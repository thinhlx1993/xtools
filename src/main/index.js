import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import system from './system'
import database from './database'
import request from './request'
import logger from './logger'
import { mapErrorConstructor } from './helpers'
import store from './store'
import { STORE_KEYS } from './constants'
import './consumer'

const _cka = async () => {
  if (is.dev) {
    return []
  }
  let key
  try {
    switch (process.platform) {
      case 'darwin':
        key = system.getMacId()
        break
      case 'win32':
        key = system.getWinID()
        break
      default:
        store.delete(STORE_KEYS.KEY_ACTIVATION)
        return ['Platform chưa được hỗ trợ']
    }
    store.set(STORE_KEYS.KEY_ACTIVATION, key)
    const [isFailure, keyInfo] = await request.getKeyInfo(key)
    if (isFailure) {
      return ['Hệ thống đang bảo trì']
    }
    if (!keyInfo.status) {
      if (keyInfo.error === 'Invalid key') {
        return ['Chưa được kịch hoạt']
      }
      return ['Key không hợp lệ']
    }
    switch (keyInfo.status) {
      case '4':
        return ['Đã bị chặn']
      case '3':
        return ['Đợi duyệt']
      case '2':
        return ['Hoàn tiền']
      case '0':
        return ['Hết hạn']
      case '1':
      default:
        break
    }
    if (keyInfo.expired_date === 'Vĩnh Viễn') {
      return []
    }
    if (new Date().getTime() >= new Date(keyInfo.expired_date).getTime()) {
      return ['Hết hạn']
    }
    return [null]
  } catch (error) {
    if (store.has(STORE_KEYS.KEY_ACTIVATION)) {
      store.delete(STORE_KEYS.KEY_ACTIVATION)
    }
    logger.error('CHECK_KEY_ACTIVATION_ERROR', {
      key,
      error: mapErrorConstructor(error)
    })
    return ['Kiểm tra lỗi']
  }
}

const createWindow = async () => {
  // const [messageError] = await _cka()
  const windowSize = {
    width: 800,
    height: 600
  }
  // if (messageError) {
  //   windowSize.width = 350
  //   windowSize.height = 250
  // }
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    ...windowSize,
    // show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      webSecurity: false,
      sandbox: false
    }
  })
  // store.set(STORE_KEYS.KEY_ACTIVATION_STATUS, messageError || '')
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // mainWindow.webContents.openDevTools()
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('close', () => {
    logger.info('appOn__window-all-closed')
  })
  mainWindow.on('closed', () => {
    logger.info('appOn__window-all-closed')
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // check for update
  autoUpdater.checkForUpdatesAndNotify()
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  await database.initConnection()
  createWindow().catch((error) => {
    logger.error('appOn_ready__createWindow_error', {
      error: mapErrorConstructor(error)
    })
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((error) => {
        logger.error('appOn_active__createWindow_error', {
          error: mapErrorConstructor(error)
        })
      })
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  logger.info('appOn__window-all-closed')
  app.quit()
})

// autoUpdater.on('update-available', () => {
//   // Notify the user an update is available
// })

// autoUpdater.on('update-downloaded', () => {
//   // Notify the user the update will be installed
//   autoUpdater.quitAndInstall()
// })

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
