const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Filesystem operations
  fs: {
    selectDirectory: () => ipcRenderer.invoke('fs:selectDirectory'),
    readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
    readFileBinary: (path) => ipcRenderer.invoke('fs:readFileBinary', path),
    writeFile: (path, content) => ipcRenderer.invoke('fs:writeFile', path, content),
    writeFileBinary: (path, data) => ipcRenderer.invoke('fs:writeFileBinary', path, data),
    deleteFile: (path) => ipcRenderer.invoke('fs:deleteFile', path),
    listFiles: (dir) => ipcRenderer.invoke('fs:listFiles', dir),
    listEntries: (dir) => ipcRenderer.invoke('fs:listEntries', dir),
    checkExists: (path) => ipcRenderer.invoke('fs:checkExists', path),
    mkdir: (dir) => ipcRenderer.invoke('fs:mkdir', dir),
  },

  // Git: every operation from shared/gitOps.js, run in the main process
  git: {
    call: (op, dir, ...args) => ipcRenderer.invoke('git:call', op, dir, ...args),
  },

  // Secure storage
  secure: {
    setToken: (token) => ipcRenderer.invoke('secure:setToken', token),
    hasToken: () => ipcRenderer.invoke('secure:hasToken'),
    removeToken: () => ipcRenderer.invoke('secure:removeToken'),
  },

  // Platform info
  platform: process.platform,
  isElectron: true,
});
