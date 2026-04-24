const { app, BrowserWindow, ipcMain, shell, protocol } = require('electron');
const fs = require('fs');
// Register a custom protocol to serve icons.svg and other static files if needed
app.whenReady().then(() => {
  protocol.registerFileProtocol('icon', (request, callback) => {
    const url = request.url.substr(7); // remove 'icon://' prefix
    const filePath = path.join(__dirname, 'app.ico'); // Adjust path as needed
    callback({ path: filePath });
  });
});
const https = require('https');
const APP_VERSION = app.getVersion();
let errorWindow;
function createErrorWindow(message = "An error occurred while checking for updates.") {
  errorWindow = new BrowserWindow({
    width: 400,
    height: 250,
    resizable: false,
    minimizable: false,
    maximizable: false,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  errorWindow.loadFile('./error.html');
  errorWindow.webContents.on('did-finish-load', () => {
    errorWindow.webContents.executeJavaScript(`document.getElementById('error-message').textContent = ${JSON.stringify(message)}`);
  });
}
// Example: Check for update from GitHub releases
function checkForUpdate() {
  return new Promise((resolve, reject) => {
    // Replace with your repo info
    const repo = 'gurraoptimus/DNM';
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repo}/releases/latest`,
      method: 'GET',
      headers: { 'User-Agent': 'DNM' }
    };
    let data = '';
    const req = https.request(options, res => {
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          const latestVersion = release.tag_name.replace(/^v/, '');
          if (latestVersion !== APP_VERSION) {
            resolve({ updateAvailable: true, latestVersion, url: release.html_url });
          } else {
            resolve({ updateAvailable: false, latestVersion });
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}
// IPC handler for update check
ipcMain.handle('check-for-update', async () => {
  try {
    const result = await checkForUpdate();
    return result;
  } catch (e) {
    createErrorWindow("Failed to check for updates.\n" + e.message);
    return { updateAvailable: false, error: e.message };
  }
});

// IPC handler for app version
ipcMain.handle('get-app-version', async () => {
  return APP_VERSION;
});
const os = require('os');
const si = require('systeminformation');
const path = require('path');

let mainWindow;
let splashWindow;


function createSplash() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    center: true,
    resizable: false,
    show: true
  });
  splashWindow.loadFile('./src/splash.html');
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
      
    },
    frame: false, // Remove window frame for a cleaner look
    maximizable: false, // Disable window maximization
    minimizable: false, // Disable window minimization
    resizable: false, // Disable window resizing
    show: false // Start hidden, show after splash
});
  mainWindow.loadFile('./index.html');
  // mainWindow.show() is called after splash closes
}


app.whenReady().then(() => {
  createSplash();
  setTimeout(() => {
    createMainWindow();
    if (splashWindow) splashWindow.close();
    if (mainWindow) mainWindow.show();
  }, 1800); // 1.8 seconds splash
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle exit from renderer
ipcMain.on('exit-app', () => {
  app.quit();
});

// IPC handlers for system info
ipcMain.handle('get-system-info', async () => {
  const userInfo = os.userInfo();
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const hostname = os.hostname();
  const platform = os.platform();
  const arch = os.arch();
  const network = os.networkInterfaces();
  const disk = await si.fsSize();
  const battery = await si.battery();
  const wifi = await si.wifiNetworks();
  const currentWifi = await si.wifiConnections();
  return {
    user: userInfo.username,
    hostname,
    platform,
    arch,
    cpu: cpus[0].model,
    ramMB: Math.round(totalMem / 1048576),
    freeRamMB: Math.round(freeMem / 1048576),
    network,
    disk,
    battery,
    wifi,
    currentWifi
  };
});
