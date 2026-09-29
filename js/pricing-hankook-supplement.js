/* ═══════════════════════════════════════
   한국단열 추가상품 (2026-09-29)

   한국단열 네이버스토어 상품에 "추가상품"으로 붙는 부자재·열선 리필·스티로폼·열반사 조각 등의 목록이다(사용자가 준 엑셀 표 2개,
   77개). 상품별 목록이 아니라 한국단열 전체 추가상품 마스터라서, 스토어 상품 페이지에서 읽은 추가상품을 이 목록과 이름·코드로
   짝지어 가격을 비교한다(스토어 가격검사, price-core.js `matchHkdSupplements`).

   **가격은 저장하지 않는다** — 코드로 각 카테고리 단가표(부자재·열반사단열재·스티로폼·아이소핑크)의 현재 판매가를 찾아
   추가비용을 더한다(사용자 확인: "단가표가 수정되면 추가상품 단가도 같이 수정"). 그래서 단가표를 고치면 이 탭과 스토어 검사의 기준가가
   바로 따라 바뀐다.
   - 한국단열 추가상품가 = 단가표 판매가 + 추가비용(열선용 스티로폼 3,000원, 열반사 1m 조각 900~5,000원 등)
   - 지마켓/11번가 추가상품가 = 한국단열가 × 1.08을 100원 단위로 올림(엑셀 표 77개 중 76개가 정확히 일치, SEN_GUN만 표 8,100 vs 계산 8,200이라
     표 값을 예외로 둠). 지금은 참고용으로만 보여준다(ESM·11번가 추가상품 검사는 나중).
   - 사용여부 N(엑셀 빨간 행) — 스토어에서 쓰지 않는 추가상품.
═══════════════════════════════════════ */

// [추가상품명(스토어 표기 그대로), 상품코드, 추가비용 = 0, 사용여부 = 'Y', 지마켓/11번가 예외가]
const HK_SUPPLEMENT_GROUPS = [
  { group: '시공부자재', items: [
    ['●_(48mm)회색면테이프 25m', 'TP_GY48'], ['●_회색면테이프(100mm) 25m', 'TP_GY100'], ['●_은박테이프 40m', 'TP_AL'], ['●_투명테이프 50m', 'TP_TR'],
    ['●_다용도 커터칼 (색상랜덤발송)', 'CK_L'], ['●_커터날 대형 18mm 10개', 'CK_B'], ['●_돼지표본드', 'PIG_BD', 0, 'N'], ['●_반코팅장갑(목장갑)', 'GL'],
    ['●_스티커 제거제', 'T_SR'], ['●_스프레이 접착제', 'T_SA'], ['●_아이소핑크 본드', 'ISO_BD', 0, 'N'], ['●_곰팡이 제거제', 'MR'],
    ['●_유성실리콘(투명)', 'SC_TR'], ['●_실리콘건', 'SC_GUN'], ['●_플라스틱 톱날', 'SC_SHE', 0, 'N'], ['●_플라스틱 평헤라', 'SC_PHE'], ['●_실리콘 헤라', 'SC_HE'],
  ] },
  { group: '도배부자재', items: [
    ['●_바인더 접착 증강제', 'H_025'], ['●_하이테크 접착제', 'H_HT'], ['●_특수도배용본드', 'H_542'],
  ] },
  { group: '우레탄폼', items: [
    ['●_타이거 우레탄폼(일회용)', 'T_TF_D'], ['●_타이거 우레탄폼(폼건 전용)', 'T_TF_G'], ['●_타이거 이지본드(일회용)', 'T_EB_D'], ['●_타이거 이지본드(폼건전용)', 'T_EB_G'],
    ['●_타이거 스프레이폼(폼건 전용)', 'T_SF_G'], ['●_타이거 스피드폼본드(폼건 전용)', 'T_SFB_G'], ['●_월드 스프레이폼(폼건 전용)', 'W_SF_G'],
    ['●_월드 스피드폼본드(폼건 전용)', 'W_SFB_G'], ['●_월드 폼본드 B2(폼건 전용)', 'W_B2_G'], ['●_유니 패스트폼본드(폼건 전용)', 'U_FB'], ['●_폼크리너', 'W_FC'],
  ] },
  { group: '월드폼건', items: [
    ['●_월드 251폼건', 'W_GUN_251'], ['●_유니폼건', 'U_GUN', 0, 'N'],
  ] },
  { group: '타이거폼건', items: [
    ['●_쎈폼건', 'SEN_GUN', 0, 'N', 8100], ['●_탑폼건', 'TOP_GUN', 0, 'N'], ['●_타이거 폼건(기본형-레드)', 'T_GUN_RED', 0, 'N'],
    ['●_타이거 폼건(고급형-블랙)', 'T_GUN_BLK', 0, 'N'], ['●_타이거 폼건(전문가용)', 'T_GUN_PRO'], ['●_타이거 폼건(프리미엄)', 'T_GUN_PRM'],
  ] },
  { group: '스티로폼용_열선커터기', items: [
    ['●_프리커터 열선커팅기', 'HC_FREE'], ['●_엘림 열선커터기', 'HC_ELIM'], ['●_USB형 열선커터기', 'HC_USB'],
    ['●_펜형 열선커터기', 'HC_PEN', 0, 'N'], ['●_마닉스 핸드 폼 커팅기', 'HC_MAN', 0, 'N'],
  ] },
  { group: '리필 열선', items: [
    ['●_프리커터용_니크롬 열선 20m 1개', 'HC_FREE_W'], ['●_엘림열선캇터기용_열선 1.2m 1개', 'HC_ELIM_W'], ['●_펜형 열선커터기용_열선 1개', 'HC_PEN_W', 0, 'N'],
    ['●_USB형 열선커터기용_열선 5개', 'HC_USB_W'], ['●_USB형 열선커터기용_조각용팁 1개', 'HC_USB_T'], ['●_USB형 열선커터기용_롱나이프팁 1개', 'HC_USB_LK'],
  ] },
  { group: '뿜칠부자재', items: [
    ['● 라이트폼 팁세트', 'TW_TP'], ['● 라이트폼 건세트', 'TW_NZ'], ['● 타이거폼 2K 분사건+호스', 'T_NZ'], ['● 타이거폼 2K 방아쇠+팁+고무오링', 'T_TP'],
  ] },
  { group: '열선커터기용_스티로폼', items: [
    ['●_스티로폼 20T 430x430 3장', 'St_430_430_20_3', 3000], ['●_스티로폼 30T 430x430 3장', 'St_430_430_30_3', 3000],
    ['●_벽산아이소핑크 10T 430x430 3장', 'Iso_430_430_10_3', 3000], ['●_벽산아이소핑크 20T 430x430 3장', 'Iso_430_430_20_3', 3000],
    ['●_벽산아이소핑크 30T 430x430 2장', 'Iso_430_430_30_2', 3000],
  ] },
  { group: '열반사2M용_50cm', items: [
    ['●_빌트론 20T 1m x 50cm 고급형 비접착', 'BL_20_05_DN'], ['●_빌트론 20T 1m x 50cm 고급형 한쪽접착', 'BL_20_05_DA'],
    ['●_빌트론 30T 1m x 50cm 고급형 비접착', 'BL_30_05_DN'], ['●_빌트론 30T 1m x 50cm 고급형 한쪽접착', 'BL_30_05_DA'],
  ] },
  { group: '열반사2M용_1m', items: [
    ['●_빌트론 20T 1m x 1m 고급형 비접착', 'BL_20_1_DN', 900], ['●_빌트론 20T 1m x 1m 고급형 한쪽접착', 'BL_20_1_DA', 1000],
    ['●_빌트론 30T 1m x 1m 고급형 비접착', 'BL_30_1_DN', 4200], ['●_빌트론 30T 1m x 1m 고급형 한쪽접착', 'BL_30_1_DA', 5000],
    ['●_빌트론 40T 1m x 1m 고급형 비접착', 'BL_40_1_DN', 2200], ['●_빌트론 50T 1m x 1m 고급형 비접착', 'BL_50_1_DN', 1600],
  ] },
  { group: '유니폼건 월드폼건 제품 전용', items: [
    ['★반짝특가_타이거우레탄폼(일회용)', 'T_TF_D_S'], ['★반짝특가_타이거우레탄폼(건용)', 'T_TF_G_S'], ['★반짝특가_타이거이지본드(일회용)', 'T_EB_D_S'],
    ['★반짝특가_타이거이지본드(건용)', 'T_EB_G_S'], ['★반짝특가_월드스피드폼본드(건용)', 'W_SFB_G_S'], ['★반짝특가_월드 폼본드 B2(전용)', 'W_B2_G_S'],
    ['★반짝특가_유니패스트본드(건용)', 'U_FB_S'], ['★반짝특가_폼크리너(랜덤발송)', 'W_FC_S'],
  ] },
];

// 코드 → 각 카테고리 단가표의 현재 판매가(없으면 null). 단가표를 고치면 여기서 바로 새 값이 나온다.
function _hkSupplementBasePrice(code) {
  let price = null;
  if (/^BL_/.test(code) && typeof window.hkReflectivePriceByCode === 'function') price = window.hkReflectivePriceByCode(code);
  else if (/^(St|SSt|StA|Neo|Iso|IsoA|IIso)_/.test(code) && typeof _hkIsoLookupFinalPriceByCode === 'function') price = _hkIsoLookupFinalPriceByCode(code);
  else if (typeof window.hkSubPriceByCode === 'function') price = window.hkSubPriceByCode(code);
  return price != null && Number.isFinite(Number(price)) ? Number(price) : null;
}

/* 사용여부 — 화면에서 바꿀 수 있다(사용자 요청, 2026-09-29). 값은 항상 'Y'(사용) / 'N'(사용안함) 두 글자로 다룬다:
   화면 선택지 "사용 (Y)"·"사용안함 (N)"의 값도, 스토어 검사에 넘기는 use도, DB에 저장하는 값도 Y/N이다.
   코드 기본값(HK_SUPPLEMENT_GROUPS의 네 번째 값)과 다르게 바꾼 것만 HK_SUPPLEMENT_USE_OVERRIDES에 두고
   DB(hk_settings.supplement_use)에 저장한다 — 그래서 나중에 코드 기본값을 고쳐도 안 건드린 항목엔 반영된다. */
const HK_SUPPLEMENT_USE_OVERRIDES = {};

// 'Y'/'N'(대소문자·공백 무시)만 인식한다. 그 외 값은 null.
function _hkSupplementNormalizeUse(value) {
  const v = String(value ?? '').trim().toUpperCase();
  return v === 'Y' || v === 'N' ? v : null;
}

function _hkSupplementDefaultUse(code) {
  for (const { items } of HK_SUPPLEMENT_GROUPS) {
    const item = items.find(entry => entry[1] === code);
    if (item) return item[3] || 'Y';
  }
  return null;
}

window.hkSupplementUseOverrides = function() { return { ...HK_SUPPLEMENT_USE_OVERRIDES }; };

window.hkSupplementApplyUseOverrides = function(map) {
  Object.keys(HK_SUPPLEMENT_USE_OVERRIDES).forEach(code => delete HK_SUPPLEMENT_USE_OVERRIDES[code]);
  Object.entries(map || {}).forEach(([code, value]) => {
    const use = _hkSupplementNormalizeUse(value);
    const base = _hkSupplementDefaultUse(code);
    if (use && base && use !== base) HK_SUPPLEMENT_USE_OVERRIDES[code] = use;
  });
};

window.hkSupplementSetUse = function(select) {
  const code = select?.dataset.code;
  const use = _hkSupplementNormalizeUse(select?.value);
  const base = _hkSupplementDefaultUse(code);
  if (!use || !base) return;
  if (use === base) delete HK_SUPPLEMENT_USE_OVERRIDES[code]; else HK_SUPPLEMENT_USE_OVERRIDES[code] = use;
  const row = select.closest('tr');
  if (row) row.classList.toggle('is-inactive', use === 'N');
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

// 추가상품 한 개의 계산값 — 한국단열가 = 단가표 판매가 + 추가비용, 지마켓/11번가가 = 한국단열가 × 1.08 100원 올림(예외가 있으면 그 값).
function _hkSupplementRow(group, [name, code, addCost = 0, defaultUse = 'Y', marketOverride]) {
  const use = HK_SUPPLEMENT_USE_OVERRIDES[code] || defaultUse;
  const base = _hkSupplementBasePrice(code);
  const price = base == null ? null : base + addCost;
  // 정수 연산으로 올림한다 — 15000 × 1.08은 부동소수점으로 16200.000000000002가 돼 16,300으로 잘못 올림됐었다.
  const market = marketOverride != null ? marketOverride : (price == null ? null : Math.ceil(price * 108 / 10000) * 100);
  return { group, name, code, base, addCost, price, market, use };
}

window.hkSupplementRows = function() {
  return HK_SUPPLEMENT_GROUPS.flatMap(({ group, items }) => items.map(item => _hkSupplementRow(group, item)));
};

// 스토어 가격검사에 넘기는 목록 — 확장(price-core.js matchHkdSupplements)이 이름·코드로 짝지어 가격을 비교한다.
window.hkSupplementCatalog = function() {
  return window.hkSupplementRows().map(row => ({ code: row.code, name: row.name, group: row.group, expected: row.price, use: row.use }));
};

function _hkSupplementGroupHtml(group, rows, groupIndex) {
  const id = `supp_g${groupIndex}`;
  const body = rows.map(row => `<tr class="${row.use === 'N' ? 'is-inactive' : ''}">
      <td class="hk-sub-name">${row.name}</td>
      <td class="hk-iso-draft-code">${row.code}</td>
      <td>${_hkIsoDraftNumber(row.base)}</td>
      <td>${row.addCost ? '+' + _hkIsoDraftNumber(row.addCost) : '—'}</td>
      <td class="hk-iso-draft-price">${_hkIsoDraftNumber(row.price)}</td>
      <td>${_hkIsoDraftNumber(row.market)}</td>
      <td><select class="pricing-input-field hk-supp-use-select" data-code="${row.code}" onchange="hkSupplementSetUse(this)" aria-label="${row.name} 사용여부">
        <option value="Y"${row.use === 'Y' ? ' selected' : ''}>사용 (Y)</option>
        <option value="N"${row.use === 'N' ? ' selected' : ''}>사용안함 (N)</option>
      </select></td>
    </tr>`).join('');
  return `<div class="hk-iso-accordion${groupIndex === 0 ? ' open' : ''}" id="hkIsoAcc-${id}">
    <div class="hk-iso-accordion-head">
      <span class="hk-iso-accordion-title">${group}</span>
      <span class="hk-iso-accordion-count">추가상품 ${rows.length}개</span>
      <button type="button" class="hk-iso-accordion-toggle" onclick="toggleHkIsoAccordion('${id}')" title="펼치기 / 접기" aria-label="${group} 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
    </div>
    <div class="hk-iso-accordion-body"><div class="pricing-table-scroll">
      <table class="pricing-table hk-sub-table">
        <colgroup><col style="width:340px"><col style="width:160px"><col style="width:110px"><col style="width:90px"><col style="width:130px"><col style="width:130px"><col style="width:100px"></colgroup>
        <thead><tr>
          <th class="hk-sub-head-base">추가상품명</th><th class="hk-sub-head-code">상품코드</th><th class="hk-sub-head-base">단가표 판매가</th>
          <th class="hk-sub-head-base">추가비용</th><th class="hk-sub-head-sale-price">추가상품가<br><small>한국단열</small></th>
          <th class="hk-sub-head-base">추가상품가<br><small>지마켓/11번가</small></th><th class="hk-sub-head-base">사용여부</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div></div>
  </div>`;
}

function renderHkSupplementPane() {
  const rows = window.hkSupplementRows();
  const groups = HK_SUPPLEMENT_GROUPS.map(({ group }) => ({ group, rows: rows.filter(row => row.group === group) }));
  const missing = rows.filter(row => row.price == null).length;
  return `<div id="hkSupplementSection">
    <div class="card pricing-result-card hk-sub-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">한국단열 추가상품<span class="pricing-spec-badge">${rows.length}개 · ${groups.length}그룹</span></div>
        <span class="pricing-result-hint">추가상품가 = 각 단가표 판매가 + 추가비용 — 단가표를 고치면 자동으로 바뀝니다 · 지마켓/11번가 = 한국단열가 × 1.08 (100원 올림)${missing ? ` · <b>단가표에서 못 찾은 코드 ${missing}개</b>` : ''}</span>
      </div>
      <div class="hk-iso-accordion-list">${groups.map((g, i) => _hkSupplementGroupHtml(g.group, g.rows, i)).join('')}</div>
    </div>
  </div>`;
}
