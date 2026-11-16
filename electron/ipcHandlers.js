/**
 * IPC handlers for the Electron main process.
 *
 * Kept free of direct `electron` imports so the exact same handlers can be
 * registered in integration tests with a fake ipcMain/dialog/safeStorage and
 * exercised against a real temp directory and real git.
 */
import path from 'node:path';
import { promises as fs } from 'node:fs';
import git from 'isomorphic-git';
import { createGitOps, GIT_OP_NAMES } from '../shared/gitOps.js';

/**
 * @param {object} deps
 * @param {{ handle: (channel: string, fn: (...args: any[]) => any) => void }} deps.ipcMain
 * @param {{ showOpenDialog: (opts: object) => Promise<{ canceled: boolean, filePaths: string[] }> }} deps.dialog
 * @param {{ isEncryptionAvailable: () => boolean, encryptString: (s: string) => Buffer, decryptString: (b: Buffer) => string }} deps.safeStorage
 * @param {() => string} deps.getUserDataPath
 * @param {(...args: any[]) => void} [deps.log]
 */
export function registerIpcHandlers({
  ipcMain,
  dialog,
  safeStorage,
  getUserDataPath,
  log = () => {},
}) {
  // ========== PATH ACCESS CONTROL ==========
  // The renderer may only touch directories the user explicitly picked via the
  // native directory dialog. The allowlist is persisted so a previously chosen
  // project folder keeps working after a restart.

  const allowedRootsFile = () => path.join(getUserDataPath(), 'allowed-roots.json');
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

  const tokenPath = () => path.join(getUserDataPath(), 'git-token.bin');

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

  // ========== GIT ==========
  // All git logic lives in shared/gitOps.js and is shared with browser mode;
  // here it runs with Node's fs. One channel, restricted to the known ops.
  const gitOps = createGitOps({
    fs,
    git,
    getHttp: () => import('isomorphic-git/http/node').then((m) => m.default),
  });
  const REMOTE_OPS = new Set(['fetch', 'push', 'pull']);

  ipcMain.handle('git:call', async (_event, op, dir, ...args) => {
    try {
      if (!GIT_OP_NAMES.includes(op)) throw new Error(`Unknown git operation: ${op}`);
      dir = await assertAllowedPath(dir);
      if (REMOTE_OPS.has(op)) {
        // The token never comes from the renderer in Electron: use the stored one
        const options = { ...(args[0] || {}) };
        options.token = await resolveToken(options.token);
        args[0] = options;
      }
      log(`[Main] git:${op} in ${dir}`);
      const value = await gitOps[op](dir, ...args);
      return { ok: true, value };
    } catch (error) {
      return { error: error.message, name: error.name };
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
      // Uint8Array is sent as one binary blob via structured clone, not one number per byte
      return { data: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) };
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

  ipcMain.handle('fs:writeFileBinary', async (_event, fullPath, data) => {
    try {
      fullPath = await assertAllowedPath(fullPath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      // Accepts a Uint8Array (current renderer) or a number[] (legacy)
      await fs.writeFile(fullPath, data instanceof Uint8Array ? data : Buffer.from(data));
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
}
