const { app, BrowserWindow, globalShortcut, screen, clipboard, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createSecureWindow() {
  const displays = screen.getAllDisplays();
  if (displays.length > 1) {
    console.warn('⚠️ Multiple displays detected! Blocking startup or restricting to single screen.');
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    kiosk: true, // Fullscreen kiosk mode
    alwaysOnTop: true,
    fullscreen: true,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false, // Prevent DevTools inspection
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load student portal
  const PORTAL_URL = process.env.STUDENT_PORTAL_URL || 'http://localhost:3000';
  mainWindow.loadURL(PORTAL_URL);

  // Block opening DevTools via shortcuts or menu
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow.webContents.closeDevTools();
  });

  // Block right-click context menu
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  // Periodically clear clipboard during exam to prevent cheat/copy-paste
  const clipboardCleaner = setInterval(() => {
    clipboard.clear();
  }, 5000);

  mainWindow.on('closed', () => {
    clearInterval(clipboardCleaner);
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createSecureWindow();

  // Register global shortcuts to block common exit/switching keys
  const blockedKeys = ['CommandOrControl+Tab', 'Alt+Tab', 'CommandOrControl+Shift+I', 'F12', 'CommandOrControl+R'];
  blockedKeys.forEach((key) => {
    globalShortcut.register(key, () => {
      console.log(`Blocked restricted key shortcut: ${key}`);
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createSecureWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
