import { app, BrowserWindow, ipcMain, dialog, safeStorage, shell } from 'electron';
import { registerIpcHandlers } from './ipcHandlers.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !!process.env.VITE_DEV_SERVER_URL;

// Verbose logging only in dev (avoid logging paths / commit messages in production)
const log = (...args) => {
  if (isDev) console.log(...args);
};

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

registerIpcHandlers({
  ipcMain,
  dialog,
  safeStorage,
  getUserDataPath: () => app.getPath('userData'),
  log,
});
