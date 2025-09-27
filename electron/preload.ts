import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// Node.js APIs safely.
contextBridge.exposeInMainWorld('fsApi', {
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  readDirectory: (path) => ipcRenderer.invoke('fs:readDirectory', path),
  saveFiles: (projectPath, files) => ipcRenderer.invoke('fs:saveFiles', projectPath, files),
});
