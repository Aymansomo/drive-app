const { app, BrowserWindow, Menu, protocol, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const isDev = !app.isPackaged;

// Global reference to the window object
let mainWindow;

// Configure auto-updater
if (!isDev) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Handle auto-updater events
  autoUpdater.on('checking-for-update', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'Checking for updates...');
    }
  });

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'Update available. Downloading...');
      autoUpdater.downloadUpdate();
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'No updates available.');
    }
  });

  autoUpdater.on('error', (err) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'Error in auto-updater: ' + err);
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'Update downloaded. It will be installed on next restart.');
    }
  });
}

// IPC handlers for update control
ipcMain.on('check-for-updates', () => {
  if (!isDev) {
    autoUpdater.checkForUpdates();
  }
});

ipcMain.on('install-update', () => {
  if (!isDev) {
    autoUpdater.quitAndInstall();
  }
});

// Get the correct path to the shared directory
function getSharedPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'shared');
  } else {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'shared');
  }
}

// Register protocol for serving local files
function registerProtocol() {
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.substr(6); // Remove 'app://'
    const filePath = path.join(getSharedPath(), url);
    console.log('Loading file:', filePath); // Add logging
    callback({ path: filePath });
  });
}

function setupMainMenu() {
  const template = [
    {
      label: 'View',
      submenu: [
        {
          label: 'Go to Admin',
          accelerator: 'CmdOrCtrl+Shift+A',
          visible: false,
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('switch-to-admin');
            }
          }
        },
        {
          label: 'Go to User',
          accelerator: 'CmdOrCtrl+Shift+U',
          visible: true,
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('switch-to-user');
            }
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Ensure shared directories exist
function ensureSharedDirectories() {
  const sharedPath = getSharedPath();
  const imagesPath = path.join(sharedPath, 'images');
  const audioPath = path.join(sharedPath, 'audio');

  if (!fs.existsSync(sharedPath)) {
    fs.mkdirSync(sharedPath, { recursive: true });
  }
  if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath, { recursive: true });
  }
  if (!fs.existsSync(audioPath)) {
    fs.mkdirSync(audioPath, { recursive: true });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: isDev 
      ? path.join(__dirname, '..', 'src', 'assets', 'icon.ico')
      : path.join(process.resourcesPath, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    // Check for updates when app starts
    autoUpdater.checkForUpdates();
  }

  setupMainMenu();
}

app.whenReady().then(() => {
  ensureSharedDirectories();
  registerProtocol(); // Register the protocol
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 