const { app, BrowserWindow, ipcMain, Menu, nativeImage, net, Notification, screen, Tray } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow = null;
let tray = null;
let quitting = false;

const DEFAULT_SETTINGS = {
  alwaysOnTop: true,
  autoLaunch: false,
  notifications: true,
  notificationLevel: 'scores',
  sound: true,
  favoriteTeam: ''
};

function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function readSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(settingsPath(), 'utf8')) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(nextSettings) {
  const settings = { ...DEFAULT_SETTINGS, ...(nextSettings || {}) };
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), 'utf8');
  return settings;
}

function positionBottomRight(win = mainWindow) {
  if (!win || win.isDestroyed()) return;
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const [width, height] = win.getSize();
  const margin = 14;
  win.setPosition(
    Math.round(display.workArea.x + display.workArea.width - width - margin),
    Math.round(display.workArea.y + display.workArea.height - height - margin),
    true
  );
}

function showWindow(gameId = '') {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.show();
  mainWindow.focus();
  positionBottomRight();
  if (gameId) mainWindow.webContents.send('focus-game', String(gameId));
}

function trayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <rect width="32" height="32" rx="8" fill="#172554"/>
      <circle cx="16" cy="16" r="10" fill="#f97316"/>
      <path d="M8 16h16M16 6c-3 4-3 16 0 20M16 6c3 4 3 16 0 20" fill="none" stroke="#fff" stroke-width="1.6"/>
    </svg>`;
  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`).resize({ width: 16, height: 16 });
}

function updateTrayMenu() {
  if (!tray) return;
  const settings = readSettings();
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'NBA Live Widget 열기', click: () => showWindow() },
    { type: 'separator' },
    {
      label: '항상 위',
      type: 'checkbox',
      checked: settings.alwaysOnTop,
      click: item => {
        const next = writeSettings({ ...settings, alwaysOnTop: item.checked });
        mainWindow?.setAlwaysOnTop(next.alwaysOnTop, 'floating');
        mainWindow?.webContents.send('settings-changed', next);
      }
    },
    { label: '오른쪽 아래로 이동', click: () => positionBottomRight() },
    { type: 'separator' },
    { label: '종료', click: () => { quitting = true; app.quit(); } }
  ]));
}

function createWindow() {
  const settings = readSettings();
  mainWindow = new BrowserWindow({
    width: 430,
    height: 760,
    minWidth: 360,
    minHeight: 500,
    frame: false,
    show: false,
    alwaysOnTop: settings.alwaysOnTop,
    backgroundColor: '#eef2f7',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.once('ready-to-show', () => {
    positionBottomRight();
    if (process.argv.includes('--smoke-test')) {
      setTimeout(async () => {
        try {
          const result = await mainWindow.webContents.executeJavaScript(`({
            title: document.title,
            cards: document.querySelectorAll('.game-card').length,
            fallback: !document.querySelector('#fallbackBanner')?.hidden,
            status: document.querySelector('#gamesStatus')?.innerText || '',
            tabs: [...document.querySelectorAll('.tab')].map(node => node.innerText.trim())
          })`);
          console.log(`SMOKE_RESULT ${JSON.stringify(result)}`);
        } catch (error) {
          console.error(`SMOKE_ERROR ${error.message}`);
          process.exitCode = 1;
        } finally {
          quitting = true;
          app.quit();
        }
      }, 10000);
      return;
    }
    mainWindow.show();
  });
  mainWindow.on('close', event => {
    if (quitting) return;
    event.preventDefault();
    mainWindow.hide();
  });

  tray = new Tray(trayIcon());
  tray.setToolTip('NBA Live Widget');
  tray.on('click', () => mainWindow.isVisible() ? mainWindow.hide() : showWindow());
  updateTrayMenu();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => showWindow());
});

app.on('window-all-closed', event => {
  event?.preventDefault?.();
});

app.on('before-quit', () => {
  quitting = true;
});

ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:hide', () => mainWindow?.hide());
ipcMain.handle('window:move-bottom-right', () => positionBottomRight());
ipcMain.handle('window:set-always-on-top', (_event, value) => {
  const settings = writeSettings({ ...readSettings(), alwaysOnTop: value });
  mainWindow?.setAlwaysOnTop(settings.alwaysOnTop, 'floating');
  updateTrayMenu();
  return settings.alwaysOnTop;
});
ipcMain.handle('settings:get', () => readSettings());
ipcMain.handle('settings:save', (_event, nextSettings) => {
  const settings = writeSettings(nextSettings);
  mainWindow?.setAlwaysOnTop(settings.alwaysOnTop, 'floating');
  app.setLoginItemSettings({
    openAtLogin: settings.autoLaunch,
    path: process.execPath,
    args: app.isPackaged ? [] : [app.getAppPath()]
  });
  updateTrayMenu();
  return settings;
});
ipcMain.handle('notification:show', (_event, payload = {}) => {
  if (!Notification.isSupported()) return false;
  const notification = new Notification({
    title: String(payload.title || 'NBA Live'),
    body: String(payload.body || ''),
    silent: payload.silent === true,
    timeoutType: 'default'
  });
  notification.on('click', () => showWindow(payload.gameId));
  notification.show();
  return true;
});

ipcMain.handle('sports:fetch-json', async (_event, requestUrl) => {
  const url = new URL(String(requestUrl || ''));
  const allowedHosts = new Set(['site.api.espn.com', 'cdn.espn.com']);
  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname)) {
    throw new Error('허용되지 않은 스포츠 데이터 주소입니다.');
  }
  const response = await net.fetch(url.toString(), {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'NBA-Live-Widget/1.0'
    }
  });
  if (!response.ok) throw new Error(`스포츠 데이터 요청 실패 (${response.status})`);
  return response.json();
});
