const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nbaNotification', {
  onData: callback => ipcRenderer.once('notification:data', (_event, payload) => callback(payload)),
  openGame: target => ipcRenderer.invoke('notification:open-game', target),
  dismiss: () => ipcRenderer.invoke('notification:dismiss'),
  setPinned: pinned => ipcRenderer.invoke('notification:set-pinned', pinned),
  onForcePinned: callback => ipcRenderer.on('notification:force-pinned', (_event, pinned) => callback(pinned))
});
