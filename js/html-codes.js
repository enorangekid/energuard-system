/* html-codes.html — 상세 HTML 코드 모음 (2026-10-30)
   - 원본: data/detail-html/files/ (D:\★한국단열\02.HTML 복사본) · 목록 manifest.json · 매핑 기본값 mapping.json
   - 바꾼 것(코드 수정·변형 파일·매핑)은 서버(Supabase hk_settings, key 'detail_html')에 저장하고 이 브라우저(localStorage)에도 사본을 둔다. 원본 파일은 바뀌지 않는다.
   - 상태 모델: { edits: {경로: 코드}, extras: {경로: {folder, name, code, from}}, map: {경로: [항목]}, unassigned: [항목]|null }
     map[경로]가 있으면 그 파일의 mapping.json 기본값을 통째로 대신한다(항목 = {channel, code, status, note}). */
(function () {
  'use strict';

  const DATA = 'data/detail-html/';
  const LS_KEY = 'hkHtmlCodes.v1';
  const CHANNELS = [['coupang', '쿠팡'], ['11st', '11번가'], ['smartstore', '스마트스토어'], ['esm', 'ESM'], ['etc', '기타']];
  const STATUSES = [['todo', '할 일'], ['done', '완료'], ['hold', '보류']];
  const CHANNEL_LABEL = Object.fromEntries(CHANNELS);
  const STATUS_LABEL = Object.fromEntries(STATUSES);
  const SAEKYUNG_IMG = 'https://gi.esmplus.com/0804bear/guide/saekyung.jpg'; // 줄 추가 칸의 기본값 — 2026-10-30 아이소핑크 _세경 변형에 맨 위로 넣은 이미지

  const $ = (selector, root = document) => root.querySelector(selector);

  /* ── 작은 DOM 도우미 ── */
  function h(tag, attrs, ...kids) {
    const node = document.createElement(tag);
    let value;
    Object.entries(attrs || {}).forEach(([key, val]) => {
      if (val == null || val === false) return;
      if (key === 'class') node.className = val;
      else if (key === 'text') node.textContent = val;
      else if (key === 'value') value = val;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), val);
      else node.setAttribute(key, val === true ? '' : val);
    });
    kids.flat().forEach(kid => { if (kid != null && kid !== false) node.append(kid.nodeType ? kid : document.createTextNode(String(kid))); });
    if (value !== undefined) node.value = value;
    return node;
  }
  const select = (options, current, attrs) => h('select', { class: 'hc-input', ...attrs }, options.map(([val, label]) => h('option', { value: val, selected: val === current }, label)));

  let toastTimer = 0;
  function toast(message) {
    const node = $('#hcToast');
    node.textContent = message;
    node.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('is-on'), 1800);
  }

  async function copyText(text, label) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const area = h('textarea', { style: 'position:fixed;opacity:0' }); // 클립보드 권한이 없는 환경 대비
      area.value = text; document.body.append(area); area.select(); document.execCommand('copy'); area.remove();
    }
    toast(`${label || '복사'}했습니다`);
  }

  function download(name, text, mime) {
    const url = URL.createObjectURL(new Blob([text], { type: mime || 'text/html;charset=utf-8' }));
    const link = h('a', { href: url, download: name });
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ── 상태 ── */
  let state = { edits: {}, extras: {}, map: {}, unassigned: null };
  try { Object.assign(state, JSON.parse(localStorage.getItem(LS_KEY) || 'null') || {}); } catch (e) { /* 저장값 없이 시작 */ }
  const hasData = () => Object.keys(state.edits).length > 0 || Object.keys(state.extras).length > 0 || Object.keys(state.map).length > 0 || state.unassigned !== null;

  /* ── 저장: 서버(Supabase hk_settings) + 이 브라우저 사본 ──
     단가표가 이미 쓰는 hk_settings 테이블(key/value jsonb, anon 읽기·쓰기 허용 — sql/hankook_pricing_tables.sql)에 key 'detail_html' 한 줄로 통째 저장한다.
     바꿀 때마다 이 브라우저(localStorage)에 바로 사본을 남기고, 1초 뒤 서버에 올린다. 여러 곳에서 열어도 서로 덮어쓰지 않게 updated_at을 비교해서
     (내가 불러온 시각 그대로일 때만 쓰기) 다른 곳에서 먼저 저장했으면 멈추고 알린다. */
  const SUPABASE_URL = 'https://eukwfypbfqojbaihfqye.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_MiBvlf3d6ulcVBsi7Odcgw_PTXSmXKj'; // 공개용(publishable) 키 — js/common.js·pricing-view.html과 같은 값
  const DB_KEY = window.HK_HTML_CODES_KEY || 'detail_html'; // 시험할 때만 다른 key로 바꿔 쓰려는 훅
  const META_KEY = 'hkHtmlCodes.meta';
  let client = null;
  try { if (window.supabase) client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch (e) { /* 서버 없이 이 브라우저에만 저장 */ }
  const meta = { stamp: '', dirty: false }; // stamp = 마지막으로 서버와 맞춘 updated_at, dirty = 서버에 아직 못 올린 변경이 있음
  try { Object.assign(meta, JSON.parse(localStorage.getItem(META_KEY) || 'null') || {}); } catch (e) { /* 기본값 */ }
  const writeMeta = () => { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* 무시 */ } };

  let saveStatus = { kind: 'loading', detail: '' };
  function setSaveStatus(kind, detail) {
    saveStatus = { kind, detail: detail || '' };
    const node = $('#hcSave');
    if (!node) return;
    const text = {
      loading: '서버에서 불러오는 중…', pending: '저장 대기…', saving: '서버에 저장 중…', offline: '서버에 연결하지 못함 — 이 브라우저에만 저장',
      saved: `서버에 저장됨${meta.stamp ? ' · ' + new Date(meta.stamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}`,
      error: `서버 저장 실패 — 이 브라우저에는 저장됨${detail ? ' (' + detail + ')' : ''}`,
      conflict: '다른 곳에서 먼저 저장했습니다 — [서버에서 불러오기] 또는 [지금 저장](덮어쓰기)',
    }[kind] || '';
    node.textContent = text;
    node.className = 'hc-save is-' + kind;
  }

  let localTimer = 0, remoteTimer = 0, pushing = false, pushAgain = false;
  function save() {
    meta.dirty = true;
    clearTimeout(localTimer);
    localTimer = setTimeout(() => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); writeMeta(); }
      catch (e) { toast('이 브라우저에 저장하지 못했습니다(저장 공간 부족·차단) — 서버 저장은 계속 시도합니다'); }
    }, 250);
    scheduleRemote();
  }
  function scheduleRemote() {
    if (!client) { setSaveStatus('offline'); return; }
    if (saveStatus.kind === 'conflict') return; // 충돌 중에는 사람이 고를 때까지 올리지 않는다
    setSaveStatus('pending');
    clearTimeout(remoteTimer);
    remoteTimer = setTimeout(pushRemote, 1000);
  }
  async function pushRemote() {
    if (!client) return;
    if (pushing) { pushAgain = true; return; }
    pushing = true;
    setSaveStatus('saving');
    try {
      do {
        pushAgain = false;
        const value = { version: 1, edits: state.edits, extras: state.extras, map: state.map, unassigned: state.unassigned };
        const now = new Date().toISOString();
        let stamp = '';
        if (!meta.stamp) { // 서버에 아직 없다 — 처음 한 번만 넣는다(이미 누가 넣었으면 충돌)
          const { data, error } = await client.from('hk_settings').insert({ key: DB_KEY, value, updated_at: now }).select('updated_at');
          if (error) { if (/duplicate|23505/i.test(`${error.code} ${error.message}`)) { setSaveStatus('conflict'); return; } throw error; }
          stamp = data[0].updated_at;
        } else { // 내가 마지막으로 본 updated_at 그대로일 때만 바꾼다
          const { data, error } = await client.from('hk_settings').update({ value, updated_at: now }).eq('key', DB_KEY).eq('updated_at', meta.stamp).select('updated_at');
          if (error) throw error;
          if (!data || !data.length) { setSaveStatus('conflict'); return; }
          stamp = data[0].updated_at;
        }
        meta.stamp = stamp;
        if (!pushAgain) meta.dirty = false;
        writeMeta();
      } while (pushAgain);
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error', /PGRST205|42P01|does not exist|schema cache/i.test(`${error.code} ${error.message}`) ? 'hk_settings 테이블이 없습니다' : (error.message || String(error)));
    } finally { pushing = false; }
  }

  function applyRemote(value) {
    state = { edits: (value && value.edits) || {}, extras: (value && value.extras) || {}, map: (value && value.map) || {}, unassigned: (value && value.unassigned) || null };
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ }
  }

  /* 서버 내용을 읽어 맞춘다. 내가 서버에 못 올린 변경이 있는데 서버도 그 사이 바뀌었으면 어느 쪽을 쓸지 묻는다. */
  async function loadRemote() {
    if (!client) { setSaveStatus('offline'); return; }
    setSaveStatus('loading');
    try {
      const { data, error } = await client.from('hk_settings').select('value,updated_at').eq('key', DB_KEY).limit(1);
      if (error) throw error;
      const row = data && data[0];
      if (!row) { // 서버에 아직 없다 — 이 브라우저에 쌓인 게 있으면 그대로 올린다
        meta.stamp = '';
        if (hasData()) { meta.dirty = true; scheduleRemote(); } else setSaveStatus('saved');
        return;
      }
      const serverChanged = row.updated_at !== meta.stamp;
      if (meta.dirty && !serverChanged) { scheduleRemote(); return; } // 올리다 만 변경을 이어서 올린다
      if (meta.dirty && serverChanged) {
        if (!confirm('이 브라우저에 서버에 못 올린 변경이 있는데, 서버 내용도 그 사이 바뀌었습니다.\n\n[확인] 서버 내용을 불러옵니다(이 브라우저의 변경은 버려짐)\n[취소] 이 브라우저 내용을 유지합니다(다음 저장 때 서버를 덮어씀)')) {
          meta.stamp = row.updated_at; writeMeta(); scheduleRemote(); return;
        }
      }
      applyRemote(row.value);
      meta.stamp = row.updated_at; meta.dirty = false; writeMeta();
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error', /PGRST205|42P01|does not exist|schema cache/i.test(`${error.code} ${error.message}`) ? 'hk_settings 테이블이 없습니다' : (error.message || String(error)));
    }
  }

  /* [지금 저장] — 충돌 중이면 서버 최신 시각을 받아 이 브라우저 내용으로 덮어쓴다(확인 후) */
  async function saveNow() {
    if (!client) { toast('서버에 연결하지 못했습니다'); return; }
    if (saveStatus.kind === 'conflict') {
      if (!confirm('서버에 있는 내용을 이 브라우저 내용으로 덮어씁니다. 다른 곳에서 저장한 변경은 사라집니다.')) return;
      try {
        const { data, error } = await client.from('hk_settings').select('updated_at').eq('key', DB_KEY).limit(1);
        if (error) throw error;
        meta.stamp = data && data[0] ? data[0].updated_at : '';
      } catch (error) { setSaveStatus('error', error.message || String(error)); return; }
      setSaveStatus('pending');
    }
    clearTimeout(remoteTimer);
    await pushRemote();
  }
  async function reloadFromServer() {
    if (meta.dirty && !confirm('서버에 아직 못 올린 변경이 있습니다. 서버 내용으로 바꾸면 그 변경은 사라집니다.')) return;
    meta.dirty = false;
    await loadRemote();
    renderTree(); renderCount();
    current ? openFile(current) : (view === 'map' ? openMapView() : showView('none'));
  }

  let manifest = [];
  let seedMap = { files: {}, unassigned: [] };
  const originals = new Map();
  let current = '';          // 지금 열린 파일 경로
  let currentTab = 'split';
  // 화면 설정(분할 비율·방향) — 코드·매핑 데이터와 따로 저장해서 백업·되돌리기에 섞이지 않게 한다
  const UI_KEY = 'hkHtmlCodes.ui';
  const ui = { split: 50, dir: 'row' };
  try { Object.assign(ui, JSON.parse(localStorage.getItem(UI_KEY) || 'null') || {}); } catch (e) { /* 기본값으로 시작 */ }
  const saveUi = () => { try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (e) { /* 저장 안 돼도 쓸 수 있다 */ } };
  let view = 'file';         // 'file' | 'map'
  let filterChip = 'all';
  const FOLDER_ORDER = ['아이소핑크', '스티로폼', '열반사단열재', '단열벽지', '기타단열재', '부자재', '초배지', '★에너가드컴퍼니'];
  const closedFolders = new Set(['★에너가드컴퍼니']); // 쓰지 않는 에너가드 쪽 25개는 접어 둔다
  const lf = text => String(text).replace(/\r\n?/g, '\n');
  const clone = value => JSON.parse(JSON.stringify(value));

  /* ── 매핑 ── */
  const entriesOf = path => state.map[path] || (seedMap.files || {})[path] || [];
  const unassignedList = () => state.unassigned || seedMap.unassigned || [];
  function writableEntries(path) {
    if (!state.map[path]) state.map[path] = clone((seedMap.files || {})[path] || []);
    return state.map[path];
  }
  function writableUnassigned() {
    if (!state.unassigned) state.unassigned = clone(seedMap.unassigned || []);
    return state.unassigned;
  }
  function effectiveMapping() {
    const files = {};
    allFiles().forEach(file => { const list = entriesOf(file.path); if (list.length) files[file.path] = list; });
    return { version: 1, updated: new Date().toISOString().slice(0, 10), note: seedMap.note || '', files, unassigned: unassignedList() };
  }

  /* ── 파일 목록·코드 ── */
  function allFiles() {
    const list = manifest.map(file => ({ path: file.path, folder: file.folder, name: file.name }));
    const seen = new Set(list.map(file => file.path));
    Object.entries(state.extras).forEach(([path, extra]) => { if (!seen.has(path)) list.push({ path, folder: extra.folder, name: extra.name, extra: true }); });
    return list;
  }
  const fileOf = path => allFiles().find(file => file.path === path);

  async function originalOf(path) {
    if (state.extras[path]) return state.extras[path].code;
    if (originals.has(path)) return originals.get(path);
    const response = await fetch(DATA + 'files/' + path.split('/').map(encodeURIComponent).join('/'), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`${path} (${response.status})`);
    const text = (await response.text()).replace(/^\uFEFF/, '');
    originals.set(path, text);
    return text;
  }
  const isEdited = path => path in state.edits;

  /* ── 사이드바 ── */
  function matches(file, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    return file.path.toLowerCase().includes(q) || entriesOf(file.path).some(entry => String(entry.code).includes(query.trim()));
  }
  function passChip(file) {
    if (filterChip === 'mapped') return entriesOf(file.path).length > 0;
    if (filterChip === 'unmapped') return entriesOf(file.path).length === 0;
    if (filterChip === 'edited') return isEdited(file.path) || !!file.extra;
    return true;
  }

  function renderChips() {
    const chips = [['all', '전체'], ['mapped', '매핑됨'], ['unmapped', '미매핑'], ['edited', '수정·변형']];
    const box = $('#hcChips');
    box.replaceChildren(...chips.map(([key, label]) => h('button', { type: 'button', class: 'hc-chip' + (filterChip === key ? ' is-on' : ''), onclick: () => { filterChip = key; renderChips(); renderTree(); } }, label)));
  }

  function renderTree() {
    const tree = $('#hcTree');
    const scroll = tree.scrollTop;
    const query = $('#hcSearch').value.trim();
    const files = allFiles().filter(file => matches(file, query) && passChip(file));
    const folders = [];
    files.forEach(file => { let group = folders.find(item => item.name === file.folder); if (!group) folders.push(group = { name: file.folder, files: [] }); group.files.push(file); });
    folders.forEach(group => group.files.sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true })));
    // 자주 쓰는 폴더가 위로 — 목록에 없는 폴더(새로 생긴 것)는 그 뒤에 이름순
    const rank = name => { const at = FOLDER_ORDER.findIndex(prefix => name === prefix || name.startsWith(prefix + '/')); return at < 0 ? FOLDER_ORDER.length : at; };
    folders.sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name, 'ko'));
    tree.replaceChildren(...folders.map(group => {
      const closed = closedFolders.has(group.name) && !query;
      return h('div', { class: 'hc-folder' },
        h('button', { type: 'button', class: 'hc-folder-head', onclick: () => { closedFolders.has(group.name) ? closedFolders.delete(group.name) : closedFolders.add(group.name); renderTree(); } },
          h('span', { class: 'hc-caret' }, closed ? '▶' : '▼'), group.name, h('span', { class: 'hc-n' }, String(group.files.length))),
        closed ? null : group.files.map(file => fileButton(file)));
    }));
    if (!folders.length) tree.append(h('div', { class: 'hc-muted', style: 'padding:12px 6px' }, '조건에 맞는 파일이 없습니다.'));
    tree.scrollTop = scroll;
    renderCount();
  }

  function fileButton(file) {
    const entries = entriesOf(file.path);
    const done = entries.filter(entry => entry.status === 'done').length;
    const tags = [];
    if (file.extra || /_세경$/.test(file.name)) tags.push(h('span', { class: 'hc-tag hc-tag-var' }, '변형'));
    if (isEdited(file.path)) tags.push(h('span', { class: 'hc-tag hc-tag-edit' }, '수정됨'));
    if (entries.length) tags.push(h('span', { class: 'hc-tag ' + (done === entries.length ? 'hc-tag-done' : entries.some(entry => entry.status === 'hold') ? 'hc-tag-hold' : 'hc-tag-todo'), title: '완료한 상품 / 매핑된 상품' }, `${done}/${entries.length}`));
    return h('button', { type: 'button', class: 'hc-file' + (view === 'file' && current === file.path ? ' is-active' : ''), onclick: () => openFile(file.path), title: file.path },
      h('span', { class: 'hc-fname' }, file.name), tags);
  }

  function renderCount() {
    const files = allFiles();
    const codes = files.reduce((sum, file) => sum + entriesOf(file.path).length, 0) + unassignedList().length;
    $('#hcCount').textContent = `파일 ${files.length}개 · 수정 ${Object.keys(state.edits).length}개 · 상품코드 ${codes}개`;
  }

  /* ── 화면 전환 ── */
  function showView(name) {
    view = name;
    $('#hcEmpty').hidden = name !== 'none';
    $('#hcEditor').hidden = name !== 'file';
    $('#hcMapView').hidden = name !== 'map';
  }

  /* ── 파일 보기 ── */
  async function openFile(path, tab) {
    const file = fileOf(path);
    if (!file) return;
    current = path;
    if (tab) currentTab = tab;
    try { history.replaceState(null, '', '#' + encodeURIComponent(path)); } catch (e) { /* 무시 */ }
    showView('file');
    const box = $('#hcEditor');
    box.replaceChildren(h('div', { class: 'hc-empty' }, '불러오는 중…'));
    let code;
    try { code = lf(path in state.edits ? state.edits[path] : await originalOf(path)); }
    catch (e) { box.replaceChildren(h('div', { class: 'hc-empty' }, `파일을 읽지 못했습니다: ${e.message}`)); return; }
    renderFile(file, code);
    renderTree();
  }

  function renderFile(file, code) {
    const path = file.path;
    const box = $('#hcEditor');
    const entries = entriesOf(path);
    const area = h('textarea', { class: 'hc-code', spellcheck: 'false', wrap: 'off' });
    area.value = code;
    const meta = h('div', { class: 'hc-code-meta' });
    const editedTag = h('span', { class: 'hc-tag hc-tag-edit', hidden: !isEdited(path) }, '수정됨');
    const revertButton = h('button', { type: 'button', class: 'hc-btn hc-btn-danger', hidden: !isEdited(path), onclick: async () => {
      if (!confirm('이 파일의 수정을 버리고 원본으로 되돌립니다.')) return;
      delete state.edits[path]; save(); await openFile(path);
    } }, '원본으로 되돌리기');

    const updateMeta = () => {
      const text = area.value;
      meta.replaceChildren(h('span', {}, `${text.split('\n').length}줄`), h('span', {}, `이미지 ${(text.match(/<img\b/gi) || []).length}개`), h('span', {}, `${text.length.toLocaleString()}자`));
    };
    let onChange = () => {};
    const onEdit = async () => {
      onChange();
      const original = lf(await originalOf(path));
      if (lf(area.value) === original) delete state.edits[path]; else state.edits[path] = lf(area.value);
      editedTag.hidden = revertButton.hidden = !isEdited(path);
      save(); updateMeta(); renderCount();
      const button = [...document.querySelectorAll('.hc-file')].find(node => node.title === path);
      if (button) button.replaceWith(fileButton(file));
    };
    area.addEventListener('input', onEdit);
    updateMeta();

    const apply = text => { area.value = text; onEdit(); };
    const findInput = h('input', { class: 'hc-input', placeholder: '찾을 글' });
    const replaceInput = h('input', { class: 'hc-input', placeholder: '바꿀 글' });
    const imageInput = h('input', { class: 'hc-input', value: SAEKYUNG_IMG, placeholder: '이미지 주소' });
    const imageLine = () => `<img src="${imageInput.value.trim()}" /> <br />`;
    const addImage = where => {
      const url = imageInput.value.trim();
      if (!url) { toast('이미지 주소를 넣으세요'); return; }
      if (area.value.includes(url)) { toast('이미 들어 있는 주소입니다'); return; }
      const text = area.value;
      if (where === 'top') {
        const open = /<center>[ \t]*\n?/i.exec(text);
        apply(open ? text.slice(0, open.index + open[0].length) + imageLine() + '\n' + text.slice(open.index + open[0].length) : imageLine() + '\n' + text);
      } else {
        const close = text.toLowerCase().lastIndexOf('</center>');
        apply(close >= 0 ? text.slice(0, close) + imageLine() + '\n' + text.slice(close) : text + '\n' + imageLine());
      }
      toast(where === 'top' ? '맨 위에 추가했습니다' : '맨 아래에 추가했습니다');
    };

    const toolsBlock = open => h('details', { class: 'hc-details', open },
      h('summary', {}, '도구 — 찾아 바꾸기 · 이미지 줄 추가'),
      h('div', { class: 'hc-tools' },
        h('div', { class: 'hc-tool' }, h('div', { class: 'hc-tool-title' }, '찾아 바꾸기 (이미지 주소 교체 등)'),
          h('div', { class: 'hc-row' }, findInput, replaceInput, h('button', { type: 'button', class: 'hc-btn', onclick: () => {
            const find = findInput.value; if (!find) { toast('찾을 글을 넣으세요'); return; }
            const count = area.value.split(find).length - 1; if (!count) { toast('찾는 글이 없습니다'); return; }
            apply(area.value.split(find).join(replaceInput.value)); toast(`${count}곳을 바꿨습니다`);
          } }, '모두 바꾸기'))),
        h('div', { class: 'hc-tool' }, h('div', { class: 'hc-tool-title' }, '이미지 줄 추가'),
          h('div', { class: 'hc-row' }, imageInput, h('button', { type: 'button', class: 'hc-btn', onclick: () => addImage('top') }, '맨 위'), h('button', { type: 'button', class: 'hc-btn', onclick: () => addImage('bottom') }, '맨 아래')))));
    const codePane = () => h('div', {}, toolsBlock(true), area, meta);

    /* 미리보기 부품 — 코드(textarea)를 그대로 그린다. 스크립트는 막혀 있고(sandbox에 allow-scripts 없음) 같은 출처만 허용해서,
       다시 그릴 때 스크롤 위치를 읽어 되돌릴 수 있다(타이핑할 때마다 맨 위로 튀지 않게). */
    const makePreview = startWidth => {
      const frame = h('iframe', { class: 'hc-preview', sandbox: 'allow-same-origin allow-popups allow-popups-to-escape-sandbox', style: `width:${startWidth}`, title: '미리보기' });
      const render = () => {
        let scrollY = 0;
        try { scrollY = frame.contentWindow.scrollY || 0; } catch (e) { /* 처음엔 문서가 없다 */ }
        frame.onload = () => {
          if (!scrollY) return;
          const restore = () => { try { frame.contentWindow.scrollTo(0, scrollY); } catch (e) { /* 무시 */ } };
          restore(); setTimeout(restore, 300); // 이미지가 늘어나기 전에 한 번, 로드된 뒤 한 번 더
        };
        // 호스팅 이미지는 https로도 열려서, 이 페이지가 https일 때 막히지 않도록 미리보기에서만 http를 https로 바꾼다(원본 코드는 그대로).
        const body = area.value.replace(/(src=["'])http:\/\//gi, '$1https://');
        frame.srcdoc = `<!doctype html><meta charset="utf-8"><base target="_blank"><style>body{margin:0;background:#fff}img{max-width:100%;vertical-align:top}</style>${body}`;
      };
      render();
      const width = size => { frame.style.width = size; };
      const bar = h('div', { class: 'hc-preview-bar' },
        h('button', { type: 'button', class: 'hc-btn hc-btn-sm', onclick: () => width('860px') }, 'PC 860'),
        h('button', { type: 'button', class: 'hc-btn hc-btn-sm', onclick: () => width('390px') }, '모바일 390'),
        h('button', { type: 'button', class: 'hc-btn hc-btn-sm', onclick: () => width('100%') }, '꽉 채우기'),
        h('button', { type: 'button', class: 'hc-btn hc-btn-sm', onclick: render }, '새로고침'));
      return { frame, render, bar, wrap: h('div', { class: 'hc-preview-wrap' }, frame) };
    };

    const previewPane = () => {
      const preview = makePreview('860px');
      return h('div', {}, preview.bar, preview.wrap);
    };

    /* 분할 보기 — 왼쪽 코드, 오른쪽 미리보기(타이핑하면 바로 갱신). 가운데 선을 끌어 크기를 바꾸고(더블클릭 = 반반, 방향키 = 미세 조절),
       좌우/상하 방향을 바꿀 수 있다. 비율·방향은 이 브라우저에 기억한다. */
    const splitPane = () => {
      const preview = makePreview('100%');
      const dirButton = h('button', { type: 'button', class: 'hc-btn hc-btn-sm', onclick: () => { ui.dir = ui.dir === 'row' ? 'column' : 'row'; saveUi(); layout(); } });
      preview.bar.append(dirButton);
      const left = h('div', { class: 'hc-split-pane hc-split-left' }, toolsBlock(false), area, meta);
      const right = h('div', { class: 'hc-split-pane hc-split-right' }, preview.bar, preview.wrap);
      const bar = h('div', { class: 'hc-splitter', role: 'separator', tabindex: '0', title: '끌어서 크기 조절 · 더블클릭: 반반 · 방향키: 미세 조절(Shift = 크게)' });
      const box = h('div', { class: 'hc-split' }, left, bar, right);
      const layout = () => {
        box.classList.toggle('is-column', ui.dir === 'column');
        left.style.flexBasis = ui.split + '%';
        dirButton.textContent = ui.dir === 'row' ? '상하로 나누기' : '좌우로 나누기';
        bar.setAttribute('aria-orientation', ui.dir === 'row' ? 'vertical' : 'horizontal');
      };
      const setRatio = percent => { ui.split = Math.round(Math.max(15, Math.min(85, percent)) * 10) / 10; left.style.flexBasis = ui.split + '%'; };
      bar.addEventListener('pointerdown', event => { event.preventDefault(); bar.setPointerCapture(event.pointerId); box.classList.add('is-dragging'); });
      bar.addEventListener('pointermove', event => {
        if (!box.classList.contains('is-dragging')) return;
        const rect = box.getBoundingClientRect();
        setRatio(ui.dir === 'row' ? (event.clientX - rect.left) / rect.width * 100 : (event.clientY - rect.top) / rect.height * 100);
      });
      const stopDrag = () => { if (box.classList.contains('is-dragging')) { box.classList.remove('is-dragging'); saveUi(); } };
      bar.addEventListener('pointerup', stopDrag);
      bar.addEventListener('pointercancel', stopDrag);
      bar.addEventListener('dblclick', () => { setRatio(50); saveUi(); });
      bar.addEventListener('keydown', event => {
        const less = ui.dir === 'row' ? 'ArrowLeft' : 'ArrowUp';
        const more = ui.dir === 'row' ? 'ArrowRight' : 'ArrowDown';
        if (event.key !== less && event.key !== more) return;
        event.preventDefault();
        setRatio(ui.split + (event.key === more ? 1 : -1) * (event.shiftKey ? 10 : 2)); saveUi();
      });
      layout();
      let timer = 0;
      onChange = () => { clearTimeout(timer); timer = setTimeout(preview.render, 250); }; // 타이핑이 멈추면 다시 그린다
      return box;
    };

    const mapPane = () => fileMapPane(path);

    const tabs = [['split', '분할'], ['code', '코드'], ['preview', '미리보기'], ['map', `매핑 (${entries.length})`]];
    const body = h('div', {});
    const showTab = tab => {
      currentTab = tab;
      onChange = () => {}; // 분할 보기일 때만 코드가 바뀔 때 미리보기를 다시 그린다
      tabBar.querySelectorAll('.hc-tab').forEach(node => node.classList.toggle('is-on', node.dataset.tab === tab));
      body.replaceChildren(tab === 'split' ? splitPane() : tab === 'code' ? codePane() : tab === 'preview' ? previewPane() : mapPane());
    };
    const tabBar = h('div', { class: 'hc-tabs' }, tabs.map(([key, label]) => h('button', { type: 'button', class: 'hc-tab', 'data-tab': key, onclick: () => showTab(key) }, label)));

    box.replaceChildren(h('div', { class: 'hc-card' },
      h('div', { class: 'hc-file-head' },
        h('div', {}, h('div', { class: 'hc-path' }, file.folder + (file.extra ? ' · 변형 파일' : '')), h('h2', {}, file.name, ' ', editedTag)),
        h('div', { class: 'hc-actions' },
          h('button', { type: 'button', class: 'hc-btn hc-btn-primary', onclick: () => copyText(area.value, '코드를 복사') }, '코드 복사'),
          h('button', { type: 'button', class: 'hc-btn', onclick: () => { const list = entriesOf(path); if (!list.length) { toast('매핑된 상품 코드가 없습니다'); return; } copyText(list.map(entry => entry.code).join('\n'), '상품 코드를 복사'); } }, '상품코드 복사'),
          h('button', { type: 'button', class: 'hc-btn', onclick: () => download(file.name + '.html', area.value.replace(/\n/g, '\r\n')) }, '내려받기'),
          h('button', { type: 'button', class: 'hc-btn', onclick: () => saveVariant(file, area.value) }, '변형으로 저장'),
          revertButton)),
      tabBar, body));
    showTab(currentTab);
  }

  /* 변형 저장 — 이름 끝에 접미사를 붙인 새 파일(예: 아이소핑크430 → 아이소핑크430_세경). 이 브라우저에만 생긴다. */
  function saveVariant(file, code) {
    const suffix = prompt('새 파일 이름 끝에 붙일 글자', '_세경');
    if (!suffix) return;
    const name = file.name + suffix.trim();
    const path = `${file.folder}/${name}.html`;
    if (fileOf(path)) { toast(`같은 이름이 이미 있습니다: ${name}`); return; }
    state.extras[path] = { folder: file.folder, name, code: lf(code), from: file.path };
    save(); renderTree(); openFile(path, 'code'); toast(`${name} 파일을 만들었습니다`);
  }

  /* ── 파일별 매핑 탭 ── */
  function fileMapPane(path) {
    const body = h('div', {});
    const draw = () => {
      const list = entriesOf(path);
      const rows = list.map((entry, index) => h('tr', {},
        h('td', {}, select(CHANNELS, entry.channel, { onchange: event => { writableEntries(path)[index].channel = event.target.value; save(); } })),
        h('td', {}, h('input', { class: 'hc-input hc-code-cell', value: entry.code, oninput: event => { writableEntries(path)[index].code = event.target.value.trim(); save(); renderTree(); } })),
        h('td', {}, select(STATUSES, entry.status, { onchange: event => { writableEntries(path)[index].status = event.target.value; save(); renderTree(); } })),
        h('td', { class: 'hc-note' }, h('input', { class: 'hc-input', value: entry.note || '', oninput: event => { writableEntries(path)[index].note = event.target.value; save(); } })),
        h('td', {}, h('button', { type: 'button', class: 'hc-btn hc-btn-sm hc-btn-danger', onclick: () => { writableEntries(path).splice(index, 1); save(); draw(); renderTree(); } }, '삭제'))));
      const pasteArea = h('textarea', { class: 'hc-input', rows: '3', placeholder: '상품 코드를 붙여넣으세요 (줄바꿈·쉼표·공백 구분)' });
      const channelSelect = select(CHANNELS, 'coupang');
      const statusSelect = select(STATUSES, 'todo');
      body.replaceChildren(
        list.length ? h('table', { class: 'hc-table' }, h('thead', {}, h('tr', {}, ['채널', '상품 코드', '상태', '메모', ''].map(label => h('th', {}, label)))), h('tbody', {}, rows))
          : h('p', { class: 'hc-muted' }, '이 파일에 매핑된 상품 코드가 없습니다.'),
        h('div', { class: 'hc-tool', style: 'margin-top:12px' },
          h('div', { class: 'hc-tool-title' }, '상품 코드 추가'),
          pasteArea,
          h('div', { class: 'hc-row', style: 'margin-top:6px' }, channelSelect, statusSelect, h('button', { type: 'button', class: 'hc-btn hc-btn-primary', onclick: () => {
            const codes = pasteArea.value.split(/[\s,]+/).map(code => code.trim()).filter(Boolean);
            if (!codes.length) { toast('상품 코드를 넣으세요'); return; }
            const target = writableEntries(path);
            let added = 0;
            codes.forEach(code => { if (!target.some(entry => entry.channel === channelSelect.value && entry.code === code)) { target.push({ channel: channelSelect.value, code, status: statusSelect.value, note: '' }); added += 1; } });
            save(); draw(); renderTree(); toast(`${added}개를 추가했습니다`);
          } }, '추가'))));
    };
    draw();
    return body;
  }

  /* ── 전체 매핑표 ── */
  function openMapView() {
    showView('map');
    current = '';
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* 무시 */ }
    renderTree();
    const box = $('#hcMapView');
    const filter = { status: '', channel: '', query: '' };
    const searchInput = h('input', { class: 'hc-input', placeholder: '상품 코드·메모·파일 검색', oninput: event => { filter.query = event.target.value.trim(); draw(); } });
    const statusFilter = select([['', '상태 전체'], ...STATUSES], '', { onchange: event => { filter.status = event.target.value; draw(); } });
    const channelFilter = select([['', '채널 전체'], ...CHANNELS], '', { onchange: event => { filter.channel = event.target.value; draw(); } });
    const tableBox = h('div', {});
    const summary = h('div', { class: 'hc-hint' });
    let shown = [];

    const rowsFor = () => {
      const rows = [];
      allFiles().forEach(file => entriesOf(file.path).forEach((entry, index) => rows.push({ path: file.path, name: file.name, index, entry })));
      unassignedList().forEach((entry, index) => rows.push({ path: '', name: '', index, entry }));
      return rows.filter(row => (!filter.status || row.entry.status === filter.status) && (!filter.channel || row.entry.channel === filter.channel)
        && (!filter.query || `${row.entry.code} ${row.entry.note || ''} ${row.path}`.includes(filter.query)));
    };
    const listFor = row => (row.path ? writableEntries(row.path) : writableUnassigned());

    function draw() {
      shown = rowsFor();
      const total = {}; shown.forEach(row => { total[row.entry.status] = (total[row.entry.status] || 0) + 1; });
      summary.textContent = `표시 ${shown.length}개 — ` + STATUSES.map(([key, label]) => `${label} ${total[key] || 0}`).join(' · ');
      const fileOptions = [['', '— HTML 없음 —'], ...allFiles().sort((a, b) => a.path.localeCompare(b.path, 'ko', { numeric: true })).map(file => [file.path, file.path])];
      tableBox.replaceChildren(h('table', { class: 'hc-table' },
        h('thead', {}, h('tr', {}, ['채널', '상품 코드', '상태', 'HTML 파일', '메모'].map(label => h('th', {}, label)))),
        h('tbody', {}, shown.map(row => h('tr', {},
          h('td', {}, CHANNEL_LABEL[row.entry.channel] || row.entry.channel),
          h('td', { class: 'hc-code-cell' }, row.entry.code),
          h('td', {}, select(STATUSES, row.entry.status, { onchange: event => { listFor(row)[row.index].status = event.target.value; save(); draw(); renderTree(); } })),
          h('td', {}, select(fileOptions, row.path, { title: row.path, onchange: event => {
            const moved = listFor(row).splice(row.index, 1)[0];
            const to = event.target.value;
            (to ? writableEntries(to) : writableUnassigned()).push(moved);
            save(); openMapView(); toast(to ? '파일을 바꿨습니다' : 'HTML 없음으로 옮겼습니다');
          } }), row.path ? h('a', { onclick: () => openFile(row.path, 'code'), style: 'margin-left:6px' }, '열기') : null),
          h('td', { class: 'hc-muted hc-note' }, row.entry.note || ''))))));
    }

    box.replaceChildren(h('div', { class: 'hc-card' },
      h('h3', { class: 'hc-h3' }, '상품 코드 ↔ HTML 매핑표'),
      h('p', { class: 'hc-hint' }, '코드 = 쿠팡 Product ID 등 채널 상품 번호. 상태와 연결 파일은 여기서 바로 바꿀 수 있습니다(이 브라우저에 저장).'),
      h('div', { class: 'hc-map-filters' }, statusFilter, channelFilter, searchInput,
        h('button', { type: 'button', class: 'hc-btn', onclick: () => { if (!shown.length) { toast('복사할 코드가 없습니다'); return; } copyText([...new Set(shown.map(row => row.entry.code))].join('\n'), `상품 코드 ${new Set(shown.map(row => row.entry.code)).size}개를 복사`); } }, '보이는 코드 복사'),
        h('button', { type: 'button', class: 'hc-btn', title: '지금 매핑을 data/detail-html/mapping.json 형식으로 내려받기 — 저장소 파일을 이걸로 바꾸면 모든 브라우저의 기본값이 됩니다', onclick: () => download('mapping.json', JSON.stringify(effectiveMapping(), null, 2) + '\n', 'application/json;charset=utf-8') }, 'mapping.json 내보내기')),
      summary, tableBox));
    draw();
  }

  /* ── 백업 ── */
  function exportBackup() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    download(`html-codes-backup-${stamp}.json`, JSON.stringify({ kind: 'hk-html-codes', version: 1, state }, null, 2), 'application/json;charset=utf-8');
  }
  async function importBackup(file) {
    try {
      const data = JSON.parse(await file.text());
      if (data.kind !== 'hk-html-codes' || !data.state) throw new Error('백업 파일이 아닙니다');
      if (!confirm('이 브라우저의 수정·변형·매핑을 백업 내용으로 덮어씁니다.')) return;
      state = Object.assign({ edits: {}, extras: {}, map: {}, unassigned: null }, data.state);
      save(); renderTree();
      current ? openFile(current) : showView('none');
      toast('백업을 불러왔습니다');
    } catch (e) { toast(`가져오지 못했습니다: ${e.message}`); }
  }

  /* ── 시작 ── */
  async function init() {
    $('#hcSearch').addEventListener('input', renderTree);
    $('#hcOpenMap').addEventListener('click', openMapView);
    $('#hcExport').addEventListener('click', exportBackup);
    $('#hcImport').addEventListener('click', () => $('#hcImportFile').click());
    $('#hcImportFile').addEventListener('change', event => { const file = event.target.files[0]; event.target.value = ''; if (file) importBackup(file); });
    $('#hcSaveNow').addEventListener('click', saveNow);
    $('#hcReloadRemote').addEventListener('click', reloadFromServer);
    showView('none');
    try {
      const get = async name => { const response = await fetch(DATA + name, { cache: 'no-cache' }); if (!response.ok) throw new Error(`${name} (${response.status})`); return response.json(); };
      manifest = await get('manifest.json');
      try { seedMap = await get('mapping.json'); } catch (e) { toast('mapping.json을 읽지 못해 매핑 없이 엽니다'); }
    } catch (e) {
      $('#hcEmpty').textContent = `목록을 읽지 못했습니다: ${e.message} — 이 페이지는 웹 서버(예: 127.0.0.1:5500)로 열어야 합니다.`;
      return;
    }
    await loadRemote(); // 서버에 저장된 수정·변형·매핑을 먼저 받아 온다
    renderChips(); renderTree();
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash && fileOf(hash)) openFile(hash);
  }
  init();
})();
