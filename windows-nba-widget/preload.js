const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nbaDesktop', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  hide: () => ipcRenderer.invoke('window:hide'),
  moveBottomRight: () => ipcRenderer.invoke('window:move-bottom-right'),
  setAlwaysOnTop: value => ipcRenderer.invoke('window:set-always-on-top', Boolean(value)),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: settings => ipcRenderer.invoke('settings:save', settings),
  fetchJson: url => ipcRenderer.invoke('sports:fetch-json', url),
  showNotification: payload => ipcRenderer.invoke('notification:show', payload),
  onFocusGame: callback => ipcRenderer.on('focus-game', (_event, gameId) => callback(gameId)),
  onSettingsChanged: callback => ipcRenderer.on('settings-changed', (_event, settings) => callback(settings))
});
