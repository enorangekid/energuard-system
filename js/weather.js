/* js/weather.js — 날씨 공용 모듈 (2026-11-04)
   포천시 가산면(우리 위치)의 현재·시간별·주간 날씨를 한 번만 받아 여러 화면이 같이 쓴다.
   - 관리자 화면 상단 날씨 칩(HKWeather.bindChip)과 그 칩을 누르면 뜨는 시간대별·주간 예보 패널이 이 모듈을 쓴다.
   - 우리 제품(우레탄폼·접착제 등)은 온도·습도·비·바람에 민감해서 다른 화면에서도 쓸 수 있게 데이터를 꺼내 쓰는 창구를 열어 둔다:
       HKWeather.get({force})      → Promise<data>   data = { fetchedAt, location, models, hours[], days[] }
       HKWeather.current()         → 지금 시각 값(시간별 값을 분 단위로 이어 계산)
       HKWeather.hourAt('2026-11-04T09:00') / HKWeather.dayOf('2026-11-04')
       window 'hkweather:update' 이벤트(detail = data) — 갱신될 때마다 뜬다.
   - 예보 모델: Open-Meteo를 통해 ECMWF·JMA·ICON·GFS·UKMO 5개 모델 값을 받아 **중앙값**을 쓴다(한 모델이 튀어도 덜 흔들린다).
     기상청(KMA) 모델이 한국엔 가장 맞지만, 2026-11-04에 Open-Meteo의 kma_seamless·kma_ldps·kma_gdps는 값이 전부 비어 있어서 못 썼다.
     예전 표시(current_weather = best_match 한 모델)는 같은 시각에 다른 모델과 2~4℃씩 어긋나기도 했다. 이 값은 관측값이 아니라 예보 모델 값이다. */
(function () {
  'use strict';

  const LOCATION = { name: '포천시 가산면', lat: 37.8289, lon: 127.1994 };
  const MODELS = [['ecmwf_ifs025', 'ECMWF'], ['jma_seamless', 'JMA'], ['icon_seamless', 'ICON'], ['gfs_seamless', 'GFS'], ['ukmo_seamless', 'UKMO']];
  const VARS = ['temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'dew_point_2m', 'precipitation', 'snowfall', 'cloud_cover', 'wind_speed_10m', 'wind_gusts_10m'];
  const DAYS = 8; // 오늘 + 7일 — 모델마다 끝나는 날이 달라 뒤쪽 날은 쓰는 모델 수가 줄어든다
  const TTL = 30 * 60 * 1000;
  const CACHE_KEY = 'hkWeather.v1';

  /* ── 계산 도우미 ── */
  const isNum = v => typeof v === 'number' && Number.isFinite(v);
  const round1 = v => (isNum(v) ? Math.round(v * 10) / 10 : null);
  function median(list) {
    const s = list.filter(isNum).sort((a, b) => a - b);
    if (!s.length) return null;
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  const esc = text => String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  function nowKst() { // 'YYYY-MM-DDTHH:mm' — 브라우저 시간대와 상관없이 한국 시각
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace(' ', 'T').slice(0, 16);
  }
  const minutesOf = t => Number(t.slice(11, 13)) * 60 + Number(t.slice(14, 16));

  /* ── 날씨 종류(맑음·구름…·비·눈) — 모델 날씨코드는 모델마다 달라서 구름양·강수·기온으로 직접 나눈다 ── */
  const KINDS = {
    clear:     { text: '맑음',     day: 'fa-sun',                 night: 'fa-moon',           color: '#f59e0b', nightColor: '#64748b' },
    partly:    { text: '구름조금', day: 'fa-cloud-sun',           night: 'fa-cloud-moon',     color: '#f59e0b', nightColor: '#64748b' },
    mostly:    { text: '구름많음', day: 'fa-cloud',               night: 'fa-cloud',          color: '#94a3b8', nightColor: '#94a3b8' },
    overcast:  { text: '흐림',     day: 'fa-cloud',               night: 'fa-cloud',          color: '#64748b', nightColor: '#64748b' },
    rain:      { text: '비',       day: 'fa-cloud-rain',          night: 'fa-cloud-rain',     color: '#3b82f6', nightColor: '#3b82f6' },
    heavyrain: { text: '강한 비',  day: 'fa-cloud-showers-heavy', night: 'fa-cloud-showers-heavy', color: '#1d4ed8', nightColor: '#1d4ed8' },
    snow:      { text: '눈',       day: 'fa-snowflake',           night: 'fa-snowflake',      color: '#0ea5e9', nightColor: '#0ea5e9' },
  };
  function kindOf(o) {
    const wet = (isNum(o.precip) && o.precip >= 0.1) || o.wetShare >= 0.5;
    if (wet) {
      if ((isNum(o.snow) && o.snow > 0.05) || (isNum(o.temp) && o.temp <= 0.5)) return 'snow';
      return isNum(o.precip) && o.precip >= 3 ? 'heavyrain' : 'rain';
    }
    const cloud = isNum(o.cloud) ? o.cloud : 0;
    if (cloud < 20) return 'clear';
    if (cloud < 50) return 'partly';
    if (cloud < 85) return 'mostly';
    return 'overcast';
  }
  function iconHtml(kind, isDay = true) {
    const k = KINDS[kind] || KINDS.clear;
    return `<i class="fa-solid ${isDay ? k.day : k.night}" style="color:${isDay ? k.color : k.nightColor};"></i>`;
  }

  /* ── 받아서 합치기 ── */
  function build(json) {
    const h = json.hourly || {};
    const times = h.time || [];
    const series = Object.fromEntries(VARS.map(v => [v, MODELS.map(([id]) => h[`${v}_${id}`]).filter(Array.isArray)]));
    const usedModels = MODELS.filter(([id]) => Array.isArray(h[`temperature_2m_${id}`]) && h[`temperature_2m_${id}`].some(isNum)).map(([id, label]) => ({ id, label }));
    // 해 뜨고 지는 시각(낮·밤 아이콘용) — 모델이 여럿이면 키에 모델 이름이 붙는다
    const d = json.daily || {};
    const riseKey = Object.keys(d).find(k => k.startsWith('sunrise')), setKey = Object.keys(d).find(k => k.startsWith('sunset'));
    const sun = {};
    (d.time || []).forEach((date, i) => { sun[date] = { rise: riseKey ? d[riseKey][i] : null, set: setKey ? d[setKey][i] : null }; });
    const isDay = t => { const s = sun[t.slice(0, 10)]; return s && s.rise && s.set ? t >= s.rise && t < s.set : minutesOf(t) >= 360 && minutesOf(t) < 1080; };

    const hours = [];
    times.forEach((t, i) => {
      const pick = v => series[v].map(arr => arr[i]);
      const temps = pick('temperature_2m').filter(isNum);
      if (!temps.length) return;
      const precips = pick('precipitation').filter(isNum);
      const o = {
        time: t,
        temp: round1(median(temps)),
        feels: round1(median(pick('apparent_temperature'))),
        humidity: isNum(median(pick('relative_humidity_2m'))) ? Math.round(median(pick('relative_humidity_2m'))) : null,
        dew: round1(median(pick('dew_point_2m'))),
        precip: round1(median(precips)) ?? 0,
        snow: median(pick('snowfall')),
        cloud: isNum(median(pick('cloud_cover'))) ? Math.round(median(pick('cloud_cover'))) : null,
        wind: round1(median(pick('wind_speed_10m'))),
        gust: round1(median(pick('wind_gusts_10m'))),
        spread: round1(Math.max(...temps) - Math.min(...temps)), // 모델 간 기온 차 — 클수록 불확실
        models: temps.length,
        wetShare: precips.length ? precips.filter(p => p >= 0.1).length / precips.length : 0, // 비가 온다고 본 모델 비율
        isDay: isDay(t),
      };
      o.kind = kindOf(o);
      hours.push(o);
    });

    // 하루 요약 — 낮(08~20시) 구름·강수로 대표 날씨를 정한다
    const byDate = new Map();
    hours.forEach(o => { const k = o.time.slice(0, 10); if (!byDate.has(k)) byDate.set(k, []); byDate.get(k).push(o); });
    const days = [...byDate.entries()].slice(0, DAYS).map(([date, list]) => {
      const dayHours = list.filter(o => { const m = minutesOf(o.time); return m >= 480 && m <= 1200; });
      const basis = dayHours.length ? dayHours : list;
      const precip = round1(list.reduce((sum, o) => sum + (o.precip || 0), 0)) ?? 0;
      const rep = { precip: basis.reduce((sum, o) => sum + (o.precip || 0), 0), wetShare: Math.max(...basis.map(o => o.wetShare)), snow: basis.reduce((sum, o) => sum + (isNum(o.snow) ? o.snow : 0), 0),
        temp: median(basis.map(o => o.temp)), cloud: median(basis.map(o => o.cloud)) };
      // 하루 합계가 작은 비(0.5mm 미만, 모델 대부분이 동의해도 0.5~1mm)는 대표 날씨로 올리지 않는다
      const kind = precip >= 1 || (rep.wetShare >= 0.6 && precip >= 0.5) ? kindOf({ ...rep, precip: Math.max(rep.precip, precip >= 1 ? 0.1 : 0) }) : kindOf({ ...rep, precip: 0, wetShare: 0 });
      const dow = new Date(date + 'T00:00:00+09:00').getDay();
      return {
        date, dow: '일월화수목금토'[dow], kind,
        tmax: Math.max(...list.map(o => o.temp)), tmin: Math.min(...list.map(o => o.temp)),
        precip, wetShare: round1(rep.wetShare), humidity: Math.round(median(list.map(o => o.humidity)) ?? 0),
        windMax: Math.max(...list.map(o => o.wind ?? 0)), gustMax: Math.max(...list.map(o => o.gust ?? 0)),
        spread: Math.max(...list.map(o => o.spread ?? 0)), models: Math.min(...list.map(o => o.models)),
      };
    });
    return { fetchedAt: new Date().toISOString(), fetchedAtMs: Date.now(), location: LOCATION, models: usedModels, hours, days };
  }

  /* ── 가져오기(30분 캐시) ── */
  let cache = null, inflight = null;
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (saved && saved.hours && Date.now() - saved.fetchedAtMs < TTL) cache = saved;
  } catch (e) { /* 캐시 없이 시작 */ }

  async function get(options = {}) {
    if (!options.force && cache && Date.now() - cache.fetchedAtMs < TTL) return cache;
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}&models=${MODELS.map(m => m[0]).join(',')}`
          + `&hourly=${VARS.join(',')}&daily=sunrise,sunset&wind_speed_unit=ms&timezone=Asia%2FSeoul&forecast_days=${DAYS}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`날씨 서버 응답 ${response.status}`);
        const data = build(await response.json());
        if (!data.hours.length) throw new Error('예보 값이 비어 있습니다');
        cache = data;
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) { /* 저장 못 해도 동작 */ }
        window.dispatchEvent(new CustomEvent('hkweather:update', { detail: data }));
        return data;
      } catch (error) {
        if (cache) return cache; // 이전 값이라도 보여 준다
        throw error;
      } finally { inflight = null; }
    })();
    return inflight;
  }

  const hourAt = time => (cache ? cache.hours.find(o => o.time === time) || null : null);
  const dayOf = date => (cache ? cache.days.find(o => o.date === date) || null : null);

  /* 지금 값 — 정시 값 두 개를 분 단위로 이어서(선형) 계산한다 */
  function current() {
    if (!cache) return null;
    const now = nowKst();
    let i = -1;
    cache.hours.forEach((o, index) => { if (o.time <= now) i = index; });
    if (i < 0) i = 0;
    const a = cache.hours[i], b = cache.hours[i + 1] || a;
    const f = a === b ? 0 : (minutesOf(now) - minutesOf(a.time) + (now.slice(0, 10) === a.time.slice(0, 10) ? 0 : 1440)) / 60;
    const mix = key => (isNum(a[key]) && isNum(b[key]) ? a[key] + (b[key] - a[key]) * Math.min(Math.max(f, 0), 1) : a[key]);
    const out = { ...a, time: now, temp: round1(mix('temp')), feels: round1(mix('feels')), humidity: isNum(mix('humidity')) ? Math.round(mix('humidity')) : null, dew: round1(mix('dew')), wind: round1(mix('wind')), gust: round1(mix('gust')), cloud: isNum(mix('cloud')) ? Math.round(mix('cloud')) : null };
    out.kind = kindOf(out);
    return out;
  }

  /* ── 상단 칩 + 패널 ── */
  const WEEK_LABEL = (day, index) => (index === 0 ? '오늘' : index === 1 ? '내일' : `${day.date.slice(5).replace('-', '/')}(${day.dow})`);
  let chip = null, panel = null;

  function chipHtml(data) {
    const now = current(); if (!now) return '';
    return `${iconHtml(now.kind, now.isDay)} <span style="font-weight:700; color:#1e293b;">${esc(now.temp)}°C</span> <span style="font-size:12px; color:#9ca3af;">(${esc(KINDS[now.kind].text)})</span>`;
  }
  function renderChip() {
    if (!chip) return;
    if (!cache) return;
    chip.innerHTML = chipHtml(cache);
    const when = new Date(cache.fetchedAtMs).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    chip.title = `${LOCATION.name} · 예보 모델 ${cache.models.length}개 중앙값(관측값 아님) · ${when} 갱신 — 누르면 시간별·주간 예보`;
  }
  function showError() {
    if (chip && !cache) chip.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color:#ef4444;"></i> 날씨 오류';
  }

  function panelHtml() {
    const now = current();
    const upd = new Date(cache.fetchedAtMs).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const models = cache.models.map(m => m.label).join('·');
    const stat = (label, value) => `<div class="hkw-stat"><span>${label}</span><b>${value}</b></div>`;
    const idx = cache.hours.findIndex(o => o.time.slice(0, 13) === now.time.slice(0, 13));
    const next = cache.hours.slice(Math.max(idx, 0), Math.max(idx, 0) + 24);
    if (next.length) next[0] = { ...next[0], temp: now.temp, humidity: now.humidity, precip: next[0].precip, kind: now.kind, isDay: now.isDay }; // "지금" 칸은 위 현재값과 같은 값으로
    const weekMin = Math.min(...cache.days.map(d => d.tmin)), weekMax = Math.max(...cache.days.map(d => d.tmax));
    const span = Math.max(weekMax - weekMin, 1);
    let lastDate = '';
    const hourly = next.map((o, i) => {
      const date = o.time.slice(0, 10);
      const mark = date !== lastDate && i > 0 ? `<div class="hkw-datemark">${date.slice(5).replace('-', '/')}</div>` : '';
      lastDate = date;
      return `${mark}<div class="hkw-hour" title="${esc(o.time.slice(11))} · ${esc(KINDS[o.kind].text)} · 체감 ${esc(o.feels)}° · 풍속 ${esc(o.wind)}m/s · 모델 간 차 ${esc(o.spread)}°">
        <span class="hkw-hl">${i === 0 ? '지금' : o.time.slice(11, 13) + '시'}</span>${iconHtml(o.kind, o.isDay)}
        <b>${esc(Math.round(o.temp))}°</b><span class="hkw-hp ${o.precip >= 0.1 ? 'is-wet' : ''}">${o.precip >= 0.1 ? esc(o.precip) + 'mm' : '–'}</span><span class="hkw-hh">${esc(o.humidity ?? '–')}%</span></div>`;
    }).join('');
    const weekly = cache.days.map((d, i) => `<div class="hkw-day">
        <span class="hkw-dl">${esc(WEEK_LABEL(d, i))}</span>${iconHtml(d.kind, true)}<span class="hkw-dt">${esc(KINDS[d.kind].text)}</span>
        <span class="hkw-dp ${d.precip >= 1 ? 'is-wet' : ''}">${d.precip >= 0.1 ? esc(d.precip) + 'mm' : '–'}</span><span class="hkw-dh">${esc(d.humidity)}%</span>
        <span class="hkw-lo">${esc(Math.round(d.tmin))}°</span>
        <span class="hkw-bar"><i style="left:${((d.tmin - weekMin) / span * 100).toFixed(1)}%; width:${(Math.max(d.tmax - d.tmin, 0.6) / span * 100).toFixed(1)}%"></i></span>
        <span class="hkw-hi">${esc(Math.round(d.tmax))}°</span></div>`).join('');
    return `<div class="hkw-head"><div><b>${esc(LOCATION.name)}</b><span class="hkw-sub">${esc(upd)} 갱신 · ${esc(models)} 중앙값</span></div>
        <button type="button" class="hkw-refresh" title="지금 다시 받기" data-act="refresh"><i class="fa-solid fa-rotate"></i></button>
        <button type="button" class="hkw-close" title="닫기" data-act="close"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="hkw-now"><div class="hkw-big">${iconHtml(now.kind, now.isDay)} <b>${esc(now.temp)}°</b><span>${esc(KINDS[now.kind].text)}</span></div>
        <div class="hkw-stats">${stat('체감', esc(now.feels) + '°')}${stat('습도', esc(now.humidity ?? '–') + '%')}${stat('풍속', esc(now.wind) + 'm/s')}${stat('돌풍', esc(now.gust) + 'm/s')}${stat('이슬점', esc(now.dew) + '°')}${stat('모델 간 차', esc(now.spread) + '°')}</div></div>
      <div class="hkw-title">시간대별 <small>(기온 · 강수 · 습도)</small></div><div class="hkw-hours">${hourly}</div>
      <div class="hkw-title">주간 예보 <small>(날씨 · 강수 · 습도 · 최저/최고)</small></div><div class="hkw-days">${weekly}</div>
      <div class="hkw-note">관측값이 아니라 예보 모델 값입니다. 모델 간 차이가 클수록 불확실합니다. 뒤쪽 날짜일수록 정확도가 떨어집니다.</div>`;
  }

  function closePanel() { if (panel) { panel.remove(); panel = null; } document.removeEventListener('mousedown', onOutside, true); document.removeEventListener('keydown', onKey, true); }
  function onOutside(event) { if (panel && !panel.contains(event.target) && !(chip && chip.contains(event.target))) closePanel(); }
  function onKey(event) { if (event.key === 'Escape') closePanel(); }
  async function openPanel() {
    if (panel) { closePanel(); return; }
    try { await get(); } catch (e) { return; }
    if (!cache) return;
    renderChip(); // 칩 글자도 지금 시각 값으로 맞춘다(패널 값과 어긋나지 않게)
    panel = document.createElement('div');
    panel.className = 'hkw-panel';
    panel.innerHTML = panelHtml();
    document.body.append(panel);
    const rect = chip ? chip.getBoundingClientRect() : { bottom: 48, right: window.innerWidth - 16 };
    panel.style.top = `${Math.round(rect.bottom + 8)}px`;
    panel.style.right = `${Math.max(8, Math.round(window.innerWidth - rect.right))}px`;
    panel.addEventListener('click', async event => {
      const act = event.target.closest('[data-act]')?.dataset.act;
      if (act === 'close') closePanel();
      if (act === 'refresh') { try { await get({ force: true }); } catch (e) { /* 이전 값 유지 */ } if (panel) { panel.innerHTML = panelHtml(); } renderChip(); }
    });
    document.addEventListener('mousedown', onOutside, true);
    document.addEventListener('keydown', onKey, true);
  }

  /* 상단 칩에 연결 — 켜질 때와 갱신될 때 칩 글자를 바꾸고, 누르면 패널을 연다 */
  function bindChip(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) return;
    chip = el;
    if (el.dataset.hkwBound) { renderChip(); return; } // 이미 연결된 칩 — 이벤트를 또 달지 않는다
    el.dataset.hkwBound = '1';
    chip.style.cursor = 'pointer';
    chip.setAttribute('role', 'button');
    chip.tabIndex = 0;
    chip.addEventListener('click', openPanel);
    chip.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPanel(); } });
    if (cache) renderChip();
  }
  window.addEventListener('hkweather:update', () => { renderChip(); if (panel) panel.innerHTML = panelHtml(); });
  /* 칩 글자를 최신으로 — 캐시가 30분 안이면 서버를 다시 부르지 않는다 */
  async function update() { try { await get(); renderChip(); } catch (e) { showError(); } }

  /* ═══════════════════════════════════════
     날짜별 날씨 기록 — 매출이 달랐던 날의 기온·날씨를 나중에 같이 보려고(2026-11-04, 사용자 요청: "이날 매출이 높았는데 많이 추웠구나")
     - 값 = Open-Meteo 과거 날씨(archive) 시간별 값으로 하루치를 계산한 것. 예보가 아니라 지난 날의 분석값이라 "그날 실제로 어땠는지"에 가깝지만
       기상청 관측소 값은 아니다(1~2℃ 차이 날 수 있다).
     - 저장: 단가표와 같은 Supabase hk_settings 테이블(key 'weather_daily', 로그인 없이 읽기·쓰기 — sql/hankook_pricing_tables.sql) 한 줄에 날짜별로 모은다.
       별도 테이블·SQL이 필요 없다. 날짜 하나 ≈ 140바이트라 1,000일에 약 140KB.
     - 채우기: 서버에서 도는 자동 작업이 없어서, 관리자 화면을 열 때(HKWeather.syncDaily) **저장 안 된 날짜를 찾아 채운다**. 며칠 안 열어도 다음에 열 때 빠진 날이 메워진다.
       어제까지만 저장한다(오늘은 하루가 안 끝났다). 최근 7일은 값이 조금 고쳐질 수 있어서 하루에 한 번 다시 받는다.
     - 두 곳에서 동시에 채워도 서로 덮어쓰지 않게 updated_at이 내가 읽은 그대로일 때만 쓴다. */
  const HISTORY_START = '2024-01-01'; // 이 날부터 채운다(알림쿠폰 시작 2024-04 이전부터 보려고)
  const DAILY_KEY = window.HK_WEATHER_DAILY_KEY || 'weather_daily';
  const ARCHIVE_VARS = 'temperature_2m,relative_humidity_2m,precipitation,snowfall,cloud_cover,wind_speed_10m,wind_gusts_10m';
  const addDays = (date, n) => { const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const todayKst = () => nowKst().slice(0, 10);
  const dbClient = () => (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
  let dailyData = null;   // { days: {날짜: 값}, stamp, checkedDate }
  let syncing = null;

  function dayKind(s) {
    const wet = s.rain >= 1 || (s.rain >= 0.5 && s.wetHours >= 3);
    if (wet) {
      if (s.snow >= 0.3 || (isNum(s.tmean) && s.tmean <= 0.5)) return 'snow';
      return s.rain >= 20 ? 'heavyrain' : 'rain';
    }
    const cloud = isNum(s.cloud) ? s.cloud : 0;
    return cloud < 20 ? 'clear' : cloud < 50 ? 'partly' : cloud < 85 ? 'mostly' : 'overcast';
  }

  /* 시간별 값 → 날짜별 요약 — 하루 24시간 중 20시간 미만이면 믿지 않고 건너뛴다 */
  function dailyFromHourly(json) {
    const h = json.hourly || {};
    const byDate = {};
    (h.time || []).forEach((t, i) => {
      const date = t.slice(0, 10);
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push({ hour: Number(t.slice(11, 13)), temp: h.temperature_2m[i], hum: h.relative_humidity_2m[i], precip: h.precipitation[i], snow: h.snowfall[i], cloud: h.cloud_cover[i], wind: h.wind_speed_10m[i], gust: h.wind_gusts_10m[i] });
    });
    const mean = list => { const v = list.filter(isNum); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
    const sum = list => list.filter(isNum).reduce((s, x) => s + x, 0);
    const out = {};
    Object.entries(byDate).forEach(([date, rows]) => {
      const temps = rows.map(r => r.temp).filter(isNum);
      if (temps.length < 20) return;
      const work = rows.filter(r => r.hour >= 9 && r.hour <= 18); // 업무시간(09~18시) — 시공·작업이 이뤄지는 때의 기온·습도
      const daytime = rows.filter(r => r.hour >= 8 && r.hour <= 20);
      const workTemps = work.map(r => r.temp).filter(isNum);
      const rain = sum(rows.map(r => r.precip)), snow = sum(rows.map(r => r.snow)), tmean = mean(temps);
      const cloud = mean(daytime.map(r => r.cloud));
      out[date] = {
        tmax: round1(Math.max(...temps)), tmin: round1(Math.min(...temps)), tmean: round1(tmean),
        rain: round1(rain), snow: round1(snow), hum: Math.round(mean(rows.map(r => r.hum)) ?? 0), cloud: Math.round(cloud ?? 0),
        wind: round1(Math.max(...rows.map(r => r.wind ?? 0))), gust: round1(Math.max(...rows.map(r => r.gust ?? 0))),
        wt: round1(mean(workTemps)), wtmin: workTemps.length ? round1(Math.min(...workTemps)) : null, wh: Math.round(mean(work.map(r => r.hum)) ?? 0),
        k: dayKind({ rain, snow, tmean, cloud, wetHours: rows.filter(r => isNum(r.precip) && r.precip >= 0.1).length }),
      };
    });
    return out;
  }

  async function fetchArchive(from, to) {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}&start_date=${from}&end_date=${to}&hourly=${ARCHIVE_VARS}&wind_speed_unit=ms&timezone=Asia%2FSeoul`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`과거 날씨 서버 응답 ${response.status}`);
    return dailyFromHourly(await response.json());
  }

  async function readDailyRow(client) {
    const { data, error } = await client.from('hk_settings').select('value,updated_at').eq('key', DAILY_KEY).limit(1);
    if (error) throw error;
    return (data && data[0]) || null;
  }

  /* 저장된 날짜별 기록을 읽는다 — { days: {'2026-11-03': {...}}, from, to, count } (서버에 아직 없으면 빈 기록) */
  async function dailyHistory(options = {}) {
    if (dailyData && !options.force) return dailyData;
    const client = dbClient();
    if (!client) throw new Error('서버에 연결하지 못했습니다');
    const row = await readDailyRow(client);
    const days = (row && row.value && row.value.days) || {};
    const keys = Object.keys(days).sort();
    dailyData = { days, stamp: row ? row.updated_at : '', checkedDate: (row && row.value && row.value.checkedDate) || '', from: keys[0] || null, to: keys[keys.length - 1] || null, count: keys.length };
    return dailyData;
  }
  const dailyOf = date => (dailyData && dailyData.days[date]) || null;

  /* 빠진 날짜를 찾아 채워 저장한다. 하루에 한 번이면 충분해서 이미 오늘 확인했고 빠진 날이 없으면 바로 끝난다. */
  async function syncDaily() {
    if (syncing) return syncing;
    syncing = (async () => {
      const client = dbClient();
      if (!client) return { ok: false, reason: 'no-client' };
      try {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const row = await readDailyRow(client);
          const days = { ...((row && row.value && row.value.days) || {}) };
          const today = todayKst(), yesterday = addDays(today, -1), recentFrom = addDays(yesterday, -6);
          const checkedToday = row && row.value && row.value.checkedDate === today;
          const wanted = [];
          for (let d = HISTORY_START; d <= yesterday; d = addDays(d, 1)) { if (!days[d] || (!checkedToday && d >= recentFrom)) wanted.push(d); }
          if (!wanted.length) {
            dailyData = null; await dailyHistory({ force: true });
            return { ok: true, added: 0, total: dailyData.count };
          }
          // 이어진 날짜끼리 묶고 최대 366일씩 나눠 받는다
          const ranges = [];
          wanted.forEach(d => { const last = ranges[ranges.length - 1]; if (last && addDays(last.to, 1) === d && Date.parse(d) - Date.parse(last.from) < 365 * 86400000) last.to = d; else ranges.push({ from: d, to: d }); });
          let added = 0;
          for (const range of ranges) {
            const part = await fetchArchive(range.from, range.to);
            Object.entries(part).forEach(([date, value]) => { if (!days[date]) added += 1; days[date] = value; });
          }
          const value = { version: 1, location: LOCATION, source: 'open-meteo archive (시간별 값으로 하루 계산)', start: HISTORY_START, checkedDate: today, days };
          const now = new Date().toISOString();
          let writeError = null, changed = false;
          if (!row) {
            const { error } = await client.from('hk_settings').insert({ key: DAILY_KEY, value, updated_at: now });
            writeError = error; changed = !error;
          } else {
            const { data, error } = await client.from('hk_settings').update({ value, updated_at: now }).eq('key', DAILY_KEY).eq('updated_at', row.updated_at).select('updated_at');
            writeError = error; changed = !error && data && data.length > 0;
          }
          if (changed) { dailyData = null; await dailyHistory({ force: true }); return { ok: true, added, total: dailyData.count }; }
          if (writeError && !/duplicate|23505/i.test(`${writeError.code} ${writeError.message}`)) throw writeError;
          // 다른 곳이 먼저 저장했다 — 다시 읽어서 한 번 더 시도한다
        }
        return { ok: false, reason: 'conflict' };
      } catch (error) {
        return { ok: false, reason: 'error', message: error.message || String(error) };
      } finally { syncing = null; }
    })();
    return syncing;
  }

  window.HKWeather = { LOCATION, MODELS, KINDS, get, update, current, hourAt, dayOf, bindChip, openPanel, closePanel, iconHtml, last: () => cache,
    syncDaily, dailyHistory, dailyOf, HISTORY_START };
})();
