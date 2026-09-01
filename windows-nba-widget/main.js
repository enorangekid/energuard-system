const { app, BrowserWindow, ipcMain, Menu, nativeImage, net, screen, Tray } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow = null;
let tray = null;
let notificationWindow = null;
let notificationWindows = [];
let quitting = false;

const DEFAULT_SETTINGS = {
  alwaysOnTop: true,
  autoLaunch: false,
  notifications: true,
  notificationLevel: 'scores',
  sound: true,
  favoriteTeam: '',
  favoriteBySport: { nba: '', mlb: '', epl: '', ucl: '' },
  notificationOpacity: 0.95,
  pinAllNotifications: false
};

function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function readSettings() {
  try {
    const candidates = [
      settingsPath(),
      path.join(app.getPath('appData'), 'NBA Live Widget', 'settings.json'),
      path.join(app.getPath('appData'), 'energuard-nba-live-widget', 'settings.json')
    ];
    const source = candidates.find(candidate => fs.existsSync(candidate));
    if (!source) throw new Error('설정 파일 없음');
    const saved = JSON.parse(fs.readFileSync(source, 'utf8'));
    return { ...DEFAULT_SETTINGS, ...saved, favoriteBySport: { ...DEFAULT_SETTINGS.favoriteBySport, ...(saved.favoriteBySport || {}) } };
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

function showWindow(gameId = '', sport = 'nba', endpointLeague = '') {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.show();
  mainWindow.focus();
  positionBottomRight();
  if (gameId) mainWindow.webContents.send('focus-game', { gameId: String(gameId), sport: String(sport || 'nba'), endpointLeague: String(endpointLeague || '') });
}

function notificationDisplay() {
  return mainWindow && !mainWindow.isDestroyed()
    ? screen.getDisplayMatching(mainWindow.getBounds())
    : screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
}

function layoutNotificationWindows() {
  notificationWindows = notificationWindows.filter(item => !item.window.isDestroyed());
  const display = notificationDisplay();
  const windowHeight = 150;
  // 카드 실제 높이는 약 126px, 창 위아래 투명 여백(24px)만큼 겹쳐 쌓아 간격을 좁힘
  const stride = 132;
  const margin = 8;
  [...notificationWindows].reverse().forEach((item, index) => {
    const [width] = item.window.getSize();
    item.window.setPosition(
      Math.round(display.workArea.x + display.workArea.width - width - margin),
      Math.round(display.workArea.y + display.workArea.height - windowHeight - margin - index * stride),
      true
    );
  });
}

function closeNotification(targetWindow = notificationWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) return;
  targetWindow.destroy();
}

function closeAllNotifications() {
  [...notificationWindows].forEach(item => closeNotification(item.window));
  notificationWindows = [];
  notificationWindow = null;
}

function notificationItemFromEvent(event) {
  return notificationWindows.find(item => item.window.webContents.id === event.sender.id);
}

function showCardNotification(payload = {}) {
  const settings = readSettings();
  const oldestUnpinned = notificationWindows.length >= 6
    ? notificationWindows.find(item => !item.pinned)
    : null;
  if (oldestUnpinned) closeNotification(oldestUnpinned.window);
  const display = notificationDisplay();
  const width = 408;
  const height = 150;
  const margin = 8;
  notificationWindow = new BrowserWindow({
    width,
    height,
    x: Math.round(display.workArea.x + display.workArea.width - width - margin),
    y: Math.round(display.workArea.y + display.workArea.height - height - margin),
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'notification-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  notificationWindow.setAlwaysOnTop(true, 'floating');
  notificationWindow.setOpacity(Math.min(1, Math.max(0.12, Number(settings.notificationOpacity) || 0.95)));
  const currentWindow = notificationWindow;
  const item = { window: currentWindow, pinned: Boolean(settings.pinAllNotifications), createdAt: Date.now() };
  notificationWindows.push(item);
  notificationWindow.loadFile('notification.html');
  currentWindow.once('ready-to-show', () => {
    if (currentWindow.isDestroyed()) return;
    currentWindow.webContents.send('notification:data', {
      title: String(payload.title || 'SPORTS LIVE'),
      body: String(payload.body || ''),
      gameId: String(payload.gameId || ''),
      sport: String(payload.sport || 'nba'),
      league: String(payload.league || 'NBA'),
      endpointLeague: String(payload.endpointLeague || ''),
      awayName: String(payload.awayName || ''),
      homeName: String(payload.homeName || ''),
      awayLogo: String(payload.awayLogo || ''),
      homeLogo: String(payload.homeLogo || ''),
      awayScore: String(payload.awayScore ?? ''),
      homeScore: String(payload.homeScore ?? ''),
      meta: String(payload.meta || ''),
      playerName: String(payload.playerName || ''),
      playerImage: String(payload.playerImage || ''),
      eventTeamLogo: String(payload.eventTeamLogo || ''),
      pinned: item.pinned,
      silent: payload.silent === true
    });
    currentWindow.showInactive();
    layoutNotificationWindows();
  });
  currentWindow.on('closed', () => {
    notificationWindows = notificationWindows.filter(entry => entry.window !== currentWindow);
    if (notificationWindow === currentWindow) notificationWindow = notificationWindows.at(-1)?.window || null;
    layoutNotificationWindows();
  });
  return true;
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
    { label: 'Energuard Sports Live 열기', click: () => showWindow() },
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
            tabs: [...document.querySelectorAll('.tab')].map(node => node.innerText.trim()),
            sports: [...document.querySelectorAll('.sport-tab')].map(node => node.innerText.trim())
          })`);
          console.log(`SMOKE_RESULT ${JSON.stringify(result)}`);
          await mainWindow.webContents.executeJavaScript(`document.querySelector('[data-sport="mlb"]').click()`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          const mlbResult = await mainWindow.webContents.executeJavaScript(`({
            sport: document.querySelector('.sport-tab.active')?.dataset.sport,
            cards: document.querySelectorAll('.game-card').length,
            status: document.querySelector('#gamesStatus')?.innerText || ''
          })`);
          console.log(`MLB_SMOKE_RESULT ${JSON.stringify(mlbResult)}`);
          await mainWindow.webContents.executeJavaScript(`shiftDate(-1)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          await mainWindow.webContents.executeJavaScript(`document.querySelector('.mlb-game-card[data-game-pk]')?.click()`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          const mlbCommentaryResult = await mainWindow.webContents.executeJavaScript(`({
            lineScore: Boolean(document.querySelector('.mlb-linescore')),
            matchup: Boolean(document.querySelector('.mlb-matchup')),
            pitches: document.querySelectorAll('.mlb-pitch-row').length,
            plays: document.querySelectorAll('.mlb-feed-row').length,
            error: document.querySelector('#commentaryContent')?.innerText.includes('불러오지 못했습니다') || false
          })`);
          console.log(`MLB_COMMENTARY_SMOKE_RESULT ${JSON.stringify(mlbCommentaryResult)}`);
          await mainWindow.webContents.executeJavaScript(`document.querySelector('[data-sport="epl"]').click()`);
          await new Promise(resolve => setTimeout(resolve, 2500));
          await mainWindow.webContents.executeJavaScript(`document.querySelector('#datePicker').value='2025-08-23'; document.querySelector('#datePicker').dispatchEvent(new Event('change',{bubbles:true}))`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          const eplResult = await mainWindow.webContents.executeJavaScript(`({sport:document.querySelector('.sport-tab.active')?.dataset.sport,cards:document.querySelectorAll('.soccer-game-card').length,status:document.querySelector('#gamesStatus')?.innerText||''})`);
          console.log(`EPL_SMOKE_RESULT ${JSON.stringify(eplResult)}`);
          await mainWindow.webContents.executeJavaScript(`document.querySelector('.soccer-game-card[data-game-id]')?.click()`);
          await new Promise(resolve => setTimeout(resolve, 4000));
          const eplDetail = await mainWindow.webContents.executeJavaScript(`({events:document.querySelectorAll('.soccer-event-row').length,stats:document.querySelectorAll('.soccer-stat-team').length,error:document.querySelector('#commentaryContent')?.innerText.includes('불러오지 못했습니다')||false})`);
          console.log(`EPL_DETAIL_SMOKE_RESULT ${JSON.stringify(eplDetail)}`);
          await mainWindow.webContents.executeJavaScript(`document.querySelector('[data-sport="ucl"]').click()`);
          await new Promise(resolve => setTimeout(resolve, 2500));
          await mainWindow.webContents.executeJavaScript(`document.querySelector('#datePicker').value='2025-08-27'; document.querySelector('#datePicker').dispatchEvent(new Event('change',{bubbles:true}))`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          const uclResult = await mainWindow.webContents.executeJavaScript(`({sport:document.querySelector('.sport-tab.active')?.dataset.sport,cards:document.querySelectorAll('.soccer-game-card').length,status:document.querySelector('#gamesStatus')?.innerText||'',leagues:[...new Set(state.events.map(event=>event._league))]})`);
          console.log(`UCL_SMOKE_RESULT ${JSON.stringify(uclResult)}`);
          await mainWindow.webContents.executeJavaScript(`document.querySelector('.soccer-game-card[data-game-id]')?.click()`);
          await new Promise(resolve => setTimeout(resolve, 4000));
          const uclDetail = await mainWindow.webContents.executeJavaScript(`({events:document.querySelectorAll('.soccer-event-row').length,stats:document.querySelectorAll('.soccer-stat-team').length,error:document.querySelector('#commentaryContent')?.innerText.includes('불러오지 못했습니다')||false})`);
          console.log(`UCL_DETAIL_SMOKE_RESULT ${JSON.stringify(uclDetail)}`);
          showCardNotification({
            awayName: 'LA 레이커스',
            homeName: '보스턴',
            awayLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
            homeLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png',
            awayScore: 108,
            homeScore: 106,
            meta: '4쿼터 · 01:24',
            body: 'LeBron James 3점슛 성공',
            playerName: 'LeBron James',
            playerImage: 'https://a.espncdn.com/i/headshots/nba/players/full/1966.png',
            silent: true
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
          const notificationResult = await notificationWindow.webContents.executeJavaScript(`({
            away: document.querySelector('#awayName')?.innerText,
            home: document.querySelector('#homeName')?.innerText,
            score: document.querySelector('.score')?.innerText.replace(/\\s+/g, ' ').trim(),
            play: document.querySelector('#playText')?.innerText,
            meta: document.querySelector('#meta')?.innerText,
            player: document.querySelector('#playerName')?.innerText,
            hasPlayerImage: Boolean(document.querySelector('#playerImage')?.getAttribute('src')),
            pinned: document.querySelector('#pin')?.getAttribute('aria-pressed')
          })`);
          console.log(`NOTIFICATION_SMOKE_RESULT ${JSON.stringify(notificationResult)}`);
          await notificationWindow.webContents.executeJavaScript(`document.querySelector('#pin').click()`);
          await new Promise(resolve => setTimeout(resolve, 200));
          const pinnedResult = await notificationWindow.webContents.executeJavaScript(`document.querySelector('#pin').getAttribute('aria-pressed')`);
          console.log(`NOTIFICATION_PIN_SMOKE_RESULT ${pinnedResult}`);
          const notificationCapture = await notificationWindow.webContents.capturePage();
          const notificationCapturePath = path.join(app.getPath('temp'), 'sports-live-notification-smoke.png');
          fs.writeFileSync(notificationCapturePath, notificationCapture.toPNG());
          console.log(`NOTIFICATION_SMOKE_IMAGE ${notificationCapturePath}`);
          showCardNotification({ awayName: '뉴욕 닉스', homeName: '시카고', awayLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png', homeLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png', awayScore: 99, homeScore: 98, meta: '4쿼터 · 00:08', body: '결승 자유투 성공', silent: true });
          await new Promise(resolve => setTimeout(resolve, 500));
          const stackBounds = notificationWindows.map(entry => entry.window.getBounds()).sort((a, b) => a.y - b.y);
          console.log(`NOTIFICATION_STACK_SMOKE_RESULT ${JSON.stringify(stackBounds)}`);
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
  tray.setToolTip('Energuard Sports Live');
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
  const previousSettings = readSettings();
  const settings = writeSettings(nextSettings);
  mainWindow?.setAlwaysOnTop(settings.alwaysOnTop, 'floating');
  app.setLoginItemSettings({
    openAtLogin: settings.autoLaunch,
    path: process.execPath,
    args: app.isPackaged ? [] : [app.getAppPath()]
  });
  updateTrayMenu();
  notificationWindows.forEach(item => {
    if (!item.window.isDestroyed()) item.window.setOpacity(Math.min(1, Math.max(0.12, Number(settings.notificationOpacity) || 0.95)));
  });
  if (previousSettings.pinAllNotifications !== settings.pinAllNotifications) {
    notificationWindows.forEach(item => {
      item.pinned = Boolean(settings.pinAllNotifications);
      if (!item.window.isDestroyed()) item.window.webContents.send('notification:force-pinned', item.pinned);
    });
  }
  return settings;
});
ipcMain.handle('notification:show', (_event, payload = {}) => {
  return showCardNotification(payload);
});
ipcMain.handle('notification:open-game', (event, target = {}) => {
  closeNotification(notificationItemFromEvent(event)?.window);
  showWindow(String(target.gameId || ''), String(target.sport || 'nba'), String(target.endpointLeague || ''));
  return true;
});
ipcMain.handle('notification:dismiss', event => {
  closeNotification(notificationItemFromEvent(event)?.window);
  return true;
});
ipcMain.handle('notification:set-pinned', (event, pinned) => {
  const item = notificationItemFromEvent(event);
  if (!item) return false;
  item.pinned = Boolean(pinned);
  return item.pinned;
});
ipcMain.handle('notification:dismiss-all', () => {
  closeAllNotifications();
  return true;
});

ipcMain.handle('sports:fetch-json', async (_event, requestUrl) => {
  const url = new URL(String(requestUrl || ''));
  const allowedHosts = new Set(['site.api.espn.com', 'site.web.api.espn.com', 'cdn.espn.com', 'statsapi.mlb.com']);
  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname)) {
    throw new Error('허용되지 않은 스포츠 데이터 주소입니다.');
  }
  const response = await net.fetch(url.toString(), {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'Energuard-Sports-Live/2.0'
    }
  });
  if (!response.ok) throw new Error(`스포츠 데이터 요청 실패 (${response.status})`);
  return response.json();
});
