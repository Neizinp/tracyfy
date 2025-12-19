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

  // Git operations
  git: {
    status: (dir, filepath) => ipcRenderer.invoke('git:status', dir, filepath),
    statusMatrix: (dir) => ipcRenderer.invoke('git:statusMatrix', dir),
    add: (dir, filepath) => ipcRenderer.invoke('git:add', dir, filepath),
    remove: (dir, filepath) => ipcRenderer.invoke('git:remove', dir, filepath),
    commit: (dir, message, author) => ipcRenderer.invoke('git:commit', dir, message, author),
    log: (dir, depth, filepath) => ipcRenderer.invoke('git:log', dir, depth, filepath),
    listFiles: (dir) => ipcRenderer.invoke('git:listFiles', dir),
    resolveRef: (dir, ref) => ipcRenderer.invoke('git:resolveRef', dir, ref),
    init: (dir) => ipcRenderer.invoke('git:init', dir),
    annotatedTag: (dir, ref, message, tagger) =>
      ipcRenderer.invoke('git:annotatedTag', dir, ref, message, tagger),
    listTags: (dir) => ipcRenderer.invoke('git:listTags', dir),
    readTag: (dir, oid) => ipcRenderer.invoke('git:readTag', dir, oid),

    // Remote operations
    addRemote: (dir, name, url) => ipcRenderer.invoke('git:addRemote', dir, name, url),
    removeRemote: (dir, name) => ipcRenderer.invoke('git:removeRemote', dir, name),
    listRemotes: (dir) => ipcRenderer.invoke('git:listRemotes', dir),
    fetch: (dir, remote, branch, token) =>
      ipcRenderer.invoke('git:fetch', dir, remote, branch, token),
    push: (dir, remote, branch, token) =>
      ipcRenderer.invoke('git:push', dir, remote, branch, token),
    pull: (dir, remote, branch, token, author) =>
      ipcRenderer.invoke('git:pull', dir, remote, branch, token, author),
  },

  // Secure storage
  secure: {
    setToken: (token) => ipcRenderer.invoke('secure:setToken', token),
    getToken: () => ipcRenderer.invoke('secure:getToken'),
    removeToken: () => ipcRenderer.invoke('secure:removeToken'),
  },

  // Platform info
  platform: process.platform,
  isElectron: true,
});
