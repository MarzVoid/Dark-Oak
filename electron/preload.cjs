const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('updater', {
  check: () => ipcRenderer.invoke('updater:check'),
  download: () => ipcRenderer.invoke('updater:download'),
  install: () => ipcRenderer.invoke('updater:install'),
  getVersion: () => ipcRenderer.invoke('updater:getVersion'),
  onEvent: (callback) => {
    const handler = (_event, payload) => callback(payload)
    ipcRenderer.on('updater:event', handler)
    return () => ipcRenderer.removeListener('updater:event', handler)
  }
})

contextBridge.exposeInMainWorld('cherryApi', {
  loadRecipes: () => ipcRenderer.invoke('storage:load'),
  saveRecipes: (recipes) => ipcRenderer.invoke('storage:save', recipes),
  exportRecipes: (recipes) => ipcRenderer.invoke('dialog:export', recipes),
  importRecipes: () => ipcRenderer.invoke('dialog:import'),
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  getRecipesDir: () => ipcRenderer.invoke('settings:getRecipesDir'),
  setRecipesDir: (dir) => ipcRenderer.invoke('settings:setRecipesDir', dir)
})
