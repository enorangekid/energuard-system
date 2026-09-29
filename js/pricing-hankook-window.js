/* ═══════════════════════════════════════
   한국단열 창문형단열재(hk_window) — 주문제작 상품의 기준값(mvalue) 관리 (2026-09-29)

   창문형단열재는 사이즈를 고객이 정하는 **주문제작** 상품이다. 스토어에는 **100원짜리 상품 1개**만 있고, 고객이 견적 계산기로 가격을 낸 뒤
   "가로·세로를 입력하고 수량 = 결제수량"으로 주문한다(가격이 수량으로 반영된다). 가격을 움직이는 값은 재질·두께별 **mvalue(재료 기준값)** 이다.
   계산기는 gi.esmplus.com에 올라간 별도 HTML(원본: D:\★한국단열\01.상세페이지\07.기타단열재\창문단열재\계산기\)이라, 여기서 바꾼 값은
   [계산기용 값 복사]로 그 HTML의 radio 값 목록에 붙여 넣어야 반영된다.

   계산식(계산기 window_estimate_n_200514_10_2 / window_estimate_g_2와 같다):
     합계   = ceil(가로mm × 세로mm × mvalue × uprice × (수량 ÷ 10) ÷ 10) × 10
              · 가로×세로 < 100 이면 × 1.3, 가로나 세로가 100mm 미만이면 × 1.2 (작은 사이즈 할증)
     재단비 = 스마트스토어: 가로+세로+두께 < 100 이면 개당 87원(사실상 없음) / 지마켓·11번가: 가로+세로+두께 < 600 이면 개당 2,000원
     결제수량 = ⌊(합계 + 재단비 × 수량) ÷ 100⌋, 최소 1개(스마트스토어) / 30개(지마켓·11번가, 3,000원 미만이면 자동 변경)
   uprice는 두께로 정해진 고정값이고, 엑셀(창문단열재단가표.xlsx) 1번 탭의 "회베당 판매가" = mvalue × uprice × 100,000 (1㎡당 가격).
   mvalue 기본값: 스마트스토어 = 엑셀 1번 탭 D열, 지마켓·11번가 = 엑셀 V열(계산기 g_2와 같다, 스마트스토어의 약 1.08배).
   바꾼 값은 "단가표 저장"을 눌러야 DB(hk_settings.window_mvalues)에 저장된다 — 코드 기본값과 다른 것만 저장한다.
   쿠팡은 별도 로직(사이즈표)이라 이 화면에서 다루지 않는다. 네오폴(판매중지)·회색 스티로폼(모바일 계산기에만 있음)은 넣지 않았다.
═══════════════════════════════════════ */
const HK_WINDOW_THICKNESS = [40, 50, 60, 70, 80, 90, 100, 110];
const HK_WINDOW_UPRICE = { 40: 0.13, 50: 0.145, 60: 0.16, 70: 0.175, 80: 0.19, 90: 0.21, 100: 0.23, 110: 0.24 };

// mvalue 기본값 — 두께(HK_WINDOW_THICKNESS)와 같은 순서. ss = 스마트스토어, mk = 지마켓·11번가.
const HK_WINDOW_MATERIALS = [
  { id: 'eps', label: '백색 스티로폼', calcName: '백색스티로폼', calcLabel: '백색 스티로폼',
    mvalue: { ss: [1.95, 1.9, 1.9, 1.8, 1.8, 1.8, 1.75, 1.75], mk: [2.1, 2.05, 2.05, 1.95, 1.95, 1.95, 1.9, 1.9] } },
  { id: 'xps', label: '아이소핑크', calcName: '아이소핑크', calcLabel: '아이소핑크',
    mvalue: { ss: [2.95, 2.9, 2.9, 2.85, 2.85, 2.85, 2.8, 2.8], mk: [3.2, 3.15, 3.15, 3.1, 3.1, 3.1, 3.05, 3.05] } },
];

const HK_WINDOW_CHANNELS = [
  { id: 'ss', label: '스마트스토어', calcFile: 'window_estimate_n_200514_10_2.html', minQty: 1, cutFeeEach: 87, cutFeeBelow: 100, cutFeeNote: '가로+세로+두께 100mm 미만 개당 87원' },
  { id: 'mk', label: '지마켓·11번가', calcFile: 'window_estimate_g_2.html', minQty: 30, cutFeeEach: 2000, cutFeeBelow: 600, cutFeeNote: '가로+세로+두께 600mm 미만 개당 2,000원' },
];

// 기본값과 다르게 바꾼 mvalue만 { '채널|재질|두께': 값 }으로 들고 있는다.
const HK_WINDOW_OVERRIDES = {};

function _hkWindowMaterial(id) { return HK_WINDOW_MATERIALS.find(m => m.id === id) || null; }
function _hkWindowChannel(id) { return HK_WINDOW_CHANNELS.find(c => c.id === id) || null; }
function _hkWindowKey(channel, material, thickness) { return `${channel}|${material}|${thickness}`; }

function _hkWindowDefaultMvalue(channel, material, thickness) {
  const mat = _hkWindowMaterial(material);
  const index = HK_WINDOW_THICKNESS.indexOf(Number(thickness));
  if (!mat || !mat.mvalue[channel] || index < 0) return null;
  return mat.mvalue[channel][index];
}

window.hkWindowMvalue = function(channel, material, thickness) {
  const key = _hkWindowKey(channel, material, thickness);
  return key in HK_WINDOW_OVERRIDES ? HK_WINDOW_OVERRIDES[key] : _hkWindowDefaultMvalue(channel, material, thickness);
};

window.hkWindowMvalueOverrides = function() { return { ...HK_WINDOW_OVERRIDES }; };

window.hkWindowApplyMvalueOverrides = function(map) {
  Object.keys(HK_WINDOW_OVERRIDES).forEach(key => delete HK_WINDOW_OVERRIDES[key]);
  Object.entries(map || {}).forEach(([key, value]) => {
    const [channel, material, thickness] = String(key).split('|');
    const base = _hkWindowDefaultMvalue(channel, material, thickness);
    const number = Number(value);
    if (base == null || !Number.isFinite(number) || number <= 0) return;
    if (number !== base) HK_WINDOW_OVERRIDES[_hkWindowKey(channel, material, Number(thickness))] = number;
  });
};

// 1㎡당 가격 — 엑셀 1번 탭의 "회베당 판매가"(mvalue × uprice × 100,000).
window.hkWindowPerSqm = function(channel, material, thickness) {
  const m = window.hkWindowMvalue(channel, material, thickness);
  const u = HK_WINDOW_UPRICE[thickness];
  return m == null || u == null ? null : Math.round(m * u * 100000);
};

/* 견적 — 계산기와 같은 식. 입력이 잘못되면 null. */
window.hkWindowCalc = function({ channel, material, thickness, width, height, qty }) {
  const ch = _hkWindowChannel(channel);
  const mvalue = window.hkWindowMvalue(channel, material, thickness);
  const uprice = HK_WINDOW_UPRICE[thickness];
  const w = Number(width), h = Number(height), q = Number(qty), d = Number(thickness);
  if (!ch || mvalue == null || uprice == null) return null;
  if (![w, h, q].every(v => Number.isInteger(v) && v > 0)) return null;
  const base = Math.ceil(w * h * mvalue * 1 * uprice * (q / 10) * 1 / 10) * 10;
  let surchargeRate = 1;
  if (w * h < 100) surchargeRate = 1.3; else if (w < 100 || h < 100) surchargeRate = 1.2;
  const sum = base * surchargeRate;
  const cutFeeEach = w + h + d < ch.cutFeeBelow ? ch.cutFeeEach : 0;
  const amount = sum + q * cutFeeEach;
  const rawQty = Math.floor(amount / 100);
  const payQty = Math.max(rawQty, ch.minQty);
  return { mvalue, uprice, base, surchargeRate, sum, cutFeeEach, cutFee: q * cutFeeEach, amount, payQty, raisedToMin: rawQty < ch.minQty, minQty: ch.minQty };
};

/* 계산기 HTML의 radio 목록(재질별·두께별 mvalue|uprice|이름) — 계산기 파일에 그대로 붙여 넣는 용도. */
window.hkWindowRadioHtml = function(channel) {
  return HK_WINDOW_MATERIALS.flatMap(mat => HK_WINDOW_THICKNESS.map(t => {
    const m = window.hkWindowMvalue(channel, mat.id, t);
    return `        <li>\n          <label>\n            <input type="radio" name="sptype" value="${m}|${HK_WINDOW_UPRICE[t]}|${mat.calcName}_${t}" onClick="radioClick('${t}');">\n            ${mat.calcLabel}_${t}</label>\n        </li>`;
  })).join('\n');
};

/* ── 화면 ── */
const _hkWindowPreview = { channel: 'ss', material: 'eps', thickness: 50, width: 500, height: 900, qty: 1 };

function _hkWindowFormat(value, digits = 0) {
  return value == null ? '—' : Number(value).toLocaleString('ko-KR', { maximumFractionDigits: digits });
}

function _hkWindowRowCells(material, thickness) {
  const ssM = window.hkWindowMvalue('ss', material, thickness);
  const mkM = window.hkWindowMvalue('mk', material, thickness);
  return {
    ssSqm: _hkWindowFormat(window.hkWindowPerSqm('ss', material, thickness)),
    mkSqm: _hkWindowFormat(window.hkWindowPerSqm('mk', material, thickness)),
    ratio: ssM ? '×' + (mkM / ssM).toFixed(3) : '—',
  };
}

/* mvalue 칸 — 다른 카테고리의 판매가 칸과 같은 방식: 평소엔 읽기 전용, 연필 버튼(또는 칸 클릭)을 눌러야 수정, Enter/바깥 클릭으로 확정,
   Esc로 취소, 바꾸면 "변경 전 값 ↺"로 되돌릴 수 있다. 변경 전 값 = 화면을 그린 시점(DB에서 불러온/마지막 저장) 값. */
function _hkWindowMvalueCell(channel, material, thickness) {
  const value = window.hkWindowMvalue(channel, material, thickness);
  const label = `${_hkWindowMaterial(material).label} ${thickness}T ${_hkWindowChannel(channel).label} mvalue`;
  return `<td class="hk-iso-draft-price hk-sub-price-cell">
      <div class="hk-iso-price-edit-wrap">
        <input type="text" inputmode="decimal" class="pricing-input-field hk-iso-final-price-input hk-win-m-input" value="${value}" data-original-value="${value}"
          data-channel="${channel}" data-material="${material}" data-thickness="${thickness}"
          onclick="beginHkWindowMvalueEdit(this)" oninput="hkWindowSetMvalue(this)" onblur="finishHkWindowMvalueEdit(this)" onkeydown="handleHkWindowMvalueKey(event,this)" readonly title="코드 기본값 ${_hkWindowDefaultMvalue(channel, material, thickness)}" aria-label="${label}">
        <button type="button" class="hk-iso-row-price-edit-btn" onclick="beginHkWindowMvalueEdit(this)" title="이 mvalue만 수정"><i class="fa-solid fa-pen"></i></button>
      </div>
      <div class="hk-iso-price-history" hidden>변경 전 <span>${value}</span><button type="button" onclick="revertHkWindowMvalue(this)" title="변경 전 값으로 되돌리기"><i class="fa-solid fa-rotate-left"></i></button></div>
    </td>`;
}

function _hkWindowTableHtml(mat) {
  const rows = HK_WINDOW_THICKNESS.map(t => {
    const cells = _hkWindowRowCells(mat.id, t);
    return `<tr data-material="${mat.id}" data-thickness="${t}">
      <td class="hk-sub-name">${mat.label} ${t}T</td>
      <td>${HK_WINDOW_UPRICE[t]}</td>
      ${_hkWindowMvalueCell('ss', mat.id, t)}
      <td class="hk-win-sqm-ss">${cells.ssSqm}</td>
      ${_hkWindowMvalueCell('mk', mat.id, t)}
      <td class="hk-win-sqm-mk">${cells.mkSqm}</td>
      <td class="hk-win-ratio">${cells.ratio}</td>
    </tr>`;
  }).join('');
  return `<div class="pricing-table-scroll"><table class="pricing-table hk-sub-table hk-win-table">
      <colgroup><col style="width:190px"><col style="width:100px"><col style="width:140px"><col style="width:140px"><col style="width:140px"><col style="width:140px"><col style="width:100px"></colgroup>
      <thead><tr>
        <th class="hk-sub-head-base">품명</th><th class="hk-sub-head-base">uprice<br><small>두께 고정값</small></th>
        <th class="hk-sub-head-sale-price">mvalue<br><small>스마트스토어</small></th><th class="hk-sub-head-base">1㎡당 가격<br><small>스마트스토어</small></th>
        <th class="hk-sub-head-sale-price">mvalue<br><small>지마켓·11번가</small></th><th class="hk-sub-head-base">1㎡당 가격<br><small>지마켓·11번가</small></th>
        <th class="hk-sub-head-base">지마켓÷<br>스마트스토어</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function _hkWindowAccordionHtml(mat, index) {
  const id = `win_g${index}`;
  return `<div class="hk-iso-accordion open" id="hkIsoAcc-${id}">
    <div class="hk-iso-accordion-head">
      <span class="hk-iso-accordion-title">${mat.label}</span>
      <span class="hk-iso-accordion-count">두께 ${HK_WINDOW_THICKNESS.length}개</span>
      <button type="button" class="hk-iso-accordion-toggle" onclick="toggleHkIsoAccordion('${id}')" title="펼치기 / 접기" aria-label="${mat.label} 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
    </div>
    <div class="hk-iso-accordion-body">${_hkWindowTableHtml(mat)}</div>
  </div>`;
}

/* 구간 가격표 — 스마트스토어 구간 상품(St_/Iso_) 옵션 가격. 재질·두께마다 세로 구간(행) × 가로 구간(열) 표 하나(70칸).
   칸: 굵은 글씨 = 옵션 가격, 작은 글씨 = 옵션가(상품 기준가 = 500×500×40T 대비). 수정 전 판매가(=지금 스토어 가격)와 달라진 칸은 주황색. */
function _hkWindowRangeAxisLabels() {
  return {
    widths: HK_WINDOW_RANGE_WIDTHS.map(w => _hkWindowRangeLabel(w, HK_WINDOW_RANGE_WIDTHS)),
    heights: HK_WINDOW_RANGE_HEIGHTS.map(h => _hkWindowRangeLabel(h, HK_WINDOW_RANGE_HEIGHTS)),
  };
}

function _hkWindowRangeStats(matId, thickness) {
  const product = HK_WINDOW_RANGE_PRODUCTS.find(item => item.material === matId);
  const base = _hkWindowRangePrice(matId, HK_WINDOW_RANGE_WIDTHS[0], HK_WINDOW_RANGE_HEIGHTS[0], HK_WINDOW_RANGE_THICKNESS[0]);
  let min = null, max = null, changed = 0;
  const rows = HK_WINDOW_RANGE_HEIGHTS.map(height => HK_WINDOW_RANGE_WIDTHS.map(width => {
    const code = `${product.prefix}_${width}_${height}_${thickness}`;
    const price = _hkWindowRangePrice(matId, width, height, thickness);
    const prev = HK_WINDOW_RANGE_ITEM_INDEX.get(code)?.prevPrice;
    const isChanged = prev != null && price !== prev;
    if (isChanged) changed++;
    min = min == null ? price : Math.min(min, price);
    max = max == null ? price : Math.max(max, price);
    return { code, price, prev, isChanged, unit: _hkWindowRangeUnitPrice(matId, width, height, thickness), isBase: code === `${product.prefix}_500_500_40`, optionAdd: price - base };
  }));
  return { rows, min, max, changed };
}

function _hkWindowRangeTableHtml(matId, thickness) {
  const { widths, heights } = _hkWindowRangeAxisLabels();
  const { rows, min, max, changed } = _hkWindowRangeStats(matId, thickness);
  const body = rows.map((cells, r) => `<tr><td class="hk-sub-name">세로 ${heights[r]}</td>${cells.map(cell => `<td class="hk-win-range-cell${cell.isChanged ? ' is-changed' : ''}${cell.isBase ? ' is-base' : ''}" title="${cell.code} · 단가 ${_hkWindowFormat(cell.unit)} + 배송비 ${_hkWindowFormat(HK_WINDOW_RANGE_SHIPPING)}${cell.isChanged ? ` · 수정 전 ${_hkWindowFormat(cell.prev)}` : ''}"><b>${_hkWindowFormat(cell.price)}</b><small>${cell.isBase ? '기준' : '+' + _hkWindowFormat(cell.optionAdd)}</small></td>`).join('')}</tr>`).join('');
  return {
    html: `<div class="pricing-table-scroll"><table class="pricing-table hk-sub-table hk-win-table hk-win-range-table">
      <colgroup><col style="width:150px">${widths.map(() => '<col>').join('')}</colgroup>
      <thead><tr><th class="hk-sub-head-base">세로 ↓ / 가로 →</th>${widths.map(label => `<th class="hk-sub-head-sale-price">가로<br><small>${label}</small></th>`).join('')}</tr></thead>
      <tbody>${body}</tbody>
    </table></div>`,
    count: `${heights.length * widths.length}개 · ${_hkWindowFormat(min)} ~ ${_hkWindowFormat(max)}원${changed ? ` · 변경 ${changed}개` : ''}`,
  };
}

function _hkWindowRangeAccordionId(matId, thickness) { return `win_r_${matId}_${thickness}`; }

function _hkWindowRangeAccordionHtml(mat, thickness, open) {
  const id = _hkWindowRangeAccordionId(mat.id, thickness);
  const table = _hkWindowRangeTableHtml(mat.id, thickness);
  return `<div class="hk-iso-accordion${open ? ' open' : ''}" id="hkIsoAcc-${id}">
    <div class="hk-iso-accordion-head">
      <span class="hk-iso-accordion-title">${mat.label} ${thickness}T</span>
      <span class="hk-iso-accordion-count">${table.count}</span>
      <button type="button" class="hk-iso-accordion-toggle" onclick="toggleHkIsoAccordion('${id}')" title="펼치기 / 접기" aria-label="${mat.label} ${thickness}T 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
    </div>
    <div class="hk-iso-accordion-body">${table.html}</div>
  </div>`;
}

function _hkWindowRangeCardHtml() {
  const materials = HK_WINDOW_MATERIALS.filter(mat => HK_WINDOW_RANGE_PRODUCTS.some(product => product.material === mat.id));
  const total = HK_WINDOW_RANGE_WIDTHS.length * HK_WINDOW_RANGE_HEIGHTS.length * HK_WINDOW_RANGE_THICKNESS.length * materials.length;
  return `<div id="hkIsoAcc-win_range" class="card pricing-result-card hk-sub-card">
    <div class="pricing-result-header">
      <div class="pricing-result-title">한국단열 창문형단열재 구간 가격표<span class="pricing-spec-badge">${total}개</span></div>
      <span class="pricing-result-hint">스마트스토어 옵션 상품(스티로폼 ${HK_WINDOW_RANGE_PRODUCTS[0].productId} · 아이소핑크 ${HK_WINDOW_RANGE_PRODUCTS[1].productId}) — 가격 = 단가 + 배송비 8,000원(10원 올림) · 작은 글씨 = 옵션가(500×500 40T 기준 대비) · <b>주황색</b> = 수정 전 판매가와 다름 · 위 스마트스토어 mvalue를 바꾸면 바로 반영됩니다</span>
    </div>
    <div class="hk-iso-accordion-list">
      ${materials.map((mat, m) => HK_WINDOW_RANGE_THICKNESS.map((t, i) => _hkWindowRangeAccordionHtml(mat, t, m === 0 && i === 0)).join('')).join('')}
    </div>
  </div>`;
}

// mvalue를 바꾸면 그 재질·두께의 가격표만 다시 그린다. 40T는 상품 기준가(옵션가 계산의 기준)라 같은 재질의 모든 두께를 다시 그린다.
function _hkWindowRefreshRangeTables(material, thickness) {
  if (!HK_WINDOW_RANGE_PRODUCTS.some(product => product.material === material)) return;
  const targets = thickness === HK_WINDOW_RANGE_THICKNESS[0] ? HK_WINDOW_RANGE_THICKNESS : HK_WINDOW_RANGE_THICKNESS.includes(thickness) ? [thickness] : [];
  targets.forEach(t => {
    const accordion = document.getElementById('hkIsoAcc-' + _hkWindowRangeAccordionId(material, t));
    if (!accordion) return;
    const table = _hkWindowRangeTableHtml(material, t);
    accordion.querySelector('.hk-iso-accordion-body').innerHTML = table.html;
    accordion.querySelector('.hk-iso-accordion-count').textContent = table.count;
  });
}

function _hkWindowPreviewResultHtml() {
  const p = _hkWindowPreview;
  const r = window.hkWindowCalc(p);
  if (!r) return '<div class="hk-win-result-empty">가로·세로·수량은 1 이상의 정수로 입력하세요.</div>';
  const ch = _hkWindowChannel(p.channel);
  const rows = [
    ['적용 mvalue × uprice', `${r.mvalue} × ${r.uprice}`],
    ['합계 (수량 포함)', `${_hkWindowFormat(r.base)}원${r.surchargeRate > 1 ? ` × ${r.surchargeRate} (작은 사이즈 할증) = ${_hkWindowFormat(r.sum)}원` : ''}`],
    ['재단비', r.cutFee ? `${_hkWindowFormat(r.cutFeeEach)}원 × ${p.qty}개 = ${_hkWindowFormat(r.cutFee)}원` : '없음'],
    ['결제금액', `${_hkWindowFormat(r.amount)}원`],
  ].map(([k, v]) => `<div class="hk-win-result-row"><span>${k}</span><b>${v}</b></div>`).join('');
  return `${rows}
    <div class="hk-win-result-pay">스토어에 입력할 결제수량 <b>${_hkWindowFormat(r.payQty)}개</b>${r.raisedToMin ? ` <small>(3,000원 미만이라 최소 ${r.minQty}개로 자동 변경)</small>` : ''}</div>
    <div class="hk-win-result-note">${ch.label} 계산기(${ch.calcFile})와 같은 식입니다 — 재단비 규칙: ${ch.cutFeeNote}.</div>`;
}

function _hkWindowPreviewHtml() {
  const p = _hkWindowPreview;
  const options = (items, current) => items.map(([value, label]) => `<option value="${value}"${String(value) === String(current) ? ' selected' : ''}>${label}</option>`).join('');
  return `<div class="card pricing-result-card hk-sub-card hk-win-preview">
    <div class="pricing-result-header">
      <div class="pricing-result-title">견적 미리보기</div>
      <span class="pricing-result-hint">사이즈를 넣으면 계산기와 같은 식으로 합계와 결제수량이 나옵니다 (저장되지 않는 확인용)</span>
    </div>
    <div class="hk-win-form">
      <label>채널<select class="pricing-input-field" data-field="channel" onchange="hkWindowPreviewChange(this)">${options(HK_WINDOW_CHANNELS.map(c => [c.id, c.label]), p.channel)}</select></label>
      <label>재질<select class="pricing-input-field" data-field="material" onchange="hkWindowPreviewChange(this)">${options(HK_WINDOW_MATERIALS.map(m => [m.id, m.label]), p.material)}</select></label>
      <label>두께<select class="pricing-input-field" data-field="thickness" onchange="hkWindowPreviewChange(this)">${options(HK_WINDOW_THICKNESS.map(t => [t, t + 'T']), p.thickness)}</select></label>
      <label>가로 (mm)<input type="number" class="pricing-input-field" data-field="width" min="1" step="1" value="${p.width}" oninput="hkWindowPreviewChange(this)"></label>
      <label>세로 (mm)<input type="number" class="pricing-input-field" data-field="height" min="1" step="1" value="${p.height}" oninput="hkWindowPreviewChange(this)"></label>
      <label>수량 (개)<input type="number" class="pricing-input-field" data-field="qty" min="1" step="1" value="${p.qty}" oninput="hkWindowPreviewChange(this)"></label>
    </div>
    <div class="hk-win-result" id="hkWindowPreviewResult">${_hkWindowPreviewResultHtml()}</div>
  </div>`;
}

function renderHkWindowPane() {
  const copyButtons = HK_WINDOW_CHANNELS.map(c => `<button type="button" class="pim-btn-cancel hk-supp-copy-btn hk-win-copy" onclick="hkWindowCopyRadio('${c.id}', this)" title="${c.calcFile}의 radio 목록에 붙여 넣는 값">
      <i class="fa-regular fa-copy"></i> ${c.label} 계산기용 값 복사</button>`).join('');
  return `<div id="hkWindowSection">
    <div id="hkIsoAcc-win_all" class="card pricing-result-card hk-sub-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">한국단열 창문형단열재 기준값<span class="pricing-spec-badge">${HK_WINDOW_MATERIALS.length * HK_WINDOW_THICKNESS.length}개</span></div>
        <span class="pricing-result-hint">주문제작 · 스토어에는 100원 상품 1개, 가격은 mvalue(가로 × 세로 × mvalue × uprice)로 조정하고 결제수량으로 반영 — <b>바꾼 값은 [계산기용 값 복사]로 계산기 HTML에 붙여 넣어야 반영됩니다</b> · 쿠팡은 별도 로직이라 제외</span>
      </div>
      <div class="hk-win-actions">${copyButtons}</div>
      <div class="hk-iso-accordion-list">
        ${HK_WINDOW_MATERIALS.map(_hkWindowAccordionHtml).join('')}
      </div>
    </div>
    ${_hkWindowRangeCardHtml()}
    ${_hkWindowPreviewHtml()}
  </div>`;
}

/* ── 동작 ── */
window.hkWindowSetMvalue = function(input) {
  const { channel, material } = input.dataset;
  const thickness = Number(input.dataset.thickness);
  const number = Number(input.value.replace(/,/g, ''));
  const base = _hkWindowDefaultMvalue(channel, material, thickness);
  if (input.value.trim() === '' || !Number.isFinite(number) || number <= 0 || base == null) return; // 잘못된 입력은 무시(이전 값 유지)
  const key = _hkWindowKey(channel, material, thickness);
  const before = key in HK_WINDOW_OVERRIDES ? HK_WINDOW_OVERRIDES[key] : base;
  if (number === base) delete HK_WINDOW_OVERRIDES[key]; else HK_WINDOW_OVERRIDES[key] = number;
  const cell = input.closest('.hk-iso-draft-price');
  const changed = number !== Number(input.dataset.originalValue);
  cell?.classList.toggle('changed', changed);
  const history = cell?.querySelector('.hk-iso-price-history');
  if (history) history.hidden = !changed;
  const row = input.closest('tr');
  if (row) {
    const cells = _hkWindowRowCells(material, thickness);
    row.querySelector('.hk-win-sqm-ss').textContent = cells.ssSqm;
    row.querySelector('.hk-win-sqm-mk').textContent = cells.mkSqm;
    row.querySelector('.hk-win-ratio').textContent = cells.ratio;
  }
  if (channel === 'ss') _hkWindowRefreshRangeTables(material, thickness); // 구간 가격표는 스마트스토어 mvalue로 계산된다
  const result = document.getElementById('hkWindowPreviewResult');
  if (result) result.innerHTML = _hkWindowPreviewResultHtml();
  if (number !== before && typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

window.beginHkWindowMvalueEdit = function(source) {
  const cell = source.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-win-m-input');
  if (!input) return;
  input.dataset.editStartValue = input.value;
  input.readOnly = false;
  cell.classList.add('editing');
  input.focus();
  input.select();
};

// 칸을 벗어나면 잠그고, 비었거나 잘못된 값이면 현재 적용값으로 되돌려 보여준다.
window.finishHkWindowMvalueEdit = function(input) {
  const current = window.hkWindowMvalue(input.dataset.channel, input.dataset.material, Number(input.dataset.thickness));
  if (current != null) input.value = current;
  input.readOnly = true;
  input.closest('.hk-iso-draft-price')?.classList.remove('editing');
};

window.revertHkWindowMvalue = function(button) {
  const cell = button.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-win-m-input');
  if (!input) return;
  input.value = input.dataset.originalValue;
  window.hkWindowSetMvalue(input);
  input.readOnly = true;
  cell.classList.remove('editing');
};

window.handleHkWindowMvalueKey = function(event, input) {
  if (event.key === 'Enter') input.blur();
  if (event.key === 'Escape') {
    input.value = input.dataset.editStartValue ?? input.dataset.originalValue;
    window.hkWindowSetMvalue(input);
    input.blur();
  }
};

window.hkWindowPreviewChange = function(control) {
  const field = control.dataset.field;
  if (!(field in _hkWindowPreview)) return;
  _hkWindowPreview[field] = ['channel', 'material'].includes(field) ? control.value : (control.value === '' ? '' : Number(control.value));
  const result = document.getElementById('hkWindowPreviewResult');
  if (result) result.innerHTML = _hkWindowPreviewResultHtml();
};

window.hkWindowCopyRadio = async function(channel, button) {
  const text = window.hkWindowRadioHtml(channel);
  let copied = false;
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); copied = true; }
  } catch { /* 아래 대체 방법으로 */ }
  if (!copied) {
    const area = document.createElement('textarea');
    area.value = text; area.setAttribute('readonly', ''); area.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(area); area.select();
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    area.remove();
  }
  if (!button) return copied;
  const original = button.dataset.label || button.innerHTML;
  button.dataset.label = original;
  button.innerHTML = copied ? '<i class="fa-solid fa-check"></i> 복사됨 (16개)' : '<i class="fa-solid fa-triangle-exclamation"></i> 복사 실패';
  clearTimeout(button._resetTimer);
  button._resetTimer = setTimeout(() => { button.innerHTML = original; }, 1800);
  return copied;
};

/* ═══════════════════════════════════════
   구간 상품 — 스마트스토어 옵션 상품 2개 (2026-09-29, 사용자 확인)

   100원 상품과 별개로, 사이즈를 구간으로 고르는 일반 옵션 상품이 있다: 가로 구간 5(500 미만·501~600 … 801~900) × 세로 구간 14(500 미만 … 1701~1800) × 두께 7(40~100T) = 옵션 490개.
   스티로폼 5012855593(관리코드 St_가로_세로_두께) · 아이소핑크 11984357778(Iso_가로_세로_두께). 구간은 상한값으로 계산한다(예: 가로 501~600 = 600mm).
   옵션가는 상품 기준가(가장 싼 옵션 St_500_500_40 / Iso_500_500_40 = 첫 옵션)와의 차이 — 사용자가 준 옵션 목록의 옵션가가 엑셀(스티로폼_구간·아이소핑크_구간)과 일치.
   가격 = 단가 + 배송비 8,000(무료배송이라 가격에 포함)을 10원 단위 올림. 단가 = ROUND(mvalue × uprice × 가로 × 세로 ÷ 10) (엑셀의 ROUND는 x.5를 올린다).
   mvalue는 스마트스토어 값(위 표) — 그래서 표의 mvalue를 바꾸면 이 옵션 980개의 가격이 같이 바뀐다.
   한국단열 채널(hkd)에 상품으로 등록한다(수정 전 판매가 = 지금 스토어 가격 = 엑셀 값). 배송비·제주·반품/교환은 아직 못 받았다 — 배송비는 가격에 포함이라 0으로 뒀고 나머지는 비웠다(확인 필요).
═══════════════════════════════════════ */
const HK_WINDOW_RANGE_WIDTHS = [500, 600, 700, 800, 900];
const HK_WINDOW_RANGE_HEIGHTS = [500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800];
const HK_WINDOW_RANGE_THICKNESS = [40, 50, 60, 70, 80, 90, 100]; // 구간 상품은 100T까지(110T 없음)
const HK_WINDOW_RANGE_SHIPPING = 8000;
const HK_WINDOW_RANGE_PRODUCTS = [
  { productId: '5012855593', material: 'eps', prefix: 'St' },
  { productId: '11984357778', material: 'xps', prefix: 'Iso' },
];

// 구간 옵션 한 개의 가격 — 정수 연산만 쓴다(mvalue×uprice×면적이 x.5로 떨어지는 경우가 많아 부동소수점 오차가 나면 1원이 틀린다).
function _hkWindowRangeUnitPrice(material, width, height, thickness) {
  const mvalue = window.hkWindowMvalue('ss', material, thickness);
  const uprice = HK_WINDOW_UPRICE[thickness];
  if (mvalue == null || uprice == null) return null;
  const scaled = Math.round(mvalue * 10000) * Math.round(uprice * 1000) * width * height; // = mvalue×uprice×가로×세로 × 10^7
  return Math.floor((scaled + 50000000) / 100000000);                                    // ÷10^8(= ÷10^7 ÷ 10) 후 반올림
}

function _hkWindowRangePrice(material, width, height, thickness) {
  const unit = _hkWindowRangeUnitPrice(material, width, height, thickness);
  return unit == null ? null : Math.ceil((unit + HK_WINDOW_RANGE_SHIPPING) / 10) * 10;
}

window.hkWindowPriceByCode = function(code) {
  const match = /^(St|Iso)_(\d+)_(\d+)_(\d+)$/.exec(String(code || ''));
  if (!match) return null;
  const product = HK_WINDOW_RANGE_PRODUCTS.find(item => item.prefix === match[1]);
  const [width, height, thickness] = [Number(match[2]), Number(match[3]), Number(match[4])];
  if (!product || !HK_WINDOW_RANGE_WIDTHS.includes(width) || !HK_WINDOW_RANGE_HEIGHTS.includes(height) || !HK_WINDOW_RANGE_THICKNESS.includes(thickness)) return null;
  return _hkWindowRangePrice(product.material, width, height, thickness);
};

function _hkWindowRangeLabel(value, list) {
  const index = list.indexOf(value);
  return index <= 0 ? `${value} 미만` : `${list[index - 1] + 1}~${value}`;
}

const HK_WINDOW_RANGE_ITEM_INDEX = new Map(); // 관리코드 → 한국단열 채널 옵션(수정 전 판매가를 가격표에서 비교하는 데 쓴다)

(function addWindowHkdChannelProducts() {
  if (typeof HK_CHANNEL_LISTINGS === 'undefined' || !HK_CHANNEL_LISTINGS.hkd) return;
  HK_WINDOW_RANGE_PRODUCTS.forEach(({ productId, material, prefix }) => {
    const materialLabel = _hkWindowMaterial(material).label;
    const items = [];
    HK_WINDOW_RANGE_WIDTHS.forEach(width => HK_WINDOW_RANGE_HEIGHTS.forEach(height => HK_WINDOW_RANGE_THICKNESS.forEach(thickness => {
      const productCode = `${prefix}_${width}_${height}_${thickness}`;
      items.push({
        productCode,
        section: `가로 ${_hkWindowRangeLabel(width, HK_WINDOW_RANGE_WIDTHS)}`, // 몰별 표에서 이 단위로 접는다(pricing-hankook.js hkToggleChannelSection)
        productName: `${materialLabel}_${thickness}(mm) · 가로 ${_hkWindowRangeLabel(width, HK_WINDOW_RANGE_WIDTHS)} × 세로 ${_hkWindowRangeLabel(height, HK_WINDOW_RANGE_HEIGHTS)}`,
        prevPrice: window.hkWindowPriceByCode(productCode), // 수정 전 판매가 = 지금 스토어 가격(사용자 옵션 목록 = 엑셀 값)
        prevShipping: 0,
        stock: 99999,
      });
      HK_WINDOW_RANGE_ITEM_INDEX.set(productCode, items[items.length - 1]);
    })));
    HK_CHANNEL_LISTINGS.hkd.push({
      categoryId: 'hk_window',
      productId,
      sectionLabel: materialLabel,
      baseShipping: 0, // 배송비 8,000원이 판매가에 포함(무료배송) — 사용자 확인 전
      shippingBasis: '-',
      jejuShipping: null,
      returnExchange: '',
      items,
    });
  });
})();