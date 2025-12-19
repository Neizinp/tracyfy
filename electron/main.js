import { app, BrowserWindow, ipcMain, dialog, safeStorage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import git from 'isomorphic-git';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !!process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
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
    return await git.status({ fs, dir, filepath });
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:statusMatrix', async (_event, dir) => {
  try {
    return await git.statusMatrix({ fs, dir });
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:add', async (_event, dir, filepath) => {
  try {
    await git.add({ fs, dir, filepath });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:remove', async (_event, dir, filepath) => {
  try {
    await git.remove({ fs, dir, filepath });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:commit', async (_event, dir, message, author) => {
  try {
    const oid = await git.commit({
      fs,
      dir,
      message,
      author: author || { name: 'Tracyfy User', email: 'user@tracyfy.local' },
    });
    return { oid };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:log', async (_event, dir, depth, filepath, ref) => {
  try {
    const commits = await git.log({
      fs,
      dir,
      depth: depth || 100,
      filepath,
      ref: ref || 'HEAD',
    });
    return commits.map((c) => ({
      oid: c.oid,
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
    return await git.listFiles({ fs, dir, ref });
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:readBlob', async (_event, dir, oid, filepath) => {
  try {
    const { blob } = await git.readBlob({ fs, dir, oid, filepath });
    return { blob: Array.from(blob) };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:resolveRef', async (_event, dir, ref) => {
  try {
    return await git.resolveRef({ fs, dir, ref });
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:init', async (_event, dir) => {
  try {
    await git.init({ fs, dir, defaultBranch: 'main' });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:annotatedTag', async (_event, dir, ref, message, tagger) => {
  try {
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
    return await git.listTags({ fs, dir });
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:readTag', async (_event, dir, oid) => {
  try {
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
    return { path: result.filePaths[0] };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:readFile', async (_event, fullPath) => {
  try {
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
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf8');
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:writeFileBinary', async (_event, fullPath, dataArray) => {
  try {
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
    await fs.access(fullPath);
    return { exists: true };
  } catch {
    return { exists: false };
  }
});

ipcMain.handle('fs:mkdir', async (_event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

// ========== REMOTE GIT OPERATIONS ==========

ipcMain.handle('git:addRemote', async (_event, dir, name, url) => {
  try {
    await git.addRemote({ fs, dir, remote: name, url });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:removeRemote', async (_event, dir, name) => {
  try {
    await git.deleteRemote({ fs, dir, remote: name });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:listRemotes', async (_event, dir) => {
  try {
    const remotes = await git.listRemotes({ fs, dir });
    return remotes.map((r) => ({ name: r.remote, url: r.url }));
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:fetch', async (_event, dir, remote, branch, token) => {
  try {
    const http = await import('isomorphic-git/http/node').then((m) => m.default);
    await git.fetch({
      fs,
      http,
      dir,
      remote: remote || 'origin',
      ref: branch,
      singleBranch: !!branch,
      onAuth: token ? () => ({ username: 'x-access-token', password: token }) : undefined,
    });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:push', async (_event, dir, remote, branch, token) => {
  try {
    const http = await import('isomorphic-git/http/node').then((m) => m.default);
    await git.push({
      fs,
      http,
      dir,
      remote: remote || 'origin',
      ref: branch || 'main',
      onAuth: token ? () => ({ username: 'x-access-token', password: token }) : undefined,
    });
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:pull', async (_event, dir, remote, branch, token, author) => {
  try {
    const http = await import('isomorphic-git/http/node').then((m) => m.default);
    await git.pull({
      fs,
      http,
      dir,
      remote: remote || 'origin',
      ref: branch || 'main',
      author: author || { name: 'Tracyfy User', email: 'user@tracyfy.local' },
      onAuth: token ? () => ({ username: 'x-access-token', password: token }) : undefined,
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
    const tokenPath = path.join(app.getPath('userData'), 'git-token.bin');
    await fs.writeFile(tokenPath, encrypted);
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('secure:getToken', async () => {
  try {
    const tokenPath = path.join(app.getPath('userData'), 'git-token.bin');
    const encrypted = await fs.readFile(tokenPath);
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available');
    }
    return { token: safeStorage.decryptString(encrypted) };
  } catch (error) {
    if (error.code === 'ENOENT') return { token: null };
    return { error: error.message };
  }
});

ipcMain.handle('secure:removeToken', async () => {
  try {
    const tokenPath = path.join(app.getPath('userData'), 'git-token.bin');
    await fs.unlink(tokenPath);
    return { ok: true };
  } catch (error) {
    if (error.code === 'ENOENT') return { ok: true };
    return { error: error.message };
  }
});
