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
// priceKey: 'price'(한국단열가, 기본) 또는 'market'(지마켓/11번가가 — 11번가 검사가 씀).
window.hkSupplementCatalog = function(priceKey = 'price') {
  const key = priceKey === 'market' ? 'market' : 'price';
  return window.hkSupplementRows().map(row => ({ code: row.code, name: row.name, group: row.group, expected: row[key], use: row.use }));
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

/* ═══════════════════════════════════════
   엑셀 템플릿(프리셋) — 스마트스토어 "추가구성목록" 엑셀 업로드 서식 (2026-09-29)

   목적(사용자): 상품마다 추가상품 목록이 있어 가격이 바뀌거나 품절이 되면 상품별로 하나씩 고치기 오래 걸리고 실수하기 쉬우니,
   상품군별 프리셋을 만들어 두고 → 상품번호를 복사해 스토어에서 그 상품군을 불러온 뒤 → 이 화면에서 만든 엑셀을 그대로 올린다.
   서식: 추가상품명 | 추가상품값 | 추가상품가 | 재고수량 | 사용여부 | 관리코드. 추가상품명(= 그룹명)은 모든 행에 채운다. **기본은 "부자재"**(사용자 지정)이고,
   수정 모드에서 프리셋의 기본 추가상품명을 바꾸거나 **행마다 다르게 지정**할 수 있다(예: 열반사단열재 50cm / 열반사단열재 1M / 부자재).
   (프리셋 = { id, name(구분용), groupName?(기본 추가상품명, 비우면 "부자재"), productIds[], rows:[{ code, group? }] }).
   대량 수정에 엑셀 표(추가상품명 | … | 관리코드)를 그대로 붙이면 관리코드로 항목을 찾고 추가상품명도 행마다 가져온다.

   **프리셋에서 고르는 건 "추가상품값" 하나뿐이다**(사용자 확인) — 추가상품가·재고수량·사용여부·관리코드는 추가상품 목록에서 코드로 그대로 가져온다(여기서 고치지 않는다):
   추가상품가 = 단가표 판매가 + 추가비용, 재고수량 = 99999, 사용여부 = 목록에서 사용 중이면 Y, 사용안함이면 N. 그래서 단가표나 목록의 사용여부가 바뀌면 그 항목이 든 모든 프리셋에 같이 반영된다.
   프리셋 = { id, name, productIds[], rows:[{ code }] }. **수정 버튼을 눌러 수정 모드로 들어가야만** 이름·상품번호·행(추가상품값 선택·삭제·추가)·프리셋 새로 만들기/삭제를 바꿀 수 있다.
   수정 모드에서는 [되돌리기](바꾼 것 하나씩 취소), [수정 취소](수정 시작 후 바꾼 것 전부 버림), [수정 완료]를 쓸 수 있고 행 순서는 ▲▼로 바꾼다.
   프리셋은 "단가표 저장"을 눌러야 DB(hk_settings.supplement_presets)에 저장된다(저장값이 없으면 아래 시드).
   시드 "아이소핑크": 사용자가 준 표 39개 + 아이소핑크 상품 23개(이름은 처음 "부자재"였다가 바뀜).
═══════════════════════════════════════ */
const HK_SUPPLEMENT_PRESET_SEEDS = [
  { id: 'isopink', name: '아이소핑크', productIds: [
    '5695312387', '439904706', '439103571', '3736232926', '3020442618', '8456757485', '8131395351', '11097629335', '2229818356', '10181564057',
    '8324406068', '10181571912', '10181453964', '8324375715', '442086644', '8324347562', '10181586522', '5697937041', '4995022274', '8324352040',
    '10185649832', '10185646787', '10181582241',
  ], codes: [
    'TP_GY48', 'TP_GY100', 'TP_AL', 'CK_L', 'CK_B', 'PIG_BD', 'GL', 'T_SR', 'T_SA', 'ISO_BD', 'MR', 'SC_TR', 'SC_GUN', 'SC_PHE', 'SC_HE',
    'T_TF_D', 'T_TF_G', 'T_EB_D', 'T_EB_G', 'T_SF_G', 'T_SFB_G', 'W_SF_G', 'W_SFB_G', 'W_B2_G', 'U_FB', 'W_FC', 'W_GUN_251', 'U_GUN',
    'HC_FREE', 'HC_ELIM', 'HC_USB', 'HC_PEN', 'HC_MAN', 'HC_FREE_W', 'HC_ELIM_W', 'HC_PEN_W', 'HC_USB_W', 'HC_USB_T', 'HC_USB_LK',
  ] },
];
const HK_SUPPLEMENT_EXCEL_HEADER = ['추가상품명', '추가상품값', '추가상품가', '재고수량', '사용여부', '관리코드']; // 스마트스토어 추가구성목록 서식(화면 표도 이 열을 쓴다)
const HK_SUPPLEMENT_EXCEL_HEADER_11ST = ['[필수]추가상품명', '[필수]추가상품값', '추가상품가격', '재고수량', '부가세', '상태', '추가상품무게'];
const HK_SUPPLEMENT_EXCEL_STOCK = 99999;

// 프리셋은 채널별로 나눈다(사용자 요청 — "채널도 나눌 필요가 있다, 처음 등록할 때부터 채널을 고를 수 있어야"). 채널이 정하는 것: ① 추가상품가 기준(한국단열·한국단열라이프 = 한국단열가,
// 11번가 = 추가상품 목록의 "지마켓/11번가" 가격) ② 적용 상품번호를 확인하는 몰별 표 ③ 파일명.
// 추가상품이 있는 채널만 둔다(사용자 확인 2026-09-29): 한국단열·한국단열라이프(둘 다 스마트스토어, 가격 동일)·11번가. 홈페이지·쿠팡·지마켓(ESM)은 추가상품이 없다.
// 11번가는 엑셀 서식이 스마트스토어와 다르다 — 사용자가 준 11번가 예시표(2026-09-29)로 서식을 맞췄다(format:'11st'):
//   [필수]추가상품명 | [필수]추가상품값 | 추가상품가격 | 재고수량 | 부가세(빈칸) | 상태(= 사용여부 Y/N) | 추가상품무게(빈칸).
//   예시표엔 "[업로드시 삭제] 상품코드" 열도 있지만 사용자가 VLOOKUP으로 가져오려고 넣은 열이라 업로드 전에 지워야 한다 — 여기서는 처음부터 뺀다.
//   가격은 지마켓/11번가가(예시표 39개와 전부 일치 확인). templateReady:false를 주면 서식이 없는 채널의 다운로드를 막을 수 있다(지금은 전부 true).
const HK_SUPPLEMENT_CHANNELS = [
  { id: 'hkd', label: '한국단열', priceKey: 'price', priceLabel: '한국단열가', format: 'smartstore', templateReady: true },
  { id: 'hkd_life', label: '한국단열라이프', priceKey: 'price', priceLabel: '한국단열가', format: 'smartstore', templateReady: true },
  { id: '11st', label: '11번가', priceKey: 'market', priceLabel: '지마켓/11번가가', format: '11st', templateReady: true },
];
function _hkSupplementChannelInfo(id) {
  return HK_SUPPLEMENT_CHANNELS.find(channel => channel.id === id) || HK_SUPPLEMENT_CHANNELS[0];
}

let _hkSupplementPresetState = null;      // [{ id, name, channel, productIds, rows:[{ code, group? }] }] — 처음 쓸 때 시드로 만든다
let _hkSupplementChannel = 'hkd';         // 지금 보는 채널
let _hkSupplementNewOpen = false;         // 새 프리셋 만들기 창
let _hkSupplementActivePresetId = null;
let _hkSupplementEditMode = false;        // 수정 모드 — 켜야만 바꿀 수 있다
let _hkSupplementEditingProducts = false; // 상품번호 수정 창
let _hkSupplementPickerOpen = false;      // "목록에서 추가" 창
let _hkSupplementPickerQuery = '';
let _hkSupplementBulkOpen = false;        // 대량 수정 창
let _hkSupplementBulkMode = 'replace';    // 'replace'(이 목록으로 교체) | 'append'(뒤에 추가)
let _hkSupplementBulkText = '';
let _hkSupplementEditStart = null;        // 수정 시작 때의 { presets, activeId } — [수정 취소]가 여기로 되돌린다
let _hkSupplementUndoStack = [];          // 바꾸기 직전 상태들 — [되돌리기]가 하나씩 꺼내 쓴다

function _hkSupplementPresets() {
  if (!_hkSupplementPresetState) {
    _hkSupplementPresetState = HK_SUPPLEMENT_PRESET_SEEDS.map(seed => ({
      id: seed.id, name: seed.name, channel: seed.channel || 'hkd', productIds: seed.productIds.slice(), rows: seed.codes.map(code => ({ code })),
    }));
  }
  return _hkSupplementPresetState;
}
function _hkSupplementPresetById(id) {
  return _hkSupplementPresets().find(preset => preset.id === id) || null;
}
function _hkSupplementChannelPresets(channel) {
  return _hkSupplementPresets().filter(preset => preset.channel === (channel || _hkSupplementChannel));
}
// 지금 보는 채널의 프리셋 중 고른 것(없으면 그 채널의 첫 프리셋, 채널에 프리셋이 없으면 null)
function _hkSupplementActivePreset() {
  const list = _hkSupplementChannelPresets();
  return list.find(preset => preset.id === _hkSupplementActivePresetId) || list[0] || null;
}
function _hkSupplementCatalogByCode() {
  return new Map(window.hkSupplementRows().map(row => [row.code, row]));
}
function _hkSupplementMarkDirty() {
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
}
function _hkSupplementRerenderPane() {
  const pane = document.getElementById('pricing-tab-hk_supp');
  if (pane) pane.innerHTML = renderHkSupplementPane();
}
function _hkSupplementSnapshot() {
  return { presets: JSON.parse(JSON.stringify(_hkSupplementPresets())), activeId: _hkSupplementActivePresetId, channel: _hkSupplementChannel };
}
function _hkSupplementRestore(snapshot) {
  _hkSupplementPresetState = JSON.parse(JSON.stringify(snapshot.presets));
  _hkSupplementActivePresetId = snapshot.activeId;
  if (snapshot.channel) _hkSupplementChannel = snapshot.channel;
}
function _hkSupplementChangedSinceStart() {
  return !!_hkSupplementEditStart && JSON.stringify(_hkSupplementPresets()) !== JSON.stringify(_hkSupplementEditStart.presets);
}
// 수정 모드에서 프리셋을 바꾸는 모든 동작은 이걸 거친다 — 바꾸기 직전 상태를 되돌리기 목록에 쌓고, 바꾼 뒤 화면을 다시 그린다.
// (저장이 필요하다는 표시는 [수정 완료] 때 실제로 바뀐 게 있을 때만 켠다.)
function _hkSupplementMutate(change) {
  _hkSupplementUndoStack.push(_hkSupplementSnapshot());
  if (_hkSupplementUndoStack.length > 100) _hkSupplementUndoStack.shift();
  change();
  _hkSupplementRerenderPane();
}
function _hkSupplementResetEditFlags() {
  _hkSupplementEditMode = false; _hkSupplementEditingProducts = false; _hkSupplementPickerOpen = false; _hkSupplementPickerQuery = '';
  _hkSupplementBulkOpen = false; _hkSupplementBulkText = ''; _hkSupplementBulkMode = 'replace'; _hkSupplementNewOpen = false;
  _hkSupplementEditStart = null; _hkSupplementUndoStack = [];
}
// 추가상품 탭을 열거나 서브탭을 바꿀 때 수정 모드는 꺼진다 — 수정 중이었다면 지금까지 바꾼 내용은 [수정 완료]와 같이 확정한다(저장은 "단가표 저장").
window.hkSupplementLeaveEdit = function() {
  if (_hkSupplementEditMode && _hkSupplementChangedSinceStart()) _hkSupplementMarkDirty();
  _hkSupplementResetEditFlags();
};

// DB 저장·복원용 — 저장된 값이 없으면(undefined) 코드 시드를 그대로 쓴다. 잘못된 값은 걸러서 받는다(행은 관리코드만 남긴다).
window.hkSupplementPresetsState = function() { return JSON.parse(JSON.stringify(_hkSupplementPresets())); };

function _hkSupplementSanitizePreset(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id.trim()) return null;
  const productIds = [...new Set((Array.isArray(raw.productIds) ? raw.productIds : []).map(id => String(id).trim()).filter(id => /^\d+$/.test(id)))];
  const seen = new Set();
  const rows = (Array.isArray(raw.rows) ? raw.rows : []).filter(row => row && typeof row === 'object')
    .map(row => {
      const clean = { code: String(row.code ?? '').trim() };
      if (typeof row.group === 'string' && row.group.trim()) clean.group = row.group.trim().slice(0, 100);
      return clean;
    })
    .filter(row => { if (row.code && seen.has(row.code)) return false; seen.add(row.code); return true; });
  const channel = HK_SUPPLEMENT_CHANNELS.some(item => item.id === raw.channel) ? raw.channel : 'hkd'; // 채널이 없거나 모르는 값이면 한국단열
  const preset = { id: raw.id.trim(), name: (typeof raw.name === 'string' && raw.name.trim()) || '프리셋', channel, productIds, rows };
  if (typeof raw.groupName === 'string' && raw.groupName.trim()) preset.groupName = raw.groupName.trim();
  return preset;
}

// 프리셋의 기본 추가상품명(엑셀 첫 열) — 기본은 "부자재"(사용자 지정). 프리셋 이름과 따로 바꿀 수 있고(수정 모드), 행마다 다르게 지정할 수도 있다(row.group).
const HK_SUPPLEMENT_DEFAULT_GROUP = '부자재';
function _hkSupplementGroupName(preset) {
  return (preset.groupName && preset.groupName.trim()) || HK_SUPPLEMENT_DEFAULT_GROUP;
}

window.hkSupplementApplyPresets = function(list) {
  if (!Array.isArray(list)) return;
  _hkSupplementPresetState = list.map(_hkSupplementSanitizePreset).filter(Boolean);
  if (!_hkSupplementPresetState.some(preset => preset.id === _hkSupplementActivePresetId)) _hkSupplementActivePresetId = null;
  _hkSupplementResetEditFlags(); // DB에서 새로 받으면 진행 중이던 수정은 끝낸다
};

// 행의 화면·엑셀 값 — 전부 추가상품 목록에서 코드로 읽는다(사용여부는 Y/N). 목록에 없는 코드는 linked:false.
function _hkSupplementRowView(row, byCode, defaultGroup, priceKey) {
  const item = row.code ? byCode.get(row.code) || null : null;
  return {
    group: row.group || defaultGroup,
    code: row.code,
    name: item ? item.name : '',
    price: item ? item[priceKey || 'price'] : null,
    stock: HK_SUPPLEMENT_EXCEL_STOCK,
    use: item ? item.use : 'Y',
    linked: !!item,
  };
}
function _hkSupplementPresetViews(preset) {
  const byCode = _hkSupplementCatalogByCode();
  const defaultGroup = _hkSupplementGroupName(preset);
  const priceKey = _hkSupplementChannelInfo(preset.channel).priceKey; // 채널마다 추가상품가 기준이 다르다
  return preset.rows.map(row => _hkSupplementRowView(row, byCode, defaultGroup, priceKey));
}

// 프리셋이 적용되는 상품 — 한국단열 몰별 표(hkd)에서 카테고리를 찾아 붙인다(목록에 없는 번호는 inList:false).
window.hkSupplementPresetProducts = function(id) {
  const preset = _hkSupplementPresetById(id);
  if (!preset) return [];
  const listed = new Map((HK_CHANNEL_LISTINGS[preset.channel] || []).map(product => [String(product.productId), product])); // 그 채널의 몰별 표에서 찾는다
  return preset.productIds.map(productId => {
    const product = listed.get(productId);
    const category = product ? HK_CATEGORIES.find(item => item.id === product.categoryId) : null;
    return { productId, inList: !!product, category: category ? category.label : null };
  });
};

// 엑셀 내용(2차원 배열) — 헤더 + 행들. 추가상품명(그룹명)은 모든 행에 프리셋 이름을 채운다.
// 채널의 서식대로 만든다 — 스마트스토어(한국단열·한국단열라이프): 추가상품명 | 추가상품값 | 추가상품가 | 재고수량 | 사용여부 | 관리코드,
// 11번가: [필수]추가상품명 | [필수]추가상품값 | 추가상품가격 | 재고수량 | 부가세(빈칸) | 상태(Y/N) | 추가상품무게(빈칸) — 관리코드 열은 없다.
window.hkSupplementPresetAoa = function(id) {
  const preset = _hkSupplementPresetById(id);
  const format = preset ? _hkSupplementChannelInfo(preset.channel).format : 'smartstore';
  if (format === '11st') {
    const rows = preset ? _hkSupplementPresetViews(preset).map(view => [view.group, view.name, view.price, view.stock, '', view.use, '']) : [];
    return [HK_SUPPLEMENT_EXCEL_HEADER_11ST.slice(), ...rows];
  }
  if (!preset) return [HK_SUPPLEMENT_EXCEL_HEADER.slice()];
  return [HK_SUPPLEMENT_EXCEL_HEADER.slice(), ..._hkSupplementPresetViews(preset).map(view => [view.group, view.name, view.price, view.stock, view.use, view.code])];
};

// 다운로드 전 점검 — 추가상품값을 아직 안 골랐거나(빈 행), 목록에 없는 코드이거나, 가격을 못 구한 행이 있으면 몇 번째 행인지 알려 주고 막는다.
function _hkSupplementPresetProblems(preset) {
  return _hkSupplementPresetViews(preset).flatMap((view, index) => {
    const issues = [];
    if (!view.code) issues.push('추가상품값을 선택하지 않음');
    else if (!view.linked) issues.push('추가상품 목록에 없는 코드');
    else if (view.price == null || !Number.isFinite(Number(view.price))) issues.push('단가표에서 가격을 못 찾음');
    return issues.length ? [`${index + 1}행(${view.code || '빈 행'}): ${issues.join(', ')}`] : [];
  });
}

window.hkSupplementDownloadPreset = function(id) {
  const preset = _hkSupplementPresetById(id);
  if (!preset) return;
  const channel = _hkSupplementChannelInfo(preset.channel);
  if (!channel.templateReady) { alert(`${channel.label}의 엑셀 서식은 아직 정해지지 않아 만들 수 없습니다. 서식을 받으면 적용합니다.`); return; }
  if (!preset.rows.length) { alert('프리셋에 항목이 없습니다.'); return; }
  const problems = _hkSupplementPresetProblems(preset);
  if (problems.length) { alert(`다운로드할 수 없습니다. 아래 행을 확인해 주세요.\n\n${problems.slice(0, 15).join('\n')}${problems.length > 15 ? `\n… 외 ${problems.length - 15}건` : ''}`); return; }
  if (typeof XLSX === 'undefined') { alert('엑셀 라이브러리를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'); return; }
  const sheet = XLSX.utils.aoa_to_sheet(window.hkSupplementPresetAoa(preset.id));
  sheet['!cols'] = channel.format === '11st'
    ? [{ wch: 16 }, { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 12 }]
    : [{ wch: 14 }, { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 16 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  const today = new Date();
  const stamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  XLSX.writeFile(workbook, `추가구성목록_${_hkSupplementChannelInfo(preset.channel).label}_${preset.name}_${stamp}.xlsx`);
};

/* ── 수정 모드: [수정] → (바꾸기 · 되돌리기) → [수정 완료] 또는 [수정 취소] ── */
window.hkSupplementSetEditMode = function(on) {
  if (on) {
    if (_hkSupplementEditMode) return;
    _hkSupplementResetEditFlags();
    _hkSupplementEditMode = true;
    _hkSupplementEditStart = _hkSupplementSnapshot();
  } else {
    // [수정 완료] — 바뀐 게 있을 때만 저장 필요 표시를 켠다
    if (_hkSupplementChangedSinceStart()) _hkSupplementMarkDirty();
    _hkSupplementResetEditFlags();
  }
  _hkSupplementRerenderPane();
};

// [수정 취소] — 수정을 시작한 뒤로 바꾼 것을 전부 버리고 시작 때 상태로 돌아간다(바꾼 게 있으면 한 번 확인).
window.hkSupplementCancelEdit = function() {
  if (!_hkSupplementEditMode) return;
  if (_hkSupplementChangedSinceStart() && !confirm('수정한 내용을 모두 버리고 수정 전으로 되돌릴까요?')) return;
  if (_hkSupplementEditStart) _hkSupplementRestore(_hkSupplementEditStart);
  _hkSupplementResetEditFlags();
  _hkSupplementRerenderPane();
};

// [되돌리기] — 방금 바꾼 것 하나를 취소한다(수정 모드 안에서 여러 번 누를 수 있다).
window.hkSupplementUndo = function() {
  if (!_hkSupplementEditMode || !_hkSupplementUndoStack.length) return;
  _hkSupplementRestore(_hkSupplementUndoStack.pop());
  _hkSupplementEditingProducts = false; _hkSupplementPickerOpen = false;
  _hkSupplementRerenderPane();
};

/* ── 프리셋 선택·새로 만들기(수정 모드)·이름 수정(수정 모드)·삭제(수정 모드) ── */
window.hkSupplementSelectPreset = function(id) {
  const preset = _hkSupplementPresetById(id);
  _hkSupplementActivePresetId = preset ? preset.id : null;
  _hkSupplementEditingProducts = false; _hkSupplementPickerOpen = false; _hkSupplementPickerQuery = '';
  _hkSupplementRerenderPane();
};

// 채널 전환 — 그 채널의 프리셋만 보인다.
window.hkSupplementSetChannel = function(channel) {
  _hkSupplementChannel = _hkSupplementChannelInfo(channel).id;
  _hkSupplementActivePresetId = null;
  _hkSupplementEditingProducts = false; _hkSupplementPickerOpen = false; _hkSupplementPickerQuery = ''; _hkSupplementBulkOpen = false; _hkSupplementBulkText = '';
  _hkSupplementRerenderPane();
};

// 새 프리셋 — 처음 등록할 때 이름과 채널을 함께 정한다. 보기 모드에서도 눌러 만들 수 있고, 만드는 순간 수정 모드로 들어가므로 [되돌리기]·[수정 취소]로 없앨 수 있다.
window.hkSupplementNewPreset = function() {
  _hkSupplementNewOpen = true;
  _hkSupplementRerenderPane();
  document.querySelector('#pricing-tab-hk_supp .hk-supp-new-name')?.focus();
};
window.hkSupplementNewCancel = function() {
  _hkSupplementNewOpen = false;
  _hkSupplementRerenderPane();
};
window.hkSupplementCreatePreset = function(nameArg, channelArg) {
  const nameInput = document.querySelector('#pricing-tab-hk_supp .hk-supp-new-name');
  const channelSelect = document.querySelector('#pricing-tab-hk_supp .hk-supp-new-channel');
  const name = String(nameArg ?? nameInput?.value ?? '').trim();
  const channel = _hkSupplementChannelInfo(channelArg ?? channelSelect?.value ?? _hkSupplementChannel).id;
  if (!name) { alert('프리셋 이름을 입력해 주세요.'); nameInput?.focus(); return null; }
  if (!_hkSupplementEditMode) window.hkSupplementSetEditMode(true);
  _hkSupplementNewOpen = false; _hkSupplementEditingProducts = false; _hkSupplementPickerOpen = false; _hkSupplementBulkOpen = false;
  let created = null;
  _hkSupplementMutate(() => {
    created = { id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, name, channel, productIds: [], rows: [] };
    _hkSupplementPresets().push(created);
    _hkSupplementActivePresetId = created.id;
    _hkSupplementChannel = channel; // 만든 채널로 이동해서 바로 보이게 한다
  });
  return created;
};

// 프리셋의 채널 바꾸기(수정 모드) — 추가상품가 기준과 상품번호 확인 대상이 그 채널로 바뀐다.
window.hkSupplementSetPresetChannel = function(select) {
  const preset = _hkSupplementActivePreset();
  if (!preset || !_hkSupplementEditMode) return;
  const channel = _hkSupplementChannelInfo(select.value).id;
  if (channel === preset.channel) return;
  _hkSupplementMutate(() => { preset.channel = channel; _hkSupplementChannel = channel; _hkSupplementActivePresetId = preset.id; });
};

window.hkSupplementRenamePreset = function(input) {
  const preset = _hkSupplementActivePreset();
  if (!preset || !_hkSupplementEditMode) return;
  const name = String(input.value || '').trim();
  if (!name) { input.value = preset.name; return; }
  if (name === preset.name) return;
  _hkSupplementMutate(() => { preset.name = name; });
};

// 기본 추가상품명(엑셀 첫 열) 수정 — 비우거나 "부자재"로 적으면 따로 저장하지 않고 기본값("부자재")을 쓴다. 행마다 따로 지정한 이름(row.group)은 건드리지 않는다.
window.hkSupplementRenameGroup = function(input) {
  const preset = _hkSupplementActivePreset();
  if (!preset || !_hkSupplementEditMode) return;
  const value = String(input.value || '').trim();
  const next = value === HK_SUPPLEMENT_DEFAULT_GROUP ? '' : value;
  if (next === (preset.groupName || '')) { input.value = _hkSupplementGroupName(preset); return; }
  _hkSupplementMutate(() => { if (next) preset.groupName = next; else delete preset.groupName; });
};

// 행 하나의 추가상품명 수정 — 기본 추가상품명과 같게 적거나 비우면 "기본값을 따름"으로 돌아간다.
window.hkSupplementPresetSetRowGroup = function(input) {
  const preset = _hkSupplementActivePreset();
  const row = preset && preset.rows[Number(input.dataset.idx)];
  if (!row || !_hkSupplementEditMode) return;
  const value = String(input.value || '').trim().slice(0, 100);
  const next = value === _hkSupplementGroupName(preset) ? '' : value;
  if (next === (row.group || '')) { input.value = row.group || _hkSupplementGroupName(preset); return; }
  _hkSupplementMutate(() => { if (next) row.group = next; else delete row.group; });
};

window.hkSupplementDeletePreset = function() {
  const preset = _hkSupplementActivePreset();
  if (!preset || !_hkSupplementEditMode) return;
  if (!confirm(`"${preset.name}" 프리셋을 삭제할까요? (항목 ${preset.rows.length}개, 상품번호 ${preset.productIds.length}개)`)) return;
  _hkSupplementEditingProducts = false; _hkSupplementPickerOpen = false;
  _hkSupplementMutate(() => {
    const presets = _hkSupplementPresets();
    presets.splice(presets.indexOf(preset), 1);
    _hkSupplementActivePresetId = _hkSupplementChannelPresets()[0]?.id || null; // 같은 채널의 다른 프리셋으로
  });
};

/* ── 상품번호: 복사(항상)·수정(수정 모드) ── */
window.hkSupplementCopyPresetProducts = async function(id, button) {
  const productIds = window.hkSupplementPresetProducts(id).map(item => item.productId);
  const text = productIds.join('\n');
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
  button.innerHTML = copied ? `<i class="fa-solid fa-check"></i> 복사됨 (${productIds.length}개)` : '<i class="fa-solid fa-triangle-exclamation"></i> 복사 실패';
  clearTimeout(button._resetTimer);
  button._resetTimer = setTimeout(() => { button.innerHTML = original; }, 1800);
  return copied;
};

window.hkSupplementEditProducts = function(open) {
  if (!_hkSupplementEditMode) return;
  _hkSupplementEditingProducts = !!open;
  _hkSupplementRerenderPane();
};

// 줄바꿈·공백·쉼표로 구분한 상품번호를 받아 숫자만 남기고 중복을 없앤다(순서 유지). 숫자가 아닌 조각은 무시하고 개수를 알려 준다.
window.hkSupplementApplyProducts = function() {
  const preset = _hkSupplementActivePreset();
  const area = document.querySelector('#pricing-tab-hk_supp .hk-supp-products-input');
  if (!preset || !area || !_hkSupplementEditMode) return;
  const tokens = area.value.split(/[\s,;]+/).map(token => token.trim()).filter(Boolean);
  const valid = [...new Set(tokens.filter(token => /^\d+$/.test(token)))];
  const ignored = tokens.filter(token => !/^\d+$/.test(token)).length;
  const duplicated = tokens.length - ignored - valid.length;
  _hkSupplementEditingProducts = false;
  _hkSupplementMutate(() => { preset.productIds = valid; });
  if (ignored || duplicated) alert(`상품번호 ${valid.length}개를 저장했습니다.${ignored ? `\n숫자가 아니라서 뺀 항목 ${ignored}개` : ''}${duplicated ? `\n중복이라 뺀 항목 ${duplicated}개` : ''}`);
};

/* ── 항목(행): 추가상품값 선택·삭제·추가 (수정 모드) ── */
// 추가상품값 드롭박스에서 항목을 고르면 그 코드로 바뀌고, 추가상품가·재고수량·사용여부·관리코드는 추가상품 목록에서 자동으로 채워진다.
window.hkSupplementPresetSelectItem = function(select) {
  const preset = _hkSupplementActivePreset();
  const index = Number(select.dataset.idx);
  const row = preset && preset.rows[index];
  if (!row || !_hkSupplementEditMode) return;
  const code = String(select.value || '');
  if (code && preset.rows.some((other, i) => i !== index && other.code === code)) { alert('이미 이 프리셋에 있는 항목입니다.'); _hkSupplementRerenderPane(); return; }
  if (row.code === code) return;
  _hkSupplementMutate(() => { row.code = code; });
};

window.hkSupplementPresetDeleteRow = function(index) {
  const preset = _hkSupplementActivePreset();
  if (!preset || !preset.rows[index] || !_hkSupplementEditMode) return;
  _hkSupplementMutate(() => { preset.rows.splice(index, 1); });
};

// 행 순서 바꾸기 — 위(-1)·아래(+1)로 한 칸씩 옮긴다(엑셀 행 순서가 그대로 바뀐다).
window.hkSupplementPresetMoveRow = function(index, delta) {
  const preset = _hkSupplementActivePreset();
  const target = index + delta;
  if (!preset || !_hkSupplementEditMode || !preset.rows[index] || !preset.rows[target]) return;
  _hkSupplementMutate(() => { const [row] = preset.rows.splice(index, 1); preset.rows.splice(target, 0, row); });
  document.querySelector(`#pricing-tab-hk_supp tr[data-idx="${target}"] .hk-supp-row-btn[data-move="${delta}"]`)?.focus();
};

window.hkSupplementPresetAddBlank = function() {
  const preset = _hkSupplementActivePreset();
  if (!preset || !_hkSupplementEditMode) return;
  _hkSupplementMutate(() => { preset.rows.push({ code: '' }); });
  document.querySelector(`#pricing-tab-hk_supp tr[data-idx="${preset.rows.length - 1}"] select`)?.focus();
};

// "목록에서 추가" — 추가상품 목록(77개) 중 이 프리셋에 아직 없는 것을 검색해서 체크한 만큼 뒤에 붙인다.
window.hkSupplementPickerToggle = function() {
  if (!_hkSupplementEditMode) return;
  _hkSupplementPickerOpen = !_hkSupplementPickerOpen;
  _hkSupplementPickerQuery = '';
  _hkSupplementRerenderPane();
};
window.hkSupplementPickerSearch = function(value) {
  _hkSupplementPickerQuery = String(value || '');
  const query = _hkSupplementPickerQuery.trim().toLowerCase();
  document.querySelectorAll('#pricing-tab-hk_supp .hk-supp-picker-item').forEach(label => {
    label.hidden = !!query && !label.dataset.search.includes(query);
  });
};
window.hkSupplementPickerAdd = function() {
  const preset = _hkSupplementActivePreset();
  if (!preset || !_hkSupplementEditMode) return;
  const codes = [...document.querySelectorAll('#pricing-tab-hk_supp .hk-supp-picker-item input:checked')].map(input => input.value);
  if (!codes.length) { alert('추가할 항목을 체크해 주세요.'); return; }
  const have = new Set(preset.rows.map(row => row.code));
  _hkSupplementPickerOpen = false; _hkSupplementPickerQuery = '';
  _hkSupplementMutate(() => { codes.filter(code => !have.has(code)).forEach(code => preset.rows.push({ code })); });
};

/* ── 대량 수정: 관리코드 목록을 붙여 넣어 한 번에 등록 ── */
// 붙여 넣은 글을 줄(또는 탭·쉼표·세미콜론)로 나눠 한 줄씩 추가상품 목록과 짝짓는다 — 관리코드(대소문자 무시)를 먼저, 없으면 추가상품값(이름) 그대로.
// 관리코드로 넣는 걸 권장한다(짧고 유일하고 엑셀에서 바로 복사되며 이름 표기가 달라져도 안 흔들린다).
// 두 가지 모양을 받는다:
//  ① 관리코드(또는 추가상품값)만 — 줄바꿈·쉼표·세미콜론으로 구분. 추가상품명은 프리셋 기본값을 쓴다.
//  ② 엑셀 표를 그대로 복사한 줄(탭 구분: 추가상품명 | 추가상품값 | 추가상품가 | 재고수량 | 사용여부 | 관리코드) — 관리코드 칸으로 항목을 찾고,
//     첫 칸의 추가상품명을 그 행의 추가상품명으로 가져온다(첫 칸이 비면 위 줄의 이름을 이어 쓴다 — 병합된 셀을 복사하면 그렇게 붙는다). 머리글 줄은 건너뛴다.
// 반환: entries[{ code, group }] (group 빈 문자열 = 기본값), unknown, duplicates, alreadyIn.
function _hkSupplementBulkParse(text, preset) {
  const rows = window.hkSupplementRows();
  const byCode = new Map(rows.map(row => [row.code.toLowerCase(), row]));
  const byName = new Map(rows.map(row => [_hkSupplementNameKey(row.name), row]));
  const defaultGroup = _hkSupplementGroupName(preset);
  const entries = [], unknown = [];
  let duplicates = 0, alreadyIn = 0, total = 0, carry = '';
  const have = new Set(preset.rows.map(row => row.code));
  const seen = new Set();
  const push = (item, group) => {
    total++;
    if (seen.has(item.code)) { duplicates++; return; }
    seen.add(item.code);
    if (_hkSupplementBulkMode === 'append' && have.has(item.code)) { alreadyIn++; return; }
    entries.push({ code: item.code, group: group && group !== defaultGroup ? group : '' });
  };
  String(text || '').split(/\r?\n/).forEach(rawLine => {
    if (!rawLine.trim()) return;
    if (rawLine.includes('\t')) {
      const cells = rawLine.split('\t').map(cell => cell.trim());
      if (/추가상품명/.test(cells[0]) && cells.some(cell => /추가상품값/.test(cell))) return; // 머리글(스마트스토어·11번가 서식 모두)
      if (cells[0]) carry = cells[0];
      let item = null;
      for (let i = cells.length - 1; i >= 1 && !item; i--) item = byCode.get(cells[i].toLowerCase()) || null;
      for (let i = 1; i < cells.length && !item; i++) item = byName.get(_hkSupplementNameKey(cells[i])) || null;
      if (!item) { total++; unknown.push(cells.filter(Boolean).slice(-1)[0] || rawLine.trim()); return; }
      push(item, carry);
      return;
    }
    rawLine.split(/[,;]+/).map(token => token.trim()).filter(Boolean).forEach(token => {
      const item = byCode.get(token.toLowerCase()) || byName.get(_hkSupplementNameKey(token)) || null;
      if (!item) { total++; unknown.push(token); return; }
      push(item, '');
    });
  });
  return { total, entries, codes: entries.map(entry => entry.code), unknown, duplicates, alreadyIn };
}
function _hkSupplementNameKey(name) {
  return String(name || '').replace(/[●★☆◆■※_\s]/g, '').toLowerCase();
}
function _hkSupplementBulkSummaryHtml(preset) {
  if (!_hkSupplementBulkText.trim()) return '붙여 넣은 내용이 없습니다.';
  const result = _hkSupplementBulkParse(_hkSupplementBulkText, preset);
  const groups = [...new Set(result.entries.filter(entry => entry.group).map(entry => entry.group))];
  const parts = [`인식 <b>${result.codes.length}개</b>`];
  if (groups.length) parts.push(`다른 추가상품명 ${groups.length}종(${_hkEscapeAttr(groups.slice(0, 4).join(', '))}${groups.length > 4 ? ' …' : ''})`);
  if (result.unknown.length) parts.push(`<span class="hk-supp-unused">목록에 없음 ${result.unknown.length}개: ${_hkEscapeAttr(result.unknown.slice(0, 5).join(', '))}${result.unknown.length > 5 ? ' …' : ''}</span>`);
  if (result.duplicates) parts.push(`중복 ${result.duplicates}개(뺌)`);
  if (result.alreadyIn) parts.push(`이미 있음 ${result.alreadyIn}개(뺌)`);
  return parts.join(' · ');
}

window.hkSupplementBulkOpen = function() {
  if (!_hkSupplementEditMode) window.hkSupplementSetEditMode(true);
  _hkSupplementBulkOpen = true; _hkSupplementEditingProducts = false; _hkSupplementPickerOpen = false;
  _hkSupplementRerenderPane();
  document.querySelector('#pricing-tab-hk_supp .hk-supp-bulk-input')?.focus();
};
window.hkSupplementBulkClose = function() {
  _hkSupplementBulkOpen = false; _hkSupplementBulkText = '';
  _hkSupplementRerenderPane();
};
window.hkSupplementBulkInput = function(textarea) {
  _hkSupplementBulkText = textarea.value;
  const preset = _hkSupplementActivePreset();
  const summary = document.querySelector('#pricing-tab-hk_supp .hk-supp-bulk-summary');
  if (preset && summary) summary.innerHTML = _hkSupplementBulkSummaryHtml(preset);
};
window.hkSupplementBulkMode = function(mode) {
  _hkSupplementBulkMode = mode === 'append' ? 'append' : 'replace';
  const preset = _hkSupplementActivePreset();
  const summary = document.querySelector('#pricing-tab-hk_supp .hk-supp-bulk-summary');
  if (preset && summary) summary.innerHTML = _hkSupplementBulkSummaryHtml(preset);
};
// 적용 — 목록에 있는 것만 등록한다(없는 건 빼고 알림). 한 번의 수정으로 기록되니 [되돌리기] 한 번에 원래대로 돌아간다.
window.hkSupplementBulkApply = function() {
  const preset = _hkSupplementActivePreset();
  if (!preset || !_hkSupplementEditMode) return;
  const result = _hkSupplementBulkParse(_hkSupplementBulkText, preset);
  if (!result.codes.length) { alert(result.unknown.length ? `추가상품 목록에서 찾은 항목이 없습니다. (목록에 없음 ${result.unknown.length}개)` : '적용할 항목이 없습니다. 관리코드를 한 줄에 하나씩 붙여 넣어 주세요.'); return; }
  const mode = _hkSupplementBulkMode;
  _hkSupplementBulkOpen = false; _hkSupplementBulkText = '';
  const toRow = entry => (entry.group ? { code: entry.code, group: entry.group } : { code: entry.code });
  _hkSupplementMutate(() => {
    if (mode === 'append') result.entries.forEach(entry => preset.rows.push(toRow(entry)));
    else preset.rows = result.entries.map(toRow);
  });
  if (result.unknown.length) alert(`${result.codes.length}개를 ${mode === 'append' ? '추가' : '등록'}했습니다.\n\n추가상품 목록에 없어서 뺀 항목 ${result.unknown.length}개:\n${result.unknown.slice(0, 15).join('\n')}${result.unknown.length > 15 ? `\n… 외 ${result.unknown.length - 15}개` : ''}`);
};

function _hkSupplementBulkHtml(preset) {
  return `<div class="hk-supp-bulk">
    <div class="hk-supp-bulk-title">대량 수정 — 관리코드를 한 줄에 하나씩 붙여 넣으세요 <small>(엑셀 표를 그대로 복사해 붙여도 됩니다 — 관리코드 칸으로 찾고 첫 칸의 추가상품명도 가져옵니다 · 추가상품값 이름도 인식하지만 관리코드를 권장합니다)</small></div>
    <textarea class="hk-supp-bulk-input" rows="10" oninput="hkSupplementBulkInput(this)" placeholder="TP_GY48&#10;TP_GY100&#10;TP_AL&#10;…">${_hkEscapeAttr(_hkSupplementBulkText)}</textarea>
    <div class="hk-supp-bulk-mode">
      <label><input type="radio" name="hkSuppBulkMode" value="replace" onchange="hkSupplementBulkMode(this.value)"${_hkSupplementBulkMode === 'replace' ? ' checked' : ''}> 이 목록으로 교체 <small>(현재 항목 ${preset.rows.length}개는 모두 바뀜)</small></label>
      <label><input type="radio" name="hkSuppBulkMode" value="append" onchange="hkSupplementBulkMode(this.value)"${_hkSupplementBulkMode === 'append' ? ' checked' : ''}> 뒤에 추가</label>
    </div>
    <div class="hk-supp-bulk-summary">${_hkSupplementBulkSummaryHtml(preset)}</div>
    <div class="hk-supp-bulk-actions">
      <button type="button" class="pim-btn-confirm" onclick="hkSupplementBulkApply()">적용</button>
      <button type="button" class="pim-btn-cancel" onclick="hkSupplementBulkClose()">닫기</button>
    </div>
  </div>`;
}

/* ── 화면 ── */
// 추가상품값 드롭박스 — 추가상품 목록 전체를 그룹별로 보여 주고, 다른 행에서 이미 쓴 항목은 뺀다. 이 행의 코드가 목록에 없으면 그 코드를 따로 표시한다.
function _hkSupplementItemSelectHtml(preset, view, index) {
  const usedElsewhere = new Set(preset.rows.filter((_, i) => i !== index).map(row => row.code).filter(Boolean));
  const groups = [];
  window.hkSupplementRows().forEach(row => {
    if (usedElsewhere.has(row.code)) return;
    let group = groups.find(item => item.name === row.group);
    if (!group) { group = { name: row.group, rows: [] }; groups.push(group); }
    group.rows.push(row);
  });
  const orphan = view.code && !view.linked ? `<option value="${_hkEscapeAttr(view.code)}" selected>(목록에 없음) ${_hkEscapeAttr(view.code)}</option>` : '';
  const placeholder = `<option value=""${view.code ? '' : ' selected'}>추가상품값 선택…</option>`;
  const optgroups = groups.map(group => `<optgroup label="${_hkEscapeAttr(group.name)}">${group.rows.map(row =>
    `<option value="${_hkEscapeAttr(row.code)}"${row.code === view.code ? ' selected' : ''}>${_hkEscapeAttr(row.name)} (${_hkEscapeAttr(row.code)})${row.use === 'N' ? ' · 사용안함' : ''}</option>`).join('')}</optgroup>`).join('');
  return `<select class="hk-supp-cell hk-supp-item-select" data-idx="${index}" onchange="hkSupplementPresetSelectItem(this)" aria-label="추가상품값">${placeholder}${orphan}${optgroups}</select>`;
}

function _hkSupplementPresetRowHtml(preset, view, index, editing, total) {
  const nameCell = editing ? _hkSupplementItemSelectHtml(preset, view, index)
    : (view.code && !view.linked ? `<span class="hk-supp-unused">(목록에 없음) ${_hkEscapeAttr(view.code)}</span>` : (view.name ? _hkEscapeAttr(view.name) : '<span class="hk-supp-unused">선택 안 함</span>'));
  return `<tr data-idx="${index}" class="${view.use === 'N' ? 'is-inactive' : ''}">
      <td class="hk-supp-cell-group">${editing
        ? `<input type="text" class="hk-supp-cell hk-supp-group-cell${view.group !== _hkSupplementGroupName(preset) ? ' is-edited' : ''}" list="hkSuppGroupList" data-idx="${index}" value="${_hkEscapeAttr(view.group)}" placeholder="${_hkEscapeAttr(_hkSupplementGroupName(preset))}" onchange="hkSupplementPresetSetRowGroup(this)" aria-label="추가상품명">`
        : _hkEscapeAttr(view.group)}</td>
      <td class="hk-supp-item-cell">${nameCell}</td>
      <td class="hk-iso-draft-price">${_hkIsoDraftNumber(view.price)}</td>
      <td>${view.linked ? _hkIsoDraftNumber(view.stock) : '—'}</td>
      <td>${view.linked ? view.use : '—'}</td>
      <td class="hk-iso-draft-code">${_hkEscapeAttr(view.code) || '—'}</td>
      ${editing ? `<td class="hk-supp-cell-actions">
        <button type="button" class="hk-supp-row-btn" data-move="-1" onclick="hkSupplementPresetMoveRow(${index}, -1)" title="위로 이동"${index === 0 ? ' disabled' : ''}><i class="fa-solid fa-arrow-up"></i></button>
        <button type="button" class="hk-supp-row-btn" data-move="1" onclick="hkSupplementPresetMoveRow(${index}, 1)" title="아래로 이동"${index === total - 1 ? ' disabled' : ''}><i class="fa-solid fa-arrow-down"></i></button>
        <button type="button" class="hk-supp-row-btn hk-supp-row-delete" onclick="hkSupplementPresetDeleteRow(${index})" title="이 행 삭제"><i class="fa-solid fa-xmark"></i></button></td>` : ''}
    </tr>`;
}

function _hkSupplementPresetProductsHtml(preset, editing) {
  const products = window.hkSupplementPresetProducts(preset.id);
  const unlisted = products.filter(item => !item.inList).length;
  const summary = `<span class="hk-supp-preset-products-title">적용 상품 <b>${products.length}개</b>${unlisted ? ` · <span class="hk-supp-unused">몰별 표에 없는 번호 ${unlisted}개</span>` : ''}</span>`;
  if (editing && _hkSupplementEditingProducts) {
    return `<div class="hk-supp-preset-products is-editing">
      ${summary}
      <textarea class="hk-supp-products-input" rows="8" placeholder="상품번호를 한 줄에 하나씩(또는 공백·쉼표로 구분해서) 붙여넣으세요">${preset.productIds.join('\n')}</textarea>
      <div class="hk-supp-products-actions">
        <button type="button" class="pim-btn-confirm" onclick="hkSupplementApplyProducts()">적용</button>
        <button type="button" class="pim-btn-cancel" onclick="hkSupplementEditProducts(false)">취소</button>
      </div>
    </div>`;
  }
  return `<div class="hk-supp-preset-products">
    ${summary}
    <button type="button" class="pim-btn-cancel hk-supp-copy-btn" onclick="hkSupplementCopyPresetProducts('${_hkEscapeAttr(preset.id)}', this)"${products.length ? '' : ' disabled'}><i class="fa-regular fa-copy"></i> 상품번호 복사</button>
    ${editing ? '<button type="button" class="pim-btn-cancel" onclick="hkSupplementEditProducts(true)"><i class="fa-solid fa-pen"></i> 번호 수정</button>' : ''}
  </div>`;
}

function _hkSupplementPickerHtml(preset) {
  const have = new Set(preset.rows.map(row => row.code));
  const items = window.hkSupplementRows().filter(row => !have.has(row.code));
  const query = _hkSupplementPickerQuery.trim().toLowerCase();
  const list = items.map(row => {
    const search = `${row.name} ${row.code} ${row.group}`.toLowerCase();
    return `<label class="hk-supp-picker-item" data-search="${_hkEscapeAttr(search)}"${query && !search.includes(query) ? ' hidden' : ''}>
      <input type="checkbox" value="${_hkEscapeAttr(row.code)}"> <span>${_hkEscapeAttr(row.name)}</span> <small>${_hkEscapeAttr(row.code)} · ${_hkEscapeAttr(row.group)}${row.use === 'N' ? ' · 사용안함' : ''}</small></label>`;
  }).join('');
  return `<div class="hk-supp-picker">
    <div class="hk-supp-picker-head">
      <input type="search" class="pim-input" placeholder="이름·코드·그룹 검색" value="${_hkEscapeAttr(_hkSupplementPickerQuery)}" oninput="hkSupplementPickerSearch(this.value)">
      <button type="button" class="pim-btn-confirm" onclick="hkSupplementPickerAdd()">체크한 항목 추가</button>
      <button type="button" class="pim-btn-cancel" onclick="hkSupplementPickerToggle()">닫기</button>
    </div>
    <div class="hk-supp-picker-list">${list || '<p class="pricing-empty-msg">추가할 수 있는 항목이 없습니다 (목록의 항목이 모두 들어 있습니다).</p>'}</div>
  </div>`;
}

// 채널 탭 — 채널마다 프리셋 개수를 보여 주고, 누르면 그 채널의 프리셋만 보인다.
function _hkSupplementChannelTabsHtml() {
  return `<div class="bead-subtab-bar hk-supp-channel-tabs">${HK_SUPPLEMENT_CHANNELS.map(channel => {
    const count = _hkSupplementChannelPresets(channel.id).length;
    return `<button type="button" class="bead-subtab${channel.id === _hkSupplementChannel ? ' active' : ''}" onclick="hkSupplementSetChannel('${channel.id}')">${_hkEscapeAttr(channel.label)}<span class="bead-subtab-sub">프리셋 ${count}개</span></button>`;
  }).join('')}</div>`;
}

// 새 프리셋 창 — 이름과 채널을 함께 정한다(채널 기본값은 지금 보는 채널).
function _hkSupplementNewFormHtml() {
  const channelOptions = HK_SUPPLEMENT_CHANNELS.map(channel => `<option value="${channel.id}"${channel.id === _hkSupplementChannel ? ' selected' : ''}>${_hkEscapeAttr(channel.label)}</option>`).join('');
  return `<div class="hk-supp-new-form">
    <div class="hk-supp-bulk-title">새 프리셋 등록</div>
    <div class="hk-supp-new-fields">
      <label class="pctd-field"><span class="pctd-field-label">채널</span><select class="pim-input hk-supp-new-channel">${channelOptions}</select></label>
      <label class="pctd-field"><span class="pctd-field-label">프리셋 이름 (구분용)</span>
        <input type="text" class="pim-input hk-supp-new-name" placeholder="예: 스티로폼" onkeydown="if(event.key==='Enter'){hkSupplementCreatePreset();}"></label>
      <button type="button" class="pim-btn-confirm" onclick="hkSupplementCreatePreset()">만들기</button>
      <button type="button" class="pim-btn-cancel" onclick="hkSupplementNewCancel()">취소</button>
    </div>
    <small class="hk-supp-new-hint">채널에 따라 추가상품가 기준과 엑셀 서식이 정해집니다 — 한국단열·한국단열라이프는 한국단열가·스마트스토어 서식, 11번가는 지마켓/11번가가·11번가 서식</small>
  </div>`;
}

function _hkSupplementPresetCardHtml() {
  const presets = _hkSupplementChannelPresets();
  const preset = _hkSupplementActivePreset();
  const editing = _hkSupplementEditMode;
  const channelInfo = _hkSupplementChannelInfo(_hkSupplementChannel);
  const header = `<div class="pricing-result-header">
      <div class="pricing-result-title">엑셀 템플릿<span class="pricing-spec-badge">${_hkSupplementChannelInfo(_hkSupplementChannel).format === '11st' ? '11번가 추가상품 업로드 서식 (관리코드 열 없음 · 상태 = 사용여부)' : '스마트스토어 추가구성목록 업로드 서식'}</span></div>
      <span class="pricing-result-hint">${editing ? '수정 중 — 추가상품값만 드롭박스로 고르고, 추가상품가·재고수량·사용여부·관리코드는 추가상품 목록에서 자동으로 채워집니다' : '추가상품가·재고수량·사용여부(Y/N)·관리코드는 추가상품 목록에서 자동으로 가져옵니다 · 바꾸려면 [수정]을 누르세요'} · 프리셋은 "단가표 저장"을 눌러야 저장됩니다</span>
    </div>`;
  const bulkButton = '<button type="button" class="pim-btn-cancel" onclick="hkSupplementBulkOpen()" title="관리코드 목록을 붙여 넣어 한 번에 등록합니다"><i class="fa-solid fa-table-list"></i> 대량 수정</button>';
  const editButton = editing
    ? `${bulkButton}
       <button type="button" class="pim-btn-cancel" onclick="hkSupplementUndo()"${_hkSupplementUndoStack.length ? '' : ' disabled'} title="방금 바꾼 것을 하나 취소합니다"><i class="fa-solid fa-rotate-left"></i> 되돌리기${_hkSupplementUndoStack.length ? ` (${_hkSupplementUndoStack.length})` : ''}</button>
       <button type="button" class="pim-btn-cancel" onclick="hkSupplementCancelEdit()" title="수정을 시작한 뒤로 바꾼 것을 모두 버립니다"><i class="fa-solid fa-xmark"></i> 수정 취소</button>
       <button type="button" class="pim-btn-confirm" onclick="hkSupplementSetEditMode(false)"><i class="fa-solid fa-check"></i> 수정 완료</button>`
    : `<button type="button" class="pim-btn-cancel" onclick="hkSupplementSetEditMode(true)"><i class="fa-solid fa-pen"></i> 수정</button>
       ${bulkButton}`;
  if (!preset) {
    return `<div class="card pricing-result-card hk-sub-card hk-supp-preset-card">${header}
      ${_hkSupplementChannelTabsHtml()}
      <div class="hk-supp-preset-bar"><p class="pricing-empty-msg">${_hkEscapeAttr(channelInfo.label)} 채널에는 프리셋이 없습니다.</p>
        <button type="button" class="pim-btn-confirm" onclick="hkSupplementNewPreset()"><i class="fa-solid fa-plus"></i> 새 프리셋 추가</button>${editing ? editButton : ''}</div>
      ${_hkSupplementNewOpen ? _hkSupplementNewFormHtml() : ''}</div>`;
  }
  const views = _hkSupplementPresetViews(preset);
  const missing = _hkSupplementPresetProblems(preset).length;
  const options = presets.map(item => `<option value="${_hkEscapeAttr(item.id)}"${item.id === preset.id ? ' selected' : ''}>${_hkEscapeAttr(item.name)} (${item.rows.length}개)</option>`).join('');
  const widths = editing ? [15, 31, 10, 9, 6, 13, 16] : [14, 40, 12, 11, 9, 14];
  const groupNames = [...new Set([_hkSupplementGroupName(preset), ...views.map(view => view.group)])];
  const groupList = editing ? `<datalist id="hkSuppGroupList">${groupNames.map(name => `<option value="${_hkEscapeAttr(name)}"></option>`).join('')}</datalist>` : '';
  const channelSelect = editing ? `<label class="pctd-field"><span class="pctd-field-label">채널</span>
        <select class="pim-input" onchange="hkSupplementSetPresetChannel(this)">${HK_SUPPLEMENT_CHANNELS.map(channel => `<option value="${channel.id}"${channel.id === preset.channel ? ' selected' : ''}>${_hkEscapeAttr(channel.label)}</option>`).join('')}</select></label>` : '';
  return `<div class="card pricing-result-card hk-sub-card hk-supp-preset-card${editing ? ' is-editing' : ''}">${header}
    ${_hkSupplementChannelTabsHtml()}
    ${_hkSupplementNewOpen ? _hkSupplementNewFormHtml() : ''}
    <div class="hk-supp-preset-bar">
      <label class="pctd-field"><span class="pctd-field-label">프리셋</span>
        <select class="pim-input" onchange="hkSupplementSelectPreset(this.value)">${options}</select></label>
      ${channelSelect}
      <button type="button" class="pim-btn-cancel" onclick="hkSupplementNewPreset()" title="새 프리셋(엑셀 템플릿)을 추가합니다"><i class="fa-solid fa-plus"></i> 새 프리셋 추가</button>
      ${editing ? `<label class="pctd-field"><span class="pctd-field-label">프리셋 이름 (구분용)</span>
        <input type="text" class="pim-input hk-supp-preset-name" value="${_hkEscapeAttr(preset.name)}" onchange="hkSupplementRenamePreset(this)"></label>
      <label class="pctd-field"><span class="pctd-field-label">기본 추가상품명 (엑셀 첫 열 · 비우면 "${HK_SUPPLEMENT_DEFAULT_GROUP}")</span>
        <input type="text" class="pim-input hk-supp-group-name" value="${_hkEscapeAttr(_hkSupplementGroupName(preset))}" placeholder="${HK_SUPPLEMENT_DEFAULT_GROUP}" onchange="hkSupplementRenameGroup(this)"></label>
      <button type="button" class="pim-btn-cancel" onclick="hkSupplementDeletePreset()"><i class="fa-regular fa-trash-can"></i> 프리셋 삭제</button>` : ''}
      ${editButton}
      <button type="button" class="pim-btn-confirm" onclick="hkSupplementDownloadPreset('${_hkEscapeAttr(preset.id)}')"${channelInfo.templateReady ? '' : ` disabled title="${_hkEscapeAttr(channelInfo.label)} 엑셀 서식은 아직 정해지지 않았습니다 — 서식을 받으면 적용합니다"`}><i class="fa-solid fa-file-excel"></i> 엑셀 다운로드</button>
    </div>
    ${_hkSupplementPresetProductsHtml(preset, editing)}
    ${editing && _hkSupplementBulkOpen ? _hkSupplementBulkHtml(preset) : ''}
    <div class="hk-supp-preset-wrap">${groupList}
      <table class="pricing-table hk-supp-preset-table">
        <colgroup>${widths.map(width => `<col style="width:${width}%">`).join('')}</colgroup>
        <thead><tr>${HK_SUPPLEMENT_EXCEL_HEADER.map(title => `<th class="hk-sub-head-base">${title}${title === '추가상품가' ? `<br><small>${_hkEscapeAttr(_hkSupplementChannelInfo(preset.channel).priceLabel)}</small>` : ''}</th>`).join('')}${editing ? '<th class="hk-sub-head-base"></th>' : ''}</tr></thead>
        <tbody>${views.map((view, index) => _hkSupplementPresetRowHtml(preset, view, index, editing, views.length)).join('') || `<tr><td colspan="${editing ? 7 : 6}" class="pricing-empty-msg">항목이 없습니다.${editing ? ' 아래에서 추가해 주세요.' : ' [수정]을 눌러 추가하세요.'}</td></tr>`}</tbody>
      </table>
    </div>
    ${editing ? `<div class="hk-supp-preset-add">
      <button type="button" class="pim-btn-cancel" onclick="hkSupplementPickerToggle()"><i class="fa-solid fa-list-check"></i> 목록에서 추가</button>
      <button type="button" class="pim-btn-cancel" onclick="hkSupplementPresetAddBlank()"><i class="fa-solid fa-plus"></i> 행 추가</button>
    </div>` : ''}
    ${missing ? `<div class="hk-supp-preset-warn"><span class="hk-supp-unused">확인 필요한 행 ${missing}개 — 추가상품값을 고르지 않았거나 목록에 없는 코드입니다</span></div>` : ''}
    ${editing && _hkSupplementPickerOpen ? _hkSupplementPickerHtml(preset) : ''}
  </div>`;
}

// 추가상품 탭 안의 두 화면 — "추가상품 목록"과 "엑셀 템플릿"은 한 화면에 같이 나오지 않게 서브탭으로 나눈다(사용자 요청).
let _hkSupplementView = 'list'; // 'list' | 'template'

window.hkSupplementSetView = function(view) {
  _hkSupplementView = view === 'template' ? 'template' : 'list';
  window.hkSupplementLeaveEdit(); // 서브탭을 바꾸면 수정 모드는 꺼진다
  const pane = document.getElementById('pricing-tab-hk_supp');
  if (pane) pane.innerHTML = renderHkSupplementPane();
};

function _hkSupplementListHtml() {
  const rows = window.hkSupplementRows();
  const groups = HK_SUPPLEMENT_GROUPS.map(({ group }) => ({ group, rows: rows.filter(row => row.group === group) }));
  const missing = rows.filter(row => row.price == null).length;
  return `<div class="card pricing-result-card hk-sub-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">한국단열 추가상품<span class="pricing-spec-badge">${rows.length}개 · ${groups.length}그룹</span></div>
        <span class="pricing-result-hint">추가상품가 = 각 단가표 판매가 + 추가비용 — 단가표를 고치면 자동으로 바뀝니다 · 지마켓/11번가 = 한국단열가 × 1.08 (100원 올림)${missing ? ` · <b>단가표에서 못 찾은 코드 ${missing}개</b>` : ''}</span>
      </div>
      <div class="hk-iso-accordion-list">${groups.map((g, i) => _hkSupplementGroupHtml(g.group, g.rows, i)).join('')}</div>
    </div>`;
}

function renderHkSupplementPane() {
  const view = _hkSupplementView === 'template' ? 'template' : 'list';
  const tabs = [
    ['list', '추가상품 목록', `${window.hkSupplementRows().length}개`],
    ['template', '엑셀 템플릿', `프리셋 ${_hkSupplementPresets().length}개`],
  ].map(([id, label, sub]) => `<button type="button" class="bead-subtab${id === view ? ' active' : ''}" onclick="hkSupplementSetView('${id}')">${label}<span class="bead-subtab-sub">${sub}</span></button>`).join('');
  return `<div id="hkSupplementSection">
    <div class="bead-subtab-bar hk-supp-subtabs">${tabs}</div>
    ${view === 'template' ? _hkSupplementPresetCardHtml() : _hkSupplementListHtml()}
  </div>`;
}
