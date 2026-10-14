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
  // 이 파일을 불러온 화면(단가표)에서만 각 카테고리(아이소핑크·열반사단열재) 맨 위에 경쟁사 가격 구역이 생긴다 — 보기 전용 화면에는 안 나타난다.

  const SETTING_KEY = 'competitor_compare';
  // 사용자 결정(2026-10-14): 경쟁사 가격은 화면에서 직접 고치지 않고 확장 수집값을 [수집값 불러오기]로만 반영한다.
  // 입력칸·줄/업체 추가·삭제 버튼은 이 값이 true일 때만 나온다(편집 코드는 그대로 남겨 두었다).
  const EDITABLE = false;
  // 업체(열) 추가·삭제는 가격 편집과 별개로 켜 둔다(사용자 지시 2026-10-14) — 열반사 비교표 머리글의 [+]·[×].
  const COMPANY_EDITABLE = true;

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
    {
      // 열반사단열재 — 같은 길이·같은 두께끼리 "두께 × 제품 옵션"별 판매가를 비교한다(kind:'unit'). 길이 1·5·10·25·50M를 탭으로 고른다.
      // 옵션 키는 빌트론 상품코드(BL_{두께}_{길이}_{SN|SA|DN|DA})의 끝 두 글자와 같다 — S 일반형·D 고급형, N 비접착·A 한쪽접착.
      // id는 처음 1M만 만들 때의 'refl_1m'을 그대로 둔다(저장된 자료와 이어지게). 길이는 줄의 len 값(없으면 1)이다.
      id: 'refl_1m', kind: 'unit', categoryId: 'hk_reflective', unitLabel: 'M',
      title: '열반사단열재 경쟁사 가격 비교표',
      lengths: [1, 5, 10, 25, 50],
      keyword: /열반사|알루미늄|은박|빌트론|열 반사|단열\s*롤/i,
      thicknesses: [5, 6, 10, 13],
      options: [
        { key: 'SN', label: '일반 비접착' }, { key: 'SA', label: '일반 접착' },
        { key: 'DN', label: '고급 비접착' }, { key: 'DA', label: '고급 접착' },
      ],
      codeOf: (t, opt, len = 1) => `BL_${t}_${len}_${opt}`,
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

  /* 열반사 1M — [업체, 두께, 옵션, 1M 판매가, 확인일]. 사용자가 준 표(2026-10-14) 그대로이고 확인일은 아직 모른다. */
  SEED.refl_1m = [
    ['배관공구마켓', 5, 'SN', 2800, ''], ['낭만홈즈', 5, 'SN', 2700, ''], ['메가론', 5, 'SN', 2600, ''],
    ['배관공구마켓', 5, 'SA', 3100, ''], ['낭만홈즈', 5, 'SA', 4000, ''], ['메가론', 5, 'SA', 3500, ''],
    ['메가론', 5, 'DN', 3000, ''], ['메가론', 5, 'DA', 3900, ''],
    ['메가론', 6, 'SN', 3300, ''], ['메가론', 6, 'SA', 4300, ''], ['메가론', 6, 'DN', 3900, ''],
    ['낭만홈즈', 6, 'DA', 5900, ''], ['메가론', 6, 'DA', 4900, ''],
    ['배관공구마켓', 10, 'SN', 5700, ''], ['메가론', 10, 'SN', 4400, ''],
    ['배관공구마켓', 10, 'SA', 7600, ''], ['메가론', 10, 'SA', 5400, ''],
    ['메가론', 10, 'DN', 4700, ''], ['낭만홈즈', 10, 'DA', 7000, ''], ['메가론', 10, 'DA', 5700, ''],
    ['메가론', 13, 'DN', 6200, ''], ['메가론', 13, 'DA', 7100, ''],
  ];

  /* 업체별 비교 상품 주소(스마트스토어 상품 페이지) — 업체 열 머리글에 링크로 보이고, 가격 수집은 이 주소를 연다. 사용자가 준 열반사 1M 주소. */
  const SEED_LINKS = {
    refl_1m: {
      '배관공구마켓': 'https://smartstore.naver.com/bgggmarket/products/9630995046',
      '메가론': 'https://smartstore.naver.com/firestop/products/4828083317',
      '낭만홈즈': 'https://smartstore.naver.com/romancehomes/products/5835171089',
    },
  };

  /* 업체별 배송비 — 확장으로는 수집되지 않아 직접 입력한다(사용자가 준 값, 2026-10-14). fee = 배송비(원), every = N개마다 1회(비우면 1).
     '__ours'는 한국단열(빌트론) 쪽 값이다. 열반사 1M 비교에서 [배송비 포함 비교]를 켜면 1M당 가격 = 판매가 + 배송비 ÷ N개 로 비교한다. */
  const OURS_SHIP_KEY = '__ours';
  const SEED_SHIPPING = {
    refl_1m: {
      '배관공구마켓': { fee: 4000, every: 1 },
      '낭만홈즈': { fee: 4000, every: 10 },
      '메가론': { fee: 4000, every: 5 },
      [OURS_SHIP_KEY]: { fee: 4300, every: 5 },
    },
  };

  const state = { rows: {}, loaded: false, loading: false, dirty: false, saving: false, savedAt: null, note: '', noteKind: '', nextId: 1, links: seedLinks(), shipping: JSON.parse(JSON.stringify(SEED_SHIPPING)) };

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

  function seedTableRows(table) {
    if (table.kind === 'unit') {
      return (SEED[table.id] || []).map(([comp, t, opt, price, checked]) => ({ id: state.nextId++, comp, t, opt, price, link: '', checked }));
    }
    return (SEED[table.id] || []).map(([comp, t, spec, sheets, price, ship, every, checked]) =>
      ({ id: state.nextId++, comp, t, spec, sheets, price, ship, every, link: '', checked }));
  }

  function seedLinks() {
    return JSON.parse(JSON.stringify(SEED_LINKS));
  }

  function seedRows() {
    const rows = {};
    TABLES.forEach(table => { rows[table.id] = seedTableRows(table); });
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

  /* 길이(M) — 줄에 len이 없으면 1M(처음 1M만 만들 때 저장된 줄). */
  const rowLen = r => Number(r.len) || 1;
  const shipKey = (name, len) => (Number(len) > 1 ? `${name}@${len}` : name);

  /* 열반사(unit) 한국단열 줄 — 단가표의 (두께, 옵션, 길이) 실판매가. 우리가 안 파는 조합(13T 일반형, 13T 25M 등)은 price가 null이다.
     롤 원품 코드(…_R, 예: BL_6_25_SN_R)가 있으면 그 롤을 먼저 쓴다 — 경쟁사의 "1롤"과 맞는 건 이쪽이다. */
  function unitOurs(table, t, opt, len = 1) {
    const base = table.codeOf(t, opt, len);
    for (const code of [`${base}_R`, base]) {
      let price = null;
      try { price = _hkChannelHkdPrice(table.categoryId, code); } catch (e) { price = null; }
      price = Number(price);
      if (Number.isFinite(price) && price > 0) return { code, price };
    }
    return { code: base, price: null };
  }

  /* 비교 값 — 한국단열 줄·경쟁사 줄 모두 sheet 표는 장당 실구매가, unit 표는 1M 판매가. */
  function oursValue(table, t, optOrUndefined, len = 1) {
    if (table.kind === 'unit') return unitOurs(table, t, optOrUndefined, len).price;
    const def = table.ours.find(d => d[0] === Number(t));
    if (!def) return null;
    const o = oursOf(table, def);
    return o.price == null ? null : (o.price + o.ship / (o.every || 1)) / o.sheets;
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

  /* 차이 배지 — 단가표 공용 마진율 배지(.pricing-rate-badge)를 그대로 쓴다. 경쟁사가 더 비싸면(+) 유리(초록), 더 싸면(−) 불리(빨강). */
  function diffHtml(real, oursReal) {
    if (real == null || oursReal == null) return '<span style="color:#cbd5e1;">—</span>';
    const d = Math.round(real - oursReal);
    if (d === 0) return '<span class="pricing-rate-badge mid">±0</span>';
    return `<span class="pricing-rate-badge ${d > 0 ? 'good' : 'low'}">${d > 0 ? '+' : ''}${d.toLocaleString('ko-KR')} ${d > 0 ? '유리' : '불리'}</span>`;
  }

  /* ─── 화면 — 단가표 공용 부품(결과 카드 .pricing-result-card · 서브탭 .bead-subtab · 표 .pricing-table · 입력칸 .pricing-input-field ·
     배지 .pricing-rate-badge)을 그대로 써서 기존 아이소핑크·열반사 표와 같은 모양으로 보이게 한다. ─── */
  const TH_SHEET = [['두께', 6], ['구분', 10], ['규격', 8], ['상품코드·링크', 11], ['장수', 5], ['판매가', 8], ['배송비', 8], ['배송기준', 6],
    ['장당 단가', 7], ['배송비/건', 7], ['장당 실구매가', 8], ['한국단열<br>장당 실구매가', 9], ['차이<br>경쟁사−한국단열', 9], ['확인일', 8], ['', 4]];
  // 한국단열 줄은 배경(옅은 인디고)만 다르고 글자 크기·굵기·색은 다른 칸과 같다(사용자 지시 2026-10-14).

  /* 단가표 공용 표(.pricing-table)는 칸 여백이 넉넉해 입력칸이 많은 이 표는 칸이 좁아진다 — 칸 여백만 줄인다. */
  function compact(html) {
    return html.replace(/<(td|th)([^>]*)>/g, (m, tag, attrs) => {
      const base = tag === 'td' ? 'padding:12px 6px;background:#fff;' : 'padding:12px 6px;';
      return attrs.includes('style="') ? `<${tag}${attrs.replace('style="', `style="${base}`)}>` : `<${tag}${attrs} style="${base}">`;
    });
  }

  /* 두께 묶음 구분 — 공용 표의 줄무늬·마우스 오버는 줄 단위라 두께 칸(rowspan)을 어긋나게 칠해서 쓰지 않는다. 대신 두께 묶음마다
     옅은 배경을 번갈아 주고 묶음 첫 줄 위에 굵은 선을 둔다. gi = 묶음 순서. */
  function styleGroup(html, gi) {
    const tint = gi % 2 ? '#f8fafc' : '#fff';
    let first = true;
    return html.replace(/<tr([^>]*)>([\s\S]*?)<\/tr>/g, (m, trAttrs, inner) => {
      const top = first ? 'border-top:2px solid #cbd5e1;' : '';
      first = false;
      const cells = inner.replace(/<td([^>]*)>/g, (mm, attrs) => attrs.includes('style="')
        ? `<td${attrs.replace('style="', `style="background:${tint};${top}`)}>`
        : `<td${attrs} style="background:${tint};${top}">`);
      return `<tr${trAttrs}>${cells}</tr>`;
    });
  }

  function theadHtml(cols) {
    return `<colgroup>${cols.map(([, w]) => `<col style="width:${w}%">`).join('')}</colgroup>
      <thead><tr>${cols.map(([label]) => `<th>${label}</th>`).join('')}</tr></thead>`;
  }

  function inputHtml(table, row, field, { placeholder = '', numeric = true, align = 'right' } = {}) {
    const value = row[field] == null ? '' : row[field];
    if (!EDITABLE) return `<span style="display:block;text-align:${align};">${value === '' ? '—' : (numeric ? Number(value).toLocaleString('ko-KR') : esc(value))}</span>`;
    const shown = numeric && value !== '' ? Number(value).toLocaleString('ko-KR') : esc(value);
    return `<input type="text" class="pricing-input-field" ${numeric ? 'inputmode="numeric"' : ''} style="width:100%;height:32px;padding:0 8px;font-size:13px;text-align:${align};" value="${shown}" placeholder="${placeholder}" onchange="hkCmpEdit('${table.id}',${row.id},'${field}',this)">`;
  }

  function linkCellHtml(table, row) {
    if (!EDITABLE) {
      return row.link
        ? `<a href="${esc(row.link)}" target="_blank" rel="noopener" title="${esc(row.link)}" style="color:#4f46e5;"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
        : '<span style="color:#cbd5e1;">—</span>';
    }
    const icon = row.link
      ? `<a href="${esc(row.link)}" target="_blank" rel="noopener" title="상품 페이지" style="color:#4f46e5;"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
      : '';
    return `<div style="display:flex;align-items:center;gap:6px;"><input type="text" class="pricing-input-field" style="width:100%;height:32px;padding:0 8px;font-size:12px;font-weight:500;text-align:left;" value="${esc(row.link)}" placeholder="링크" onchange="hkCmpEdit('${table.id}',${row.id},'link',this)">${icon}</div>`;
  }

  function addButton(tableId, t, opt, title) {
    if (!EDITABLE) return '';
    return `<button type="button" class="pgl-btn" title="${esc(title)}" onclick="hkCmpAddRow('${tableId}',${t}${opt ? `,'${opt}'` : ''})"><i class="fa-solid fa-plus"></i></button>`;
  }

  function delButton(tableId, rowId) {
    if (!EDITABLE) return '';
    return `<button type="button" class="pgl-btn" title="이 줄 삭제" onclick="hkCmpDelRow('${tableId}',${rowId})"><i class="fa-solid fa-xmark"></i></button>`;
  }

  function competitorRowHtml(table, row, group, first, oursReal, listId) {
    const d = derive(table, row);
    const incomplete = num(row.price) && num(row.ship) == null;
    const id = `hkc-${row.id}`;
    return `<tr data-hkc-row="${row.id}">
      ${first ? `<td rowspan="${group}" style="text-align:center;font-weight:700;color:#4f46e5;vertical-align:top;">${row.t}T<div style="margin-top:6px;">${addButton(table.id, row.t, '', `${row.t}T 경쟁사 줄 추가`)}</div></td>` : ''}
      <td>${EDITABLE ? `<input type="text" class="pricing-input-field" list="${listId}" style="width:100%;height:32px;padding:0 8px;font-size:13px;text-align:left;" value="${esc(row.comp)}" placeholder="업체" onchange="hkCmpEdit('${table.id}',${row.id},'comp',this)">` : `<span style="display:block;text-align:left;font-weight:600;color:#334155;">${esc(row.comp) || '—'}</span>`}</td>
      <td>${inputHtml(table, row, 'spec', { placeholder: table.size, numeric: false, align: 'center' })}</td>
      <td>${linkCellHtml(table, row)}</td>
      <td>${inputHtml(table, row, 'sheets')}</td>
      <td>${inputHtml(table, row, 'price')}</td>
      <td>${inputHtml(table, row, 'ship', { placeholder: incomplete ? '입력' : '' })}</td>
      <td>${inputHtml(table, row, 'every')}</td>
      <td id="${id}-per">${fmt(d?.perSheet)}</td>
      <td id="${id}-ship">${fmt(d?.shipPer)}</td>
      <td id="${id}-real">${fmt(d?.real)}</td>
      <td>${fmt(oursReal)}</td>
      <td id="${id}-diff" style="text-align:center;">${diffHtml(d?.real, oursReal)}</td>
      <td style="text-align:center;font-size:11px;color:#94a3b8;white-space:nowrap;">${esc(row.checked || '—')}</td>
      <td style="text-align:center;">${delButton(table.id, row.id)}</td>
    </tr>`;
  }

  function tableHtml(table, listId) {
    const rows = state.rows[table.id] || [];
    const oursByT = new Map(table.ours.map(def => [def[0], oursOf(table, def)]));
    const thicknesses = [...new Set([...oursByT.keys(), ...rows.map(r => Number(r.t))])].sort((a, b) => a - b);
    const body = thicknesses.map((t, gi) => {
      const ours = oursByT.get(t);
      const list = rows.filter(r => Number(r.t) === t);
      const group = 1 + list.length;
      const oursPer = ours && ours.price != null ? (ours.price + ours.ship / (ours.every || 1)) / ours.sheets : null;
      const oursRow = ours
        ? `<tr>
            <td rowspan="${group}" style="text-align:center;font-weight:700;color:#4f46e5;vertical-align:top;">${t}T<div style="margin-top:6px;">${addButton(table.id, t, '', `${t}T 경쟁사 줄 추가`)}</div></td>
            <td style="background:#eef2ff;text-align:left;font-weight:700;">한국단열</td>
            <td style="background:#eef2ff;text-align:center;">${esc(table.size)}×${ours.sheets}장</td>
            <td style="background:#eef2ff;text-align:left;font-size:11px;">${esc(ours.code)}</td>
            <td style="background:#eef2ff;">${ours.sheets}</td>
            <td style="background:#eef2ff;">${fmt(ours.price)}</td>
            <td style="background:#eef2ff;">${ours.ship ? fmt(ours.ship) : '무료'}</td>
            <td style="background:#eef2ff;">${ours.ship ? ours.every : '—'}</td>
            <td style="background:#eef2ff;">${fmt(ours.price == null ? null : ours.price / ours.sheets)}</td>
            <td style="background:#eef2ff;">${ours.ship ? fmt(ours.ship / ours.every) : '—'}</td>
            <td style="background:#eef2ff;">${fmt(oursPer)}</td>
            <td style="background:#eef2ff;">${fmt(oursPer)}</td>
            <td style="background:#eef2ff;text-align:center;">기준</td>
            <td style="background:#eef2ff;"></td><td style="background:#eef2ff;"></td>
          </tr>`
        : '';
      const compRows = list.map((row, i) => competitorRowHtml(table, row, ours ? group : list.length, !ours && i === 0, oursPer, listId)).join('');
      return styleGroup(oursRow + compRows, gi);
    }).join('');
    return compact(`<div style="margin-top:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;">
        <div style="font-size:14px;font-weight:700;color:#1e293b;">${esc(table.title)}</div>
        <button type="button" class="pricing-margin-edit-btn" onclick="hkCmpSave()"><i class="fa-solid fa-floppy-disk"></i> 저장</button>
      </div>
      <div class="pricing-table-scroll" style="border:1px solid #e2e8f0;border-radius:10px;">
        <table class="pricing-table" style="min-width:1100px;">${theadHtml(TH_SHEET)}<tbody>${body}</tbody></table>
      </div>
    </div>`);
  }

  /* 열반사 1M 비교표 — 한눈에 보이도록 "두께 × 제품 옵션" 한 줄에 업체별 가격 칸을 가로로 놓는 표(사용자가 엑셀로 맞추던 모양).
     칸을 비우면 그 업체 가격을 지운다. 새 업체는 [+ 업체]로 열을 더한다. 링크·확인일은 칸에 마우스를 올리면 보인다. */
  const matrixComps = {}; // tableId → 그리는 순간의 업체 열 순서(칸 편집 핸들러가 인덱스로 찾는다)

  function matrixCompsOf(table) {
    const rows = state.rows[table.id] || [];
    const names = [];
    rows.forEach(r => { if (r.comp && !names.includes(r.comp)) names.push(r.comp); });
    (state.extraComps && state.extraComps[table.id] || []).forEach(n => { if (!names.includes(n)) names.push(n); });
    return names;
  }

  /* 배송비 — fee ÷ every(N개마다). 입력이 없으면 null(상품가만 비교). */
  function shipPerUnit(table, key) {
    const v = (state.shipping[table.id] || {})[key] || {};
    const fee = num(v.fee);
    return fee == null ? null : fee / (num(v.every) || 1);
  }

  function withShipOn(table) { return !!uiOf(table.categoryId).withShip; }

  /* 편집 모드 — [편집]을 눌러야 배송비 입력과 업체 추가·삭제가 가능하다(사용자 지시 2026-10-14). 꺼져 있으면 값만 보인다. */
  function editingOn(table) { return !!uiOf(table.categoryId).editing; }

  /* 비교에 쓰는 1M 값 — [배송비 포함 비교]가 꺼져 있으면 판매가 그대로, 켜져 있으면 판매가 + 배송비/N개(입력이 있을 때). */
  function effValue(table, key, price) {
    if (price == null) return null;
    if (!withShipOn(table)) return price;
    const per = shipPerUnit(table, key);
    return per == null ? price : price + per;
  }

  function minCompPrice(table, t, opt, len = 1) {
    const values = (state.rows[table.id] || []).filter(r => Number(r.t) === t && r.opt === opt && rowLen(r) === len && num(r.price))
      .map(r => effValue(table, shipKey(r.comp, len), num(r.price)));
    return values.length ? Math.min(...values) : null;
  }

  function vsMinBadge(oursValue, min) {
    if (oursValue == null || min == null) return '<span style="color:#cbd5e1;">—</span>';
    const gap = Math.round(oursValue - min);
    if (gap === 0) return '<span class="pricing-rate-badge mid">최저가와 같음</span>';
    return `<span class="pricing-rate-badge ${gap > 0 ? 'low' : 'good'}">${gap > 0 ? '+' : ''}${gap.toLocaleString('ko-KR')} ${gap > 0 ? '불리' : '유리'}</span>`;
  }

  function shipCellHtml(table, key) {
    const v = (state.shipping[table.id] || {})[key] || {};
    if (!editingOn(table)) {
      const fee = num(v.fee);
      const box = inner => `<div style="display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;height:28px;">${inner}</div>`;
      if (fee === 0) return box('<span style="font-size:13px;font-weight:600;color:#15803d;">무료배송</span>');
      return fee == null
        ? box('<span style="color:#d5dbe3;">—</span>')
        : box(`<span style="font-size:13px;font-weight:600;color:#334155;">${fee.toLocaleString('ko-KR')}원</span><span style="font-size:11px;color:#64748b;">${(num(v.every) || 1) > 1 ? `/ ${num(v.every)}개마다` : '/ 주문당'}</span>`);
    }
    const style = 'height:28px;padding:0 4px;font-size:12px;text-align:center;';
    const k = esc(key).replace(/'/g, '&#39;');
    return `<div style="display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;height:28px;">
      <input type="text" inputmode="numeric" class="pricing-input-field" style="width:62px;${style}" value="${v.fee === '' || v.fee == null ? '' : Number(v.fee).toLocaleString('ko-KR')}" placeholder="배송비" onchange="hkCmpEditShip('${table.id}','${k}','fee',this)">
      <span style="font-size:11px;color:#64748b;">원</span><span style="color:#cbd5e1;">/</span>
      <input type="text" inputmode="numeric" class="pricing-input-field" style="width:38px;${style}" value="${v.every === '' || v.every == null ? '' : v.every}" placeholder="1" onchange="hkCmpEditShip('${table.id}','${k}','every',this)">
      <span style="font-size:11px;color:#64748b;">개마다</span></div>`;
  }

  function unitTableHtml(table, listId) {
    const rows = state.rows[table.id] || [];
    const comps = matrixComps[table.id] = matrixCompsOf(table);
    const thicknesses = [...new Set([...table.thicknesses, ...rows.map(r => Number(r.t))])].sort((a, b) => a - b);
    const withShip = withShipOn(table);
    const len = uiOf(table.categoryId).len || 1; // 지금 고른 길이(M)
    const compW = Math.floor(48 / Math.max(comps.length, 1));
    const C = 'text-align:center;'; // 숫자·머리글을 모두 가운데 맞춤 — 머리글과 숫자가 어긋나 보이지 않게
    const head = `<colgroup><col style="width:7%"><col style="width:12%">${comps.map(() => `<col style="width:${compW}%">`).join('')}<col style="width:18%"><col style="width:${100 - 7 - 12 - compW * comps.length - 18}%"></colgroup>
      <thead><tr><th>두께</th><th>제품 옵션</th>
        ${comps.map((name, ci) => {
          const url = (state.links[table.id] || {})[name] || (rows.find(r => r.comp === name && r.link) || {}).link || '';
          const icon = url ? ` <a href="${esc(url)}" target="_blank" rel="noopener" title="비교 상품 페이지" style="color:#a5b4fc;margin-left:4px;"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : '';
          const del = COMPANY_EDITABLE && editingOn(table) ? ` <span role="button" tabindex="0" title="${esc(name)} 열 삭제" onclick="hkCmpDelComp('${table.id}',${ci})" style="margin-left:8px;cursor:pointer;color:#94a3b8;"><i class="fa-solid fa-xmark"></i></span>` : '';
          return `<th>${esc(name)}${icon}${del}</th>`;
        }).join('')}
        <th style="background:#4f46e5;">한국단열(빌트론)<br>${len}M ${withShip ? '판매가+배송비' : '판매가'}</th><th>최저가 대비</th></tr></thead>`;
    // 배송비 줄 — 업체마다 배송비와 N개마다를 직접 입력한다(확장으로 수집되지 않는다).
    const shipBg = 'background:#fffbeb;border-bottom:2px solid #cbd5e1;';
    const shipRow = `<tr>
      <td colspan="2" style="${C}font-weight:700;color:#334155;height:50px;${shipBg}">배송비 <span style="font-size:11px;font-weight:500;color:#94a3b8;">원 / N개마다</span></td>
      ${comps.map(name => `<td style="${shipBg}border-left:1px solid #eef2f7;">${shipCellHtml(table, shipKey(name, len))}</td>`).join('')}
      <td style="${shipBg}border-left:1px solid #eef2f7;">${shipCellHtml(table, shipKey(OURS_SHIP_KEY, len))}</td>
      <td style="${shipBg}"></td>
    </tr>`;
    // 한국단열이 판매하지 않는 두께·옵션(예: 13T 일반형)은 비교 대상이 아니라 줄을 만들지 않는다(사용자 지시 2026-10-14).
    const soldOptions = t => table.options.filter(opt => unitOurs(table, t, opt.key, len).price != null);
    const body = thicknesses.filter(t => soldOptions(t).length).map((t, gi) => styleGroup(soldOptions(t).map((opt, oi, list) => {
      const ours = unitOurs(table, t, opt.key, len);
      const oursShown = effValue(table, shipKey(OURS_SHIP_KEY, len), ours.price);
      const min = minCompPrice(table, t, opt.key, len);
      const cells = comps.map((name, ci) => {
        const row = rows.find(r => r.comp === name && Number(r.t) === t && r.opt === opt.key && rowLen(r) === len);
        const price = row && num(row.price) ? num(row.price) : '';
        const shown = price === '' ? '' : effValue(table, shipKey(name, len), price);
        const per = shipPerUnit(table, shipKey(name, len));
        const tip = row ? `${row.checked ? `확인일 ${row.checked}` : '확인일 기록 없음'}${row.link ? ' · 링크 있음' : ''}${withShip && per != null ? ` · 판매가 ${Number(price).toLocaleString('ko-KR')} + 배송비 ${Math.round(per).toLocaleString('ko-KR')}` : ''}` : '';
        if (!EDITABLE) {
          return `<td style="border-left:1px solid #eef2f7;${C}" title="${esc(tip)}"><span style="font-size:13px;font-weight:600;color:#334155;">${shown === '' ? '<span style="color:#d5dbe3;font-weight:400;">—</span>' : Math.round(shown).toLocaleString('ko-KR')}</span></td>`;
        }
        return `<td style="border-left:1px solid #eef2f7;"><input type="text" inputmode="numeric" class="pricing-input-field" data-hkcm="${t}|${opt.key}|${ci}" title="${esc(tip)}"
            style="width:100%;height:26px;padding:0 6px;font-size:12px;text-align:center;" value="${price === '' ? '' : Number(price).toLocaleString('ko-KR')}" placeholder=""
            onchange="hkCmpEditCell('${table.id}',${t},'${opt.key}',${ci},this)"></td>`;
      }).join('');
      return `<tr data-hkcm-row="${t}|${opt.key}">
        ${oi === 0 ? `<td rowspan="${list.length}" style="${C}font-weight:700;color:#4f46e5;vertical-align:middle;border-right:1px solid #e2e8f0;">${t}T</td>` : ''}
        <td style="${C}font-weight:600;color:#334155;border-right:1px solid #e2e8f0;">${esc(opt.label)}</td>
        ${cells}
        <td style="background:#eef2ff;${C}font-size:13px;font-weight:600;color:#334155;border-left:1px solid #e2e8f0;" title="${ours.price == null ? '한국단열 판매 안 함' : esc(ours.code)}">${oursShown == null ? '<span style="font-size:11px;font-weight:500;">판매 안 함</span>' : Math.round(oursShown).toLocaleString('ko-KR')}</td>
        <td id="hkcm-${t}-${opt.key}-diff" style="${C}">${vsMinBadge(oursShown, min)}</td>
      </tr>`;
    }).join(''), gi)).join('');
    const compactBody = (shipRow + body).replace(/<td([^>]*)>/g, (m, attrs) => attrs.includes('style="')
      ? `<td${attrs.replace('style="', 'style="padding:11px 6px;background:#fff;')}>`
      : `<td${attrs} style="padding:11px 6px;background:#fff;">`);
    const hint = EDITABLE ? '칸을 비우면 그 업체 가격이 지워집니다' : '가격은 확장 수집값을 [수집값 불러오기]로 반영하고, 배송비는 직접 입력합니다';
    return `<div style="margin-top:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;">
        <div style="font-size:14px;font-weight:700;color:#1e293b;">${esc(table.title)} – ${len}M 기준 <span style="font-size:11px;font-weight:500;color:#94a3b8;">${hint}</span></div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="pricing-margin-edit-btn" onclick="hkCmpCollect('${table.id}')" title="등록된 경쟁사 상품 주소를 크롬 확장이 열어 옵션별 판매가를 읽어 옵니다(통합 확장 0.32.5 이상). 길이는 모두 한 번에 읽습니다.">
            <i class="fa-solid fa-people-arrows"></i> 경쟁사 가격 확인</button>
          ${COMPANY_EDITABLE && editingOn(table) ? `<button type="button" class="pricing-margin-edit-btn" onclick="hkCmpAddComp('${table.id}')"><i class="fa-solid fa-plus"></i> 경쟁사 추가</button>` : ''}
          ${COMPANY_EDITABLE ? `<button type="button" class="pricing-margin-edit-btn" onclick="hkCmpToggleEdit('${table.categoryId}')" title="${editingOn(table) ? '편집을 끝냅니다' : '배송비 입력, 경쟁사 추가·삭제를 할 수 있습니다'}"><i class="fa-solid fa-${editingOn(table) ? 'check' : 'pen'}"></i> ${editingOn(table) ? '편집 완료' : '편집'}</button>` : ''}
          <button type="button" class="pricing-margin-edit-btn" onclick="hkCmpToggleShip('${table.categoryId}')" title="켜면 같은 길이끼리 판매가 + 배송비 ÷ N개로 비교합니다(분석 막대도 같은 기준)">
            <i class="fa-solid fa-truck-fast"></i> 배송비 포함 비교: ${withShip ? '켜짐' : '꺼짐'}</button>
          <button type="button" class="pricing-margin-edit-btn" onclick="hkCmpSave()"><i class="fa-solid fa-floppy-disk"></i> 저장</button>
        </div>
      </div>
      <div class="pricing-table-scroll" style="border:1px solid #e2e8f0;border-radius:10px;">
        <table class="pricing-table" style="min-width:${540 + comps.length * 150}px;">${head.replace(/<(td|th)([^>]*)>/g, (m, tag, attrs) => (attrs.includes('style="') ? `<${tag}${attrs.replace('style="', 'style="padding:10px 6px;')}>` : `<${tag}${attrs} style="padding:10px 6px;">`))}<tbody>${compactBody}</tbody></table>
      </div>
    </div>`;
  }

  window.hkCmpToggleEdit = function (cat) {
    const ui = uiOf(cat);
    ui.editing = !ui.editing;
    rerender();
  };

  window.hkCmpToggleShip = function (cat) {
    const ui = uiOf(cat);
    ui.withShip = !ui.withShip;
    rerender();
  };

  /* 배송비 칸 편집 — key는 업체 이름 또는 '__ours'(한국단열). 입력 후 표와 분석을 다시 그린다. */
  window.hkCmpEditShip = function (tableId, key, field, input) {
    const table = tableOf(tableId);
    if (!table) return;
    const map = state.shipping[tableId] = state.shipping[tableId] || {};
    const cur = map[key] = map[key] || { fee: '', every: '' };
    const n = num(input.value);
    cur[field] = n == null ? '' : n;
    markDirty();
    rerender();
  };

  /* 칸 하나 편집 — 값이 있으면 그 (업체, 두께, 옵션) 줄을 만들거나 고치고, 비우면 줄을 지운다. */
  window.hkCmpEditCell = function (tableId, t, opt, ci, input) {
    const table = tableOf(tableId);
    const comp = (matrixComps[tableId] || [])[ci];
    if (!table || !comp) return;
    const list = state.rows[tableId] = state.rows[tableId] || [];
    const len = uiOf(table.categoryId).len || 1;
    const idx = list.findIndex(r => r.comp === comp && Number(r.t) === Number(t) && r.opt === opt && rowLen(r) === len);
    const value = num(input.value);
    if (value == null) {
      if (idx >= 0) list.splice(idx, 1);
      // 마지막 가격을 지워도 업체 열은 남겨 둔다(열 삭제는 머리글의 ×).
      const extra = state.extraComps = state.extraComps || {};
      if (!(extra[tableId] || (extra[tableId] = [])).includes(comp)) extra[tableId].push(comp);
      input.value = '';
    } else {
      input.value = value.toLocaleString('ko-KR');
      if (idx >= 0) { list[idx].price = value; list[idx].checked = today(); }
      else list.push({ id: state.nextId++, comp, t: Number(t), opt, len, price: value, link: '', checked: today() });
    }
    markDirty();
    // 같은 줄의 '최저가 대비'만 다시 그린다(입력 중인 칸의 포커스를 지키기 위해 표 전체는 다시 그리지 않는다).
    const min = minCompPrice(table, Number(t), opt, len);
    const diff = document.getElementById(`hkcm-${t}-${opt}-diff`);
    if (diff) diff.innerHTML = vsMinBadge(effValue(table, shipKey(OURS_SHIP_KEY, len), unitOurs(table, Number(t), opt, len).price), min);
    renderAnalysis(table.categoryId);
  };

  window.hkCmpAddComp = function (tableId) {
    const name = String(window.prompt('추가할 경쟁사 이름을 입력하세요') || '').trim();
    if (!name) return;
    if (matrixCompsOf(tableOf(tableId)).includes(name)) { toast(`"${name}"은(는) 이미 있습니다.`, 'error'); return; }
    const url = String(window.prompt('비교할 상품 페이지 주소를 입력하세요(스마트스토어 상품 주소, 없으면 비워 두세요)') || '').trim();
    if (url && !/^https:\/\/smartstore\.naver\.com\/[^/]+\/products\/\d+\/?$/.test(url)) {
      toast('스마트스토어 상품 주소 형식이 아닙니다(https://smartstore.naver.com/스토어/products/번호).', 'error');
      return;
    }
    const extra = state.extraComps = state.extraComps || {};
    (extra[tableId] = extra[tableId] || []).push(name);
    if (url) (state.links[tableId] = state.links[tableId] || {})[name] = url;
    markDirty();
    rerender();
  };

  window.hkCmpDelComp = function (tableId, ci) {
    const name = (matrixComps[tableId] || [])[ci];
    if (!name) return;
    const count = (state.rows[tableId] || []).filter(r => r.comp === name).length;
    if (!window.confirm(`"${name}" 열을 지울까요? 입력된 가격 ${count}건이 함께 지워집니다.`)) return;
    state.rows[tableId] = (state.rows[tableId] || []).filter(r => r.comp !== name);
    if (state.extraComps && state.extraComps[tableId]) state.extraComps[tableId] = state.extraComps[tableId].filter(n => n !== name);
    if (state.links[tableId]) state.links[tableId][name] = '';
    if (state.shipping[tableId]) Object.keys(state.shipping[tableId]).filter(k => k === name || k.startsWith(`${name}@`)).forEach(k => delete state.shipping[tableId][k]);
    markDirty();
    rerender();
  };

  /* ─── 가격 경쟁력 분석(막대) — 입력표와 같은 자료에서 만든다. 읽기 전용이다. ───
     sheet 표(아이소핑크)는 두께마다 한 줄(값 = 장당 실구매가), unit 표(열반사)는 두께 탭 안에 제품 옵션마다 한 줄(값 = 1M 판매가). */
  const uiByCat = {}; // 카테고리마다 고른 표·두께·펼침 상태
  function uiOf(cat) {
    // 기본은 접힌 상태 — 단가표를 열 때 원가·판매가 표가 먼저 보이게 한다(사용자 지시 2026-10-14).
    if (!uiByCat[cat]) uiByCat[cat] = { tableId: (TABLES.find(t => t.categoryId === cat) || {}).id, t: null, len: 1, open: false };
    return uiByCat[cat];
  }

  function analysisGroups(table, onlyT) {
    const rows = state.rows[table.id] || [];
    const thicknesses = table.kind === 'unit'
      ? [...new Set([...table.thicknesses, ...rows.map(r => Number(r.t))])].sort((a, b) => a - b)
      : [...new Set([...table.ours.map(d => d[0]), ...rows.map(r => Number(r.t))])].sort((a, b) => a - b);
    const groups = [];
    thicknesses.forEach(t => {
      if (onlyT != null && t !== onlyT) return;
      if (table.kind === 'unit') {
        const len = uiOf(table.categoryId).len || 1;
        table.options.forEach(opt => {
          const oursPrice = oursValue(table, t, opt.key, len);
          if (oursPrice == null) return; // 한국단열이 안 파는 옵션은 비교 대상이 아니다
          const ours = effValue(table, shipKey(OURS_SHIP_KEY, len), oursPrice);
          const comps = rows.filter(r => Number(r.t) === t && r.opt === opt.key && rowLen(r) === len && num(r.price))
            .map(r => ({ comp: r.comp || '(업체 미입력)', value: effValue(table, shipKey(r.comp, len), num(r.price)), checked: r.checked }));
          groups.push({ t, label: opt.label, sub: '', ours, comps });
        });
      } else {
        const def = table.ours.find(d => d[0] === t);
        const comps = rows.filter(r => Number(r.t) === t).map(r => ({ comp: r.comp || '(업체 미입력)', value: derive(table, r)?.real ?? null, checked: r.checked }))
          .filter(c => c.value != null);
        groups.push({ t, label: `${t}T`, sub: def ? `${table.size}×${def[2]}장` : '', ours: oursValue(table, t), comps });
      }
    });
    return { thicknesses, groups };
  }

  function analysisSummary(table) {
    const all = analysisGroups(table).groups.filter(g => g.ours != null && g.comps.length);
    if (!all.length) return '비교할 경쟁사 가격이 아직 없습니다.';
    const gaps = all.map(g => ({ g, gap: Math.round(g.ours - Math.min(...g.comps.map(c => c.value))) }));
    const higher = gaps.filter(x => x.gap > 0);
    const name = x => (table.kind === 'unit' ? `${x.g.t}T ${x.g.label}` : x.g.label);
    const lenText = table.kind === 'unit' ? `${uiOf(table.categoryId).len || 1}M 기준 ` : '';
    let text = `${lenText}비교 가능한 ${all.length}개 중 ${higher.length}개가 경쟁사 최저가보다 높고, ${gaps.length - higher.length}개는 최저가 이하입니다.`;
    if (higher.length) {
      const worst = higher.reduce((a, b) => (b.gap > a.gap ? b : a));
      const best = higher.reduce((a, b) => (b.gap < a.gap ? b : a));
      text += ` 격차가 가장 큰 곳은 ${name(worst)}(+${worst.gap.toLocaleString('ko-KR')}원), 가장 작은 곳은 ${name(best)}(+${best.gap.toLocaleString('ko-KR')}원)입니다.`;
    }
    return text;
  }

  /* 막대 색 — 단가표 기본 색(인디고 #4f46e5 = 우리, 슬레이트 = 경쟁사)에 맞춘다. */
  const BAR = { track: '#f1f5f9', compLow: '#94a3b8', compRange: '#cbd5e1', ours: '#4f46e5' };

  function barHtml(group, scale) {
    const pct = v => `${Math.max(0, Math.min(100, v / scale * 100)).toFixed(2)}%`;
    const values = group.comps.map(c => c.value);
    const min = values.length ? Math.min(...values) : null, max = values.length ? Math.max(...values) : null;
    const minComp = min == null ? null : group.comps.find(c => c.value === min).comp;
    const gap = group.ours != null && min != null ? Math.round(group.ours - min) : null;
    const gapHtml = gap == null ? '' : gap === 0 ? '<span class="pricing-rate-badge mid">최저가와 같음</span>'
      : `<span class="pricing-rate-badge ${gap > 0 ? 'low' : 'good'}">최저가 대비 ${gap > 0 ? '+' : ''}${gap.toLocaleString('ko-KR')} ${gap > 0 ? '불리' : '유리'}</span>`;
    const range = min == null ? '경쟁사 가격 없음'
      : `경쟁사 ${fmt(min)}원${max !== min ? ` ~ ${fmt(max)}원` : ''} · 최저 ${esc(minComp)}${group.comps.length > 1 ? ` (${group.comps.length}곳)` : ''}`;
    return `<div style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">
        <span style="font-size:14px;font-weight:700;color:#1e293b;">${esc(group.label)}${group.sub ? ` <span style="font-size:11px;font-weight:500;color:#94a3b8;">${esc(group.sub)}</span>` : ''}</span>
        <span style="font-size:14px;font-weight:700;color:#1e293b;">${group.ours == null ? '<span style="font-size:11px;font-weight:500;color:#94a3b8;">한국단열 판매 안 함</span>' : `${fmt(group.ours)}원`}</span>
      </div>
      <div style="position:relative;height:10px;margin-top:7px;background:${BAR.track};border-radius:6px;overflow:hidden;">
        ${min == null ? '' : `<div style="position:absolute;left:0;top:0;bottom:0;width:${pct(min)};background:${BAR.compLow};"></div>
        <div style="position:absolute;left:${pct(min)};top:0;bottom:0;width:${pct(max - min)};background:${BAR.compRange};"></div>`}
      </div>
      <div style="height:6px;margin-top:3px;background:${BAR.track};border-radius:6px;overflow:hidden;">
        ${group.ours == null ? '' : `<div style="height:100%;width:${pct(group.ours)};background:${BAR.ours};"></div>`}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:6px;font-size:12px;color:#64748b;">
        <span>${range}</span>${gapHtml}
      </div>
    </div>`;
  }

  function subtabBar(items, activeKey, onclickOf, extraClass = '') {
    return `<div class="bead-subtab-bar${extraClass}">${items.map(item =>
      `<button type="button" class="bead-subtab${item.key === activeKey ? ' active' : ''}" onclick="${onclickOf(item.key)}">${esc(item.label)}${item.sub ? `<span class="bead-subtab-sub">${esc(item.sub)}</span>` : ''}</button>`
    ).join('')}</div>`;
  }

  function analysisInnerHtml(cat) {
    if (!state.loaded) return '<div style="padding:16px 22px;color:#94a3b8;font-size:13px;">불러오는 중…</div>';
    const ui = uiOf(cat);
    const catTables = TABLES.filter(t => t.categoryId === cat);
    const table = tableOf(ui.tableId) || catTables[0];
    const chips = catTables.length > 1
      ? subtabBar(catTables.map(item => ({ key: item.id, label: item.chip || item.title.replace(/^.*경쟁사 가격 비교표 – /, ''), sub: item.kind === 'unit' ? (ui.withShip ? '판매가+배송비' : '판매가') : '장당 실구매가' })),
        table.id, key => `hkCmpPickTable('${cat}','${key}')`)
      : '';
    const whole = analysisGroups(table);
    if (table.kind === 'unit') whole.thicknesses = whole.thicknesses.filter(t => whole.groups.some(g => g.t === t));
    let tabs = '', lenTabs = '', shown = whole.groups, tNow = null;
    const len = ui.len || 1;
    if (table.kind === 'unit') {
      lenTabs = subtabBar(table.lengths.map(l => ({ key: l, label: `${l}M` })), len, key => `hkCmpPickLen('${cat}',${key})`);
      tNow = whole.thicknesses.includes(ui.t) ? ui.t : whole.thicknesses[0];
      tabs = subtabBar(whole.thicknesses.map(t => ({ key: t, label: `${t}T` })), tNow, key => `hkCmpPickT('${cat}',${key})`);
      shown = whole.groups.filter(g => g.t === tNow);
    }
    const values = shown.flatMap(g => [g.ours, ...g.comps.map(c => c.value)]).filter(v => v != null);
    const scale = values.length ? Math.max(...values) * 1.02 : 1;
    const swatch = color => `<i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};margin-right:4px;"></i>`;
    const legend = `<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:#64748b;margin-top:10px;">
      <span>${swatch(BAR.compLow)}경쟁사 최저가까지</span><span>${swatch(BAR.compRange)}최저~최고 구간</span>
      <span>${swatch(BAR.ours)}한국단열 ${table.kind === 'unit' ? `${len}M ${uiOf(cat).withShip ? '판매가+배송비' : '판매가'}` : '장당 실구매가'}</span></div>`;
    return `${chips}${lenTabs}${tabs}
      <div style="padding:14px 22px 4px;">
        <div style="font-size:13px;color:#334155;font-weight:500;">${esc(analysisSummary(table))}</div>
        ${legend}
        <div style="margin-top:6px;">${shown.map(g => barHtml(g, scale)).join('')}</div>
      </div>`;
  }

  function renderAnalysis(cat) {
    const el = document.getElementById(`hkCmpAnalysis-${cat}`);
    if (el) el.innerHTML = analysisInnerHtml(cat);
  }

  // 분석에서 고른 표 하나만 아래 입력표에 보인다(표를 바꾸면 입력표도 같이 바뀐다).
  window.hkCmpPickTable = function (cat, id) {
    const ui = uiOf(cat);
    ui.tableId = id;
    ui.t = null;
    renderAnalysis(cat);
    const body = document.getElementById(`hkComparePaneBody-${cat}`);
    if (body) body.innerHTML = bodyHtml(cat);
  };
  window.hkCmpPickT = function (cat, t) { uiOf(cat).t = Number(t); renderAnalysis(cat); };
  // 길이를 바꾸면 분석과 아래 비교표가 같은 길이로 같이 바뀐다.
  window.hkCmpPickLen = function (cat, len) {
    const ui = uiOf(cat);
    ui.len = Number(len) || 1;
    ui.t = null;
    renderAnalysis(cat);
    const body = document.getElementById(`hkComparePaneBody-${cat}`);
    if (body) body.innerHTML = bodyHtml(cat);
  };
  window.hkCmpToggle = function (cat) { const ui = uiOf(cat); ui.open = !ui.open; rerender(); };

  function bodyHtml(cat) {
    if (!state.loaded) return '<div style="padding:16px 0;color:#94a3b8;font-size:13px;">경쟁사 가격을 불러오는 중입니다…</div>';
    const names = [...new Set(Object.values(state.rows).flat().map(r => r.comp).filter(Boolean))];
    const listId = `hkCmpCompanyNames-${cat}`;
    const ui = uiOf(cat);
    return `<datalist id="${listId}">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>`
      + TABLES.filter(table => table.categoryId === cat && table.id === ui.tableId)
        .map(table => (table.kind === 'unit' ? unitTableHtml(table, listId) : tableHtml(table, listId))).join('');
  }

  function statusHtml() {
    if (state.saving) return '<span style="color:#64748b;">저장 중…</span>';
    if (state.dirty) return '<span style="color:#d97706;font-weight:600;">저장하지 않은 변경이 있습니다</span>';
    if (state.savedAt) return `<span>마지막 저장 ${esc(state.savedAt.toLocaleString('ko-KR'))}</span>`;
    return '';
  }

  /* 카테고리 맨 위 구역 — 가격 경쟁력 분석(막대) + 경쟁사 가격 입력표. 그 카테고리에 비교표가 없으면(스티로폼 등) 아무것도 안 그린다. */
  function sectionInner(cat) {
    if (!state.loaded && !state.loading) load();
    const ui = uiOf(cat);
    const noteHtml = state.note && (!state.noteCat || state.noteCat === cat)
      ? `<span style="color:${state.noteKind === 'error' ? '#dc2626' : '#64748b'};">${esc(state.note)}</span>` : '';
    const label = (HK_CATEGORIES.find(c => c.id === cat) || {}).label || '';
    return `<div class="card pricing-result-card" style="margin-bottom:24px;">
      <div class="pricing-result-header"${ui.open ? '' : ' style="border-radius:12px;border-bottom:0;"'}>
        <div class="pricing-result-title">${esc(label)} 경쟁사 가격 · 가격 경쟁력<span class="pricing-spec-badge">한국단열 스마트스토어 기준</span>${!ui.open && state.dirty ? '<span class="pricing-result-hint" style="color:#d97706;font-weight:600;">저장하지 않은 변경이 있습니다</span>' : ''}</div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${ui.open && TABLES.some(t => t.categoryId === cat && t.kind !== 'unit') ? `<button type="button" class="pricing-margin-edit-btn" onclick="hkCmpImportScans('${cat}')" title="확장으로 수집한 경쟁사 옵션 가격(competitor_price_scans)을 업체명·두께·규격으로 짝지어 판매가를 채웁니다. 표에 이미 있는 업체만 반영하고, 배송비·배송기준은 직접 입력합니다.">
            <i class="fa-solid fa-cloud-arrow-down"></i> 수집값 불러오기</button>` : ''}
          <button type="button" class="hk-iso-accordion-toggle" onclick="hkCmpToggle('${cat}')" title="펼치기 / 접기" aria-label="경쟁사 가격 구역 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"${ui.open ? ' style="transform:rotate(180deg);color:#4f46e5;"' : ''}></i></button>
        </div>
      </div>
      ${ui.open ? `
      <div id="hkCmpAnalysis-${cat}">${analysisInnerHtml(cat)}</div>
      <div style="padding:6px 22px 20px;">
        <div class="pricing-result-hint hk-cmp-status-line" style="min-height:18px;margin-top:8px;"><span class="hk-cmp-status">${statusHtml()}</span> ${noteHtml}</div>
        <div id="hkComparePaneBody-${cat}">${bodyHtml(cat)}</div>
      </div>` : ''}
    </div>`;
  }

  window.hkCompareSectionHtml = function (cat) {
    if (!TABLES.some(t => t.categoryId === cat)) return '';
    return `<div class="hk-cmp-section" data-cat="${cat}">${sectionInner(cat)}</div>`;
  };

  function rerender() {
    document.querySelectorAll('.hk-cmp-section').forEach(el => { el.innerHTML = sectionInner(el.dataset.cat); });
  }

  function setStatus() {
    document.querySelectorAll('.hk-cmp-status').forEach(el => { el.innerHTML = statusHtml(); });
  }

  // 탭을 열 때마다 한국단열 현재 가격을 다시 읽어 와서 방금 고친 값이 비교에 바로 반영되게 한다.
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
        const seededTables = [];
        TABLES.forEach(table => {
          if (Array.isArray(rows[table.id])) {
            state.rows[table.id] = rows[table.id].map(r => ({ ...r, id: state.nextId++ }));
          } else {
            // 나중에 새로 생긴 비교표(저장본에 아직 없음)는 그 표의 시드 값을 채워 둔다.
            state.rows[table.id] = seedTableRows(table);
            seededTables.push(table.title);
          }
        });
        const savedLinks = saved.value.links;
        if (savedLinks && typeof savedLinks === 'object') {
          TABLES.forEach(table => { if (savedLinks[table.id]) state.links[table.id] = { ...(state.links[table.id] || {}), ...savedLinks[table.id] }; });
        }
        const savedCompanies = saved.value.companies;
        if (savedCompanies && typeof savedCompanies === 'object') {
          const extra = state.extraComps = state.extraComps || {};
          TABLES.forEach(table => {
            if (Array.isArray(savedCompanies[table.id])) extra[table.id] = [...new Set([...(extra[table.id] || []), ...savedCompanies[table.id]])];
          });
        }
        const savedShipping = saved.value.shipping;
        if (savedShipping && typeof savedShipping === 'object') {
          TABLES.forEach(table => { if (savedShipping[table.id]) state.shipping[table.id] = { ...(state.shipping[table.id] || {}), ...savedShipping[table.id] }; });
        }
        state.savedAt = saved.updated_at ? new Date(saved.updated_at) : null;
        state.dirty = seededTables.length > 0;
        state.note = seededTables.length ? `새 비교표(${seededTables.join(', ')})에 예전 값을 채워 두었습니다 — 확인 후 [저장]을 눌러 확정하세요.` : '';
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
        .filter(r => r.comp || r.price)
        .filter(r => table.kind !== 'unit' || unitOurs(table, Number(r.t), r.opt, rowLen(r)).price != null);
    });
    const links = {};
    TABLES.forEach(table => {
      if (table.kind !== 'unit') return;
      const names = new Set(matrixCompsOf(table));
      links[table.id] = Object.fromEntries(Object.entries(state.links[table.id] || {}).filter(([name, url]) => url && names.has(name)));
    });
    const shipping = {};
    TABLES.forEach(table => {
      if (table.kind !== 'unit') return;
      const names = new Set([...matrixCompsOf(table), OURS_SHIP_KEY]);
      shipping[table.id] = Object.fromEntries(Object.entries(state.shipping[table.id] || {}).filter(([key, v]) => names.has(key.split('@')[0]) && v && (v.fee !== '' && v.fee != null)));
    });
    const companies = {};
    TABLES.forEach(table => { if (table.kind === 'unit') companies[table.id] = matrixCompsOf(table); });
    const now = new Date().toISOString();
    const { error } = await c.from('hk_settings').upsert({ key: SETTING_KEY, value: { version: 1, rows, links, shipping, companies }, updated_at: now }, { onConflict: 'key' });
    state.saving = false;
    if (error) { toast(`저장 실패: ${error.message || error}`, 'error'); setStatus(); return; }
    state.dirty = false; state.savedAt = new Date(now); state.note = ''; state.noteKind = ''; state.noteCat = null;
    toast('경쟁사 가격이 저장되었습니다.', 'success');
    rerender();
  };

  /* ─── 편집 ─── */
  function markDirty() { state.dirty = true; setStatus(); }

  function refreshRow(table, row) {
    if (table.kind === 'unit') {
      const el = document.getElementById(`hkc-${row.id}-diff`);
      if (el) el.innerHTML = diffHtml(num(row.price), unitOurs(table, Number(row.t), row.opt, rowLen(row)).price);
      renderAnalysis(table.categoryId);
      return;
    }
    const ours = table.ours.find(def => def[0] === Number(row.t));
    const o = ours ? oursOf(table, ours) : null;
    const oursReal = o && o.price != null ? (o.price + o.ship / (o.every || 1)) / o.sheets : null;
    const d = derive(table, row);
    const set = (suffix, html) => { const el = document.getElementById(`hkc-${row.id}-${suffix}`); if (el) el.innerHTML = html; };
    set('per', fmt(d?.perSheet));
    set('ship', fmt(d?.shipPer));
    set('real', fmt(d?.real));
    set('diff', diffHtml(d?.real, oursReal));
    renderAnalysis(table.categoryId);
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

  window.hkCmpAddRow = function (tableId, t, opt) {
    const table = tableOf(tableId);
    if (!table) return;
    const list = state.rows[tableId] = state.rows[tableId] || [];
    if (table.kind === 'unit') {
      const lastUnit = [...list].reverse().find(r => r.comp && Number(r.t) === Number(t)) || [...list].reverse().find(r => r.comp);
      list.push({ id: state.nextId++, comp: lastUnit ? lastUnit.comp : '', t, opt, price: '', link: '', checked: '' });
      markDirty();
      rerender();
      return;
    }
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

  /* 열반사 옵션 해석 — 두께(T)·길이(1M만)·등급·접착 여부가 모두 읽혀야 한다. 하나라도 못 읽으면 null(건너뜀).
     항목마다 옵션 이름(option_label)에서 먼저 찾고, 없을 때만 상품명(product_name)에서 찾는다 — 상품명에는 옵션과 반대 말이 같이 있는 경우가 많다
     (예: 상품명 "…단면은박비점착" 안의 옵션 "C.단면은박/점착"). 등급은 단면은박=일반형, 양면은박=고급형으로 본다(메가론 A~D 옵션 기준 추정). 점착 = 접착. */
  function parseUnitScan(scan) {
    const sources = [String(scan.option_label || ''), String(scan.product_name || '')];
    const firstOf = detect => { for (const text of sources) { const v = detect(text); if (v != null) return v; } return null; };
    const t = firstOf(text => { const m = text.match(/(\d{1,2})\s*[Tt]\b/) || text.match(/(\d{1,2})\s*(?:mm|㎜)/); return m ? Number(m[1]) : null; });
    const length = firstOf(text => { const m = text.match(/(\d+(?:\.\d+)?)\s*(?:[mM]\b|미터)/); return m ? Number(m[1]) : null; });
    if (t == null || length == null) return null; // 두께나 길이를 못 읽음(길이가 표에 없으면 호출 쪽이 조용히 건너뛴다)
    const adhesive = firstOf(text => (/비\s*(?:접착|점착)|무\s*(?:접착|점착)|비접|접착\s*없/.test(text) ? false : (/점착|접착/.test(text) ? true : null)));
    const grade = firstOf(text => (/양면|고급|프리미엄|이중/.test(text) ? 'D' : (/단면|일반|기본|스탠다드/.test(text) ? 'S' : null)));
    if (adhesive == null || grade == null) return null;
    return { t, len: length, opt: grade + (adhesive ? 'A' : 'N') };
  }

  /* ─── 경쟁사 가격 확인(크롬 확장) ───
     에너가드 '경쟁사 가격 확인'과 같은 흐름: 단가표 안 버튼 → 확장이 업체별 상품 주소를 백그라운드 탭으로 하나씩 열어 옵션·가격을 읽음 →
     결과 창에서 이전 값과 비교 → [변경 적용]. 확장은 옵션을 있는 그대로 돌려주고(kind:'compscan'), 일반/고급·접착·1M 짝짓기는 여기(parseUnitScan)서 한다. */
  const COLLECT_MIN_EXTENSION = '0.32.5';
  const SMARTSTORE_PRODUCT = /^https:\/\/smartstore\.naver\.com\/[^/]+\/products\/\d+\/?$/;

  function extRequest(action, payload) {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const timer = setTimeout(() => { window.removeEventListener('message', listener); reject(Error('확장 연결이 없습니다. 통합 확장을 업데이트·리로드한 뒤 이 관리자 페이지도 새로고침해 주세요.')); }, 8000);
      function listener(event) {
        if (event.source !== window || event.origin !== location.origin || event.data?.type !== 'EG_PRICE_TEST_RESPONSE' || event.data.requestId !== requestId) return;
        clearTimeout(timer); window.removeEventListener('message', listener);
        event.data.result?.ok ? resolve(event.data.result) : reject(Error(event.data.result?.error || '요청 실패'));
      }
      window.addEventListener('message', listener);
      window.postMessage({ type: 'EG_PRICE_TEST_REQUEST', requestId, action, payload }, location.origin);
    });
  }

  function versionLess(a, b) {
    const l = String(a).split('.').map(Number), r = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(l.length, r.length); i++) { const d = (l[i] || 0) - (r[i] || 0); if (d) return d < 0; }
    return false;
  }

  function collectTargets(table) {
    const rows = state.rows[table.id] || [];
    return matrixCompsOf(table).map(name => ({
      name,
      link: (state.links[table.id] || {})[name] || (rows.find(r => r.comp === name && r.link) || {}).link || '',
    })).filter(item => SMARTSTORE_PRODUCT.test(item.link));
  }

  /* 확장이 돌려준 원본 옵션 → 표의 (업체, 두께, 옵션)에 짝지어 이전 값과 비교한 행 목록. */
  function collectResults(table, scanState) {
    const rawRows = (scanState && scanState.rows) || [];
    const current = state.rows[table.id] || [];
    const keyOf = (comp, t, opt, len) => `${comp}|${t}|${opt}|${len}`;
    const optLabel = (key, len) => `${len}M ${(table.options.find(o => o.key === key) || {}).label || key}`;
    const results = [];
    const seen = new Set();
    const okComps = new Set();
    rawRows.forEach(raw => {
      if (raw.status === '수집 실패') {
        results.push({ comp: raw.name, status: '수집 실패', note: raw.errorMsg || '', link: raw.link });
        return;
      }
      okComps.add(raw.name);
      const unit = parseUnitScan({ option_label: raw.label, product_name: raw.productName });
      if (unit && !table.lengths.includes(unit.len)) return; // 표에 없는 길이(15M·20M 등)는 대상이 아니다
      if (!unit) { results.push({ comp: raw.name, status: '옵션 해석 불가', label: raw.label, link: raw.link }); return; }
      if (unitOurs(table, unit.t, unit.opt, unit.len).price == null) return; // 한국단열이 안 파는 옵션
      seen.add(keyOf(raw.name, unit.t, unit.opt, unit.len));
      const cur = current.find(x => x.comp === raw.name && Number(x.t) === unit.t && x.opt === unit.opt && rowLen(x) === unit.len);
      const before = cur && num(cur.price) ? num(cur.price) : null;
      const actual = raw.finalPrice;
      let status;
      if (raw.soldOut) status = '품절';
      else if (!(actual > 0)) status = '가격 확인 불가';
      else if (before == null) status = '신규';
      else if (before === actual) status = '일치';
      else status = '변경';
      results.push({ comp: raw.name, t: unit.t, len: unit.len, opt: unit.opt, optLabel: optLabel(unit.opt, unit.len), label: raw.label, before, actual, diff: before != null && actual > 0 ? actual - before : null, status, link: raw.link });
    });
    // 수집은 됐는데 표에 있던 옵션이 스토어에서 안 보이는 경우(판매 중지·옵션 삭제 가능성)
    current.forEach(x => {
      if (!okComps.has(x.comp) || !num(x.price)) return;
      if (seen.has(keyOf(x.comp, Number(x.t), x.opt, rowLen(x)))) return;
      if (unitOurs(table, Number(x.t), x.opt, rowLen(x)).price == null) return;
      results.push({ comp: x.comp, t: Number(x.t), len: rowLen(x), opt: x.opt, optLabel: optLabel(x.opt, rowLen(x)), before: num(x.price), actual: null, diff: null, status: '스토어에서 안 보임', link: x.link || '' });
    });
    return results;
  }

  function collectBadgeClass(status) {
    if (status === '일치') return 'good';
    if (status === '변경' || status === '신규') return 'mid';
    if (status === '수집 실패') return 'low';
    return 'neutral';
  }

  function applyCollected(table, results) {
    const list = state.rows[table.id] = state.rows[table.id] || [];
    let applied = 0;
    results.filter(r => (r.status === '변경' || r.status === '신규') && r.actual > 0).forEach(r => {
      const cur = list.find(x => x.comp === r.comp && Number(x.t) === r.t && x.opt === r.opt && rowLen(x) === (r.len || 1));
      if (cur) { cur.price = r.actual; cur.checked = today(); if (!cur.link && r.link) cur.link = r.link; }
      else list.push({ id: state.nextId++, comp: r.comp, t: r.t, opt: r.opt, len: r.len || 1, price: r.actual, link: r.link || '', checked: today() });
      const extra = state.extraComps = state.extraComps || {};
      if (!(extra[table.id] || (extra[table.id] = [])).includes(r.comp)) extra[table.id].push(r.comp);
      if (r.link && !(state.links[table.id] || {})[r.comp]) (state.links[table.id] = state.links[table.id] || {})[r.comp] = r.link;
      applied++;
    });
    return applied;
  }

  window.hkCmpCollect = async function (tableId) {
    const table = tableOf(tableId);
    if (!table || table.kind !== 'unit') return;
    const targets = collectTargets(table);
    let dialog = document.getElementById('hkCompareCollectDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'hkCompareCollectDialog';
      dialog.className = 'pv-dialog';
      document.body.appendChild(dialog);
    }
    dialog.innerHTML = `<div class="pricing-input-modal-header">
        <div class="pim-header-left">
          <span class="pim-title"><i class="fa-solid fa-people-arrows"></i> 경쟁사 가격 확인</span>
          <span class="pim-sub">${esc(table.title)}</span>
        </div>
        <button type="button" class="pim-close-btn" data-close><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="pv-body">
        <div class="pv-hint"><i class="fa-solid fa-circle-info"></i>
          <span>등록된 경쟁사 상품 주소를 크롬 확장이 하나씩 열어 옵션별 판매가를 읽어 옵니다(통합 확장 ${COLLECT_MIN_EXTENSION} 이상, 스마트스토어에 로그인된 크롬). 결과를 확인한 뒤 [변경 적용]을 누르면 표에 반영되고, [저장]은 따로 눌러야 합니다.</span>
        </div>
        <div class="pctd-actions">
          <button type="button" class="pim-btn-confirm" data-apply disabled><i class="fa-solid fa-check"></i> 변경 적용</button>
          <button type="button" class="pim-btn-cancel" data-pause><i class="fa-solid fa-pause"></i> 일시정지</button>
          <button type="button" class="pim-btn-cancel" data-resume><i class="fa-solid fa-forward"></i> 이어서</button>
          <label class="pctd-checkbox"><input type="checkbox" data-only checked> 확인 필요한 항목만</label>
        </div>
        <div class="pctd-status-bar" data-statusbar><span data-status role="status">시작 중…</span></div>
        <div class="pv-summary" data-summary></div>
        <div class="pv-table" data-result></div>
      </div>`;
    const q = sel => dialog.querySelector(sel);
    const statusEl = q('[data-status]'), statusBar = q('[data-statusbar]'), summary = q('[data-summary]'), resultEl = q('[data-result]');
    let timer = null, snapshot = null, results = [], polling = false;
    const close = () => { clearInterval(timer); dialog.close(); };
    q('[data-close]').onclick = close;
    dialog.onclose = () => clearInterval(timer);
    if (!dialog.open) dialog.showModal();

    function render() {
      const st = snapshot;
      if (!st || st.kind !== 'compscan') { statusEl.textContent = '다른 검사 기록이 있어 이 수집 결과가 없습니다 — 다시 시작해 주세요.'; return; }
      results = collectResults(table, st);
      statusEl.textContent = `${st.done}/${st.total}개 링크 · ${st.running ? '진행 중' : st.reason || '완료'}${st.currentProduct ? ` · ${st.currentProduct.replace('https://smartstore.naver.com/', '')}` : ''}`;
      statusBar.classList.toggle('running', !!st.running);
      const counts = {};
      results.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
      summary.replaceChildren(...Object.entries(counts).map(([k, v]) => {
        const badge = document.createElement('span');
        badge.className = 'pricing-rate-badge ' + collectBadgeClass(k);
        badge.textContent = `${k} ${v}건`;
        return badge;
      }));
      q('[data-pause]').disabled = !st.running;
      q('[data-resume]').disabled = st.running || st.done >= st.total;
      const changes = results.filter(r => r.status === '변경' || r.status === '신규').length;
      q('[data-apply]').disabled = st.running || !changes;
      q('[data-apply]').innerHTML = `<i class="fa-solid fa-check"></i> 변경 적용${changes ? ` (${changes}건)` : ''}`;
      const shown = results.filter(r => !q('[data-only]').checked || r.status !== '일치');
      if (!shown.length) { resultEl.innerHTML = '<p class="pricing-empty-msg"><i class="fa-solid fa-circle-check"></i> 표시할 항목이 없습니다.</p>'; return; }
      const tableEl = document.createElement('table');
      const head = tableEl.insertRow();
      [['경쟁사', true], ['두께', true], ['제품 옵션', true], ['기록된 가격'], ['실제 가격'], ['차액'], ['판정', true]].forEach(([text, left]) => {
        const th = document.createElement('th'); th.textContent = text; if (left) th.className = 'pv-td-left'; head.appendChild(th);
      });
      shown.forEach(r => {
        const tr = tableEl.insertRow();
        [[r.comp, true], [r.t != null ? `${r.t}T` : '—', true], [r.optLabel || r.label || '—', true], [r.before], [r.actual], [r.diff]].forEach(([value, left]) => {
          const td = tr.insertCell();
          td.textContent = value == null ? '—' : typeof value === 'number' ? value.toLocaleString('ko-KR') : String(value);
          if (left) td.className = 'pv-td-left';
        });
        const td = tr.insertCell(); td.className = 'pv-td-left';
        const badge = document.createElement('span');
        badge.className = 'pricing-rate-badge ' + collectBadgeClass(r.status);
        badge.textContent = r.status + (r.note ? ` (${r.note})` : '');
        td.appendChild(badge);
      });
      resultEl.replaceChildren(tableEl);
    }

    async function refresh() {
      if (polling) return;
      polling = true;
      try { const r = await extRequest('status'); snapshot = r.state; render(); }
      catch (e) { statusEl.textContent = e.message; }
      finally { polling = false; }
    }
    q('[data-only]').onchange = render;
    for (const action of ['pause', 'resume']) {
      q(`[data-${action}]`).onclick = async () => { try { await extRequest(action); await refresh(); } catch (e) { statusEl.textContent = e.message; } };
    }
    q('[data-apply]').onclick = () => {
      const targetsToApply = results.filter(r => (r.status === '변경' || r.status === '신규') && r.actual > 0);
      const applied = applyCollected(table, results);
      if (applied) { markDirty(); rerender(); }
      // 반영 뒤 표 머리글에 그 업체가 실제로 보이는지 확인한다(안 보이면 어느 업체인지 알려 준다).
      const headers = [...document.querySelectorAll(`#hkComparePaneBody-${table.categoryId} thead th`)].map(th => th.innerText.replace(/\s+/g, ' ').trim());
      const missing = [...new Set(targetsToApply.map(r => r.comp))].filter(name => !headers.some(h => h.startsWith(name)));
      if (applied && missing.length) toast(`${applied}건을 반영했지만 표에 보이지 않는 업체가 있습니다: ${missing.join(', ')}`, 'error');
      else toast(applied ? `경쟁사 가격 ${applied}건을 표에 반영했습니다 — [저장]을 눌러 확정하세요.` : '반영할 변경이 없습니다.', applied ? 'success' : 'info');
      close();
    };

    try {
      if (!targets.length) throw Error('수집할 경쟁사 상품 주소가 없습니다 — [편집]에서 업체를 추가하며 상품 주소를 입력해 주세요.');
      statusEl.textContent = '확장 연결 확인 중…';
      const ext = await extRequest('ping');
      if (!ext.version || versionLess(ext.version, COLLECT_MIN_EXTENSION)) throw Error(`통합 확장을 ${COLLECT_MIN_EXTENSION} 이상으로 업데이트·리로드한 뒤 이 페이지를 새로고침해 주세요(현재 ${ext.version || '확인 불가'}).`);
      await extRequest('start', { kind: 'compscan', items: targets.map(item => ({ name: item.name, link: item.link })) });
      timer = setInterval(() => { if (dialog.open) refresh(); }, 3000);
      await refresh();
    } catch (error) {
      statusEl.textContent = error.message || '시작하지 못했습니다';
    }
  };

  window.hkCmpImportScans = async function (cat) {
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
    let unparsedUnit = 0;

    // 표 안에서 같은 (업체, 두께, 장수, 규격)이 여러 개면 가장 싼 값을 쓴다.
    const picked = new Map();
    latest.forEach(scan => {
      if (!scan.store_name || !scan.final_price || scan.sold_out) return;
      const text = `${scan.product_name || ''} ${scan.option_label || ''}`;
      const related = TABLES.filter(table => (!cat || table.categoryId === cat) && table.keyword.test(text));
      if (!related.length) return;
      // 스토어 이름이 표의 업체명을 포함하면 같은 업체로 본다(예: 스토어 "이지하우스 메가론" → 표의 "메가론"). 표에는 표의 이름으로 쓴다.
      const rawStore = String(scan.store_name).trim();
      const squash = text => String(text).replace(/\s+/g, '');
      const store = known.has(rawStore) ? rawStore : ([...known].find(name => squash(rawStore).includes(squash(name))) || null);
      if (!store) { skipped.set(rawStore, (skipped.get(rawStore) || 0) + 1); return; }
      const checked = String(scan.collected_at || '').slice(0, 10);
      related.forEach(table => {
        if (table.kind === 'unit') {
          const unit = parseUnitScan(scan);
          if (unit && !table.lengths.includes(unit.len)) return;
          if (!unit) { unparsedUnit++; return; }
          const key = `${table.id}|${store}|${unit.t}|${unit.opt}|${unit.len}`;
          const prev = picked.get(key);
          if (!prev || scan.final_price < prev.price) {
            picked.set(key, { tableId: table.id, unit: true, comp: store, t: unit.t, len: unit.len, opt: unit.opt, price: scan.final_price, link: scan.product_url || '', checked });
          }
          return;
        }
        const parsed = parseScan(scan);
        if (!parsed) return;
        const tableArea = areaOf(table.size);
        const ratio = tableArea / parsed.area;
        if (ratio !== 1 && ratio !== 2) return; // 같은 규격이거나 정확히 절반 규격(600x450 등)만 이 표에 넣는다
        const key = `${table.id}|${store}|${parsed.t}|${parsed.spec}|${parsed.sheets}`;
        const prev = picked.get(key);
        if (!prev || scan.final_price < prev.price) {
          picked.set(key, { tableId: table.id, comp: store, t: parsed.t, spec: parsed.spec, sheets: parsed.sheets, price: scan.final_price, link: scan.product_url || '', checked });
        }
      });
    });

    let updated = 0, added = 0;
    picked.forEach(item => {
      const list = state.rows[item.tableId] = state.rows[item.tableId] || [];
      if (item.unit) {
        const sameUnit = list.find(r => r.comp === item.comp && Number(r.t) === item.t && r.opt === item.opt && rowLen(r) === item.len);
        if (sameUnit) {
          if (Number(sameUnit.price) !== item.price) updated++;
          sameUnit.price = item.price;
          sameUnit.checked = item.checked;
          if (!sameUnit.link && item.link) sameUnit.link = item.link;
        } else {
          list.push({ id: state.nextId++, comp: item.comp, t: item.t, opt: item.opt, len: item.len, price: item.price, link: item.link, checked: item.checked });
          added++;
        }
        return;
      }
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
    const skippedText = (skipped.size
      ? ` · 표에 없는 업체라 건너뜀: ${[...skipped].map(([name, n]) => `${name} ${n}건`).join(', ')}`
      : '') + (unparsedUnit ? ` · 1M 열반사 옵션인데 두께·등급·접착 중 읽지 못해 건너뜀 ${unparsedUnit}건` : '');
    state.note = (added || updated
      ? `수집값 반영: 가격 변경 ${updated}건 · 새 줄 ${added}건 (배송비가 비어 있는 줄은 직접 입력하세요) — [저장]을 눌러야 저장됩니다.`
      : `수집값 ${picked.size}건을 확인했지만 바뀐 가격이 없습니다.`) + skippedText;
    state.noteKind = '';
    state.noteCat = cat || null;
    rerender();
  };
})();
