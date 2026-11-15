import { app, BrowserWindow, ipcMain, dialog, safeStorage, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import git from 'isomorphic-git';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !!process.env.VITE_DEV_SERVER_URL;

// ========== PATH ACCESS CONTROL ==========
// The renderer may only touch directories the user explicitly picked via the
// native directory dialog. The allowlist is persisted so a previously chosen
// project folder keeps working after a restart.

const allowedRootsFile = () => path.join(app.getPath('userData'), 'allowed-roots.json');
let allowedRoots = null;

async function loadAllowedRoots() {
  if (allowedRoots) return allowedRoots;
  try {
    const parsed = JSON.parse(await fs.readFile(allowedRootsFile(), 'utf8'));
    allowedRoots = new Set(Array.isArray(parsed) ? parsed.map((p) => path.resolve(p)) : []);
  } catch {
    allowedRoots = new Set();
  }
  return allowedRoots;
}

async function addAllowedRoot(dir) {
  const roots = await loadAllowedRoots();
  roots.add(path.resolve(dir));
  await fs.writeFile(allowedRootsFile(), JSON.stringify([...roots], null, 2), 'utf8');
}

/**
 * Resolve a path and verify it lies inside a user-selected root directory.
 * Throws if the path escapes every allowed root.
 */
async function assertAllowedPath(target) {
  if (typeof target !== 'string' || target.length === 0) {
    throw new Error('Invalid path');
  }
  const resolved = path.resolve(target);
  const roots = await loadAllowedRoots();
  for (const root of roots) {
    if (resolved === root || resolved.startsWith(root + path.sep)) {
      return resolved;
    }
  }
  throw new Error(`Access denied: ${resolved} is outside the selected project directory`);
}

// ========== TOKEN STORAGE ==========
// The token never leaves the main process: the renderer can store, clear and
// check for it, and remote git operations read it here.

const tokenPath = () => path.join(app.getPath('userData'), 'git-token.bin');

async function readStoredToken() {
  try {
    const encrypted = await fs.readFile(tokenPath());
    if (!safeStorage.isEncryptionAvailable()) return null;
    return safeStorage.decryptString(encrypted);
  } catch {
    return null;
  }
}

async function resolveToken(token) {
  return token || (await readStoredToken());
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Never open new windows from the renderer; send http(s) links to the OS browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Block navigation away from the app itself.
  win.webContents.on('will-navigate', (event, url) => {
    const appUrl = isDev ? process.env.VITE_DEV_SERVER_URL : 'file://';
    if (!url.startsWith(appUrl)) {
      event.preventDefault();
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexHtml = path.join(__dirname, '..', 'dist', 'index.html');
    win.loadFile(indexHtml);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Git IPC handlers - run in Node context with real fs
ipcMain.handle('git:status', async (_event, dir, filepath) => {
  try {
    dir = await assertAllowedPath(dir);
    return await git.status({ fs, dir, filepath });
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:statusMatrix', async (_event, dir) => {
  try {
    dir = await assertAllowedPath(dir);
    return await git.statusMatrix({ fs, dir });
  } catch (error) {
    return { error: error.message };
  }
});

console.log('[Main] Registering git:checkout handler');
ipcMain.handle('git:checkout', async (_event, dir, filepath, force) => {
  try {
    dir = await assertAllowedPath(dir);
    console.log(`[Main] git:checkout ${filepath} in ${dir} (force: ${force})`);
    await git.checkout({
      fs,
      dir,
      ref: 'HEAD',
      filepaths: [filepath],
      force: !!force,
    });
    console.log(`[Main] git:checkout ${filepath} success`);
    return { ok: true };
  } catch (error) {
    console.error(`[Main] git:checkout ${filepath} failed:`, error);
    return { error: error.message };
  }
});

ipcMain.handle('git:add', async (_event, dir, filepath) => {
  try {
    dir = await assertAllowedPath(dir);
    await git.add({ fs, dir, filepath });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:remove', async (_event, dir, filepath) => {
  try {
    dir = await assertAllowedPath(dir);
    await git.remove({ fs, dir, filepath });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:commit', async (_event, dir, message, author) => {
  try {
    dir = await assertAllowedPath(dir);
    // Ensure HEAD is attached to main branch (not detached)
    // If HEAD contains a raw SHA, commits won't update the branch pointer
    const headPath = path.join(dir, '.git', 'HEAD');
    try {
      const headContent = await fs.readFile(headPath, 'utf8');
      const trimmedHead = headContent.trim();

      if (!trimmedHead.startsWith('ref: ')) {
        console.log(
          `[Main] git:commit - HEAD is detached (contains: "${trimmedHead.substring(0, 20)}..."). Repairing...`
        );

        // If HEAD is a valid SHA, ensure refs/heads/main points to it
        if (trimmedHead.match(/^[0-9a-f]{40}$/i)) {
          const mainRefPath = path.join(dir, '.git', 'refs', 'heads', 'main');
          await fs.mkdir(path.dirname(mainRefPath), { recursive: true });
          await fs.writeFile(mainRefPath, trimmedHead + '\n', 'utf8');
          console.log(`[Main] Updated refs/heads/main to ${trimmedHead}`);
        }

        // Attach HEAD to main
        await fs.writeFile(headPath, 'ref: refs/heads/main\n', 'utf8');
        console.log('[Main] HEAD is now attached to refs/heads/main');
      }
    } catch (headError) {
      console.error('[Main] Failed to check/repair HEAD:', headError.message);
    }

    console.log(`[Main] git:commit starting for ${dir}, message: "${message}"`);
    const oid = await git.commit({
      fs,
      dir,
      message,
      author: author || { name: 'Tracyfy User', email: 'user@tracyfy.local' },
    });
    console.log(`[Main] git:commit success, OID: ${oid}`);
    return { oid };
  } catch (error) {
    console.error('[Main] git:commit failed:', error.message);
    return { error: error.message };
  }
});

ipcMain.handle('git:log', async (_event, dir, depth, filepath, ref) => {
  try {
    dir = await assertAllowedPath(dir);
    const commits = await git.log({
      fs,
      dir,
      depth: depth || 100,
      filepath,
      ref: ref || 'HEAD',
    });
    return commits.map((c) => ({
      hash: c.oid,
      message: c.commit.message,
      author: c.commit.author.name,
      timestamp: c.commit.author.timestamp * 1000,
      parent: c.commit.parent,
    }));
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:listFiles', async (_event, dir, ref) => {
  try {
    dir = await assertAllowedPath(dir);
    return await git.listFiles({ fs, dir, ref });
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:readBlob', async (_event, dir, oid, filepath) => {
  try {
    dir = await assertAllowedPath(dir);
    const { blob } = await git.readBlob({ fs, dir, oid, filepath });
    return { blob: Array.from(blob) };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:resolveRef', async (_event, dir, ref) => {
  try {
    dir = await assertAllowedPath(dir);
    return await git.resolveRef({ fs, dir, ref });
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:isDescendent', async (_event, dir, oid, ancestor, depth) => {
  try {
    dir = await assertAllowedPath(dir);
    return await git.isDescendent({ fs, dir, oid, ancestor, depth });
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:currentBranch', async (_event, dir) => {
  try {
    dir = await assertAllowedPath(dir);
    return await git.currentBranch({ fs, dir });
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:init', async (_event, dir) => {
  try {
    dir = await assertAllowedPath(dir);
    await git.init({ fs, dir, defaultBranch: 'main' });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:annotatedTag', async (_event, dir, ref, message, tagger) => {
  try {
    dir = await assertAllowedPath(dir);
    await git.annotatedTag({
      fs,
      dir,
      ref,
      message,
      tagger: tagger || { name: 'Tracyfy User', email: 'user@tracyfy.local' },
    });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:listTags', async (_event, dir) => {
  try {
    dir = await assertAllowedPath(dir);
    return await git.listTags({ fs, dir });
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:readTag', async (_event, dir, oid) => {
  try {
    dir = await assertAllowedPath(dir);
    const tag = await git.readTag({ fs, dir, oid });
    return {
      message: tag.tag.message,
      timestamp: tag.tag.tagger.timestamp * 1000,
      object: tag.tag.object,
    };
  } catch (error) {
    return { error: error.message };
  }
});

// Filesystem IPC handlers - use Node fs for real disk access
ipcMain.handle('fs:selectDirectory', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths.length) {
      return { canceled: true };
    }
    await addAllowedRoot(result.filePaths[0]);
    return { path: result.filePaths[0] };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:readFile', async (_event, fullPath) => {
  try {
    fullPath = await assertAllowedPath(fullPath);
    const content = await fs.readFile(fullPath, 'utf8');
    return { content };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { notFound: true };
    }
    return { error: error.message };
  }
});

ipcMain.handle('fs:readFileBinary', async (_event, fullPath) => {
  try {
    fullPath = await assertAllowedPath(fullPath);
    const buffer = await fs.readFile(fullPath);
    return { data: Array.from(buffer) };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { notFound: true };
    }
    return { error: error.message };
  }
});

ipcMain.handle('fs:writeFile', async (_event, fullPath, content) => {
  try {
    fullPath = await assertAllowedPath(fullPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf8');
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:writeFileBinary', async (_event, fullPath, dataArray) => {
  try {
    fullPath = await assertAllowedPath(fullPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    const buffer = Buffer.from(dataArray);
    await fs.writeFile(fullPath, buffer);
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:deleteFile', async (_event, fullPath) => {
  try {
    fullPath = await assertAllowedPath(fullPath);
    await fs.unlink(fullPath);
    return { ok: true };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { ok: true };
    }
    return { error: error.message };
  }
});

ipcMain.handle('fs:listFiles', async (_event, dirPath) => {
  try {
    dirPath = await assertAllowedPath(dirPath);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);
    return { files };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { files: [] };
    }
    return { error: error.message };
  }
});

ipcMain.handle('fs:listEntries', async (_event, dirPath) => {
  try {
    dirPath = await assertAllowedPath(dirPath);
    const entries = await fs.readdir(dirPath);
    return { entries };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { entries: [] };
    }
    return { error: error.message };
  }
});

ipcMain.handle('fs:checkExists', async (_event, fullPath) => {
  try {
    fullPath = await assertAllowedPath(fullPath);
    await fs.access(fullPath);
    return { exists: true };
  } catch {
    return { exists: false };
  }
});

ipcMain.handle('fs:mkdir', async (_event, dirPath) => {
  try {
    dirPath = await assertAllowedPath(dirPath);
    await fs.mkdir(dirPath, { recursive: true });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

// ========== REMOTE GIT OPERATIONS ==========

ipcMain.handle('git:addRemote', async (_event, dir, name, url) => {
  try {
    dir = await assertAllowedPath(dir);
    await git.addRemote({ fs, dir, remote: name, url });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:removeRemote', async (_event, dir, name) => {
  try {
    dir = await assertAllowedPath(dir);
    await git.deleteRemote({ fs, dir, remote: name });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:listRemotes', async (_event, dir) => {
  try {
    dir = await assertAllowedPath(dir);
    const remotes = await git.listRemotes({ fs, dir });
    return remotes.map((r) => ({ name: r.remote, url: r.url }));
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:fetch', async (_event, dir, remote, branch, token) => {
  try {
    dir = await assertAllowedPath(dir);
    const http = await import('isomorphic-git/http/node').then((m) => m.default);
    const authToken = await resolveToken(token);
    await git.fetch({
      fs,
      http,
      dir,
      remote: remote || 'origin',
      ref: branch,
      singleBranch: !!branch,
      onAuth: authToken ? () => ({ username: 'x-access-token', password: authToken }) : undefined,
    });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:push', async (_event, dir, remote, branch, token) => {
  try {
    dir = await assertAllowedPath(dir);
    const http = await import('isomorphic-git/http/node').then((m) => m.default);
    const authToken = await resolveToken(token);
    await git.push({
      fs,
      http,
      dir,
      remote: remote || 'origin',
      ref: branch || 'main',
      onAuth: authToken ? () => ({ username: 'x-access-token', password: authToken }) : undefined,
    });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:pull', async (_event, dir, remote, branch, token, author) => {
  try {
    dir = await assertAllowedPath(dir);
    const http = await import('isomorphic-git/http/node').then((m) => m.default);
    const authToken = await resolveToken(token);
    await git.pull({
      fs,
      http,
      dir,
      remote: remote || 'origin',
      ref: branch || 'main',
      author: author || { name: 'Tracyfy User', email: 'user@tracyfy.local' },
      onAuth: authToken ? () => ({ username: 'x-access-token', password: authToken }) : undefined,
    });
    return { ok: true, conflicts: [] };
  } catch (error) {
    if (error.code === 'MergeConflictError' || error.code === 'CheckoutConflictError') {
      return { ok: false, conflicts: error.data?.filepaths || [] };
    }
    return { error: error.message };
  }
});

// ========== SECURE STORAGE OPERATIONS ==========

ipcMain.handle('secure:setToken', async (_event, token) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available on this system');
    }
    const encrypted = safeStorage.encryptString(token);
    await fs.writeFile(tokenPath(), encrypted);
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('secure:hasToken', async () => {
  return { hasToken: !!(await readStoredToken()) };
});

ipcMain.handle('secure:removeToken', async () => {
  try {
    await fs.unlink(tokenPath());
    return { ok: true };
  } catch (error) {
    if (error.code === 'ENOENT') return { ok: true };
    return { error: error.message };
  }
});
