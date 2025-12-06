const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, stable API to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
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
  },
});
