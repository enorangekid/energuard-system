/* ═══════════════════════════════════════
   한국단열 경쟁사 가격 비교 — 카테고리 탭 '경쟁사 가격' (2026-10-13)

   한국단열 스마트스토어(hkd) 판매가를 경쟁사와 "장당 실구매가"(배송비까지 더한 장당 값)로 비교한다.
   예전에 엑셀로 맞추던 비교표(아이소핑크 900×1800 · 600×900)를 화면으로 옮긴 것이다.

   · 한국단열 줄 = 단가표의 현재 값(_hkChannelHkdPrice + hkd 채널 배송비)을 그대로 읽는다 — 저장하지 않는다.
   · 경쟁사 줄 = 사람이 입력한 값. hk_settings 의 key 'competitor_compare' 한 줄(JSON)에 저장한다(SQL 변경 없음).
     이 탭의 [저장]으로만 저장되고, 단가표 저장·이력과는 무관하다.
   · [수집값 불러오기] = 크롬 확장이 모은 경쟁사 옵션 가격(competitor_price_scans, 에너가드 경쟁사 수집과 같은 테이블)을
     업체명(store_name)·두께·규격·장수로 짝지어 판매가를 채운다. 배송비·배송기준은 수집되지 않아 직접 입력한다.

   계산(엑셀과 같다):
     배송비/건   = 배송비 ÷ 배송기준(N개마다)
     장당 단가   = 판매가 ÷ 장수
     장당 실구매가 = (판매가 + 배송비/건) ÷ 장수 × 규격환산(한국단열 규격 면적 ÷ 그 상품 규격 면적 — 600x450은 600x900의 절반이라 ×2)
     차이        = 경쟁사 장당 실구매가 − 한국단열 장당 실구매가 (+ 이면 경쟁사가 더 비싸 우리에게 유리)
═══════════════════════════════════════ */
(function () {
  if (typeof HK_CATEGORIES === 'undefined') return;
  // 이 파일을 불러온 화면(단가표)에서만 탭이 생긴다 — 보기 전용 화면에는 나타나지 않는다.
  if (!HK_CATEGORIES.some(c => c.id === 'hk_compare')) HK_CATEGORIES.push({ id: 'hk_compare', label: '경쟁사 가격' });

  const SETTING_KEY = 'competitor_compare';

  /* 비교표 정의 — ours: [두께, 한국단열 상품코드, 그 묶음의 장수]. 한국단열 줄은 이 코드의 현재 판매가·배송비로 계산한다.
     900×1800은 모음전(배송비 포함 묶음) 기준이고 70T·100T는 1장 단품이라 배송비를 따로 받는다. */
  const TABLES = [
    {
      id: 'iso_900_1800', categoryId: 'hk_isopink', size: '900x1800',
      title: '아이소핑크 경쟁사 가격 비교표 – 900×1800',
      keyword: /아이소|아이스핑크|압출|XPS/i,
      ours: [
        [10, 'Iso_900_1800_10_10', 10], [20, 'Iso_900_1800_20_5', 5], [30, 'Iso_900_1800_30_3', 3], [40, 'Iso_900_1800_40_2', 2],
        [50, 'Iso_900_1800_50_2', 2], [70, 'Iso_900_1800_70_1', 1], [100, 'Iso_900_1800_100_1', 1],
      ],
    },
    {
      id: 'iso_600_900', categoryId: 'hk_isopink', size: '600x900',
      title: '아이소핑크 경쟁사 가격 비교표 – 600×900',
      keyword: /아이소|아이스핑크|압출|XPS/i,
      ours: [
        [10, 'Iso_600_900_10_3', 3], [20, 'Iso_600_900_20_1', 1], [30, 'Iso_600_900_30_1', 1], [40, 'Iso_600_900_40_1', 1],
        [50, 'Iso_600_900_50_1', 1], [70, 'Iso_600_900_70_1', 1], [100, 'Iso_600_900_100_1', 1],
      ],
    },
  ];

  /* DB에 저장된 값이 아직 없을 때 채워 두는 예전 비교표 값 — [업체, 두께, 규격, 장수, 판매가, 배송비, 배송기준, 확인일].
     단열코리아는 2026-10-13에 확장 수집·상품 목록으로 다시 확인했고, 나머지 업체는 예전 표 그대로라 확인일이 비어 있다. */
  const SEED = {
    iso_900_1800: [
      ['나라단열', 10, '900x1800', 1, 5000, 12500, 10, ''], ['단열코리아', 10, '900x1800', 5, 25000, 11000, 1, '2026-10-13'],
      ['나라단열', 20, '900x1800', 1, 9000, 8800, 4, ''], ['단열코리아', 20, '900x1800', 3, 31500, 11000, 1, '2026-10-13'],
      ['나라단열', 30, '900x1800', 1, 13600, 8800, 3, ''], ['단열코리아', 30, '900x1800', 2, 28000, 11000, 1, '2026-10-13'],
      ['나라단열', 40, '900x1800', 1, 18000, 12500, 4, ''],
      ['나라단열', 50, '900x1800', 1, 23000, 12500, 3, ''], ['단열코리아', 50, '900x1800', 1, 23000, 11000, 1, '2026-10-13'],
      ['나라단열', 70, '900x1800', 1, 34000, 12500, 4, ''], ['단열코리아', 70, '900x1800', 1, 38000, 11000, 1, '2026-10-13'],
      ['나라단열', 100, '900x1800', 1, 43000, 12500, 2, ''], ['단열코리아', 100, '900x1800', 1, 49000, 11000, 1, '2026-10-13'],
    ],
    iso_600_900: [
      ['극동씨앤씨', 10, '600x450', 3, 2400, 6000, 8, ''], ['단열코리아', 10, '600x900', 3, 6900, 5500, 5, '2026-10-13'],
      ['극동씨앤씨', 20, '600x450', 2, 5000, 6000, 5, ''], ['나라단열', 20, '600x900', 1, 3500, 5500, 10, ''], ['단열코리아', 20, '600x900', 1, 4400, 5500, 5, '2026-10-13'],
      ['극동씨앤씨', 30, '600x900', 1, 6000, 6000, 5, ''], ['나라단열', 30, '600x900', 1, 5000, 5500, 7, ''], ['단열코리아', 30, '600x900', 1, 6000, 5500, 5, '2026-10-13'],
      ['나라단열', 40, '600x900', 1, 6000, 5500, 5, ''],
      ['극동씨앤씨', 50, '600x900', 1, 10000, 6000, 3, ''], ['나라단열', 50, '600x900', 1, 7500, 5500, 4, ''], ['단열코리아', 50, '600x900', 1, 10100, 5500, 5, '2026-10-13'],
      ['단열코리아', 70, '600x900', 1, 14700, 5500, 5, '2026-10-13'], ['나라단열', 70, '600x900', 1, 11000, 5500, 3, ''], ['극동씨앤씨', 70, '600x900', 1, 16000, 6000, 3, ''],
      ['극동씨앤씨', 100, '600x900', 1, 19500, 6000, 3, ''], ['나라단열', 100, '600x900', 1, 15000, 5500, 2, ''], ['단열코리아', 100, '600x900', 1, 21000, 5500, 5, '2026-10-13'],
    ],
  };

  const state = { rows: {}, loaded: false, loading: false, dirty: false, saving: false, savedAt: null, note: '', noteKind: '', nextId: 1 };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const num = value => {
    if (value === '' || value == null) return null;
    const n = parseFloat(String(value).replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  };
  const fmt = value => (value == null || !Number.isFinite(value)) ? '—' : Math.round(value).toLocaleString('ko-KR');
  const client = () => (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
  const toast = (message, type) => { if (typeof showToast === 'function') showToast(message, type); else console.warn('[경쟁사 가격]', message); };
  const today = () => new Date().toISOString().slice(0, 10);
  const tableOf = id => TABLES.find(t => t.id === id);

  /* "900x1800"·"900 x 1800"·"900×1800" 같은 규격 글자의 면적(㎟). 읽히지 않으면 null. */
  function areaOf(text) {
    const m = String(text || '').match(/(\d{3,4})\s*[x×X*]\s*(\d{3,4})/);
    return m ? Number(m[1]) * Number(m[2]) : null;
  }

  function seedRows() {
    const rows = {};
    TABLES.forEach(table => {
      rows[table.id] = (SEED[table.id] || []).map(([comp, t, spec, sheets, price, ship, every, checked]) =>
        ({ id: state.nextId++, comp, t, spec, sheets, price, ship, every, link: '', checked }));
    });
    return rows;
  }

  /* ─── 한국단열 줄: 단가표의 현재 값 ─── */
  function shippingInfo(code) {
    const product = (typeof HK_CHANNEL_LISTINGS !== 'undefined' ? (HK_CHANNEL_LISTINGS.hkd || []) : [])
      .find(p => (p.items || []).some(item => item.productCode === code));
    if (product) {
      const ship = Number(product.baseShipping || 0);
      const m = String(product.shippingBasis || '').match(/(\d+)\s*개마다/);
      return { ship, every: m ? Number(m[1]) : 1 };
    }
    const ship = typeof _hkHkdShippingByCode === 'function' ? _hkHkdShippingByCode(code) : null;
    return { ship: Number(ship || 0), every: 5 }; // 2단계 배송 블록은 5장당
  }

  function oursOf(table, [t, code, sheets]) {
    let price = null;
    try { price = _hkChannelHkdPrice(table.categoryId, code); } catch (e) { price = null; }
    const { ship, every } = shippingInfo(code);
    return { t, code, sheets, price, ship, every, spec: table.size };
  }

  function derive(table, row) {
    const price = num(row.price), sheets = num(row.sheets);
    if (!price || !sheets) return null;
    const ship = num(row.ship), every = num(row.every) || 1;
    const shipPer = ship == null ? null : ship / every;
    const tableArea = areaOf(table.size), area = areaOf(row.spec);
    const ratio = tableArea && area ? tableArea / area : 1;
    return { perSheet: price / sheets, shipPer, real: shipPer == null ? null : (price + shipPer) / sheets * ratio };
  }

  function diffHtml(real, oursReal) {
    if (real == null || oursReal == null) return '<span class="cp-diff-empty">—</span>';
    const d = Math.round(real - oursReal);
    if (d === 0) return '<span class="cp-diff-same">±0</span>';
    // 경쟁사가 더 비싸면(+) 우리에게 유리(초록), 더 싸면(−) 불리(빨강) — 에너가드 경쟁사 칸의 배지와 같은 모양.
    return `<span class="cp-diff ${d > 0 ? 'down' : 'up'}">${d > 0 ? '+' : ''}${d.toLocaleString('ko-KR')}<em>${d > 0 ? '유리' : '불리'}</em></span>`;
  }

  /* ─── 화면 ─── */
  const TH = ['두께', '구분', '규격', '상품코드·링크', '장수', '판매가(원)', '배송비(원)', '배송기준', '장당 단가(원)', '배송비/건(원)', '장당 실구매가(원)', '한국단열 장당 실구매가(원)', '차이(원) 경쟁사−한국단열', '확인일', ''];
  const OURS_BG = 'background:#eef2ff;';

  function inputHtml(table, row, field, { width, placeholder = '', numeric = true }) {
    const value = row[field] == null ? '' : row[field];
    const shown = numeric && value !== '' ? Number(value).toLocaleString('ko-KR') : esc(value);
    return `<input type="text" class="cp-input" ${numeric ? 'inputmode="numeric"' : ''} style="width:${width}px;${numeric ? '' : 'text-align:left;'}" value="${shown}" placeholder="${placeholder}" onchange="hkCmpEdit('${table.id}',${row.id},'${field}',this)">`;
  }

  function competitorRowHtml(table, row, group, first, oursReal, listId) {
    const d = derive(table, row);
    const incomplete = num(row.price) && num(row.ship) == null;
    const link = row.link
      ? `<a href="${esc(row.link)}" target="_blank" rel="noopener" class="cp-link-icon" title="상품 페이지"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
      : '';
    const id = `hkc-${row.id}`;
    return `<tr data-hkc-row="${row.id}">
      ${first ? `<td rowspan="${group}" style="text-align:center;font-weight:700;vertical-align:top;">${row.t}T
        <div><button type="button" class="pgl-btn" title="${row.t}T 경쟁사 줄 추가" onclick="hkCmpAddRow('${table.id}',${row.t})"><i class="fa-solid fa-plus"></i></button></div></td>` : ''}
      <td><input type="text" class="cp-input" list="${listId}" style="width:92px;text-align:left;" value="${esc(row.comp)}" placeholder="업체" onchange="hkCmpEdit('${table.id}',${row.id},'comp',this)"></td>
      <td>${inputHtml(table, row, 'spec', { width: 80, placeholder: table.size, numeric: false })}</td>
      <td style="white-space:nowrap;"><input type="text" class="cp-link-input" style="width:96px;" value="${esc(row.link)}" placeholder="링크" onchange="hkCmpEdit('${table.id}',${row.id},'link',this)"> ${link}</td>
      <td>${inputHtml(table, row, 'sheets', { width: 44 })}</td>
      <td>${inputHtml(table, row, 'price', { width: 76 })}</td>
      <td>${inputHtml(table, row, 'ship', { width: 70, placeholder: incomplete ? '입력' : '' })}</td>
      <td>${inputHtml(table, row, 'every', { width: 44 })}</td>
      <td id="${id}-per" style="text-align:right;">${fmt(d?.perSheet)}</td>
      <td id="${id}-ship" style="text-align:right;">${fmt(d?.shipPer)}</td>
      <td id="${id}-real" style="text-align:right;font-weight:700;">${fmt(d?.real)}</td>
      <td style="text-align:right;">${fmt(oursReal)}</td>
      <td id="${id}-diff" style="text-align:center;">${diffHtml(d?.real, oursReal)}</td>
      <td style="text-align:center;font-size:11px;color:#94a3b8;white-space:nowrap;">${esc(row.checked || '—')}</td>
      <td style="text-align:center;"><button type="button" class="pgl-btn" title="이 줄 삭제" onclick="hkCmpDelRow('${table.id}',${row.id})"><i class="fa-solid fa-xmark"></i></button></td>
    </tr>`;
  }

  function tableHtml(table, listId) {
    const rows = state.rows[table.id] || [];
    const oursByT = new Map(table.ours.map(def => [def[0], oursOf(table, def)]));
    const thicknesses = [...new Set([...oursByT.keys(), ...rows.map(r => Number(r.t))])].sort((a, b) => a - b);
    const body = thicknesses.map(t => {
      const ours = oursByT.get(t);
      const list = rows.filter(r => Number(r.t) === t);
      const group = 1 + list.length;
      const oursPer = ours && ours.price != null ? (ours.price + ours.ship / (ours.every || 1)) / ours.sheets : null;
      const oursRow = ours
        ? `<tr style="${OURS_BG}">
            <td rowspan="${group}" style="text-align:center;font-weight:700;vertical-align:top;">${t}T
              <div><button type="button" class="pgl-btn" title="${t}T 경쟁사 줄 추가" onclick="hkCmpAddRow('${table.id}',${t})"><i class="fa-solid fa-plus"></i></button></div></td>
            <td style="font-weight:700;">한국단열</td>
            <td>${esc(table.size)}×${ours.sheets}장</td>
            <td style="font-size:11px;color:#64748b;">${esc(ours.code)}</td>
            <td style="text-align:right;">${ours.sheets}</td>
            <td style="text-align:right;">${fmt(ours.price)}</td>
            <td style="text-align:right;">${ours.ship ? fmt(ours.ship) : '무료'}</td>
            <td style="text-align:right;">${ours.ship ? ours.every : '—'}</td>
            <td style="text-align:right;">${fmt(ours.price == null ? null : ours.price / ours.sheets)}</td>
            <td style="text-align:right;">${ours.ship ? fmt(ours.ship / ours.every) : '—'}</td>
            <td style="text-align:right;font-weight:700;">${fmt(oursPer)}</td>
            <td style="text-align:right;">${fmt(oursPer)}</td>
            <td style="text-align:center;"><span class="cp-diff-same">기준</span></td>
            <td></td><td></td>
          </tr>`
        : '';
      const compRows = list.map((row, i) => competitorRowHtml(table, row, ours ? group : list.length, !ours && i === 0, oursPer, listId)).join('');
      return oursRow + compRows;
    }).join('');
    const html = `<div style="margin-bottom:22px;">
      <div class="pricing-section-title" style="font-size:15px;">${esc(table.title)}</div>
      <div class="pricing-input-table-wrap" style="overflow-x:auto;">
        <table class="pricing-cost-unified-table" style="table-layout:auto;">
          <thead><tr>${TH.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>`;
    // 공용 표(.pricing-cost-unified-table)는 칸 여백이 넉넉해 열이 많은 이 표는 가로로 너무 길어진다 — 칸 여백만 줄인다.
    return html.replace(/<(td|th)([^>]*)>/g, (m, tag, attrs) => attrs.includes('style="')
      ? `<${tag}${attrs.replace('style="', 'style="padding:5px 4px;')}>`
      : `<${tag}${attrs} style="padding:5px 4px;">`);
  }

  function bodyHtml() {
    if (!state.loaded) return '<div class="pricing-coming-soon"><i class="fa-solid fa-spinner fa-spin"></i><p>경쟁사 가격을 불러오는 중입니다…</p></div>';
    const names = [...new Set(Object.values(state.rows).flat().map(r => r.comp).filter(Boolean))];
    const listId = 'hkCmpCompanyNames';
    return `<datalist id="${listId}">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>`
      + TABLES.map(table => tableHtml(table, listId)).join('');
  }

  function statusHtml() {
    if (state.saving) return '<span style="color:#64748b;">저장 중…</span>';
    if (state.dirty) return '<span style="color:#d97706;font-weight:600;">저장하지 않은 변경이 있습니다</span>';
    if (state.savedAt) return `<span style="color:#94a3b8;">마지막 저장 ${esc(state.savedAt.toLocaleString('ko-KR'))}</span>`;
    return '';
  }

  window.renderHkComparePane = function () {
    if (!state.loaded && !state.loading) load();
    return `<div class="card pricing-cost-card">
      <div class="pricing-section-title">경쟁사 가격 비교 <span class="pricing-section-sub">— 한국단열 스마트스토어 현재 판매가 대비 장당 실구매가(배송비 포함)</span></div>
      <div class="pricing-cost-footer hk-iso-shared-cost-controls" style="margin-bottom:14px;">
        <button type="button" class="pricing-margin-edit-btn" onclick="hkCmpImportScans()" title="확장으로 수집한 경쟁사 옵션 가격(competitor_price_scans)을 업체명·두께·규격·장수로 짝지어 판매가를 채웁니다. 배송비·배송기준은 직접 입력합니다.">
          <i class="fa-solid fa-cloud-arrow-down"></i> 수집값 불러오기
        </button>
        <button type="button" class="pricing-margin-edit-btn" onclick="hkCmpSave()"><i class="fa-solid fa-floppy-disk"></i> 저장</button>
        <span id="hkCmpStatus" style="font-size:12px;margin-left:6px;">${statusHtml()}</span>
        ${state.note ? `<span style="font-size:12px;color:${state.noteKind === 'error' ? '#dc2626' : '#64748b'};">${esc(state.note)}</span>` : ''}
      </div>
      <div id="hkComparePaneBody">${bodyHtml()}</div>
    </div>`;
  };

  function rerender() {
    const pane = document.getElementById('pricing-tab-hk_compare');
    if (pane) pane.innerHTML = window.renderHkComparePane();
  }

  function setStatus() {
    const el = document.getElementById('hkCmpStatus');
    if (el) el.innerHTML = statusHtml();
  }

  window.hkCompareOnOpen = function () { rerender(); };

  /* ─── 불러오기 / 저장 ─── */
  async function load() {
    const c = client();
    state.loading = true;
    try {
      if (!c) throw new Error('Supabase에 연결되지 않았습니다');
      const { data, error } = await c.from('hk_settings').select('value,updated_at').eq('key', SETTING_KEY).limit(1);
      if (error) throw new Error(error.message || String(error));
      const saved = data && data[0];
      const rows = saved && saved.value && saved.value.rows;
      if (rows && typeof rows === 'object') {
        state.rows = {};
        TABLES.forEach(table => {
          state.rows[table.id] = (rows[table.id] || []).map(r => ({ ...r, id: state.nextId++ }));
        });
        state.savedAt = saved.updated_at ? new Date(saved.updated_at) : null;
        state.dirty = false;
        state.note = '';
      } else {
        state.rows = seedRows();
        state.dirty = true;
        state.note = '아직 저장된 자료가 없어 예전 비교표 값을 채워 두었습니다 — 확인 후 [저장]을 눌러 확정하세요.';
      }
    } catch (e) {
      state.rows = seedRows();
      state.dirty = true;
      state.note = `저장된 값을 불러오지 못해 예전 비교표 값을 보여 줍니다 (${e.message})`;
      state.noteKind = 'error';
    }
    state.loaded = true;
    state.loading = false;
    rerender();
  }

  window.hkCmpSave = async function () {
    const c = client();
    if (!c) { toast('Supabase에 연결되지 않았습니다', 'error'); return; }
    state.saving = true; setStatus();
    const rows = {};
    TABLES.forEach(table => {
      rows[table.id] = (state.rows[table.id] || []).map(({ id, ...rest }) => rest)
        .filter(r => r.comp || r.price);
    });
    const now = new Date().toISOString();
    const { error } = await c.from('hk_settings').upsert({ key: SETTING_KEY, value: { version: 1, rows }, updated_at: now }, { onConflict: 'key' });
    state.saving = false;
    if (error) { toast(`저장 실패: ${error.message || error}`, 'error'); setStatus(); return; }
    state.dirty = false; state.savedAt = new Date(now); state.note = ''; state.noteKind = '';
    toast('경쟁사 가격이 저장되었습니다.', 'success');
    rerender();
  };

  /* ─── 편집 ─── */
  function markDirty() { state.dirty = true; setStatus(); }

  function refreshRow(table, row) {
    const ours = table.ours.find(def => def[0] === Number(row.t));
    const o = ours ? oursOf(table, ours) : null;
    const oursReal = o && o.price != null ? (o.price + o.ship / (o.every || 1)) / o.sheets : null;
    const d = derive(table, row);
    const set = (suffix, html) => { const el = document.getElementById(`hkc-${row.id}-${suffix}`); if (el) el.innerHTML = html; };
    set('per', fmt(d?.perSheet));
    set('ship', fmt(d?.shipPer));
    set('real', fmt(d?.real));
    set('diff', diffHtml(d?.real, oursReal));
  }

  window.hkCmpEdit = function (tableId, rowId, field, input) {
    const table = tableOf(tableId);
    const row = (state.rows[tableId] || []).find(r => r.id === rowId);
    if (!table || !row) return;
    const raw = input.value.trim();
    if (['sheets', 'price', 'ship', 'every'].includes(field)) {
      const n = num(raw);
      row[field] = n == null ? '' : n;
      input.value = n == null ? '' : n.toLocaleString('ko-KR');
    } else {
      row[field] = raw;
    }
    if (field !== 'link' || raw) row.checked = today(); // 값을 고친 날을 확인일로 남긴다
    markDirty();
    if (['comp', 'link'].includes(field)) rerender(); else refreshRow(table, row);
  };

  window.hkCmpAddRow = function (tableId, t) {
    const table = tableOf(tableId);
    if (!table) return;
    const list = state.rows[tableId] = state.rows[tableId] || [];
    // 같은 업체의 배송비·배송기준은 두께가 달라도 거의 같아서, 이 표의 마지막 줄 값을 복사해 둔다.
    const last = [...list].reverse().find(r => r.comp);
    list.push({ id: state.nextId++, comp: last ? last.comp : '', t, spec: table.size, sheets: 1, price: '', ship: last ? last.ship : '', every: last ? last.every : '', link: '', checked: '' });
    markDirty();
    rerender();
  };

  window.hkCmpDelRow = function (tableId, rowId) {
    const list = state.rows[tableId] || [];
    const i = list.findIndex(r => r.id === rowId);
    if (i < 0) return;
    list.splice(i, 1);
    markDirty();
    rerender();
  };

  /* ─── 확장 수집값 가져오기 ─── */
  /* 옵션 이름(option_label)에서 먼저 읽고, 없는 항목만 상품명(product_name)에서 읽는다 — 상품명에는 옵션과 다른 규격·두께가 같이 적혀 있는 경우가 많다
     (예: 상품명 "…벽산1호 10T 400X600" 안의 옵션 "600x900 / 한영 특호90T(1장)"). */
  function parseScan(scan) {
    const SIZE = /(\d{3,4})\s*[x×X*]\s*(\d{3,4})/, THICK = /(\d{1,3})\s*[Tt]\b/, QTY = /(\d+)\s*장/;
    const sources = [String(scan.option_label || ''), String(scan.product_name || '')];
    const pick = re => { for (const text of sources) { const m = text.match(re); if (m) return m; } return null; };
    const size = pick(SIZE), thick = pick(THICK), qty = pick(QTY);
    if (!size || !thick) return null;
    return { spec: `${size[1]}x${size[2]}`, area: Number(size[1]) * Number(size[2]), t: Number(thick[1]), sheets: qty ? Number(qty[1]) : 1 };
  }

  window.hkCmpImportScans = async function () {
    const c = client();
    if (!c) { toast('Supabase에 연결되지 않았습니다', 'error'); return; }
    const { data, error } = await c.from('competitor_price_scans')
      .select('product_url,product_name,store_name,option_label,final_price,sold_out,collected_at')
      .order('collected_at', { ascending: false }).limit(3000);
    if (error) { toast(`수집값을 불러오지 못했습니다: ${error.message || error}`, 'error'); return; }

    // 같은 상품·옵션은 가장 최근 수집만 쓴다.
    const latest = new Map();
    (data || []).forEach(scan => {
      const key = `${scan.store_name}|${scan.product_url}|${scan.option_label}`;
      if (!latest.has(key)) latest.set(key, scan);
    });

    // 수집 테이블은 에너가드 경쟁사 수집과 같이 쓰므로(에너가드컴퍼니·크린슐라 등도 들어 있다) 이 표에 이미 있는 업체만 반영한다.
    // 새 업체는 업체명을 적은 줄을 하나 추가한 뒤 다시 불러오면 된다 — 건너뛴 업체명은 결과 안내에 알려 준다.
    const known = new Set(Object.values(state.rows).flat().map(r => String(r.comp || '').trim()).filter(Boolean));
    const skipped = new Map();

    // 표 안에서 같은 (업체, 두께, 장수, 규격)이 여러 개면 가장 싼 값을 쓴다.
    const picked = new Map();
    latest.forEach(scan => {
      if (!scan.store_name || !scan.final_price || scan.sold_out) return;
      const text = `${scan.product_name || ''} ${scan.option_label || ''}`;
      const parsed = parseScan(scan);
      if (!parsed) return;
      if (!known.has(String(scan.store_name).trim())) {
        if (TABLES.some(table => table.keyword.test(text))) skipped.set(scan.store_name, (skipped.get(scan.store_name) || 0) + 1);
        return;
      }
      TABLES.forEach(table => {
        if (!table.keyword.test(text)) return;
        const tableArea = areaOf(table.size);
        const ratio = tableArea / parsed.area;
        if (ratio !== 1 && ratio !== 2) return; // 같은 규격이거나 정확히 절반 규격(600x450 등)만 이 표에 넣는다
        const key = `${table.id}|${scan.store_name}|${parsed.t}|${parsed.spec}|${parsed.sheets}`;
        const prev = picked.get(key);
        if (!prev || scan.final_price < prev.price) {
          picked.set(key, { tableId: table.id, comp: scan.store_name, t: parsed.t, spec: parsed.spec, sheets: parsed.sheets, price: scan.final_price, link: scan.product_url || '', checked: String(scan.collected_at || '').slice(0, 10) });
        }
      });
    });

    let updated = 0, added = 0;
    picked.forEach(item => {
      const list = state.rows[item.tableId] = state.rows[item.tableId] || [];
      const same = list.find(r => r.comp === item.comp && Number(r.t) === item.t && Number(r.sheets) === item.sheets && areaOf(r.spec) === areaOf(item.spec));
      if (same) {
        if (Number(same.price) !== item.price) updated++;
        same.price = item.price;
        same.checked = item.checked;
        if (!same.link && item.link) same.link = item.link;
      } else {
        const sibling = list.find(r => r.comp === item.comp && num(r.ship) != null);
        list.push({ id: state.nextId++, comp: item.comp, t: item.t, spec: item.spec, sheets: item.sheets, price: item.price,
          ship: sibling ? sibling.ship : '', every: sibling ? sibling.every : '', link: item.link, checked: item.checked });
        added++;
      }
    });

    if (updated || added) markDirty();
    const skippedText = skipped.size
      ? ` · 표에 없는 업체라 건너뜀: ${[...skipped].map(([name, n]) => `${name} ${n}건`).join(', ')}`
      : '';
    state.note = (added || updated
      ? `수집값 반영: 가격 변경 ${updated}건 · 새 줄 ${added}건 (배송비가 비어 있는 줄은 직접 입력하세요) — [저장]을 눌러야 저장됩니다.`
      : `아이소핑크 수집값 ${picked.size}건을 확인했지만 바뀐 가격이 없습니다.`) + skippedText;
    state.noteKind = '';
    rerender();
  };
})();
