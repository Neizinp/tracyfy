import { app, BrowserWindow, ipcMain } from 'electron';
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
      author: author || { name: 'ReqTrace User', email: 'user@reqtrace.local' },
    });
    return { oid };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:log', async (_event, dir, depth, filepath) => {
  try {
    const commits = await git.log({
      fs,
      dir,
      depth: depth || 100,
      filepath,
    });
    return commits.map((c) => ({
      oid: c.oid,
      message: c.commit.message,
      author: c.commit.author.name,
      timestamp: c.commit.author.timestamp * 1000,
    }));
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('git:listFiles', async (_event, dir) => {
  try {
    return await git.listFiles({ fs, dir });
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
      tagger: tagger || { name: 'ReqTrace User', email: 'user@reqtrace.local' },
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
