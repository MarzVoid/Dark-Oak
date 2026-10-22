const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { initUpdater } = require('@marzipan/updater/main')
const { loadDataFromDb, saveDataToDb } = require('./db.cjs')

const pkg = require('../package.json')

app.setVersion(pkg.version)

let mainWindow = null

function getConfigFilePath() {
  return path.join(app.getPath('userData'), 'dark-oak-config.json')
}

function getConfig() {
  try {
    const p = getConfigFilePath()
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'))
    }
  } catch (e) {
  }
  const defaultDir = path.join(app.getPath('documents'), 'Dark Oak')
  return { recipesDir: defaultDir }
}

function saveConfig(cfg) {
  try {
    const p = getConfigFilePath()
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf-8')
    return true
  } catch (e) {
    return false
  }
}

function getRecipesDbPath() {
  const cfg = getConfig()
  let dir = cfg.recipesDir
  if (!dir) {
    dir = path.join(app.getPath('documents'), 'Dark Oak')
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return path.join(dir, 'dark-oak-recipes.db')
}

function getRecipesFilePath() {
  const cfg = getConfig()
  let dir = cfg.recipesDir
  if (!dir) {
    dir = path.join(app.getPath('documents'), 'Dark Oak')
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const targetFile = path.join(dir, 'dark-oak-recipes.json')
  if (!fs.existsSync(targetFile)) {
    const legacyFile = path.join(app.getPath('userData'), 'dark-oak-recipes.json')
    if (fs.existsSync(legacyFile)) {
      try {
        fs.copyFileSync(legacyFile, targetFile)
      } catch (e) {
      }
    }
  }
  return targetFile
}

function createWindow() {
  const iconPath = process.platform === 'win32' && fs.existsSync(path.join(__dirname, 'icon.ico'))
    ? path.join(__dirname, 'icon.ico')
    : path.join(__dirname, 'icon.png');
  mainWindow = new BrowserWindow({
    width: 1260,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#120c08',
    title: 'Dark Oak',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.maximize()

  initUpdater({
    repo: 'MarzVoid/Dark-Oak',
    currentVersion: pkg.version,
    appName: 'Dark Oak',
    executableName: 'Dark Oak.exe',
    getMainWindow: () => mainWindow
  })

  const devUrl = 'http://localhost:5173'
  mainWindow.loadURL(devUrl).catch(() => {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  })
}

ipcMain.handle('storage:load', async () => {
  try {
    const dbPath = getRecipesDbPath()
    const jsonPath = getRecipesFilePath()
    const data = await loadDataFromDb(dbPath, jsonPath)
    return data
  } catch (err) {
    return null
  }
})

ipcMain.handle('storage:save', async (_, data) => {
  try {
    const dbPath = getRecipesDbPath()
    const jsonPath = getRecipesFilePath()
    return await saveDataToDb(dbPath, data, jsonPath)
  } catch (err) {
    return { success: false, error: err.message }
  }
})

async function translateTextOnline(text, targetLang) {
  if (!text || typeof text !== 'string' || !text.trim()) return text
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (Array.isArray(json) && Array.isArray(json[0])) {
    return json[0].map(item => item[0]).join('')
  }
  return text
}

ipcMain.handle('translate:text', async (_, { text, targetLang }) => {
  try {
    const translated = await translateTextOnline(text, targetLang)
    return { success: true, text: translated }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('translate:batch', async (_, { texts, targetLang }) => {
  try {
    const promises = (texts || []).map(async t => {
      try {
        return await translateTextOnline(t, targetLang)
      } catch (e) {
        return t
      }
    })
    const results = await Promise.all(promises)
    return { success: true, results }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('dialog:export', async (_, data) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Экспорт рецептов Dark Oak',
      defaultPath: 'dark-oak-recipes-backup.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    })
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
      return { success: true, path: result.filePath }
    }
    return { canceled: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('dialog:import', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Импорт рецептов Dark Oak',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const data = fs.readFileSync(result.filePaths[0], 'utf-8')
      return { success: true, data: JSON.parse(data) }
    }
    return { canceled: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('settings:getRecipesDir', async () => {
  const cfg = getConfig()
  return { dir: cfg.recipesDir }
})

ipcMain.handle('settings:setRecipesDir', async (_, newDir) => {
  try {
    if (!newDir || typeof newDir !== 'string') {
      return { success: false, error: 'Invalid directory path' }
    }
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true })
    }
    const currentFilePath = getRecipesFilePath()
    const newFilePath = path.join(newDir, 'dark-oak-recipes.json')
    if (fs.existsSync(currentFilePath) && !fs.existsSync(newFilePath)) {
      try {
        fs.copyFileSync(currentFilePath, newFilePath)
      } catch (e) {
      }
    }
    const currentDbPath = getRecipesDbPath()
    const newDbPath = path.join(newDir, 'dark-oak-recipes.db')
    if (fs.existsSync(currentDbPath) && !fs.existsSync(newDbPath)) {
      try {
        fs.copyFileSync(currentDbPath, newDbPath)
      } catch (e) {
      }
    }
    const cfg = getConfig()
    cfg.recipesDir = newDir
    saveConfig(cfg)
    return { success: true, dir: newDir }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('dialog:selectDirectory', async () => {
  try {
    const cfg = getConfig()
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Выбор папки для рецептов / Select Recipes Directory',
      defaultPath: cfg.recipesDir,
      properties: ['openDirectory', 'createDirectory']
    })
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      return { success: true, path: result.filePaths[0] }
    }
    return { canceled: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
