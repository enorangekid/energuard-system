/* ═══════════════════════════════════════
   한국단열 단가표 — Supabase 저장/불러오기 (2026-09-21)

   js/pricing-hankook.js의 상수(HK_ISO_*, HK_CHANNEL_LISTINGS)는 "기본값"이고,
   화면에서 사람이 바꾼 값만 DB(hk_* 테이블, sql/hankook_pricing_tables.sql)에 둔다.
   실판매가·옵션추가금·가격차이 같은 계산 결과는 저장하지 않고 화면에서 다시 계산한다.

   불러오기는 "덮어쓰기(overlay)" 방식이다 — 어떤 상품·옵션이 존재하는지(구조)는
   JS 상수가 정하고, DB는 그 위에 값(판매가·배송 정책·수정 전 판매가 등)만 얹는다.
   그래서 JS에 새 상품/옵션을 추가하면 저장 전에도 기본값으로 화면에 나타난다.
   저장은 반대로 "현재 화면 상태 전체"를 DB와 맞춘다(없어진 행은 DB에서도 지운다).

   상품코드는 2단계 블록 전체에서 유일해야 한다 — 중복이면 저장을 막는다.
═══════════════════════════════════════ */

const HK_DB_STATE_VERSION = 1;
const HK_DB_HISTORY_KEEP = 60;
const HK_DB_CHUNK = 500;
const HK_DB_SETUP_HINT = 'DB 테이블이 없습니다 — sql/hankook_pricing_tables.sql을 Supabase SQL Editor에서 한 번 실행하세요.';

const _hkDb = {
  loaded: false,
  loading: false,
  saving: false,
  dirty: false,
  tablesMissing: false,
  hasSavedData: false,
  lastSavedAt: null,
  loadedMonth: '', // 지금 화면이 기준으로 삼은 단가 기준 년월(불러오거나 저장한 이력)
  liveMonth: '',   // "실제 적용가"로 지정한 이력의 단가 기준 년월(hk_settings.live_month)
  message: '',
  messageKind: '',
  messageTitle: '',
  history: [],
};

function _hkDbClient() {
  return (typeof supabaseClient !== 'undefined') ? supabaseClient : null;
}

function _hkDbToast(message, type) {
  if (typeof showToast === 'function') showToast(message, type);
  else console.warn('[한국단열 DB]', message);
}

function _hkDbInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

function _hkDbIsMissingTable(error) {
  const text = `${error?.code || ''} ${error?.message || ''}`;
  return /PGRST205|PGRST204|42P01|schema cache|does not exist/i.test(text);
}

function _hkDbErrorText(error) {
  return error?.message || String(error);
}

function _hkDbChunks(list, size = HK_DB_CHUNK) {
  const chunks = [];
  for (let i = 0; i < list.length; i += size) chunks.push(list.slice(i, i + size));
  return chunks;
}

/* 2단계 블록의 모든 행에 상품코드를 붙인 목록 — 코드 규칙은 pricing-hankook.js의
   _hkIsoLookupFinalPriceByCode와 같다(codeOverride 우선). */
function _hkDbProductIndex() {
  const list = [];
  HK_ISO_SHIPPING_BLOCKS.forEach(block => {
    const sourceRows = HK_ISO_CONNECTED_DRAFTS[block.sourceAccordion]?.rows || [];
    let thickness = null;
    sourceRows.forEach((row, rowIndex) => {
      const thicknessMatch = row.name.match(/(\d+)T/);
      if (thicknessMatch) thickness = Number(thicknessMatch[1]);
      const ship = block.rows[rowIndex];
      const code = (ship && ship.codeOverride)
        || _hkIsoDraftProductCode(row.saleSize, thickness, block.isAdhesive, block.codePrefix);
      list.push({ code, block, row, rowIndex, ship, accordionId: block.sourceAccordion });
    });
  });
  return list;
}

function _hkDbLivePrice(entry) {
  const input = document.querySelector(`#hkIsoAcc-${entry.accordionId} tr[data-row-index="${entry.rowIndex}"] .hk-iso-final-price-input`);
  return input ? _hkIsoDraftParseNumber(input.value) : Number(entry.row.price);
}

/* 채널 옵션 설정 — 사용자가 지정한 기준가 옵션(product.baseCode)과 품절/판매중지 상태(item.status),
   쿠팡 위너 옵션의 수동 판매가(item.manualPrice)·옵션 메모(item.memo).
   기본값(첫 판매중 옵션이 기준, 전부 판매중, 수동 판매가·메모 없음)에서 벗어난 것만 담는다:
   { 채널ID: { 상품ID: { base: 상품코드, status: { 상품코드: 'soldout'|'stopped' },
                         manualPrice: { 상품코드: 숫자 }, memo: { 상품코드: 글 } } } }
   hk_settings.channel_options 한 줄로 저장하므로 별도 테이블/컬럼(SQL)이 필요 없다. */
function _hkDbCollectChannelOptions() {
  const result = {};
  Object.entries(HK_CHANNEL_LISTINGS).forEach(([channelId, products]) => {
    (products || []).forEach(product => {
      const entry = {};
      // 코드에 미리 적어둔 기준가 옵션(seedBaseCode)과 같으면 기본값이라 저장하지 않는다.
      if (product.baseCode && product.baseCode !== product.seedBaseCode) entry.base = product.baseCode;
      const status = {};
      const manual = {};
      const memo = {};
      product.items.forEach(item => {
        if (item.status) status[item.productCode] = item.status;
        // 쿠팡 위너 옵션의 수동 판매가와 옵션 메모(2026-09-21)
        if (item.manualPrice != null) manual[item.productCode] = item.manualPrice;
        if (item.memo) memo[item.productCode] = item.memo;
      });
      if (Object.keys(status).length) entry.status = status;
      if (Object.keys(manual).length) entry.manualPrice = manual;
      if (Object.keys(memo).length) entry.memo = memo;
      if (!Object.keys(entry).length) return;
      if (!result[channelId]) result[channelId] = {};
      result[channelId][product.productId] = entry;
    });
  });
  return result;
}

/* ─── 현재 화면 상태 → state ─── */
function hkDbCollectState() {
  const baseCosts = {};
  Object.keys(HK_ISO_DRAFT_BASE_COSTS).forEach(band => {
    const input = document.getElementById(`hkIsoDraftBaseCost-${band}`);
    baseCosts[band] = input ? _hkIsoDraftParseNumber(input.value) : HK_ISO_DRAFT_BASE_COSTS[band];
  });
  const adhesiveFee = HK_ISO_DRAFT_ADHESIVE_ADDON;
  const monthInput = document.getElementById('hkIsoBaseMonth');
  const baseMonth = String(monthInput ? monthInput.value : HK_ISO_DRAFT_BASE_MONTH) || '';

  const blockBaseShipping = {};
  HK_ISO_SHIPPING_BLOCKS.forEach(block => {
    if (block.sharedBaseShipping) blockBaseShipping[block.id] = Number(block.baseShipping5 || 0);
  });

  const products = {};
  _hkDbProductIndex().forEach(entry => {
    if (products[entry.code]) throw new Error(`상품코드가 중복됩니다: ${entry.code}`);
    const price = _hkDbInt(_hkDbLivePrice(entry));
    if (price === null) throw new Error(`판매가를 읽을 수 없습니다: ${entry.code}`);
    const ship = JSON.parse(JSON.stringify(entry.ship || {}));
    delete ship.codeOverride; // 코드 규칙은 구조(JS)에 속하고 값이 아니다
    products[entry.code] = {
      categoryId: 'hk_isopink',
      accordionId: entry.accordionId,
      rowIndex: entry.rowIndex,
      price,
      ship,
    };
  });

  return {
    version: HK_DB_STATE_VERSION,
    settings: {
      baseCosts,
      extraMargins: { ...HK_ISO_DRAFT_EXTRA_MARGINS },
      adhesiveFee,
      baseMonth,
      blockBaseShipping,
      channelOptions: _hkDbCollectChannelOptions(),
    },
    products,
    channels: JSON.parse(JSON.stringify(HK_CHANNEL_LISTINGS)),
  };
}

/* ─── state → 테이블 행 ─── */
function _hkDbStateToRows(state) {
  const now = new Date().toISOString();
  const s = state.settings;
  const settings = [
    { key: 'base_costs', value: s.baseCosts, updated_at: now },
    { key: 'extra_margins', value: s.extraMargins, updated_at: now },
    { key: 'adhesive_fee', value: s.adhesiveFee, updated_at: now },
    { key: 'base_month', value: s.baseMonth || '', updated_at: now },
    { key: 'block_base_shipping', value: s.blockBaseShipping, updated_at: now },
    { key: 'channel_options', value: s.channelOptions || {}, updated_at: now },
  ];
  const products = Object.entries(state.products).map(([code, p]) => ({
    product_code: code,
    category_id: p.categoryId,
    accordion_id: p.accordionId,
    row_index: p.rowIndex,
    price: p.price,
    shipping: p.ship,
    updated_at: now,
  }));
  const channelProducts = [];
  const channelItems = [];
  Object.entries(state.channels).forEach(([channelId, list]) => {
    (list || []).forEach((product, productIndex) => {
      channelProducts.push({
        channel_id: channelId,
        product_id: String(product.productId),
        category_id: product.categoryId,
        base_shipping: _hkDbInt(product.baseShipping),
        shipping_basis: product.shippingBasis ?? null,
        jeju_shipping: _hkDbInt(product.jejuShipping),
        return_exchange: product.returnExchange ?? null,
        sort_order: productIndex,
        updated_at: now,
      });
      (product.items || []).forEach((item, itemIndex) => {
        channelItems.push({
          channel_id: channelId,
          product_id: String(product.productId),
          sort_order: itemIndex,
          product_code: item.productCode,
          prev_price: _hkDbInt(item.prevPrice),
          prev_shipping: _hkDbInt(item.prevShipping),
          stock: _hkDbInt(item.stock),
          updated_at: now,
        });
      });
    });
  });
  return { settings, products, channelProducts, channelItems };
}

/* ─── 테이블 행 → state ─── */
function _hkDbRowsToState(settingsRows, productRows, channelProductRows, channelItemRows) {
  const map = {};
  settingsRows.forEach(row => { map[row.key] = row.value; });

  const products = {};
  productRows.forEach(row => {
    products[row.product_code] = {
      categoryId: row.category_id,
      accordionId: row.accordion_id,
      rowIndex: row.row_index,
      price: row.price,
      ship: row.shipping || {},
    };
  });

  const itemsByProduct = {};
  channelItemRows.forEach(row => {
    const key = `${row.channel_id}|${row.product_id}`;
    if (!itemsByProduct[key]) itemsByProduct[key] = [];
    itemsByProduct[key].push({
      productCode: row.product_code,
      prevPrice: row.prev_price,
      prevShipping: row.prev_shipping,
      stock: row.stock,
    });
  });
  const channels = {};
  channelProductRows.forEach(row => {
    if (!channels[row.channel_id]) channels[row.channel_id] = [];
    channels[row.channel_id].push({
      productId: row.product_id,
      categoryId: row.category_id,
      baseShipping: row.base_shipping,
      shippingBasis: row.shipping_basis,
      jejuShipping: row.jeju_shipping,
      returnExchange: row.return_exchange,
      items: itemsByProduct[`${row.channel_id}|${row.product_id}`] || [],
    });
  });

  return {
    version: HK_DB_STATE_VERSION,
    settings: {
      baseCosts: map.base_costs,
      extraMargins: map.extra_margins,
      adhesiveFee: map.adhesive_fee,
      baseMonth: map.base_month,
      blockBaseShipping: map.block_base_shipping,
      channelOptions: map.channel_options,
    },
    products,
    channels,
  };
}

/* ─── state를 JS 상수 위에 얹는다(화면 다시 그리기 전 단계) ─── */
function _hkDbApplyState(state) {
  const s = state.settings || {};
  const finite = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

  if (s.baseCosts) {
    Object.keys(HK_ISO_DRAFT_BASE_COSTS).forEach(band => {
      if (finite(s.baseCosts[band])) HK_ISO_DRAFT_BASE_COSTS[band] = Number(s.baseCosts[band]);
    });
  }
  if (s.extraMargins) {
    Object.keys(HK_ISO_DRAFT_EXTRA_MARGINS).forEach(thickness => {
      if (finite(s.extraMargins[thickness])) HK_ISO_DRAFT_EXTRA_MARGINS[thickness] = Number(s.extraMargins[thickness]);
    });
  }
  if (finite(s.adhesiveFee)) {
    HK_ISO_DRAFT_ADHESIVE_ADDON = Number(s.adhesiveFee);
    Object.values(HK_ISO_CONNECTED_DRAFTS).forEach(draft => {
      if (Number(draft.fixedCostAddon) > 0) draft.fixedCostAddon = HK_ISO_DRAFT_ADHESIVE_ADDON;
    });
  }
  if (typeof s.baseMonth === 'string') HK_ISO_DRAFT_BASE_MONTH = s.baseMonth;
  // 채널 옵션 설정(기준가 옵션·판매상태)은 저장된 값이 있을 때만 덮어쓰고, 덮어쓰기 전에 모두 기본값으로 되돌린다.
  if (s.channelOptions && typeof s.channelOptions === 'object') {
    Object.entries(HK_CHANNEL_LISTINGS).forEach(([channelId, products]) => {
      (products || []).forEach(product => {
        if (product.seedBaseCode) product.baseCode = product.seedBaseCode;
        else delete product.baseCode;
        product.items.forEach(item => { delete item.status; delete item.manualPrice; delete item.memo; });
        const saved = s.channelOptions[channelId]?.[product.productId];
        if (!saved) return;
        if (saved.base && product.items.some(item => item.productCode === saved.base)) product.baseCode = saved.base;
        product.items.forEach(item => {
          const status = saved.status?.[item.productCode];
          if (status && HK_CHANNEL_STATUS[status]) item.status = status;
          const manual = saved.manualPrice?.[item.productCode];
          if (manual != null && Number.isFinite(Number(manual))) item.manualPrice = Number(manual);
          const memo = saved.memo?.[item.productCode];
          if (typeof memo === 'string' && memo) item.memo = memo;
        });
      });
    });
  }
  if (s.blockBaseShipping) {
    HK_ISO_SHIPPING_BLOCKS.forEach(block => {
      if (block.sharedBaseShipping && finite(s.blockBaseShipping[block.id])) {
        block.baseShipping5 = Number(s.blockBaseShipping[block.id]);
      }
    });
  }

  _hkDbProductIndex().forEach(entry => {
    const saved = state.products?.[entry.code];
    if (!saved) return;
    if (finite(saved.price)) entry.row.price = Number(saved.price);
    const target = entry.block.rows[entry.rowIndex];
    if (target && saved.ship && typeof saved.ship === 'object') {
      const { codeOverride, ...values } = saved.ship;
      Object.assign(target, values);
    }
  });

  Object.entries(state.channels || {}).forEach(([channelId, savedProducts]) => {
    const seedProducts = HK_CHANNEL_LISTINGS[channelId];
    if (!seedProducts) return;
    (savedProducts || []).forEach(saved => {
      const product = seedProducts.find(item => String(item.productId) === String(saved.productId));
      if (!product) return;
      ['baseShipping', 'shippingBasis', 'jejuShipping', 'returnExchange'].forEach(field => {
        if (saved[field] !== undefined) product[field] = saved[field];
      });
      (saved.items || []).forEach((savedItem, index) => {
        const item = product.items[index];
        // 순번이 같아도 코드가 다르면(구조가 바뀜) 기본값을 그대로 둔다.
        if (!item || item.productCode !== savedItem.productCode) return;
        if (savedItem.prevPrice !== undefined) item.prevPrice = savedItem.prevPrice;
        if (savedItem.prevShipping !== undefined) item.prevShipping = savedItem.prevShipping;
        if (savedItem.stock !== undefined && savedItem.stock !== null) item.stock = savedItem.stock;
      });
    });
  });
}

/* 상수를 바꾼 뒤 화면을 다시 그리고, 보고 있던 탭/아코디언 상태를 되살린다. */
function _hkDbRerender() {
  const openAccordions = [...document.querySelectorAll('.hk-iso-accordion.open')].map(el => el.id);
  const superButtons = [...document.querySelectorAll('#hkIsoSuperTabBar .bead-subtab')];
  const activeSuperIndex = superButtons.findIndex(button => button.classList.contains('active'));
  const channelButton = document.querySelector('#hkChannelTabs .pricing-tab.active');
  const categoryButton = document.querySelector('#hkCategoryTabs .pricing-tab.active');

  window._hkRenderBody();

  if (openAccordions.length) {
    document.querySelectorAll('.hk-iso-accordion').forEach(el => el.classList.toggle('open', openAccordions.includes(el.id)));
  }
  if (activeSuperIndex > 0) {
    const button = document.querySelectorAll('#hkIsoSuperTabBar .bead-subtab')[activeSuperIndex];
    window.setHkIsoSuperTab(HK_ISO_SUPER_TABS[activeSuperIndex].id, button);
  }

  // 그려진 표는 JS 기본 원가(적용원가 seed)로 계산돼 있으니 저장된 원가·마진으로 다시 계산한다.
  Object.keys(HK_ISO_DRAFT_EXTRA_MARGINS).forEach(thickness => _hkIsoDraftApplySharedCost(Number(thickness)));

  if (channelButton) window.setHkChannel(window._activeHkChannel, channelButton);
  else if (categoryButton) window.setHkPricingTab(window._activeHkTab, categoryButton);
}

/* ─── 읽기/쓰기 ─── */
async function _hkDbSelectAll(table, columns, orderColumns) {
  const client = _hkDbClient();
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let query = client.from(table).select(columns);
    orderColumns.forEach(column => { query = query.order(column, { ascending: true }); });
    const { data, error } = await query.range(from, from + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function _hkDbFetchState() {
  const [settings, products, channelProducts, channelItems] = await Promise.all([
    _hkDbSelectAll('hk_settings', '*', ['key']),
    _hkDbSelectAll('hk_products', '*', ['product_code']),
    _hkDbSelectAll('hk_channel_products', '*', ['channel_id', 'sort_order']),
    _hkDbSelectAll('hk_channel_items', '*', ['channel_id', 'product_id', 'sort_order']),
  ]);
  // 실제 적용가로 지정한 년월과 마지막 저장 시각은 단가 상태가 아니라 헤드 표시용 메타다.
  const liveRow = settings.find(row => row.key === 'live_month');
  _hkDb.liveMonth = liveRow && typeof liveRow.value === 'string' ? liveRow.value : '';
  const stamps = settings.filter(row => row.key !== 'live_month' && row.updated_at)
    .map(row => Date.parse(row.updated_at)).filter(Number.isFinite);
  _hkDb.lastSavedAt = stamps.length ? new Date(Math.max(...stamps)) : null;
  if (!settings.length && !products.length && !channelProducts.length && !channelItems.length) return null;
  return _hkDbRowsToState(settings, products, channelProducts, channelItems);
}

async function _hkDbUpsert(table, rows, onConflict) {
  for (const chunk of _hkDbChunks(rows)) {
    const { error } = await _hkDbClient().from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table}: ${_hkDbErrorText(error)}`);
  }
}

async function _hkDbDelete(table, build) {
  const { error } = await build(_hkDbClient().from(table).delete());
  if (error) throw new Error(`${table}: ${_hkDbErrorText(error)}`);
}

/* 현재 상태에 없는 DB 행을 지운다. 정상 상황에서는 대부분 지울 것이 없다. */
async function _hkDbRemoveStale(rows) {
  const keepCodes = new Set(rows.products.map(row => row.product_code));
  const existingCodes = await _hkDbSelectAll('hk_products', 'product_code', ['product_code']);
  const staleCodes = existingCodes.map(row => row.product_code).filter(code => !keepCodes.has(code));
  for (const chunk of _hkDbChunks(staleCodes, 100)) {
    await _hkDbDelete('hk_products', query => query.in('product_code', chunk));
  }

  const keepProducts = new Set(rows.channelProducts.map(row => `${row.channel_id}|${row.product_id}`));
  const existingProducts = await _hkDbSelectAll('hk_channel_products', 'channel_id,product_id', ['channel_id', 'product_id']);
  for (const row of existingProducts) {
    if (keepProducts.has(`${row.channel_id}|${row.product_id}`)) continue;
    await _hkDbDelete('hk_channel_items', query => query.eq('channel_id', row.channel_id).eq('product_id', row.product_id));
    await _hkDbDelete('hk_channel_products', query => query.eq('channel_id', row.channel_id).eq('product_id', row.product_id));
  }

  const keepItems = new Set(rows.channelItems.map(row => `${row.channel_id}|${row.product_id}|${row.sort_order}`));
  const existingItems = await _hkDbSelectAll('hk_channel_items', 'channel_id,product_id,sort_order', ['channel_id', 'product_id', 'sort_order']);
  const staleByProduct = {};
  existingItems.forEach(row => {
    if (keepItems.has(`${row.channel_id}|${row.product_id}|${row.sort_order}`)) return;
    const key = `${row.channel_id}|${row.product_id}`;
    if (!staleByProduct[key]) staleByProduct[key] = { channel_id: row.channel_id, product_id: row.product_id, orders: [] };
    staleByProduct[key].orders.push(row.sort_order);
  });
  for (const stale of Object.values(staleByProduct)) {
    await _hkDbDelete('hk_channel_items', query => query.eq('channel_id', stale.channel_id).eq('product_id', stale.product_id).in('sort_order', stale.orders));
  }
}

function _hkDbCurrentMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/* 이력은 "단가 기준 년월"이 이름이다 — 같은 년월로 저장하면 그 년월 이력을 덮어쓴다
   (에너가드 단가표와 같은 방식). */
async function _hkDbWriteHistory(state, month) {
  const client = _hkDbClient();
  const { data: existing, error: findError } = await client.from('hk_history')
    .select('id').eq('label', month).order('id', { ascending: false });
  if (findError) throw new Error(`hk_history: ${_hkDbErrorText(findError)}`);
  if (existing && existing.length) {
    const { error } = await client.from('hk_history')
      .update({ snapshot: state, saved_at: new Date().toISOString() }).eq('id', existing[0].id);
    if (error) throw new Error(`hk_history: ${_hkDbErrorText(error)}`);
  } else {
    const { error } = await client.from('hk_history').insert({ label: month, snapshot: state });
    if (error) throw new Error(`hk_history: ${_hkDbErrorText(error)}`);
  }
  const { data: old, error: listError } = await client.from('hk_history')
    .select('id').order('saved_at', { ascending: false }).order('id', { ascending: false })
    .range(HK_DB_HISTORY_KEEP, HK_DB_HISTORY_KEEP + 500);
  if (listError) throw new Error(`hk_history: ${_hkDbErrorText(listError)}`);
  const ids = (old || []).map(row => row.id);
  if (ids.length) await _hkDbDelete('hk_history', query => query.in('id', ids));
}

async function _hkDbRefreshHistoryList() {
  const client = _hkDbClient();
  if (!client || _hkDb.tablesMissing) return;
  const { data, error } = await client.from('hk_history')
    .select('id,label,saved_at').order('label', { ascending: false }).order('id', { ascending: false }).limit(HK_DB_HISTORY_KEEP);
  if (error) return;
  _hkDb.history = data || [];
  _hkDbRenderBar();
}

/* ─── 헤드 우측(index.html #hkPricingHeaderRight): 최근 저장 / 실제 적용가 / 이력 / 단가표 저장 ─── */
function _hkDbEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

/* 오류·안내 문구 — 있으면 "최근 저장" 자리에 대신 보여준다. message를 비우면 원래 문구로 돌아간다. */
function _hkDbSetMessage(message, kind = '', title = '') {
  _hkDb.message = message;
  _hkDb.messageKind = kind;
  _hkDb.messageTitle = title;
  _hkDbRenderBar();
}

function _hkDbRenderBar() {
  const saved = document.getElementById('hkDbLastSaved');
  if (!saved) return;
  let text = '';
  let kind = '';
  let title = '';
  if (_hkDb.saving) text = '저장 중…';
  else if (_hkDb.loading) text = '불러오는 중…';
  else if (_hkDb.tablesMissing) { text = '단가 DB 테이블이 없습니다'; kind = 'error'; title = HK_DB_SETUP_HINT; }
  else if (_hkDb.dirty) { text = '저장 안 된 변경이 있습니다'; kind = 'dirty'; }
  else if (_hkDb.message) { text = _hkDb.message; kind = _hkDb.messageKind; title = _hkDb.messageTitle; }
  else if (_hkDb.lastSavedAt) {
    text = '최근 저장: ' + _hkDb.lastSavedAt.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } else text = '저장 기록 없음';
  saved.textContent = text;
  saved.title = title || text; // 줄임표로 잘려도 전체 문구를 볼 수 있게
  saved.className = `pricing-last-saved${kind ? ' is-' + kind : ''}`;

  const saveButton = document.getElementById('hkDbSaveBtn');
  if (saveButton) {
    saveButton.disabled = _hkDb.saving || _hkDb.loading;
    saveButton.classList.toggle('is-dirty', _hkDb.dirty);
  }
  _hkDbRenderLiveBadge();
  _hkDbRenderHistory();
}

/* 실제 적용가 배지 — 지금 화면의 단가 기준 년월이 실제 적용가로 지정한 년월과 다르면 경고색. */
function _hkDbRenderLiveBadge() {
  const badge = document.getElementById('hkDbLiveBadge');
  if (!badge) return;
  const shown = _hkDb.loadedMonth || HK_ISO_DRAFT_BASE_MONTH;
  if (_hkDb.tablesMissing) {
    badge.innerHTML = '';
    badge.className = 'pricing-live-badge';
  } else if (!_hkDb.liveMonth) {
    badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 실제 적용가 미지정';
    badge.className = 'pricing-live-badge warn';
  } else if (shown && shown !== _hkDb.liveMonth) {
    badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 실제 적용가: ${_hkDbEscape(_hkDb.liveMonth)} (지금 화면과 다름)`;
    badge.className = 'pricing-live-badge warn';
  } else {
    badge.innerHTML = `<i class="fa-solid fa-check"></i> 실제 적용가: ${_hkDbEscape(_hkDb.liveMonth)}`;
    badge.className = 'pricing-live-badge ok';
  }
}

function _hkDbRenderHistory() {
  const list = document.getElementById('hkDbHistoryList');
  const button = document.getElementById('hkDbHistoryBtn');
  if (!list || !button) return;
  const history = _hkDb.history;
  if (!history.length) {
    list.innerHTML = '<div class="pricing-history-empty">저장된 이력이 없습니다</div>';
  } else {
    list.innerHTML = history.map((row, index) => {
      const viewing = row.label === _hkDb.loadedMonth;
      const live = row.label === _hkDb.liveMonth;
      return `<div class="pricing-history-item${viewing ? ' selected' : ''}" onclick="hkDbRestoreHistory(${row.id})">
        <div class="phi-left">
          <span class="phi-label">${_hkDbEscape(row.label)}</span>
          ${index === 0 ? '<span class="phi-badge phi-badge-latest">최신</span>' : ''}
          ${viewing ? '<span class="phi-badge phi-badge-viewing">조회중</span>' : ''}
        </div>
        ${live
          ? '<span class="phi-badge-live"><i class="fa-solid fa-check"></i> 적용중</span>'
          : `<button type="button" class="phi-apply-btn" onclick="event.stopPropagation(); hkDbApplyLive(${row.id})">실제 적용</button>`}
      </div>`;
    }).join('');
  }
  // 최신이 아닌 년월을 보고 있으면 버튼에 그 년월을 보여준다(에너가드 이력 버튼과 같은 방식).
  const viewingOld = _hkDb.loadedMonth && history.length && _hkDb.loadedMonth !== history[0].label
    && history.some(row => row.label === _hkDb.loadedMonth);
  button.innerHTML = viewingOld
    ? `<i class="fa-solid fa-calendar-days"></i> ${_hkDbEscape(_hkDb.loadedMonth)} <i class="fa-solid fa-chevron-down" style="font-size:10px; margin-left:2px;"></i>`
    : '<i class="fa-solid fa-clock-rotate-left"></i> 이력 <i class="fa-solid fa-chevron-down" style="font-size:10px; margin-left:2px;"></i>';
  button.classList.toggle('active', !!viewingOld);
}

window.hkDbToggleHistory = function() {
  document.getElementById('hkDbHistoryDropdown')?.classList.toggle('open');
};

function _hkDbCloseHistory() {
  document.getElementById('hkDbHistoryDropdown')?.classList.remove('open');
}

document.addEventListener('click', event => {
  const wrap = document.getElementById('hkDbHistoryWrap');
  if (wrap && !wrap.contains(event.target)) _hkDbCloseHistory();
});

/* 이력 하나를 "실제 적용가"로 지정한다(hk_settings.live_month). 한국단열에는 아직 이 값을
   읽는 곳이 없고, 어느 단가가 실제 반영분인지 표시하는 용도다. */
window.hkDbApplyLive = async function(id) {
  const row = _hkDb.history.find(item => String(item.id) === String(id));
  if (!row || row.label === _hkDb.liveMonth) return;
  if (!window.confirm(`"${row.label}" 단가를 실제 적용가로 지정하시겠습니까?`)) return;
  const { error } = await _hkDbClient().from('hk_settings')
    .upsert({ key: 'live_month', value: row.label, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) {
    _hkDbToast(`적용 실패: ${_hkDbErrorText(error)}`, 'error');
    return;
  }
  _hkDb.liveMonth = row.label;
  _hkDbRenderBar();
  _hkDbToast(`"${row.label}" 단가가 실제 적용가로 지정되었습니다.`, 'success');
};

/* ─── 공개 함수 ─── */
window.hkDbMarkDirty = function() {
  if (_hkDb.dirty) return;
  _hkDb.dirty = true;
  _hkDbRenderBar();
};

window.hkDbEnsureLoaded = function() {
  if (_hkDb.loaded || _hkDb.loading) return;
  window.hkDbLoad();
};

window.hkDbLoad = async function() {
  const client = _hkDbClient();
  if (!client) { _hkDbSetMessage('Supabase에 연결되지 않았습니다 — 기본값으로 표시 중', 'error'); return; }
  _hkDb.loading = true;
  _hkDbSetMessage('');
  try {
    const state = await _hkDbFetchState();
    _hkDb.tablesMissing = false;
    if (state === null) {
      _hkDb.hasSavedData = false;
      _hkDbSetMessage('저장 기록 없음 — 기본값 표시 중', 'info', '단가표 저장을 누르면 지금 값이 DB에 올라갑니다.');
    } else if (_hkDb.dirty) {
      // 불러오는 동안 이미 값을 고쳤다면 덮어쓰지 않는다.
      _hkDbSetMessage('불러오는 사이 수정해서 저장값을 적용하지 않았습니다', 'error');
    } else {
      _hkDb.hasSavedData = true;
      _hkDbApplyState(state);
      _hkDbRerender();
      _hkDb.loadedMonth = HK_ISO_DRAFT_BASE_MONTH;
    }
    _hkDb.loaded = true;
    await _hkDbRefreshHistoryList();
  } catch (error) {
    if (_hkDbIsMissingTable(error)) {
      _hkDb.tablesMissing = true;
    } else {
      console.error('[한국단열 DB] 불러오기 실패', error);
      _hkDbSetMessage('단가를 불러오지 못했습니다', 'error', _hkDbErrorText(error));
    }
  } finally {
    _hkDb.loading = false;
    _hkDbRenderBar();
  }
};

window.hkDbSave = async function() {
  if (_hkDb.saving) return;
  if (!_hkDbClient()) { _hkDbToast('Supabase에 연결되지 않아 저장할 수 없습니다.', 'error'); return; }
  if (_hkDb.loading) { _hkDbToast('불러오는 중입니다. 잠시 뒤 다시 눌러주세요.', 'warning'); return; }
  let state;
  try {
    state = hkDbCollectState();
  } catch (error) {
    _hkDbToast(`저장하지 않았습니다 — ${_hkDbErrorText(error)}`, 'error');
    return;
  }

  // 단가 기준 년월이 이력 이름이 된다. 비어 있으면 이번 달로 채운다.
  let month = state.settings.baseMonth;
  if (!month) {
    month = _hkDbCurrentMonth();
    _hkDbToast(`단가 기준 년월이 비어 있어 ${month}로 저장합니다.`, 'info');
  }
  if (!/^\d{4}-\d{2}$/.test(month)) {
    _hkDbToast('단가 기준 년월을 YYYY-MM 형식으로 골라 주세요.', 'warning');
    return;
  }
  // 불러오거나 저장한 년월이 아닌 다른 년월(이미 이력이 있는)로 저장하면 그 이력을 덮어쓴다.
  if (month !== _hkDb.loadedMonth && _hkDb.history.some(row => row.label === month)
      && !window.confirm(`${month} 기준 이력이 이미 있습니다.\n이 화면의 값으로 덮어쓸까요?`)) {
    return;
  }
  state.settings.baseMonth = month;

  // 몰별 화면의 "수정 전 판매가·배송비"는 마지막으로 저장한 값이다 — 저장하는 이 시점의 현재
  // 판매가·배송비로 맞춘다(별도 "적용 완료" 버튼 없이 자동). 저장이 실패하면 아래 catch에서 되돌린다.
  const undoBaselines = typeof window.hkChannelAlignBaselines === 'function' ? window.hkChannelAlignBaselines() : null;
  state.channels = JSON.parse(JSON.stringify(HK_CHANNEL_LISTINGS));

  _hkDb.saving = true;
  _hkDbSetMessage('');
  try {
    const rows = _hkDbStateToRows(state);
    await _hkDbUpsert('hk_settings', rows.settings, 'key');
    await _hkDbUpsert('hk_products', rows.products, 'product_code');
    await _hkDbUpsert('hk_channel_products', rows.channelProducts, 'channel_id,product_id');
    await _hkDbUpsert('hk_channel_items', rows.channelItems, 'channel_id,product_id,sort_order');
    await _hkDbRemoveStale(rows);
    await _hkDbWriteHistory(state, month);

    // 저장한 값이 새 기준이다 — 행별 "변경 전" 표시도 저장값 기준으로 초기화한다.
    _hkDbProductIndex().forEach(entry => { entry.row.price = state.products[entry.code].price; });
    document.querySelectorAll('.hk-iso-final-price-input').forEach(input => {
      const saved = _hkIsoDraftParseNumber(input.value);
      input.dataset.originalPrice = String(saved);
      const historyValue = input.closest('.hk-iso-draft-price')?.querySelector('.hk-iso-price-history span');
      if (historyValue) historyValue.textContent = `${saved.toLocaleString()}원`;
      window.updateHkIsoPriceHistory(input);
    });

    if (typeof window._hkRefreshChannelListing === 'function') window._hkRefreshChannelListing(); // 차액·반영 대기를 0으로 다시 그림
    _hkDb.tablesMissing = false;
    _hkDb.hasSavedData = true;
    _hkDb.dirty = false;
    _hkDb.lastSavedAt = new Date();
    HK_ISO_DRAFT_BASE_MONTH = month;
    const monthInput = document.getElementById('hkIsoBaseMonth');
    if (monthInput) monthInput.value = month;
    _hkDb.loadedMonth = month;
    _hkDbSetMessage('');
    _hkDbToast(`한국단열 단가(${month} 기준)를 저장했습니다.`, 'success');
    // 실제 적용가로 지정돼 있던 년월을 새 값으로 덮어썼다면 지정을 푼다(에너가드와 같은 규칙) —
    // 적용중이라고 표시된 이력이 실제로는 다른 값이 되는 걸 막는다.
    if (month === _hkDb.liveMonth) {
      await _hkDbDelete('hk_settings', query => query.eq('key', 'live_month'));
      _hkDb.liveMonth = '';
      _hkDbToast(`${month}은(는) 실제 적용가로 지정돼 있었는데 새 값으로 덮어써서 지정이 해제되었습니다. 이력에서 "실제 적용"을 다시 눌러 주세요.`, 'warning');
    }
    await _hkDbRefreshHistoryList();
  } catch (error) {
    console.error('[한국단열 DB] 저장 실패', error);
    if (undoBaselines) undoBaselines(); // 저장이 안 됐으니 수정 전 값도 원래대로
    if (_hkDbIsMissingTable(error)) {
      _hkDb.tablesMissing = true;
      _hkDbToast(HK_DB_SETUP_HINT, 'error');
    } else {
      _hkDbSetMessage('저장에 실패했습니다', 'error', _hkDbErrorText(error));
      _hkDbToast(`저장 실패 — ${_hkDbErrorText(error)} (일부만 저장됐을 수 있으니 다시 저장해 주세요)`, 'error');
    }
  } finally {
    _hkDb.saving = false;
    _hkDbRenderBar();
  }
};

/* 이력에서 년월 하나를 골라 그 시점의 단가를 화면에 불러온다(저장을 눌러야 현재값이 됨). */
window.hkDbRestoreHistory = async function(id) {
  _hkDbCloseHistory();
  const row = _hkDb.history.find(item => String(item.id) === String(id));
  if (!row) return;
  const label = row.label;
  if (_hkDb.dirty && !window.confirm(`"${label}" 기준 단가를 불러옵니다.\n지금 화면의 저장 안 된 변경은 사라집니다. 계속할까요?`)) {
    return;
  }
  try {
    const { data, error } = await _hkDbClient().from('hk_history').select('snapshot').eq('id', id).single();
    if (error) throw error;
    const snapshot = data.snapshot || {};
    snapshot.settings = snapshot.settings || {};
    // 년월이 없던 예전 이력은 이력 이름(날짜)에서 YYYY-MM을 가져온다.
    if (typeof snapshot.settings.baseMonth !== 'string' || !snapshot.settings.baseMonth) {
      snapshot.settings.baseMonth = /^\d{4}-\d{2}/.test(label) ? label.slice(0, 7) : '';
    }
    _hkDbApplyState(snapshot);
    _hkDbRerender();
    _hkDb.loadedMonth = label;
    _hkDb.dirty = true;
    _hkDbRenderBar();
    _hkDbToast(`"${label}" 기준 단가를 불러왔습니다. 저장하면 이 값이 현재값이 됩니다.`, 'info');
  } catch (error) {
    _hkDbToast(`단가를 불러오지 못했습니다 — ${_hkDbErrorText(error)}`, 'error');
    _hkDbRenderBar();
  }
};

document.addEventListener('DOMContentLoaded', _hkDbRenderBar);

// 판매가/배송 세부설정/원가 입력칸의 직접 수정을 저장 안 된 변경으로 표시한다.
document.addEventListener('input', event => {
  if (event.target?.closest?.('#hkPricingBodyWrap, #hkIsoShippingModal')) window.hkDbMarkDirty();
});

window.addEventListener('beforeunload', event => {
  if (!_hkDb.dirty) return;
  event.preventDefault();
  event.returnValue = '';
});
