const { app, BrowserWindow, Menu, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = !app.isPackaged;

// Global reference to the window object
let mainWindow;

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