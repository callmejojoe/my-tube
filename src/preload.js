const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  fetchInfo: (url) => ipcRenderer.invoke('api:info', url),
  startDownload: (data) => ipcRenderer.invoke('api:download', data),
  onDownloadProgress: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },
  onYtDlpError: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('ytdlp-error', handler);
    return () => ipcRenderer.removeListener('ytdlp-error', handler);
  },
});
