const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getApp: () => ipcRenderer.invoke('get-app'),
  setShowTips: (showTips) => ipcRenderer.invoke('set-show-tips', showTips),
  getIgdbStatus: () => ipcRenderer.invoke('get-igdb-status'),
  testIgdbConnection: (credentials) => ipcRenderer.invoke('test-igdb-connection', credentials),
  createDesktopShortcut: () => ipcRenderer.invoke('create-desktop-shortcut'),
  createStartMenuShortcut: () => ipcRenderer.invoke('create-start-menu-shortcut'),
  getTerms: () => ipcRenderer.invoke('get-terms'),
  acceptTerms: () => ipcRenderer.invoke('accept-terms'),
  updateAppSettings: (settings) => ipcRenderer.invoke('update-app-settings', settings),
  getRssFeed: (options) => ipcRenderer.invoke('get-rss-feed', options),
  refreshRssFeed: () => ipcRenderer.invoke('refresh-rss-feed'),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  getGames: () => ipcRenderer.invoke('get-games'),
  getMetadata: (gameId) => ipcRenderer.invoke('get-metadata', gameId),
  browseGameFile: () => ipcRenderer.invoke('browse-game-file'),
  selectScanFolder: () => ipcRenderer.invoke('select-scan-folder'),
  startFolderScan: (folderPath) => ipcRenderer.invoke('start-folder-scan', folderPath),
  stopFolderScan: (scanId) => ipcRenderer.invoke('stop-folder-scan', scanId),
  onFolderScanItem: (callback) => {
    const listener = (event, item) => callback(item);
    ipcRenderer.on('folder-scan-item', listener);
    return () => ipcRenderer.removeListener('folder-scan-item', listener);
  },
  onFolderScanDone: (callback) => {
    const listener = (event, result) => callback(result);
    ipcRenderer.on('folder-scan-done', listener);
    return () => ipcRenderer.removeListener('folder-scan-done', listener);
  },
  inspectGamePath: (filePath) => ipcRenderer.invoke('inspect-game-path', filePath),
  searchMetadata: (gameName) => ipcRenderer.invoke('search-metadata', gameName),
  addLocalGame: (game) => ipcRenderer.invoke('add-local-game', game),
  updateGame: (game) => ipcRenderer.invoke('update-game', game),
  deleteGame: (gameId) => ipcRenderer.invoke('delete-game', gameId),
  hideGame: (gameId) => ipcRenderer.invoke('hide-game', gameId),
  getHiddenGames: () => ipcRenderer.invoke('get-hidden-games'),
  unhideGame: (gameId) => ipcRenderer.invoke('unhide-game', gameId),
  launchGame: (gameId) => ipcRenderer.invoke('launch-game', gameId),
  toggleFavorite: (gameId) => ipcRenderer.invoke('toggle-favorite', gameId),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window-toggle-maximize'),
  getPathForFile: (file) => webUtils.getPathForFile(file),
})
