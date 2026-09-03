const card = document.querySelector('#card');
const AVATAR_PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZTllZGYyIi8+PGNpcmNsZSBjeD0iMjAiIGN5PSIxNSIgcj0iNyIgZmlsbD0iI2I0YmRjOSIvPjxwYXRoIGQ9Ik02IDM0YzIuMi03LjggNy4yLTExLjQgMTQtMTEuNFMzMiAyNi4yIDM0IDM0eiIgZmlsbD0iI2I0YmRjOSIvPjwvc3ZnPg==";
let gameId = '';
let sport = 'nba';
let endpointLeague = '';
let closeTimer = null;
let pinned = false;

function scheduleClose(delay = 7000) {
  clearTimeout(closeTimer);
  if (pinned) return;
  closeTimer = setTimeout(closeAnimated, delay);
}

function closeAnimated() {
  clearTimeout(closeTimer);
  card.classList.add('hiding');
  setTimeout(() => window.nbaNotification.dismiss(), 210);
}

function openGame() {
  clearTimeout(closeTimer);
  window.nbaNotification.openGame({ gameId, sport, endpointLeague });
}

function renderPinned(nextPinned) {
  pinned = Boolean(nextPinned);
  const button = document.querySelector('#pin');
  button.classList.toggle('active', pinned);
  button.textContent = '📌';
  button.setAttribute('aria-pressed', String(pinned));
  button.title = pinned ? '고정 해제' : '알림 고정';
  if (pinned) clearTimeout(closeTimer); else scheduleClose(3500);
}

function playSoftTone() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const gain = context.createGain();
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + .12);
    gain.gain.setValueAtTime(.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.06, context.currentTime + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .2);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .21);
  } catch {}
}

window.nbaNotification.onData(payload => {
  gameId = payload.gameId || '';
  sport = payload.sport || 'nba';
  document.documentElement.dataset.sport = sport;
  endpointLeague = payload.endpointLeague || '';
  document.querySelector('#appMark').textContent = payload.league || sport.toUpperCase();
  document.querySelector('#meta').textContent = payload.meta || '실시간 경기';
  document.querySelector('#awayName').textContent = payload.awayName || '원정';
  document.querySelector('#homeName').textContent = payload.homeName || '홈';
  document.querySelector('#awayScore').textContent = payload.awayScore === '' ? '-' : payload.awayScore;
  document.querySelector('#homeScore').textContent = payload.homeScore === '' ? '-' : payload.homeScore;
  document.querySelector('#playText').textContent = payload.body || payload.title || '새로운 경기 소식이 있습니다.';
  document.querySelector('#playerName').textContent = payload.playerName || '';
  document.querySelector('#playerName').hidden = !payload.playerName;
  const playerImageEl = document.querySelector('#playerImage');
  const hasPlayerContext = Boolean(payload.playerName);
  playerImageEl.hidden = !hasPlayerContext;
  if (hasPlayerContext) {
    playerImageEl.onerror = () => { playerImageEl.onerror = null; playerImageEl.src = AVATAR_PLACEHOLDER; };
    playerImageEl.src = payload.playerImage || AVATAR_PLACEHOLDER;
  }
  if (payload.awayLogo) document.querySelector('#awayLogo').src = payload.awayLogo;
  if (payload.homeLogo) document.querySelector('#homeLogo').src = payload.homeLogo;
  if (!payload.silent) playSoftTone();
  renderPinned(payload.pinned);
  scheduleClose();
});

window.nbaNotification.onForcePinned(nextPinned => renderPinned(nextPinned));

card.addEventListener('click', openGame);
card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') openGame(); });
card.addEventListener('mouseenter', () => clearTimeout(closeTimer));
card.addEventListener('mouseleave', () => scheduleClose(3500));
document.querySelector('#dismiss').addEventListener('click', event => { event.stopPropagation(); closeAnimated(); });
document.querySelector('#pin').addEventListener('click', async event => {
  event.stopPropagation();
  renderPinned(await window.nbaNotification.setPinned(!pinned));
});
