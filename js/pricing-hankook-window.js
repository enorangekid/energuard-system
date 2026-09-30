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

// Number#toLocaleString()은 호출마다 포맷터를 새로 만들어서 느리다(구간 가격표는 칸이 수천 개) — 같은 결과를 내는 포맷터 하나를 재사용한다.
const _hkWindowNumberFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
function _hkWindowFormat(value, digits = 0) {
  if (value == null) return '—';
  return digits ? Number(value).toLocaleString('ko-KR', { maximumFractionDigits: digits }) : _hkWindowNumberFormat.format(Number(value));
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

/* 칸의 굵은 글씨 = 반영가(한국단열 단가로 쓰는 값), 작은 글씨 = 옵션가(반영가 기준 500×500 40T 대비).
   계산가(지금 mvalue로 계산한 값)가 반영가와 다르면 점선 주황 칸 + "계산 …"이 붙고 [반영]을 눌러야 한국단열 단가에 들어간다.
   반영했지만 아직 저장 안 해서 수정 전 판매가(= 마지막 저장값)와 다른 칸은 주황색 배경. */
function _hkWindowRangeStats(matId, thickness) {
  const product = HK_WINDOW_RANGE_PRODUCTS.find(item => item.material === matId);
  const base = window.hkWindowPriceByCode(`${product.prefix}_${HK_WINDOW_RANGE_WIDTHS[0]}_${HK_WINDOW_RANGE_HEIGHTS[0]}_${HK_WINDOW_RANGE_THICKNESS[0]}`);
  let min = null, max = null, changed = 0, pending = 0;
  const rows = HK_WINDOW_RANGE_HEIGHTS.map(height => HK_WINDOW_RANGE_WIDTHS.map(width => {
    const code = `${product.prefix}_${width}_${height}_${thickness}`;
    const price = window.hkWindowPriceByCode(code);
    const calc = _hkWindowRangePrice(matId, width, height, thickness);
    const prev = HK_WINDOW_RANGE_ITEM_INDEX.get(code)?.prevPrice;
    const isChanged = prev != null && price !== prev;
    const isPending = calc !== price;
    if (isChanged) changed++;
    if (isPending) pending++;
    min = min == null ? price : Math.min(min, price);
    max = max == null ? price : Math.max(max, price);
    return { code, price, calc, prev, isChanged, isPending, unit: _hkWindowRangeUnitPrice(matId, width, height, thickness), isBase: code === `${product.prefix}_500_500_40`, optionAdd: price - base };
  }));
  return { rows, min, max, changed, pending };
}

// 재질·두께별 요약(개수·가격 범위·반영 대기·변경 수)을 계산한다 — 접힌 아코디언은 표 HTML 없이 요약만 만든다.
function _hkWindowRangeSummary(stats, cellCount) {
  return `${cellCount}개 · ${_hkWindowFormat(stats.min)} ~ ${_hkWindowFormat(stats.max)}원${stats.pending ? ` · 반영 대기 ${stats.pending}개` : ''}${stats.changed ? ` · 변경 ${stats.changed}개` : ''}`;
}

// withHtml=false면 제목의 요약만 계산하고 표 HTML은 만들지 않는다 — 접힌 아코디언은 펼칠 때 만든다.
function _hkWindowRangeTableHtml(matId, thickness, withHtml = true) {
  const { widths, heights } = _hkWindowRangeAxisLabels();
  const stats = _hkWindowRangeStats(matId, thickness);
  const { rows, pending } = stats;
  const count = _hkWindowRangeSummary(stats, heights.length * widths.length);
  if (!withHtml) return { html: '', count, pending };
  const body = rows.map((cells, r) => `<tr><td class="hk-sub-name">세로 ${heights[r]}</td>${cells.map(cell => `<td class="hk-win-range-cell${cell.isChanged ? ' is-changed' : ''}${cell.isPending ? ' is-pending' : ''}${cell.isBase ? ' is-base' : ''}" title="${cell.code} · 계산 단가 ${_hkWindowFormat(cell.unit)} + 배송비 ${_hkWindowFormat(HK_WINDOW_RANGE_SHIPPING)}${cell.isPending ? ` · 계산가 ${_hkWindowFormat(cell.calc)} (반영 대기)` : ''}${cell.isChanged ? ` · 수정 전 ${_hkWindowFormat(cell.prev)}` : ''}"><b>${_hkWindowFormat(cell.price)}</b><small>${cell.isBase ? '기준' : '+' + _hkWindowFormat(cell.optionAdd)}</small><span class="hk-win-range-code">${cell.code}</span>${cell.isPending ? `<em>계산 ${_hkWindowFormat(cell.calc)}</em>` : ''}</td>`).join('')}</tr>`).join('');
  return {
    html: `<div class="pricing-table-scroll"><table class="pricing-table hk-sub-table hk-win-table hk-win-range-table">
      <colgroup><col style="width:150px">${widths.map(() => '<col>').join('')}</colgroup>
      <thead><tr><th class="hk-sub-head-base">세로 ↓ / 가로 →</th>${widths.map(label => `<th class="hk-sub-head-sale-price">가로<br><small>${label}</small></th>`).join('')}</tr></thead>
      <tbody>${body}</tbody>
    </table></div>`,
    count,
    pending,
  };
}

function _hkWindowRangeAccordionId(matId, thickness) { return `win_r_${matId}_${thickness}`; }

function _hkWindowReflectButtonHtml(matId, thickness, pending) {
  return `<button type="button" class="hk-win-reflect-btn" onclick="hkWindowReflectClick('${matId}', ${thickness})" title="이 두께의 계산가를 한국단열 단가에 반영합니다"${pending ? '' : ' hidden'}><i class="fa-solid fa-arrow-right-to-bracket"></i> 반영 <span>${pending}</span>개</button>`;
}

function _hkWindowRangeAccordionHtml(mat, thickness, open) {
  const id = _hkWindowRangeAccordionId(mat.id, thickness);
  const table = _hkWindowRangeTableHtml(mat.id, thickness, open);
  return `<div class="hk-iso-accordion${open ? ' open' : ''}" id="hkIsoAcc-${id}">
    <div class="hk-iso-accordion-head">
      <span class="hk-iso-accordion-title">${mat.label} ${thickness}T</span>
      <span class="hk-iso-accordion-count">${table.count}</span>
      ${_hkWindowReflectButtonHtml(mat.id, thickness, table.pending)}
      <button type="button" class="hk-iso-accordion-toggle" onclick="hkWindowToggleRange('${mat.id}', ${thickness})" title="펼치기 / 접기" aria-label="${mat.label} ${thickness}T 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
    </div>
    <div class="hk-iso-accordion-body"${open ? '' : ' data-lazy="1"'}>${table.html}</div>
  </div>`;
}

// 접혀 있던 가격표는 처음 펼칠 때 표를 만든다(14개를 전부 미리 그리면 탭 렌더가 90ms 걸렸다).
// 펼쳐 둔 것은 기억해서, 화면을 다시 그릴 때(DB 불러오기 등) 그 아코디언은 처음부터 표까지 그린다.
const _hkWindowOpenRanges = new Set(['eps_40']);
// 구간 가격표의 상품코드 표시 스위치 — 기본 켬(사용자 요청 2026-09-30: "코드가 보이게"). 끄면 코드는 칸에 마우스를 올려야 보인다.
let _hkWindowShowCodes = true;
window.hkWindowToggleRangeCodes = function(input) {
  _hkWindowShowCodes = !!input.checked;
  document.getElementById('hkIsoAcc-win_range')?.classList.toggle('hk-win-show-codes', _hkWindowShowCodes);
};
window.hkWindowToggleRange = function(material, thickness) {
  const id = _hkWindowRangeAccordionId(material, thickness);
  const body = document.querySelector(`#hkIsoAcc-${id} .hk-iso-accordion-body`);
  if (body && body.dataset.lazy) {
    body.innerHTML = _hkWindowRangeTableHtml(material, thickness).html;
    delete body.dataset.lazy;
  }
  window.toggleHkIsoAccordion(id);
  const open = document.getElementById('hkIsoAcc-' + id)?.classList.contains('open');
  if (open) _hkWindowOpenRanges.add(`${material}_${thickness}`); else _hkWindowOpenRanges.delete(`${material}_${thickness}`);
};

function _hkWindowRangeCardHtml() {
  const materials = HK_WINDOW_MATERIALS.filter(mat => HK_WINDOW_RANGE_PRODUCTS.some(product => product.material === mat.id));
  const total = HK_WINDOW_RANGE_WIDTHS.length * HK_WINDOW_RANGE_HEIGHTS.length * HK_WINDOW_RANGE_THICKNESS.length * materials.length;
  return `<div id="hkIsoAcc-win_range" class="card pricing-result-card hk-sub-card${_hkWindowShowCodes ? ' hk-win-show-codes' : ''}">
    <div class="pricing-result-header">
      <div class="pricing-result-title">한국단열 창문형단열재 구간 가격표<span class="pricing-spec-badge">${total}개</span></div>
      <span class="pricing-result-hint">스마트스토어 옵션 상품(스티로폼 ${HK_WINDOW_RANGE_PRODUCTS[0].productId} · 아이소핑크 ${HK_WINDOW_RANGE_PRODUCTS[1].productId}) — 가격 = 단가 + 배송비 8,000원(10원 올림) · 굵은 글씨 = 한국단열 단가(반영가), 작은 글씨 = 옵션가 · <b>점선 칸의 "계산 …"</b> = 기준값(mvalue)으로 계산했지만 <b>아직 한국단열 단가에 반영 안 됨</b>([반영]을 눌러야 들어감) · 주황 배경 = 반영했지만 저장 전(수정 전 판매가와 다름)</span>
      <label class="hk-win-code-toggle" title="칸마다 스토어 옵션의 관리코드(St_/Iso_ + 가로_세로_두께)를 보여줍니다 — 한국단열 몰별 표는 이 코드로 가격을 찾습니다"><input type="checkbox"${_hkWindowShowCodes ? ' checked' : ''} onchange="hkWindowToggleRangeCodes(this)"> 상품코드 표시</label>
      <button type="button" class="pricing-margin-edit-btn hk-win-reflect-all" onclick="hkWindowReflectAllClick()" title="모든 재질·두께의 계산가를 한국단열 단가에 반영합니다"${_hkWindowRangeTotalPending() ? '' : ' hidden'}><i class="fa-solid fa-arrow-right-to-bracket"></i> 전체 반영 <span>${_hkWindowRangeTotalPending()}</span>개</button>
    </div>
    <div class="hk-iso-accordion-list">
      ${materials.map(mat => HK_WINDOW_RANGE_THICKNESS.map(t => _hkWindowRangeAccordionHtml(mat, t, _hkWindowOpenRanges.has(`${mat.id}_${t}`))).join('')).join('')}
    </div>
  </div>`;
}

// 전체 반영 대기 수 — 모든 재질·두께의 (계산가 ≠ 반영가) 칸 수.
function _hkWindowRangeTotalPending() {
  let total = 0;
  HK_WINDOW_RANGE_PRODUCTS.forEach(product => HK_WINDOW_RANGE_THICKNESS.forEach(t => { total += _hkWindowRangeStats(product.material, t).pending; }));
  return total;
}

// 카드 머리의 [전체 반영] 버튼 — 반영 대기가 있을 때만 보인다.
function _hkWindowRefreshRangeHeader() {
  if (typeof document === 'undefined') return;
  const button = document.querySelector('#hkIsoAcc-win_range .hk-win-reflect-all');
  if (!button) return;
  const total = _hkWindowRangeTotalPending();
  button.hidden = !total;
  const number = button.querySelector('span');
  if (number) number.textContent = total;
}

// 가격표를 다시 그린다. 기준값(mvalue)을 고치면 그 재질·두께의 "계산가"만 바뀌므로 그 아코디언만, 반영하면 40T(상품 기준가)가 바뀔 수 있어서 all=true로 같은 재질 전체를 그린다.
function _hkWindowRefreshRangeTables(material, thickness, all = false) {
  if (typeof document === 'undefined') return;
  if (!HK_WINDOW_RANGE_PRODUCTS.some(product => product.material === material)) return;
  const targets = all || thickness === 'all' ? HK_WINDOW_RANGE_THICKNESS : HK_WINDOW_RANGE_THICKNESS.includes(Number(thickness)) ? [Number(thickness)] : [];
  targets.forEach(t => {
    const accordion = document.getElementById('hkIsoAcc-' + _hkWindowRangeAccordionId(material, t));
    if (!accordion) return;
    const body = accordion.querySelector('.hk-iso-accordion-body');
    const lazy = !!body.dataset.lazy; // 아직 안 펼친 아코디언은 제목 요약만 갱신한다
    const table = _hkWindowRangeTableHtml(material, t, !lazy);
    if (!lazy) body.innerHTML = table.html;
    accordion.querySelector('.hk-iso-accordion-count').textContent = table.count;
    const reflect = accordion.querySelector('.hk-win-reflect-btn');
    if (reflect) {
      reflect.hidden = !table.pending;
      const number = reflect.querySelector('span');
      if (number) number.textContent = table.pending;
    }
  });
  _hkWindowRefreshRangeHeader();
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
  // 세 화면(기준값 / 구간 가격 / 쿠팡가)을 전부 그려 두고 하나만 보여준다 — 탭을 옮겨도 다시 그리지 않아서 mvalue를 고친 상태·"변경 전 값"이 그대로 남고,
  // 기준값 탭에서 mvalue를 바꾸면 안 보이는 구간 가격 탭도 같이 갱신된다(구간 가격표는 펼칠 때만 표를 만들어서 다 그려도 가볍다).
  const rangeCount = HK_WINDOW_RANGE_WIDTHS.length * HK_WINDOW_RANGE_HEIGHTS.length * HK_WINDOW_RANGE_THICKNESS.length * HK_WINDOW_RANGE_PRODUCTS.length;
  const views = [
    ['base', '기준값', `${HK_WINDOW_MATERIALS.length * HK_WINDOW_THICKNESS.length}개`],
    ['range', '구간 가격', `${rangeCount}개`],
    ['coupang', '쿠팡가', `${HK_WINDOW_MATERIALS.length * HK_WINDOW_THICKNESS.length}개`],
  ];
  if (!views.some(([id]) => id === _hkWindowView)) _hkWindowView = 'base';
  const tabs = views.map(([id, label, sub]) => `<button type="button" class="bead-subtab${id === _hkWindowView ? ' active' : ''}" data-view="${id}" onclick="hkWindowSetView('${id}')">${label}<span class="bead-subtab-sub">${sub}</span></button>`).join('');
  const viewAttr = id => ` class="hk-win-view" data-view="${id}"${id === _hkWindowView ? '' : ' hidden'}`;
  return `<div id="hkWindowSection">
    <div class="bead-subtab-bar hk-supp-subtabs">${tabs}</div>
    <div${viewAttr('base')}>
      <div id="hkIsoAcc-win_all" class="card pricing-result-card hk-sub-card">
        <div class="pricing-result-header">
          <div class="pricing-result-title">한국단열 창문형단열재 기준값<span class="pricing-spec-badge">${HK_WINDOW_MATERIALS.length * HK_WINDOW_THICKNESS.length}개</span></div>
          <span class="pricing-result-hint">주문제작 · 스토어에는 100원 상품 1개, 가격은 mvalue(가로 × 세로 × mvalue × uprice)로 조정하고 결제수량으로 반영 — <b>바꾼 값은 [계산기용 값 복사]로 계산기 HTML에 붙여 넣어야 반영됩니다</b> · 스마트스토어 mvalue를 바꾸면 <b>구간 가격 탭의 "계산가"</b>가 바뀌고, 거기서 [반영]해야 한국단열 단가에 들어갑니다</span>
        </div>
        <div class="hk-win-actions">${copyButtons}</div>
        <div class="hk-iso-accordion-list">
          ${HK_WINDOW_MATERIALS.map(_hkWindowAccordionHtml).join('')}
        </div>
      </div>
      ${_hkWindowPreviewHtml()}
    </div>
    <div${viewAttr('range')}>${_hkWindowRangeCardHtml()}</div>
    <div${viewAttr('coupang')}>${_hkWindowCoupangCardHtml()}</div>
  </div>`;
}

let _hkWindowView = 'base'; // 마지막으로 보던 화면 — 다시 그려도(DB 불러오기 등) 유지한다
window.hkWindowSetView = function(view) {
  _hkWindowView = view;
  const section = document.getElementById('hkWindowSection');
  if (!section) return;
  section.querySelectorAll('.bead-subtab').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  section.querySelectorAll('.hk-win-view').forEach(el => { el.hidden = el.dataset.view !== view; });
};

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
  if (channel === 'ss') { // 구간 가격표·쿠팡 개당단가의 "계산가"는 스마트스토어 mvalue로 계산된다(한국단열 단가·쿠팡 판매가에는 [반영]해야 들어감)
    _hkWindowRefreshRangeTables(material, thickness);
    _hkWindowRefreshCoupang(material, thickness);
  }
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
   mvalue는 스마트스토어 값(위 표). **단, mvalue를 바꿔도 한국단열 단가는 바로 안 바뀐다**(사용자 지시 2026-09-30): 구간 가격 탭에는 "계산가"(지금 mvalue로 계산)와
   "반영가"(한국단열 단가로 쓰는 값)가 따로 있고, [반영]을 눌러야 계산가가 반영가가 된다(HK_WINDOW_APPLIED, DB hk_settings.window_range_applied). 몰별 표·스토어 가격검사는 반영가를 쓴다.
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
function _hkWindowRangeUnitPrice(material, width, height, thickness, mvalue = window.hkWindowMvalue('ss', material, thickness)) {
  const uprice = HK_WINDOW_UPRICE[thickness];
  if (mvalue == null || uprice == null) return null;
  const scaled = Math.round(mvalue * 10000) * Math.round(uprice * 1000) * width * height; // = mvalue×uprice×가로×세로 × 10^7
  return Math.floor((scaled + 50000000) / 100000000);                                    // ÷10^8(= ÷10^7 ÷ 10) 후 반올림
}

// 계산가 — 지금 화면의 스마트스토어 mvalue로 계산한 가격. 한국단열 단가에는 아직 안 들어간다("반영"해야 들어간다, 아래).
function _hkWindowRangePrice(material, width, height, thickness) {
  const unit = _hkWindowRangeUnitPrice(material, width, height, thickness);
  return unit == null ? null : Math.ceil((unit + HK_WINDOW_RANGE_SHIPPING) / 10) * 10;
}

// 코드 기본값 — 코드에 든 기본 mvalue로 계산한 가격(= 처음 스토어 가격). 반영가가 이 값과 같으면 저장하지 않는다.
function _hkWindowRangeDefaultPrice(material, width, height, thickness) {
  const unit = _hkWindowRangeUnitPrice(material, width, height, thickness, _hkWindowDefaultMvalue('ss', material, thickness));
  return unit == null ? null : Math.ceil((unit + HK_WINDOW_RANGE_SHIPPING) / 10) * 10;
}

function _hkWindowParseRangeCode(code) {
  const match = /^(St|Iso)_(\d+)_(\d+)_(\d+)$/.exec(String(code || ''));
  if (!match) return null;
  const product = HK_WINDOW_RANGE_PRODUCTS.find(item => item.prefix === match[1]);
  const [width, height, thickness] = [Number(match[2]), Number(match[3]), Number(match[4])];
  if (!product || !HK_WINDOW_RANGE_WIDTHS.includes(width) || !HK_WINDOW_RANGE_HEIGHTS.includes(height) || !HK_WINDOW_RANGE_THICKNESS.includes(thickness)) return null;
  return { material: product.material, width, height, thickness };
}

/* 반영가(= 한국단열 단가) — 기준값(mvalue)을 고치면 구간 가격의 "계산가"만 바뀌고, 구간 가격 탭에서 [반영]을 눌러야 여기(한국단열 단가)에 들어간다(사용자 지시 2026-09-30).
   코드 기본값과 다르게 반영한 것만 { 관리코드: 가격 }으로 들고 있고 DB(hk_settings.window_range_applied)에 저장한다. 한국단열 몰별 표·스토어 가격검사는 이 값을 쓴다. */
const HK_WINDOW_APPLIED = {};

window.hkWindowPriceByCode = function(code) {
  const parsed = _hkWindowParseRangeCode(code);
  if (!parsed) return null;
  if (code in HK_WINDOW_APPLIED) return HK_WINDOW_APPLIED[code];
  return _hkWindowRangeDefaultPrice(parsed.material, parsed.width, parsed.height, parsed.thickness);
};

window.hkWindowAppliedPrices = function() { return { ...HK_WINDOW_APPLIED }; };

window.hkWindowApplyAppliedPrices = function(map) {
  Object.keys(HK_WINDOW_APPLIED).forEach(code => delete HK_WINDOW_APPLIED[code]);
  Object.entries(map || {}).forEach(([code, value]) => {
    const parsed = _hkWindowParseRangeCode(code);
    const price = Number(value);
    if (!parsed || !Number.isInteger(price) || price <= 0) return;
    if (price !== _hkWindowRangeDefaultPrice(parsed.material, parsed.width, parsed.height, parsed.thickness)) HK_WINDOW_APPLIED[code] = price;
  });
};

// 계산가를 반영가로 만든다. thickness = 두께 숫자 또는 'all'(그 재질 전체). 바뀐 옵션 수를 돌려준다.
window.hkWindowReflectRange = function(material, thickness) {
  const product = HK_WINDOW_RANGE_PRODUCTS.find(item => item.material === material);
  if (!product) return 0;
  const thicknesses = thickness === 'all' ? HK_WINDOW_RANGE_THICKNESS : [Number(thickness)];
  let changed = 0;
  thicknesses.forEach(t => HK_WINDOW_RANGE_HEIGHTS.forEach(height => HK_WINDOW_RANGE_WIDTHS.forEach(width => {
    const code = `${product.prefix}_${width}_${height}_${t}`;
    const before = window.hkWindowPriceByCode(code);
    const calc = _hkWindowRangePrice(material, width, height, t);
    if (calc == null || calc === before) return;
    if (calc === _hkWindowRangeDefaultPrice(material, width, height, t)) delete HK_WINDOW_APPLIED[code]; else HK_WINDOW_APPLIED[code] = calc;
    changed++;
  })));
  if (!changed) return 0;
  // 40T(500×500)는 상품 기준가라서 반영하면 같은 재질의 모든 두께 옵션가가 다시 계산된다.
  _hkWindowRefreshRangeTables(material, thickness, thickness === 'all' || thicknesses.includes(HK_WINDOW_RANGE_THICKNESS[0]));
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
  const listing = typeof document !== 'undefined' ? document.getElementById('hkChannelListingSection') : null;
  if (listing && !listing.hidden && typeof window._hkRefreshChannelListing === 'function') window._hkRefreshChannelListing();
  return changed;
};

// 화면 버튼용 — 반영하고 안내한다.
window.hkWindowReflectClick = function(material, thickness) {
  const changed = window.hkWindowReflectRange(material, thickness);
  const message = changed ? `구간 가격 ${changed}개를 한국단열 단가에 반영했습니다. 단가표를 저장하면 확정됩니다.` : '반영할 변경이 없습니다.';
  if (typeof _hkDbToast === 'function') _hkDbToast(message, changed ? 'success' : 'info');
  return changed;
};

window.hkWindowReflectAllClick = function() {
  let total = 0;
  HK_WINDOW_RANGE_PRODUCTS.forEach(product => { total += window.hkWindowReflectRange(product.material, 'all'); });
  const message = total ? `구간 가격 ${total}개를 한국단열 단가에 반영했습니다. 단가표를 저장하면 확정됩니다.` : '반영할 변경이 없습니다.';
  if (typeof _hkDbToast === 'function') _hkDbToast(message, total ? 'success' : 'info');
  return total;
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
/* ═══════════════════════════════════════
   쿠팡가 — 개당단가 × 사이즈표 주문수량 (2026-09-30, 엑셀 "쿠팡 가격 로직"·"사이즈표"·"단가 시뮬레이터")

   쿠팡은 100원 상품처럼 **개당단가**로 판다: 고객이 가로·세로를 사이즈표에서 찾아 그 **주문수량**만큼 주문한다 → 결제금액 = 주문수량 × 개당단가.
   - 500×500 계산가(SS계산가) = ROUND(mvalue × uprice × 500 × 500 × 100,000 ÷ 1,000,000) — 스마트스토어 mvalue(기준값 탭)로 계산한다(기준 사이즈 500×500 고정)
   - 주문수량 = 사이즈표(가로 5 × 세로 14, 스티로폼 40T 기준 55개에서 시작, **모든 두께·재질 공통·고정**)
   - **개당단가(계산) = ceil(500×500 계산가 ÷ 55 ÷ 10) × 10 + 10** (+10원은 쿠팡 수수료 보정)
   - 엑셀의 "현재 쿠팡 등록가"(인상 전: 스티로폼 40T 110 · 아이소핑크 40T 170 …, 사람이 손으로 조정한 값이 섞여 있었다)는 이미 인상돼서 쿠팡에는 지금 계산 개당단가(130·190 …)로 올라가 있다(사용자 확인 2026-09-30) → 현재 등록가 = 계산 개당단가. 반영가는 직접 고칠 수도 있다.
   흐름은 구간 가격과 같다: 기준값(mvalue)을 고치면 **계산가**만 바뀌고, [반영]해야 **반영 개당단가**(쿠팡 판매가)가 된다. **수정 전 = 마지막으로 저장한 값**(처음엔 현재 쿠팡 등록가).
   코드 기본값(현재 쿠팡 등록가)과 다르게 반영한 것만 { '재질_두께': 개당단가 }로 DB(hk_settings.window_coupang_applied)에 저장한다.
   쿠팡 채널 상품(노출상품ID·옵션ID)은 아직 못 받아서 몰별 표에는 등록하지 않았다 — 이 표는 카테고리 안의 가격표다.
═══════════════════════════════════════ */
const HK_WINDOW_COUPANG_QTY_BASE = 55;
const HK_WINDOW_COUPANG_WIDTH_LABELS = ['50 미만', '51~60', '61~70', '71~80', '81~90']; // cm
const HK_WINDOW_COUPANG_HEIGHT_LABELS = ['50 미만', '51~60', '61~70', '71~80', '81~90', '91~100', '101~110', '111~120', '121~130', '131~140', '141~150', '151~160', '161~170', '171~180']; // cm
// 사이즈표(주문수량) — 행 = 세로, 열 = 가로. 엑셀 "사이즈표" 그대로(= floor(가로mm × 세로mm × 1.7 × 0.13 ÷ 1000), 옛 mvalue 1.7로 만든 값을 고정해서 쓴다).
const HK_WINDOW_COUPANG_SIZE_TABLE = [
  [55, 66, 77, 88, 99], [66, 79, 92, 106, 119], [77, 92, 108, 123, 139], [88, 106, 123, 141, 159], [99, 119, 139, 159, 179],
  [110, 132, 154, 176, 198], [121, 145, 170, 194, 218], [132, 159, 185, 212, 238], [143, 172, 201, 229, 258], [154, 185, 216, 247, 278],
  [165, 198, 232, 265, 298], [176, 212, 247, 282, 318], [187, 225, 262, 300, 338], [198, 238, 278, 318, 358],
];
// 현재 쿠팡 등록 개당단가(두께 40~110T 순서). 엑셀 "현재 쿠팡 등록가"는 인상 전 값(스티로폼 110·130·140·140·150·170·170·180 /
// 아이소핑크 170·190·200·210·230·250·250·270)이었는데, **쿠팡에는 이미 인상된 가격으로 반영돼 있다**(사용자 확인 2026-09-30: "110원이 아닌 130원,
// 170원이 아닌 190원") — 그래서 인상된 값(= 엑셀 "단가 시뮬레이터"의 변경 쿠팡 개당단가 = 지금 mvalue의 계산 개당단가)을 현재 등록가로 둔다.
const HK_WINDOW_COUPANG_CURRENT = {
  eps: [130, 140, 150, 160, 170, 190, 200, 210],
  xps: [190, 210, 230, 240, 260, 290, 310, 320],
};

const HK_WINDOW_COUPANG_APPLIED = {}; // 코드 기본값(현재 등록가)과 다르게 반영한 개당단가 { '재질_두께': 가격 }
let _hkWindowCoupangSaved = {};       // 마지막으로 저장(불러오기)한 반영가 = 수정 전 판매가

function _hkWindowCoupangKey(material, thickness) { return `${material}_${thickness}`; }

function _hkWindowCoupangCurrent(material, thickness) {
  const list = HK_WINDOW_COUPANG_CURRENT[material];
  const index = HK_WINDOW_THICKNESS.indexOf(Number(thickness));
  return list && index >= 0 ? list[index] : null;
}

// 500×500 계산가 — 정수 연산(mvalue×uprice×25,000 = m10000 × u1000 ÷ 400, 반올림).
function _hkWindowCoupangBaseAmount(material, thickness) {
  const mvalue = window.hkWindowMvalue('ss', material, thickness);
  const uprice = HK_WINDOW_UPRICE[thickness];
  if (mvalue == null || uprice == null) return null;
  return Math.floor((Math.round(mvalue * 10000) * Math.round(uprice * 1000) + 200) / 400);
}

// 개당단가 계산가 = ceil(500×500 계산가 ÷ 55 ÷ 10) × 10 + 10 (정수 올림)
window.hkWindowCoupangCalc = function(material, thickness) {
  const base = _hkWindowCoupangBaseAmount(material, thickness);
  if (base == null) return null;
  const step = HK_WINDOW_COUPANG_QTY_BASE * 10;
  return Math.floor((base + step - 1) / step) * 10 + 10;
};

window.hkWindowCoupangPrice = function(material, thickness) {
  const key = _hkWindowCoupangKey(material, thickness);
  return key in HK_WINDOW_COUPANG_APPLIED ? HK_WINDOW_COUPANG_APPLIED[key] : _hkWindowCoupangCurrent(material, thickness);
};

// windowKey('xps_100', 쿠팡 몰별 표 옵션에 붙는 재질_두께)로 반영 개당단가를 찾는다 — 쿠팡 채널의 창문형단열재 옵션 등록 판매가.
window.hkWindowCoupangPriceByKey = function(key) {
  const [material, thickness] = String(key || '').split('_');
  return window.hkWindowCoupangPrice(material, Number(thickness));
};

window.hkWindowCoupangPrev = function(material, thickness) {
  const key = _hkWindowCoupangKey(material, thickness);
  return key in _hkWindowCoupangSaved ? _hkWindowCoupangSaved[key] : _hkWindowCoupangCurrent(material, thickness);
};

window.hkWindowCoupangAppliedPrices = function() { return { ...HK_WINDOW_COUPANG_APPLIED }; };

function _hkWindowCoupangParseKey(key) {
  const [material, thickness] = String(key).split('_');
  return _hkWindowCoupangCurrent(material, Number(thickness)) == null ? null : { material, thickness: Number(thickness) };
}

// DB에서 불러온 값을 적용한다(기본값과 같거나 이상한 값은 버림). 불러온 값이 곧 "마지막 저장값"(= 수정 전 판매가)이다.
window.hkWindowApplyCoupangPrices = function(map) {
  Object.keys(HK_WINDOW_COUPANG_APPLIED).forEach(key => delete HK_WINDOW_COUPANG_APPLIED[key]);
  Object.entries(map || {}).forEach(([key, value]) => {
    const parsed = _hkWindowCoupangParseKey(key);
    const price = Number(value);
    if (!parsed || !Number.isInteger(price) || price <= 0) return;
    if (price !== _hkWindowCoupangCurrent(parsed.material, parsed.thickness)) HK_WINDOW_COUPANG_APPLIED[_hkWindowCoupangKey(parsed.material, parsed.thickness)] = price;
  });
  _hkWindowCoupangSaved = { ...HK_WINDOW_COUPANG_APPLIED };
};

// 반영가를 직접 정한다(엑셀의 수동 조정처럼). 바뀌었으면 true.
window.hkWindowCoupangSetPrice = function(material, thickness, value) {
  const price = Number(value);
  const current = _hkWindowCoupangCurrent(material, thickness);
  if (current == null || !Number.isInteger(price) || price <= 0) return false;
  const before = window.hkWindowCoupangPrice(material, thickness);
  const key = _hkWindowCoupangKey(material, thickness);
  if (price === current) delete HK_WINDOW_COUPANG_APPLIED[key]; else HK_WINDOW_COUPANG_APPLIED[key] = price;
  return price !== before;
};

// 계산가를 반영가로 만든다. material = 재질 id 또는 'all', thickness = 두께 숫자 또는 'all'. 바뀐 수를 돌려준다.
window.hkWindowCoupangReflect = function(material, thickness) {
  const materials = material === 'all' ? HK_WINDOW_MATERIALS.map(m => m.id) : [material];
  const thicknesses = thickness === 'all' ? HK_WINDOW_THICKNESS : [Number(thickness)];
  let changed = 0;
  materials.forEach(mat => thicknesses.forEach(t => {
    const calc = window.hkWindowCoupangCalc(mat, t);
    if (calc != null && window.hkWindowCoupangSetPrice(mat, t, calc)) changed++;
  }));
  if (changed) {
    _hkWindowRefreshCoupang(material, thickness);
    if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
  }
  return changed;
};

window.hkWindowCoupangPendingCount = function() {
  let count = 0;
  HK_WINDOW_MATERIALS.forEach(mat => HK_WINDOW_THICKNESS.forEach(t => { if (window.hkWindowCoupangCalc(mat.id, t) !== window.hkWindowCoupangPrice(mat.id, t)) count++; }));
  return count;
};

// 단가표를 저장하면 그 값이 새 "수정 전 판매가"가 된다(pricing-hankook-db.js가 저장 성공 뒤에 부른다).
window.hkWindowMarkSaved = function() {
  _hkWindowCoupangSaved = { ...HK_WINDOW_COUPANG_APPLIED };
  _hkWindowRefreshCoupang('all', 'all');
};

/* ── 화면 ── */
function _hkWindowCoupangRowHtml(mat, t) {
  const calc = window.hkWindowCoupangCalc(mat.id, t);
  const price = window.hkWindowCoupangPrice(mat.id, t);
  const prev = window.hkWindowCoupangPrev(mat.id, t);
  const pending = calc !== price;
  const changed = price !== prev;
  const diff = price - prev;
  return `<tr data-cp-material="${mat.id}" data-cp-thickness="${t}">
    <td class="hk-sub-name">${mat.label} ${t}T</td>
    <td>${HK_WINDOW_UPRICE[t]}</td>
    <td class="hk-cp-m">${window.hkWindowMvalue('ss', mat.id, t)}</td>
    <td class="hk-cp-ss">${_hkWindowFormat(_hkWindowCoupangBaseAmount(mat.id, t))}</td>
    <td class="hk-cp-calc${pending ? ' is-pending' : ''}"><b>${_hkWindowFormat(calc)}</b><button type="button" class="hk-win-reflect-btn hk-cp-reflect" onclick="hkWindowCoupangReflectClick('${mat.id}', ${t})" title="계산 개당단가를 반영 개당단가로 만듭니다"${pending ? '' : ' hidden'}>반영</button></td>
    <td class="hk-cp-prev">${_hkWindowFormat(prev)}</td>
    <td class="hk-iso-draft-price hk-sub-price-cell${changed ? ' changed' : ''}">
      <div class="hk-iso-price-edit-wrap">
        <input type="text" inputmode="numeric" class="pricing-input-field hk-iso-final-price-input hk-cp-input" value="${price}"
          data-material="${mat.id}" data-thickness="${t}" onclick="beginHkWindowCoupangEdit(this)" oninput="hkWindowCoupangInput(this)" onblur="finishHkWindowCoupangEdit(this)" onkeydown="handleHkWindowCoupangKey(event,this)" readonly
          title="현재 쿠팡 등록가 ${_hkWindowCoupangCurrent(mat.id, t)}원 · 직접 고칠 수 있습니다" aria-label="${mat.label} ${t}T 쿠팡 반영 개당단가">
        <button type="button" class="hk-iso-row-price-edit-btn" onclick="beginHkWindowCoupangEdit(this)" title="이 개당단가만 수정"><i class="fa-solid fa-pen"></i></button>
      </div>
      <div class="hk-iso-price-history"${changed ? '' : ' hidden'}>변경 전 <span>${_hkWindowFormat(prev)}</span><button type="button" onclick="revertHkWindowCoupang(this)" title="변경 전 값으로 되돌리기"><i class="fa-solid fa-rotate-left"></i></button></div>
    </td>
    <td class="hk-cp-diff">${diff ? (diff > 0 ? '+' : '') + _hkWindowFormat(diff) : '동일'}</td>
    <td class="hk-cp-pay">${_hkWindowFormat(HK_WINDOW_COUPANG_SIZE_TABLE[0][0] * price)}</td>
  </tr>`;
}

function _hkWindowCoupangTableHtml(mat) {
  return `<div class="pricing-table-scroll"><table class="pricing-table hk-sub-table hk-win-table hk-cp-table">
    <colgroup><col style="width:170px"><col style="width:80px"><col style="width:90px"><col style="width:120px"><col style="width:130px"><col style="width:100px"><col style="width:140px"><col style="width:90px"><col style="width:130px"></colgroup>
    <thead><tr>
      <th class="hk-sub-head-base">${mat.label}</th><th class="hk-sub-head-base">uprice</th>
      <th class="hk-sub-head-base">mvalue<br><small>스마트스토어</small></th><th class="hk-sub-head-base">500×500 계산가</th>
      <th class="hk-sub-head-sale-price">계산 개당단가<br><small>반영 전</small></th><th class="hk-sub-head-base">수정 전<br><small>마지막 저장</small></th>
      <th class="hk-sub-head-sale-price">반영 개당단가<br><small>쿠팡 판매가</small></th><th class="hk-sub-head-base">차이</th>
      <th class="hk-sub-head-base">최소 결제금액<br><small>55개 × 개당단가</small></th>
    </tr></thead>
    <tbody>${HK_WINDOW_THICKNESS.map(t => _hkWindowCoupangRowHtml(mat, t)).join('')}</tbody>
  </table></div>`;
}

function _hkWindowCoupangAccordionHtml(mat, index) {
  const id = `win_cp_${mat.id}`;
  return `<div class="hk-iso-accordion open" id="hkIsoAcc-${id}">
    <div class="hk-iso-accordion-head">
      <span class="hk-iso-accordion-title">${mat.label}</span>
      <span class="hk-iso-accordion-count">두께 ${HK_WINDOW_THICKNESS.length}개</span>
      <button type="button" class="hk-iso-accordion-toggle" onclick="toggleHkIsoAccordion('${id}')" title="펼치기 / 접기" aria-label="${mat.label} 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
    </div>
    <div class="hk-iso-accordion-body">${_hkWindowCoupangTableHtml(mat)}</div>
  </div>`;
}

// 결제금액표 — 재질·두께마다 세로 14 × 가로 5 (주문수량 × 반영 개당단가). 펼칠 때 표를 만든다(구간 가격표와 같은 방식).
function _hkWindowCoupangPayStats(matId, thickness) {
  const price = window.hkWindowCoupangPrice(matId, thickness);
  const prev = window.hkWindowCoupangPrev(matId, thickness);
  const all = HK_WINDOW_COUPANG_SIZE_TABLE.flat();
  const changed = price !== prev;
  return { price, prev, changed, min: Math.min(...all) * price, max: Math.max(...all) * price };
}

function _hkWindowCoupangPayCount(matId, thickness) {
  const s = _hkWindowCoupangPayStats(matId, thickness);
  return `개당 ${_hkWindowFormat(s.price)}원 · ${_hkWindowFormat(s.min)} ~ ${_hkWindowFormat(s.max)}원${s.changed ? ` · 변경 (수정 전 개당 ${_hkWindowFormat(s.prev)}원)` : ''}`;
}

function _hkWindowCoupangPayTableHtml(matId, thickness) {
  const { price, prev, changed } = _hkWindowCoupangPayStats(matId, thickness);
  const body = HK_WINDOW_COUPANG_SIZE_TABLE.map((row, r) => `<tr><td class="hk-sub-name">세로 ${HK_WINDOW_COUPANG_HEIGHT_LABELS[r]}cm</td>${row.map(qty => `<td class="hk-win-range-cell${changed ? ' is-changed' : ''}" title="${qty}개 × ${_hkWindowFormat(price)}원${changed ? ` · 수정 전 ${_hkWindowFormat(qty * prev)}원 (개당 ${_hkWindowFormat(prev)}원)` : ''}"><b>${_hkWindowFormat(qty * price)}</b><small>${qty}개</small></td>`).join('')}</tr>`).join('');
  return `<div class="pricing-table-scroll"><table class="pricing-table hk-sub-table hk-win-table hk-win-range-table">
    <colgroup><col style="width:150px">${HK_WINDOW_COUPANG_WIDTH_LABELS.map(() => '<col>').join('')}</colgroup>
    <thead><tr><th class="hk-sub-head-base">세로 ↓ / 가로 →</th>${HK_WINDOW_COUPANG_WIDTH_LABELS.map(label => `<th class="hk-sub-head-sale-price">가로<br><small>${label}cm</small></th>`).join('')}</tr></thead>
    <tbody>${body}</tbody>
  </table></div>`;
}

const _hkWindowCoupangOpenPay = new Set(['eps_40']);
function _hkWindowCoupangPayAccordionHtml(mat, t) {
  const id = `win_cpp_${mat.id}_${t}`;
  const open = _hkWindowCoupangOpenPay.has(`${mat.id}_${t}`);
  return `<div class="hk-iso-accordion${open ? ' open' : ''}" id="hkIsoAcc-${id}">
    <div class="hk-iso-accordion-head">
      <span class="hk-iso-accordion-title">${mat.label} ${t}T</span>
      <span class="hk-iso-accordion-count">${_hkWindowCoupangPayCount(mat.id, t)}</span>
      <button type="button" class="hk-iso-accordion-toggle" onclick="hkWindowToggleCoupangPay('${mat.id}', ${t})" title="펼치기 / 접기" aria-label="${mat.label} ${t}T 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
    </div>
    <div class="hk-iso-accordion-body"${open ? '' : ' data-lazy="1"'}>${open ? _hkWindowCoupangPayTableHtml(mat.id, t) : ''}</div>
  </div>`;
}

window.hkWindowToggleCoupangPay = function(material, thickness) {
  const id = `win_cpp_${material}_${thickness}`;
  const body = document.querySelector(`#hkIsoAcc-${id} .hk-iso-accordion-body`);
  if (body && body.dataset.lazy) {
    body.innerHTML = _hkWindowCoupangPayTableHtml(material, thickness);
    delete body.dataset.lazy;
  }
  window.toggleHkIsoAccordion(id);
  const open = document.getElementById('hkIsoAcc-' + id)?.classList.contains('open');
  if (open) _hkWindowCoupangOpenPay.add(`${material}_${thickness}`); else _hkWindowCoupangOpenPay.delete(`${material}_${thickness}`);
};

function _hkWindowCoupangSizeAccordionHtml() {
  const head = HK_WINDOW_COUPANG_WIDTH_LABELS.map(label => `<th class="hk-sub-head-sale-price">가로<br><small>${label}cm</small></th>`).join('');
  const body = HK_WINDOW_COUPANG_SIZE_TABLE.map((row, r) => `<tr><td class="hk-sub-name">세로 ${HK_WINDOW_COUPANG_HEIGHT_LABELS[r]}cm</td>${row.map((qty, c) => `<td class="hk-win-range-cell${r === 0 && c === 0 ? ' is-base' : ''}"><b>${qty}</b>${r === 0 && c === 0 ? '<small>기준</small>' : ''}</td>`).join('')}</tr>`).join('');
  return `<div class="hk-iso-accordion open" id="hkIsoAcc-win_cp_size">
    <div class="hk-iso-accordion-head">
      <span class="hk-iso-accordion-title">사이즈표 — 주문수량(개)</span>
      <span class="hk-iso-accordion-count">가로 5 × 세로 14 · 모든 두께·재질 공통(스티로폼 40T 기준 55개에서 시작, 고정값)</span>
      <button type="button" class="hk-iso-accordion-toggle" onclick="toggleHkIsoAccordion('win_cp_size')" title="펼치기 / 접기" aria-label="사이즈표 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
    </div>
    <div class="hk-iso-accordion-body"><div class="pricing-table-scroll"><table class="pricing-table hk-sub-table hk-win-table hk-win-range-table">
      <colgroup><col style="width:150px">${HK_WINDOW_COUPANG_WIDTH_LABELS.map(() => '<col>').join('')}</colgroup>
      <thead><tr><th class="hk-sub-head-base">세로 ↓ / 가로 →</th>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table></div></div>
  </div>`;
}

function _hkWindowCoupangCardHtml() {
  const pending = window.hkWindowCoupangPendingCount();
  return `<div id="hkIsoAcc-win_coupang" class="card pricing-result-card hk-sub-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">한국단열 창문형단열재 쿠팡 개당단가<span class="pricing-spec-badge">${HK_WINDOW_MATERIALS.length * HK_WINDOW_THICKNESS.length}개</span></div>
        <span class="pricing-result-hint" title="결제금액 = 주문수량 × 개당단가 · 계산 개당단가 = ceil(500×500 계산가 ÷ 55 ÷ 10) × 10 + 10 (+10원은 쿠팡 수수료 보정) · 계산은 스마트스토어 mvalue 기준 · 반영 개당단가는 연필로 직접 고칠 수 있음 · 수정 전 = 마지막 저장값(처음엔 현재 쿠팡 등록가) · 쿠팡 상품·옵션ID는 아직 등록 전이라 몰별 표에는 없음">개당단가 × 사이즈표 주문수량 · 계산가는 스마트스토어 mvalue 기준 — <b>[반영]해야 쿠팡 판매가</b>가 됩니다</span>
        <button type="button" class="pricing-margin-edit-btn hk-win-reflect-all hk-cp-reflect-all" onclick="hkWindowCoupangReflectAllClick()" title="모든 재질·두께의 계산 개당단가를 반영합니다"${pending ? '' : ' hidden'}><i class="fa-solid fa-arrow-right-to-bracket"></i> 전체 반영 <span>${pending}</span>개</button>
      </div>
      <div class="hk-iso-accordion-list">
        ${HK_WINDOW_MATERIALS.map(_hkWindowCoupangAccordionHtml).join('')}
      </div>
    </div>
    <div class="card pricing-result-card hk-sub-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">쿠팡 결제금액표<span class="pricing-spec-badge">${HK_WINDOW_MATERIALS.length * HK_WINDOW_THICKNESS.length}개</span></div>
        <span class="pricing-result-hint">재질·두께별 결제금액 = 사이즈표 주문수량 × 반영 개당단가 (작은 글씨 = 주문수량) · <b>주황 배경</b> = 수정 전(마지막 저장)과 다름</span>
      </div>
      <div class="hk-iso-accordion-list">
        ${HK_WINDOW_MATERIALS.map(mat => HK_WINDOW_THICKNESS.map(t => _hkWindowCoupangPayAccordionHtml(mat, t)).join('')).join('')}
      </div>
    </div>
    <div class="card pricing-result-card hk-sub-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">쿠팡 사이즈표</div>
        <span class="pricing-result-hint">고객이 가로·세로 구간(cm)을 찾아 이 수량만큼 주문합니다</span>
      </div>
      <div class="hk-iso-accordion-list">${_hkWindowCoupangSizeAccordionHtml()}</div>
    </div>`;
}

// 표시만 갱신한다(입력 중인 칸은 건드리지 않는다). material/thickness = 'all' 가능.
function _hkWindowRefreshCoupang(material, thickness) {
  if (typeof document === 'undefined') return;
  const materials = material === 'all' ? HK_WINDOW_MATERIALS.map(m => m.id) : [material];
  const thicknesses = thickness === 'all' ? HK_WINDOW_THICKNESS : [Number(thickness)];
  materials.forEach(mat => thicknesses.forEach(t => {
    const row = document.querySelector(`#hkWindowSection tr[data-cp-material="${mat}"][data-cp-thickness="${t}"]`);
    if (row) {
      const calc = window.hkWindowCoupangCalc(mat, t);
      const price = window.hkWindowCoupangPrice(mat, t);
      const prev = window.hkWindowCoupangPrev(mat, t);
      const diff = price - prev;
      const set = (selector, text) => { const el = row.querySelector(selector); if (el) el.textContent = text; };
      set('.hk-cp-m', window.hkWindowMvalue('ss', mat, t));
      set('.hk-cp-ss', _hkWindowFormat(_hkWindowCoupangBaseAmount(mat, t)));
      set('.hk-cp-calc b', _hkWindowFormat(calc));
      const calcCell = row.querySelector('.hk-cp-calc');
      calcCell?.classList.toggle('is-pending', calc !== price);
      const reflect = row.querySelector('.hk-cp-reflect');
      if (reflect) reflect.hidden = calc === price;
      set('.hk-cp-prev', _hkWindowFormat(prev));
      set('.hk-cp-diff', diff ? (diff > 0 ? '+' : '') + _hkWindowFormat(diff) : '동일');
      set('.hk-cp-pay', _hkWindowFormat(HK_WINDOW_COUPANG_SIZE_TABLE[0][0] * price));
      const input = row.querySelector('.hk-cp-input');
      if (input && document.activeElement !== input) input.value = price;
      const cell = row.querySelector('.hk-iso-draft-price');
      cell?.classList.toggle('changed', price !== prev);
      const history = cell?.querySelector('.hk-iso-price-history');
      if (history) { history.hidden = price === prev; const span = history.querySelector('span'); if (span) span.textContent = _hkWindowFormat(prev); }
    }
    const accordion = document.getElementById(`hkIsoAcc-win_cpp_${mat}_${t}`);
    if (accordion) {
      const body = accordion.querySelector('.hk-iso-accordion-body');
      if (!body.dataset.lazy) body.innerHTML = _hkWindowCoupangPayTableHtml(mat, t);
      accordion.querySelector('.hk-iso-accordion-count').textContent = _hkWindowCoupangPayCount(mat, t);
    }
  }));
  const pending = window.hkWindowCoupangPendingCount();
  const button = document.querySelector('#hkWindowSection .hk-cp-reflect-all');
  if (button) { button.hidden = !pending; const number = button.querySelector('span'); if (number) number.textContent = pending; }
}

/* ── 동작 ── */
window.hkWindowCoupangInput = function(input) {
  const raw = input.value.replace(/,/g, '').trim();
  if (!/^\d+$/.test(raw)) return; // 잘못된 입력은 무시(이전 값 유지)
  const { material } = input.dataset;
  const thickness = Number(input.dataset.thickness);
  if (window.hkWindowCoupangSetPrice(material, thickness, Number(raw)) && typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
  _hkWindowRefreshCoupang(material, thickness);
};

window.beginHkWindowCoupangEdit = function(source) {
  const cell = source.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-cp-input');
  if (!input) return;
  input.dataset.editStartValue = input.value;
  input.readOnly = false;
  cell.classList.add('editing');
  input.focus();
  input.select();
};

window.finishHkWindowCoupangEdit = function(input) {
  const current = window.hkWindowCoupangPrice(input.dataset.material, Number(input.dataset.thickness));
  if (current != null) input.value = current;
  input.readOnly = true;
  input.closest('.hk-iso-draft-price')?.classList.remove('editing');
};

window.revertHkWindowCoupang = function(button) {
  const cell = button.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-cp-input');
  if (!input) return;
  const { material } = input.dataset;
  const thickness = Number(input.dataset.thickness);
  if (window.hkWindowCoupangSetPrice(material, thickness, window.hkWindowCoupangPrev(material, thickness)) && typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
  input.readOnly = true;
  cell.classList.remove('editing');
  _hkWindowRefreshCoupang(material, thickness);
};

window.handleHkWindowCoupangKey = function(event, input) {
  if (event.key === 'Enter') input.blur();
  if (event.key === 'Escape') {
    const start = input.dataset.editStartValue;
    if (start != null) { input.value = start; window.hkWindowCoupangInput(input); }
    input.blur();
  }
};

function _hkWindowCoupangToast(changed) {
  const message = changed ? `쿠팡 개당단가 ${changed}개를 반영했습니다. 단가표를 저장하면 확정됩니다.` : '반영할 변경이 없습니다.';
  if (typeof _hkDbToast === 'function') _hkDbToast(message, changed ? 'success' : 'info');
}

window.hkWindowCoupangReflectClick = function(material, thickness) {
  const changed = window.hkWindowCoupangReflect(material, thickness);
  _hkWindowCoupangToast(changed);
  return changed;
};

window.hkWindowCoupangReflectAllClick = function() {
  const changed = window.hkWindowCoupangReflect('all', 'all');
  _hkWindowCoupangToast(changed);
  return changed;
};