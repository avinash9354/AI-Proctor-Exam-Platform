const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('examSecureAPI', {
  isSecureBrowser: true,
  getSystemInfo: () => ({
    platform: process.platform,
    version: process.version,
  }),
});
