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
  fs: {
    selectDirectory: () => ipcRenderer.invoke('fs:selectDirectory'),
    readFile: (fullPath) => ipcRenderer.invoke('fs:readFile', fullPath),
    readFileBinary: (fullPath) => ipcRenderer.invoke('fs:readFileBinary', fullPath),
    writeFile: (fullPath, content) => ipcRenderer.invoke('fs:writeFile', fullPath, content),
    writeFileBinary: (fullPath, dataArray) =>
      ipcRenderer.invoke('fs:writeFileBinary', fullPath, dataArray),
    deleteFile: (fullPath) => ipcRenderer.invoke('fs:deleteFile', fullPath),
    listFiles: (dirPath) => ipcRenderer.invoke('fs:listFiles', dirPath),
    listEntries: (dirPath) => ipcRenderer.invoke('fs:listEntries', dirPath),
    checkExists: (fullPath) => ipcRenderer.invoke('fs:checkExists', fullPath),
    mkdir: (dirPath) => ipcRenderer.invoke('fs:mkdir', dirPath),
  },
});
