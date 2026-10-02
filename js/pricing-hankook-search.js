/* ═══════════════════════════════════════
   한국단열 단가표 검색 — 상품명·관리코드·상품번호·옵션ID로 찾아 그 행으로 이동한다.
   · 제품별 단가(카테고리 탭의 기준 단가표 행) → 그 카테고리 탭·아코디언을 열고 행으로 스크롤
   · 몰별 적용(채널 탭의 등록 상품 옵션) → 그 채널·카테고리 표로 바꾸고, 접힌 그룹·구간을 펼친 뒤 행으로 스크롤
   결과가 많을 때: 맨 위 칩으로 "단가표 / 채널별 / 카테고리"를 골라 좁히고, "전체"에서는 채널마다 몇 건씩만 골고루 보여 준다.
   채널마다 알약 색이 달라서(단가표 인디고·한국단열 파랑·라이프 청록·홈페이지 초록·쿠팡 빨강·쿠팡_부자재 주황·ESM 보라·11번가 노랑)
   결과가 적을 때도 어느 몰인지 한눈에 보인다.
   읽기 전용 — 가격이나 상태는 건드리지 않는다. 데이터는 이미 화면용으로 있는 HK_CHANNEL_LISTINGS와
   _hkDbProductIndex()를 그대로 읽는다(검색용 사본을 따로 저장하지 않는다).
═══════════════════════════════════════ */
(function () {
  const PER_GROUP = 5;    // "전체" 보기에서 묶음(단가표·채널)마다 보여 줄 수
  const MAX_SHOWN = 100;  // 한 묶음만 골랐을 때 최대 표시 수
  let panel = null, input = null, results = [], active = -1, cache = null, debounce = 0;
  let lastQuery = '', lastFound = null;
  const state = { filter: 'all', category: '' }; // filter: 'all' | 'base' | 채널 ID

  const norm = value => String(value ?? '').toLowerCase();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const categoryLabel = id => (typeof HK_CATEGORIES !== 'undefined' && HK_CATEGORIES.find(c => c.id === id)?.label) || id;
  const channelLabel = id => (typeof HK_CHANNELS !== 'undefined' && HK_CHANNELS.find(c => c.id === id)?.label) || id;
  const groupLabel = key => key === 'base' ? '단가표' : channelLabel(key);

  /* 검색 대상 목록 — 상품명·코드는 바뀌지 않으므로 한 번 만들어 두고, 상품·옵션 수가 달라지면(DB 불러오기 등) 다시 만든다. */
  function signature() {
    let count = 0;
    Object.values(HK_CHANNEL_LISTINGS || {}).forEach(list => (list || []).forEach(product => { count += 1 + product.items.length; }));
    return count;
  }
  function build() {
    const sig = signature();
    if (cache && cache.sig === sig) return cache;
    const base = [];
    try {
      _hkDbProductIndex().forEach(entry => {
        if (!entry.code) return;
        const name = entry.row?.name || '';
        const supplier = entry.row?.supplier || '';
        base.push({
          kind: 'base', groupKey: 'base', categoryId: entry.categoryId, accordionId: entry.accordionId, rowIndex: entry.rowIndex, code: entry.code, name, supplier, price: entry.row?.price,
          hay: norm([entry.code, name, supplier, categoryLabel(entry.categoryId)].join(' ')),
        });
      });
    } catch (error) { console.warn('[단가표 검색] 제품별 단가 목록을 읽지 못했습니다', error); }
    const channel = [];
    Object.entries(HK_CHANNEL_LISTINGS || {}).forEach(([channelId, products]) => (products || []).forEach(product => product.items.forEach((item, index) => {
      const categoryId = product.categoryId;
      let name = '';
      try { name = _hkChannelItemName(item.categoryId || categoryId, product, item) || ''; } catch { name = item.productName || ''; }
      const code = item.productCode || '';
      channel.push({
        kind: 'channel', groupKey: channelId, channelId, categoryId, product, item, index, name, code,
        hay: norm([name, code, item.displayCode, product.productId, product.masterId, product.auctionProductId, product.groupName, item.optionId, item.storeName, product.productName, channelLabel(channelId), categoryLabel(categoryId)].filter(Boolean).join(' ')),
      });
    })));
    cache = { sig, base, channel };
    lastQuery = ''; lastFound = null;
    return cache;
  }

  function rank(hit, query) {
    const code = norm(hit.code), name = norm(hit.name);
    if (code === query) return 0;
    if (code.startsWith(query)) return 1;
    if (name.startsWith(query)) return 2;
    return 3;
  }
  /* 검색어에 맞는 결과 전부를 묶음(단가표 → 채널 순서)별로 돌려준다. 자르는 건 화면에서 한다. */
  function search(raw) {
    const query = norm(raw).trim();
    if (query === lastQuery && lastFound) return lastFound;
    const { base, channel } = build();
    const tokens = query.split(/\s+/).filter(Boolean);
    const match = list => list.filter(hit => tokens.every(token => hit.hay.includes(token)));
    const byRank = list => list.map(hit => ({ hit, r: rank(hit, query) })).sort((a, b) => a.r - b.r).map(x => x.hit);
    const byGroup = new Map();
    byGroup.set('base', byRank(match(base)));
    const channelHits = byRank(match(channel));
    HK_CHANNELS.forEach(c => byGroup.set(c.id, channelHits.filter(hit => hit.groupKey === c.id)));
    lastQuery = query;
    lastFound = [...byGroup.entries()].filter(([, hits]) => hits.length).map(([key, hits]) => ({ key, label: groupLabel(key), hits }));
    return lastFound;
  }

  /* ── 화면 ── */
  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.className = 'hk-search-panel';
    panel.hidden = true;
    panel.addEventListener('mousedown', event => event.preventDefault()); // 결과·칩을 눌러도 입력칸 포커스가 풀려 닫히지 않게
    panel.addEventListener('click', event => {
      const chip = event.target.closest('[data-chip]');
      if (chip) { state.filter = chip.dataset.chip; render(); return; }
      const cat = event.target.closest('[data-cat]');
      if (cat) { state.category = state.category === cat.dataset.cat ? '' : cat.dataset.cat; render(); return; }
      const row = event.target.closest('[data-hit]');
      if (row) go(Number(row.dataset.hit));
    });
    document.body.appendChild(panel);
    return panel;
  }
  function place() {
    if (!panel || !input) return;
    const rect = input.getBoundingClientRect();
    panel.style.left = `${Math.max(8, rect.left)}px`;
    panel.style.top = `${rect.bottom + 6}px`;
    panel.style.width = `${Math.min(760, Math.max(rect.width, window.innerWidth - rect.left - 16))}px`;
    panel.style.maxHeight = `${Math.max(260, window.innerHeight - rect.bottom - 24)}px`;
  }
  function close() { if (panel) panel.hidden = true; active = -1; }
  function highlight(text, tokens) {
    let html = esc(text);
    tokens.forEach(token => { if (!token || /^(?:amp|lt|gt|quot|39|#|#39|&)$/i.test(token)) return; html = html.replace(new RegExp(esc(token).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`); });
    return html;
  }
  function hitHtml(hit, position, tokens) {
    const key = hit.groupKey;
    if (hit.kind === 'base') {
      return `<div class="hk-search-item" data-hit="${position}"><span class="hk-search-badge hk-c-${key}">${esc(categoryLabel(hit.categoryId))}</span><span class="hk-search-main"><strong>${highlight(hit.name || hit.code, tokens)}</strong><code>${highlight(hit.code, tokens)}</code></span><span class="hk-search-sub">${hit.supplier ? esc(hit.supplier) + ' · ' : ''}${hit.price != null && Number.isFinite(Number(hit.price)) ? Number(hit.price).toLocaleString() + '원' : ''}</span></div>`;
    }
    const status = hit.item.status ? `<em class="hk-search-status is-${hit.item.status}">${hit.item.status === 'stopped' ? '판매중지' : '품절'}</em>` : '';
    const ids = [hit.product.productId, hit.item.optionId && hit.item.optionId !== hit.product.productId ? hit.item.optionId : ''].filter(Boolean).join(' / ');
    return `<div class="hk-search-item" data-hit="${position}"><span class="hk-search-badge hk-c-${key}">${esc(channelLabel(hit.channelId))}</span><span class="hk-search-main"><strong>${highlight(hit.name || hit.code, tokens)}</strong><code>${highlight(hit.code, tokens)}</code></span><span class="hk-search-sub">${esc(categoryLabel(hit.categoryId))} · ${highlight(ids, tokens)}${status}</span></div>`;
  }
  function render() {
    const query = input.value.trim();
    ensurePanel();
    if (!query) { close(); return; }
    const groups = search(query);
    const tokens = norm(query).split(/\s+/).filter(Boolean);
    results = [];
    let html = '';
    if (!groups.length) {
      panel.innerHTML = `<div class="hk-search-empty">“${esc(query)}”에 해당하는 상품이 없습니다. 상품명·관리코드·상품번호·옵션 ID로 찾을 수 있어요.</div>`;
      panel.hidden = false; active = -1; place(); return;
    }
    // 칩에 쓰는 건수 — 묶음 칩은 고른 카테고리 기준, 카테고리 칩은 고른 묶음 기준(서로 좁혀 가는 방식).
    if (state.filter !== 'all' && !groups.some(group => group.key === state.filter)) state.filter = 'all';
    const scope = state.filter === 'all' ? groups : groups.filter(group => group.key === state.filter);
    const categoryCounts = new Map();
    scope.forEach(group => group.hits.forEach(hit => categoryCounts.set(hit.categoryId, (categoryCounts.get(hit.categoryId) || 0) + 1)));
    if (state.category && !categoryCounts.has(state.category)) state.category = '';
    const withCategory = hits => state.category ? hits.filter(hit => hit.categoryId === state.category) : hits;
    const counts = groups.map(group => ({ ...group, shown: withCategory(group.hits) }));
    const totalShown = counts.reduce((sum, group) => sum + group.shown.length, 0);

    const groupChips = [`<button type="button" class="hk-search-chip is-all${state.filter === 'all' ? ' is-on' : ''}" data-chip="all">전체 <b>${totalShown}</b></button>`]
      .concat(counts.filter(group => group.shown.length || state.filter === group.key).map(group =>
        `<button type="button" class="hk-search-chip hk-c-${group.key}${state.filter === group.key ? ' is-on' : ''}" data-chip="${group.key}">${esc(group.label)} <b>${group.shown.length}</b></button>`)).join('');
    const categoryOrder = HK_CATEGORIES.filter(c => categoryCounts.has(c.id));
    const categoryChips = categoryOrder.length > 1 || state.category
      ? `<div class="hk-search-chips is-sub"><span class="hk-search-chips-label">카테고리</span>${categoryOrder.map(c =>
        `<button type="button" class="hk-search-chip is-cat${state.category === c.id ? ' is-on' : ''}" data-cat="${c.id}">${esc(c.label)} <b>${categoryCounts.get(c.id)}</b></button>`).join('')}</div>`
      : '';
    html += `<div class="hk-search-head"><div class="hk-search-chips">${groupChips}</div>${categoryChips}</div>`;

    const visible = counts.filter(group => group.shown.length && (state.filter === 'all' || group.key === state.filter));
    if (!visible.length) {
      html += `<div class="hk-search-empty">고른 조건에 맞는 결과가 없습니다. 위 칩에서 다른 곳을 골라 보세요.</div>`;
    }
    visible.forEach(group => {
      const limit = state.filter === 'all' ? PER_GROUP : MAX_SHOWN;
      const shown = group.shown.slice(0, limit);
      html += `<div class="hk-search-section"><span class="hk-search-dot hk-c-${group.key}"></span>${esc(group.label)} <small>${group.shown.length}건${group.shown.length > shown.length && state.filter !== 'all' ? ` 중 ${shown.length}건 표시 — 검색어를 더 좁혀 보세요` : ''}</small></div>`;
      shown.forEach(hit => { html += hitHtml(hit, results.length, tokens); results.push({ type: 'hit', hit }); });
      if (group.shown.length > shown.length && state.filter === 'all') {
        html += `<div class="hk-search-more hk-c-${group.key}" data-hit="${results.length}">${esc(group.label)} ${group.shown.length - shown.length}건 더 보기 <i class="fa-solid fa-chevron-right"></i></div>`;
        results.push({ type: 'more', key: group.key });
      }
    });
    panel.innerHTML = html;
    panel.hidden = false;
    panel.scrollTop = 0;
    active = results.length ? 0 : -1;
    paintActive();
    place();
  }
  function paintActive() {
    if (!panel) return;
    panel.querySelectorAll('[data-hit]').forEach(el => el.classList.toggle('is-active', Number(el.dataset.hit) === active));
    panel.querySelector('[data-hit].is-active')?.scrollIntoView({ block: 'nearest' });
  }

  /* ── 이동 ── */
  function flash(row) {
    if (!row) return;
    document.querySelectorAll('.hk-search-hit').forEach(el => el.classList.remove('hk-search-hit'));
    // 화면 밖 카드는 그려지기 전이라 높이가 어긋날 수 있어서, 한 번 이동한 뒤 레이아웃이 잡히면 한 번 더 맞춘다.
    row.scrollIntoView({ block: 'center', behavior: 'auto' });
    setTimeout(() => {
      row.scrollIntoView({ block: 'center', behavior: 'auto' });
      row.classList.add('hk-search-hit');
      setTimeout(() => row.classList.remove('hk-search-hit'), 2800);
    }, 80);
  }
  function tabButton(containerId, id) {
    return [...document.querySelectorAll(`#${containerId} .pricing-tab, #${containerId} .bead-subtab`)].find(button => (button.getAttribute('onclick') || '').includes(`'${id}'`)) || null;
  }
  function goBase(hit) {
    setHkPricingTab(hit.categoryId, tabButton('hkCategoryTabs', hit.categoryId));
    const accordion = document.getElementById('hkIsoAcc-' + hit.accordionId);
    if (accordion) accordion.classList.add('open');
    setTimeout(() => { // requestAnimationFrame은 숨겨진 탭에서 멈추므로 쓰지 않는다
      let row = accordion?.querySelector(`tr[data-row-index="${hit.rowIndex}"]`) || null;
      if (!row) { // 행 번호로 못 찾으면 그 카테고리 표에서 코드 칸으로 찾는다
        row = [...document.querySelectorAll(`#pricing-tab-${hit.categoryId} tr`)].find(tr => [...tr.children].some(td => td.textContent.trim() === hit.code)) || null;
      }
      // 부자재처럼 업체별 아코디언이 큰 아코디언 안에 또 들어 있으면 안쪽도 접혀 있다 — 행을 감싼 아코디언을 전부 연다.
      // 아이소핑크(일반·접착식·쿠팡 위너)·스티로폼(1종·접착식·2종)은 윗단 탭(super-pane)으로도 나뉘어 있어 그 탭도 맞춰 준다.
      for (let el = row?.parentElement; el; el = el.parentElement) {
        const id = el.id || '';
        if (id.startsWith('hkIsoAcc-')) el.classList.add('open');
        else if (id.startsWith('hkIsoSuper-') && !el.classList.contains('active')) setHkIsoSuperTab(id.slice(11), tabButton('hkIsoSuperTabBar', id.slice(11)));
        else if (id.startsWith('hkBeadSuper-') && !el.classList.contains('active')) setHkBeadSuperTab(id.slice(12), tabButton('hkBeadSuperTabBar', id.slice(12)));
      }
      flash(row);
    }, 30);
  }
  function goChannel(hit) {
    const { channelId, product, item, index } = hit;
    // 접힌 그룹상품·구간(옵션이 많은 상품)은 펼쳐 둬야 행이 그려진다 — 그리기 전에 펼침 상태를 먼저 기억시킨다.
    if (product.groupProductCode) _hkExpandedChannelGroups.add(String(product.groupProductCode));
    window.hkChannelShowProductTab?.(channelId, product); // 상품마다 탭이 있는 카테고리(단열벽지)는 그 상품 탭으로
    window.hkChannelKindExpand?.(channelId, product); // 모음전·단품 아코디언에서 접힌 쪽에 있으면 펼친다
    if (item.section) {
      _hkExpandedChannelSections.add(`${channelId}|${product.productId}|${item.section}`);       // 일반 표
      _hkExpandedChannelSections.add(`${channelId}|${item.sectionId || ''}|${item.section}`);    // 쿠팡 표
    }
    setHkChannel(channelId, tabButton('hkChannelTabs', channelId), product.categoryId);
    setTimeout(() => {
      const section = document.getElementById('hkChannelListingSection');
      const row = section?.querySelector(`tr[data-hk-key="${product.productId}|${index}"]`) || null;
      flash(row);
    }, 30);
  }
  function go(position) {
    const entry = results[position];
    if (!entry) return;
    if (entry.type === 'more') { state.filter = entry.key; render(); return; } // "N건 더 보기" — 그 묶음만 길게 보여 준다(창은 닫지 않는다)
    const hit = entry.hit;
    close();
    input.blur();
    if (hit.kind === 'base') goBase(hit); else goChannel(hit);
  }

  /* ── 검색칸 붙이기 ── */
  function mount() {
    const bar = document.getElementById('hkPricingTabsBar');
    if (!bar || bar.querySelector('.hk-tab-group-search')) return;
    const group = document.createElement('div');
    group.className = 'hk-tab-group hk-tab-group-search';
    group.innerHTML = `<div class="hk-tab-group-label"><i class="fa-solid fa-magnifying-glass"></i><span><strong>검색</strong><small>상품명·관리코드</small></span></div>
      <div class="hk-search-box"><i class="fa-solid fa-magnifying-glass"></i><input type="search" id="hkSearchInput" autocomplete="off" spellcheck="false" placeholder="상품명, 관리코드, 상품번호, 옵션 ID로 검색 (예: 타이거폼, St_430_430_10, 5812309858)" aria-label="단가표 검색"></div>
      <span class="hk-search-hint">Enter = 첫 결과로 이동 · ↑↓ 선택 · Esc 닫기</span>`;
    bar.appendChild(group);
    input = group.querySelector('#hkSearchInput');
    input.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(render, 120); });
    input.addEventListener('focus', () => { if (input.value.trim()) render(); });
    input.addEventListener('blur', () => setTimeout(close, 120));
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') { input.value = ''; state.filter = 'all'; state.category = ''; close(); return; }
      if (!panel || panel.hidden || !results.length) return;
      if (event.key === 'ArrowDown') { event.preventDefault(); active = (active + 1) % results.length; paintActive(); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); active = (active - 1 + results.length) % results.length; paintActive(); }
      else if (event.key === 'Enter') { event.preventDefault(); go(Math.max(active, 0)); }
    });
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, { passive: true });
  }
  // 탭바는 pricing-hankook.js의 DOMContentLoaded에서 그려지므로 그 뒤에 붙인다.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
  window.hkSearchRefreshIndex = () => { cache = null; lastQuery = ''; lastFound = null; };
})();
