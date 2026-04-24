const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('deviceAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  exitApp: () => ipcRenderer.send('exit-app'),
  checkForUpdate: () => ipcRenderer.invoke('check-for-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});

// Expose update page API
contextBridge.exposeInMainWorld('electronAPI', {
  showUpdatePage: () => ipcRenderer.send('show-update-page'),
  acceptUpdate: () => ipcRenderer.send('accept-update'),
  laterUpdate: () => ipcRenderer.send('later-update'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, status) => callback(status)),
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (event, progress) => callback(progress))
});
