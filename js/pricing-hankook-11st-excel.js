/* ═══════════════════════════════════════
   11번가 옵션 엑셀 — 11번가 "필수옵션선택" 옵션 일괄 수정용 (판매자 오피스 옵션 엑셀 양식)
   · 한 상품 안에 옵션이 여러 개(두께·규격) 있는 11번가 상품의 옵션 가격을 단가표 값으로 내려받는다. 단가표 값은 바꾸지 않는다(읽기 전용).
   · 1단 옵션 열: 이미지 URL 입력 여부 | No. | 필수옵션선택 | 옵션 이미지 URL | 자세히보기 이미지 URL | 재고수량 | 옵션가격 | 상태 | 옵션추가무게 | 셀러재고코드
     (사용자가 준 1534504863 옵션 엑셀 그대로 — 2026-10-08). 첫 데이터 행의 첫 칸만 'N', 나머지 칸은 비운다.
   · 2단 옵션 열(사용자가 준 1548926732 옵션 엑셀, 2026-10-08): 이미지 URL 입력 여부 | No. | 옵션명 1 | 옵션 이미지 URL | 자세히보기 이미지 URL | 옵션명 2 | 재고수량 | 옵션가격 | 상태 | 옵션추가무게 | 셀러재고코드.
     한 줄이 1단 옵션 × 2단 옵션 한 조합이고, No.는 1단 옵션(옵션명 1) 번호라 같은 옵션명 1의 줄은 같은 번호가 반복된다. 줄 순서는 11번가 페이지 순서.
   · **2단 옵션 새 양식(v2)** — 1534558353은 11번가 옵션 엑셀 양식이 다르다(사용자가 준 엑셀, 2026-10-08. 고객 페이지·옵션 구조는 1548926732와 같아서 페이지로는 구분이 안 되고, 판매자 오피스에서 받은 양식이 다르다):
     열 `안내 | 이미지 URL 입력 여부 | No. | 옵션명 1 | 옵션명 2 | 옵션 대표이미지 URL | 옵션 추가이미지 URL | 옵션 상품상세 | 옵션가격 | 재고수량 | 상태 | 셀러재고코드`(옵션가격이 재고수량 앞, 옵션추가무게 없음),
     **1행 = 열 제목, 2행 = 안내 칸에 "1~2행은 삭제하지 마세요."**, 데이터는 3행부터, 'N'은 첫 데이터 행의 둘째 칸(이미지 URL 입력 여부), No.는 줄마다 01·02·03…(옵션명 1 묶음 번호가 아님).
     이 양식을 쓰는 상품은 NEW_STYLE_PRODUCTS에 상품번호를 적는다. 다른 2단 상품(3731788703·3733599906)이 어느 양식인지는 아직 모른다 — 기본은 위의 옛 양식.
   · 옵션가격 = 그 옵션 11번가 판매가 − 상품 기준가(기준가 옵션 = 0원). 기준가는 표의 기준 옵션(파란 칸). 기준가의 −50%~+300%를 넘으면 알림만 한다(11번가 "내 상품의 옵션정책" — 판매가 11,400원이면 옵션 추가금 −5,700 ~ +34,200원, 사용자 확인 2026-10-08).
   · **옵션명은 엑셀을 만드는 순간 확장이 11번가 상품 페이지에서 직접 읽어 온다**(st11options, 확장 0.32.3~) — 11번가에서 이름을 바꿔도 항상 최신 이름이다.
     단가표 옵션과는 단가표에 적어 둔 11번가 옵션명(name11st·검사용 storeName)이 같으면 그 옵션으로, 아니면 규격(두께·크기·장수·접착)으로 짝짓는다 — 규격은 아이소핑크·스티로폼 상품코드(Iso_600_900_20_1, St_430_430_10_5, Neo_… )만 읽는다.
     11번가 페이지에는 품절 옵션도 이름·가격과 함께 보인다(재고 0·disabled) — 재고 0이면 임시품절·재고 0으로 낸다(1641037728로 확인, 2026-10-08). 구매자 페이지에는 판매중지
     옵션과 셀러재고코드가 안 나온다 → 판매중지 옵션은 파일 끝에 단가표 이름(name11st)으로 넣고, 셀러재고코드 칸은 비운다.
     확장이 없거나 못 읽으면 옵션에 적어 둔 name11st(11번가 옵션명)로 만든다 — 이 이름이 전부 적힌 상품만.
   · 2단 옵션은 확장이 "1단 / 2단"으로 합쳐 준 이름을 ' / '로 나눠 옵션명 1·2에 넣는다. 3단 이상은 지원하지 않는다.
   · **열 제목(필수옵션선택 / 옵션명 1·2 / 제품선택·디자인선택)은 11번가 상품의 옵션 항목 이름 그대로**다 — 확장이 단계 머리글에서 읽어 준다(levelNames, 확장 0.32.4~). 못 읽으면 기본 이름.
   · 단열벽지(2026-10-08, 사용자 엑셀 `1684647231`): 2단 옵션 — 1단 = 제품선택(타입·두께·길이, 단가표 옵션 하나), 2단 = 디자인선택(색상 수십 개). 색상 줄은 전부 그 1단 옵션의 옵션가격을 같이 쓴다.
     짝짓기는 1단 이름만 보고(가격검사와 같은 열쇠 WP|타입|두께|길이), 색상 상태는 단가표가 아니라 11번가 페이지에서 읽는다(재고 0 = 임시품절).
   · 재고수량: 11번가에서 읽은 현재 재고를 그대로 쓴다(건드리지 않음). 임시품절·재고 0 옵션은 11번가 페이지가 재고를 0으로 보여 줘서 같은 상품의 가장 큰 재고로 채운다(사용자 엑셀도
     임시품절 옵션의 재고를 그대로 99,999로 둔다). 판매중지는 0. 읽지 못하는 경우(확장 없음) 9,999. **상태 칸은 '사용함'·'임시품절' 두 가지뿐**(사용자 업로드 확인 2026-10-12, '사용안함'은 오류) — 판매중 '사용함' / 품절·판매중지 '임시품절'.
   · 11번가 업로드는 .xls(97-2003)만 받는다 — 파일 확장자를 .xls로 쓰면 XLSX 라이브러리가 그 형식으로 저장한다.
═══════════════════════════════════════ */
(function () {
  // 열 제목 — 옵션 항목 이름(names)은 11번가 상품마다 다르다(필수옵션선택·옵션명 1/2·제품선택/디자인선택 …).
  const header1 = names => ['이미지 URL 입력 여부', 'No.', names[0] || '필수옵션선택', '옵션 이미지 URL', '자세히보기 이미지 URL', '재고수량', '옵션가격', '상태', '옵션추가무게', '셀러재고코드'];
  const headerNew = names => ['안내', '이미지 URL 입력 여부', 'No.', names[0] || '옵션명 1', names[1] || '옵션명 2', '옵션 대표이미지 URL', '옵션 추가이미지 URL', '옵션 상품상세', '옵션가격', '재고수량', '상태', '셀러재고코드'];
  const NOTICE_NEW = '1~2행은 삭제하지 마세요.';
  const NEW_STYLE_PRODUCTS = new Set(['1534558353']); // 2단 옵션 새 양식(위 설명)을 쓰는 11번가 상품
  const header2 = names => ['이미지 URL 입력 여부', 'No.', names[0] || '옵션명 1', '옵션 이미지 URL', '자세히보기 이미지 URL', names[1] || '옵션명 2', '재고수량', '옵션가격', '상태', '옵션추가무게', '셀러재고코드'];
  const STOCK = 9999;
  // 11번가 옵션 엑셀의 상태 칸은 '사용함'·'임시품절' 두 가지뿐이다(사용자가 업로드로 확인, 2026-10-12 — '사용안함'을 쓰면 오류). 판매중지도 '임시품절'로 낸다(재고만 0).
  const STATUS_TEXT = { '': '사용함', soldout: '임시품절', stopped: '임시품절' };
  const MIN_EXTENSION = '0.32.4'; // 0.32.4부터 옵션마다 단계별 이름(parts)과 옵션 단계 수(levels)를 준다

  const findProduct = productId => (HK_CHANNEL_LISTINGS['11st'] || []).find(product => String(product.productId) === String(productId)) || null;
  const stamp = () => { const now = new Date(); return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`; };
  const toast = (message, type) => { if (typeof showToast === 'function') showToast(message, type); else console.log(message); };
  // 단가표에 적어 둔 11번가 옵션명 — name11st(엑셀용으로 저장한 이름) → storeName(검사용 스토어 옵션명) 순서.
  const savedName = item => String(item.name11st || item.storeName || '').trim();
  const namesReady = product => !!product && Array.isArray(product.items) && product.items.length > 0 && product.items.every(savedName);
  // 옵션 이름을 단계별로 나눈다. 확장이 준 parts가 있으면 그대로(1단 옵션 이름 안에 " / "가 들어 있는 상품도 정확), 없으면 " / "로 자른다. 단계 수(depth)를 알면 그만큼만 자른다.
  const splitName = (name, depth) => { const parts = String(name || '').split(' / ').map(part => part.trim()); return depth === 1 ? [String(name || '').trim()] : depth === 2 && parts.length > 2 ? [parts[0], parts.slice(1).join(' / ')] : parts; };
  const rowParts = (row, depth) => Array.isArray(row.parts) && row.parts.length ? row.parts.map(part => String(part).trim()) : splitName(row.name, depth);
  // 이름 비교용 정규화 — 공백·기호를 지운다(가격검사 확장 st11NormName과 같은 규칙: "타이거이지본드-일회용" = "타이거이지본드 / 일회용").
  const nameKey = text => String(text || '').toLowerCase().replace(/[\s()\[\]{}·_\-\/,.~★●☆※+]/g, '');
  // 단가표 옵션의 이름 후보 — 11번가 옵션명(name11st)·검사용 스토어 옵션명(storeName)·상품명(productName)·표에 보이는 이름. 상품코드 자체는 뺀다.
  const labelsOf = (item, product) => [item.name11st, item.storeName, item.productName, typeof _hkChannelItemName === 'function' ? _hkChannelItemName(item.categoryId || product.categoryId, product, item) : '']
    .map(label => String(label || '').trim()).filter(label => label && label !== item.productCode);

  /* 규격 열쇠 — 상품코드(Iso_600_900_20_1, IsoA_…, IIso_…, St_430_430_10_5, StA_…, Neo_…)와 11번가 옵션명("…_20T-600㎜x900㎜(1장)", "회색 스티로폼 200T 2호 200Tx600㎜x900㎜")을
     같은 모양으로 맞춘다. 재질(I 아이소핑크 / G 회색·네오 / W 백색 스티로폼) | 접착 여부 | 두께 | 짧은 변 x 긴 변 | 장수(옵션명에 없으면 1).
     열반사·부자재 등 다른 카테고리는 아직 열쇠가 없다(null). */
  const keyOf = (material, adhesive, thickness, a, b, count) => `${material}|${adhesive ? 'A' : 'N'}|${thickness}|${Math.min(a, b)}x${Math.max(a, b)}|${count || 1}`;
  const MATERIAL_OF_PREFIX = { Iso: 'I', IIso: 'I', St: 'W', Neo: 'G' };
  function keyFromCode(categoryId, code) {
    // 열반사(빌트론) BL_두께_길이_등급+접착(_R) — 등급 S일반·D고급, 접착 N비접착·A한쪽접착. 가격검사 확장 st11KeyFromCode와 같은 열쇠.
    const bl = /^BL_(\d+)_(\d+)_([SD][NA])(?:_R)?$/.exec(String(code || '').trim());
    if (bl) return `BL|${bl[1]}|${bl[2]}|${bl[3]}`;
    // 단열벽지 WP_타입(P1·P2·DW·SK)_두께_길이(2.3m는 23)
    const wp = /^WP_(P1|P2|DW|SK)_(\d+)_(\d+)$/.exec(String(code || '').trim());
    if (wp) return `WP|${wp[1]}|${wp[2]}|${wp[3]}`;
    const m = /^(I+so|St|Neo)(A?)_(\d+)_(\d+)_(\d+)_(\d+)$/.exec(String(code || '').trim());
    return m ? keyOf(MATERIAL_OF_PREFIX[m[1]] || 'I', m[2] === 'A', Number(m[5]), Number(m[3]), Number(m[4]), Number(m[6])) : null;
  }
  // first = 2단 옵션의 1단 이름(단열벽지는 색상 이름이 섞이지 않게 이것만 본다).
  function keyFromName(name, first) {
    const text = String(name || '');
    // 열반사(빌트론): "빌트론 5T 1m x 50m 일반형 비접착" → BL|5|50|SN (길이는 "x50m"의 숫자)
    const compact = text.replace(/㎜|mm/gi, '').replace(/\s+/g, '').toLowerCase();
    if (/빌트론|열반사/.test(compact)) {
      const length = /x(\d+)m/.exec(compact), thick = /(?<![\d.])(\d{1,3})t(?![a-wyz])/.exec(compact);
      const grade = /고급형/.test(compact) ? 'D' : /일반형/.test(compact) ? 'S' : null, adhesive = /한쪽접착/.test(compact) ? 'A' : /비접착/.test(compact) ? 'N' : null;
      return thick && length && grade && adhesive ? `BL|${thick[1]}|${length[1]}|${grade}${adhesive}` : null;
    }
    // 단열벽지: "고급형1_5T(1m x 1m)"·"이중화이트_5T 1x10m" → WP|P1|5|1 (타입 P1 고급형1·P2 고급형2·DW 이중화이트·SK 실크, 길이 2.3m는 23)
    const wallText = String(first || text).replace(/㎜|mm/gi, '').replace(/\s+/g, '').toLowerCase();
    if (/벽지|고급형[12]|이중화이트|실크/.test(wallText)) {
      const type = /고급형1/.test(wallText) ? 'P1' : /고급형2/.test(wallText) ? 'P2' : /이중화이트/.test(wallText) ? 'DW' : /실크/.test(wallText) ? 'SK' : null;
      const length = /x(\d+(?:\.\d+)?)m/.exec(wallText), thick = /(?<![\d.])(\d{1,3})t(?![a-wyz])/.exec(wallText);
      return type && thick && length ? `WP|${type}|${thick[1]}|${length[1].replace('.', '')}` : null;
    }
    const t = /(\d+)\s*T/i.exec(text), size = /(\d+)\s*(?:㎜|mm)?\s*[xX×*]\s*(\d+)/.exec(text), n = /\((\d+)\s*장\)/.exec(text);
    const material = /아이소핑크/.test(text) ? 'I' : /회색|네오/.test(text) ? 'G' : 'W';
    return t && size ? keyOf(material, /접착/.test(text), Number(t[1]), Number(size[1]), Number(size[2]), n ? Number(n[1]) : 1) : null;
  }
  /* 버튼을 보일 상품 — 옵션이 2개 이상이고(옵션 없는 단품은 옵션 엑셀이 필요 없다), 옵션을 전부 짝지을 수 있을 것으로 보이는 상품: 옵션명이 단가표에 저장돼 있거나,
     상품코드에서 규격 열쇠를 만들 수 있거나(아이소핑크·스티로폼·열반사), 이름 후보가 있는 상품(부자재 — 이름이 같은 옵션끼리 짝짓는다).
     단열벽지는 WP 열쇠(1단 이름만 비교, 색상 줄은 그 옵션을 같이 쓴다). 실제로 짝지어지는지는 만들 때 11번가에서 읽은 이름으로 확인하고, 안 맞으면 알려 준다. */
  const specReady = product => !!product && Array.isArray(product.items) && product.items.length > 0 && product.items.every(item => keyFromCode(item.categoryId || product.categoryId, item.productCode));
  const nameReady = product => !!product && Array.isArray(product.items) && product.items.length > 0 && product.items.every(item => labelsOf(item, product).length);
  window.hk11stExcelReady = product => !!product && Array.isArray(product.items) && product.items.length >= 2
    && (namesReady(product) || specReady(product) || nameReady(product));

  /* 화면과 같은 가격 계산(_hkChannelTargetPrice) — 옵션별 11번가 판매가와 기준가. product.basePrice가 있으면 그 값이 기준가(모음전 엑셀과 같은 규칙). */
  function calculate(product) {
    const compute = () => {
      const prices = product.items.map(item => _hkChannelTargetPrice(item.categoryId || product.categoryId, item.productCode, '11st', product, item));
      const baseIndex = _hkChannelBaseIndex(product);
      return { prices, baseIndex, basePrice: product.basePrice != null ? Number(product.basePrice) : prices[baseIndex] };
    };
    const calc = typeof _hkRunLookupPass === 'function' ? _hkRunLookupPass(compute) : compute();
    if (!(calc.basePrice > 0)) return { error: '기준가(기준 옵션 가격)를 계산하지 못했습니다.' };
    const missing = product.items.filter((item, i) => !(calc.prices[i] > 0));
    if (missing.length) return { error: `판매가를 계산하지 못한 옵션이 있습니다: ${missing.map(item => item.productCode).join(', ')}` };
    return calc;
  }

  /* 엑셀에 넣을 옵션 목록 [{ name, index(단가표 옵션 번호), stock0(스토어에서 품절이면 true) }] — 스토어에서 읽은 이름 우선, 없으면 단가표에 적어 둔 name11st. */
  function entriesFromStore(product, store) {
    if (store.rows.length === 1 && store.rows[0].name === '(옵션 없음)') return { error: '옵션이 없는 단품 상품이라 옵션 엑셀이 필요 없습니다.' };
    const depth = Number.isFinite(store.levels) && store.levels > 0 ? store.levels : Math.max(...store.rows.map(row => splitName(row.name).length));
    if (depth > 2) return { error: '3단 이상 옵션 상품은 아직 지원하지 않습니다.' };
    // 짝짓기: 단가표에 적어 둔 이름·상품명과 정규화한 이름이 같으면 그 옵션, 아니면 규격 열쇠(아이소핑크·스티로폼·열반사).
    const byKey = new Map(), byName = new Map();
    product.items.forEach((item, index) => {
      const key = keyFromCode(item.categoryId || product.categoryId, item.productCode); if (key && !byKey.has(key)) byKey.set(key, index); // 단열벽지는 색상 항목이 같은 열쇠(유형·길이)를 공유한다 — 첫 항목이 대표
      labelsOf(item, product).forEach(label => { if (!byName.has(nameKey(label))) byName.set(nameKey(label), index); });
    });
    const used = new Set(), entries = [], unmatched = [], skippedSoldOut = [], odd = [];
    store.rows.forEach(row => {
      const parts = rowParts(row, depth);
      const key = keyFromName(row.name, depth === 2 ? parts[0] : null);
      const byNameIndex = byName.get(nameKey(row.name));
      let index = -1, fallback = false;
      if (byNameIndex != null && !used.has(byNameIndex)) index = byNameIndex; // 색상까지 이름이 같은 단가표 옵션(단열벽지는 색상 항목마다 판매상태가 따로다)
      else if (key && key.startsWith('WP|') && byKey.has(key)) { index = byKey.get(key); fallback = true; } // 단가표에 없는 새 색상 — 같은 유형·길이의 가격을 쓰고 상태는 11번가에서 읽은 대로
      else if (key && byKey.has(key) && !used.has(byKey.get(key))) index = byKey.get(key);
      if (index < 0) { (row.qty === 0 ? skippedSoldOut : unmatched).push(row.name); return; } // 단가표에 없는 옵션이 11번가에서 이미 품절이면 건너뛴다
      if (parts.length !== depth) { odd.push(row.name); return; }
      used.add(index);
      entries.push({ parts, index, soldOut: row.qty === 0, qty: row.qty, fallback });
    });
    if (unmatched.length) return { error: `11번가 옵션 중 단가표 옵션과 이름·규격이 맞지 않는 것이 ${unmatched.length}개 있어 만들지 않았습니다 — ${unmatched.slice(0, 4).join(', ')}${unmatched.length > 4 ? ' …' : ''}` };
    if (odd.length) return { error: `옵션 단계가 다른 옵션이 있어 만들지 않았습니다 — ${odd.slice(0, 3).join(', ')}` };
    const notes = [], warnings = [];
    // 11번가 페이지에 안 보이는 옵션 — 판매중지는 단가표 이름으로 파일 끝에 넣고(재고 0·임시품절), 그 밖에는 경고한다.
    const absent = [];
    product.items.forEach((item, index) => {
      if (used.has(index)) return;
      const parts = splitName(savedName(item), depth);
      if (item.status === 'stopped' && parts.length === depth && parts.every(Boolean)) { entries.push({ parts, index, soldOut: true }); notes.push(item.productCode); } else absent.push(item.productCode);
    });
    if (absent.length) warnings.push(`단가표에는 있지만 11번가 페이지에서 읽히지 않은 옵션 ${absent.length}개(${absent.slice(0, 5).join(', ')}${absent.length > 5 ? ' …' : ''}) — 파일에는 넣지 않았습니다.`);
    return { entries, depth, warnings, stoppedAdded: notes, skippedSoldOut, levelNames: Array.isArray(store.levelNames) ? store.levelNames : [], source: 'store' };
  }
  function entriesFromNames(product) {
    if (!namesReady(product)) return { error: '11번가에서 옵션명을 읽지 못했고, 단가표에 적어 둔 11번가 옵션명도 없습니다.' };
    const depth = Math.max(...product.items.map(item => splitName(savedName(item)).length));
    const entries = product.items.map((item, index) => ({ parts: splitName(savedName(item), depth), index, soldOut: false }));
    if (depth > 2 || entries.some(entry => entry.parts.length !== depth)) return { error: '단가표에 적어 둔 11번가 옵션명의 단계가 맞지 않습니다(1~2단만 지원).' };
    return { entries, depth, levelNames: [], warnings: ['11번가에서 옵션명을 읽지 못해 단가표에 적어 둔 이름으로 만들었습니다 — 업로드 전에 11번가 옵션명과 같은지 확인하세요.'], stoppedAdded: [], source: 'static' };
  }

  /* 엑셀 내용(행 목록)과 파일 이름. store를 넘기면 11번가에서 읽은 이름으로, 안 넘기면 단가표에 적어 둔 이름으로 만든다. */
  window.hk11stBuildRows = function (productId, store) {
    const product = findProduct(productId);
    if (!product) return { error: '상품을 찾지 못했습니다.' };
    const calc = calculate(product);
    if (calc.error) return calc;
    const made = store ? entriesFromStore(product, store) : entriesFromNames(product);
    if (made.error) return made;
    // 줄마다 값만 먼저 모으고(lines), 양식에 맞게 칸 순서를 정한다.
    const groupNo = new Map(); // 옛 2단 양식: 옵션명 1별 번호(처음 나온 순서)
    const newStyle = made.depth === 2 && NEW_STYLE_PRODUCTS.has(String(product.productId));
    // 재고: 11번가에서 읽은 현재 재고를 그대로 쓰고, 읽은 값이 0이면(임시품절·품절 — 11번가 페이지는 임시품절 옵션의 재고를 0으로 보여 준다) 같은 상품의 가장 큰 재고로 채운다.
    const liveStock = Math.max(0, ...made.entries.map(entry => entry.qty > 0 ? entry.qty : 0)) || STOCK;
    const lines = made.entries.map((entry, i) => {
      // 단가표의 판매상태(색상별 품절·판매중지)가 우선이고, 단가표에 없는 새 색상(fallback)은 11번가에서 읽은 대로(재고 0이면 임시품절).
      const item = product.items[entry.index], status = entry.fallback ? (entry.soldOut ? 'soldout' : '') : (item.status || (entry.soldOut ? 'soldout' : ''));
      // 단가표에서 판매중이어도 11번가에서 이미 품절(재고 0)이면 품절로 낸다(엑셀을 올려 9,999로 되살리는 것 방지).
      if (made.depth === 2 && !groupNo.has(entry.parts[0])) groupNo.set(entry.parts[0], groupNo.size + 1);
      const no = made.depth === 1 || newStyle ? i + 1 : groupNo.get(entry.parts[0]);
      return { no: String(no).padStart(2, '0'), first: i === 0 ? 'N' : '', parts: entry.parts, stock: status === 'stopped' ? 0 : entry.qty > 0 ? entry.qty : liveStock, offset: calc.prices[entry.index] - calc.basePrice, state: STATUS_TEXT[status] || STATUS_TEXT[''] };
    });
    const body = lines.map(line => {
      if (made.depth === 1) return [line.first, line.no, line.parts[0], '', '', line.stock, line.offset, line.state, 0, ''];
      if (newStyle) return ['', line.first, line.no, line.parts[0], line.parts[1], '', '', '', line.offset, line.stock, line.state, ''];
      return [line.first, line.no, line.parts[0], '', '', line.parts[1], line.stock, line.offset, line.state, 0, ''];
    });
    // 단열벽지 색상은 단가표에서 따로 관리하지 않으니(WP 옵션 하나가 색상 전부) 이 알림에서 뺀다.
    const storeSoldOut = made.entries.filter(entry => entry.soldOut && !entry.fallback && !product.items[entry.index].status && made.source === 'store').length;
    const newColors = made.entries.filter(entry => entry.fallback).map(entry => entry.parts.join(' / '));
    const warnings = [...made.warnings];
    const notes = [];
    // 11번가 옵션가격 한도 = 판매가의 −50% ~ +300%(내 상품의 옵션정책, 사용자 확인). 넘는 옵션은 알려만 준다(막지 않음).
    const outOfRange = lines.filter(line => line.offset > calc.basePrice * 3 || line.offset < -calc.basePrice / 2).map(line => `${line.no}번(${line.offset.toLocaleString()}원)`);
    if (outOfRange.length) notes.push(`옵션가격이 기준가 ${calc.basePrice.toLocaleString()}원의 −50% ~ +300%를 넘는 옵션이 있습니다 — ${outOfRange.join(', ')}. 업로드가 거절되면 기준가 옵션을 바꿔 보세요.`);
    if (made.skippedSoldOut && made.skippedSoldOut.length) notes.push(`11번가에서 이미 품절이고 단가표에 없는 옵션 ${made.skippedSoldOut.length}개(${made.skippedSoldOut.slice(0, 3).join(', ')})는 파일에 넣지 않았습니다 — 업로드하면 이 옵션이 어떻게 되는지 확인하세요.`);
    if (made.stoppedAdded.length) notes.push(`판매중지 옵션 ${made.stoppedAdded.length}개(${made.stoppedAdded.slice(0, 5).join(', ')})는 11번가 페이지에 안 보여서 단가표 이름으로 파일 끝에 넣었습니다(임시품절, 재고 0).`);
    if (newColors.length) notes.push(`단가표에 없는 새 색상 ${newColors.length}개(${newColors.slice(0, 3).join(', ')}${newColors.length > 3 ? ' …' : ''})는 같은 유형의 가격으로 냈습니다 — 단가표 단열벽지(11번가)에 색상을 추가해 두세요.`);
    if (storeSoldOut) notes.push(`11번가에서 품절인데 단가표엔 품절 표시가 없는 옵션 ${storeSoldOut}개 — 임시품절로 냈습니다. 단가표 판매상태도 품절로 바꿔 두세요.`);
    const headRows = made.depth === 1 ? [header1(made.levelNames)] : newStyle ? [headerNew(made.levelNames), [NOTICE_NEW]] : [header2(made.levelNames)];
    return { rows: [...headRows, ...body], count: body.length, style: made.depth === 1 ? 'single' : newStyle ? 'new' : 'old', depth: made.depth, warnings, notes, source: made.source, basePrice: calc.basePrice, baseCode: product.items[calc.baseIndex].productCode, fileName: `11번가_${product.productId}_옵션_${stamp()}.xls` };
  };

  /* ── 확장과 대화 — 모음전 엑셀(pricing-hankook-moeum.js)과 같은 메시지 규칙 ── */
  function extensionRequest(action, payload, timeoutMs) {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const timer = setTimeout(() => { window.removeEventListener('message', listener); reject(Error('확장 연결이 없습니다.')); }, timeoutMs);
      function listener(event) {
        if (event.source !== window || event.origin !== location.origin || event.data?.type !== 'EG_PRICE_TEST_RESPONSE' || event.data.requestId !== requestId) return;
        clearTimeout(timer); window.removeEventListener('message', listener);
        event.data.result?.ok ? resolve(event.data.result) : reject(Error(event.data.result?.error || '요청 실패'));
      }
      window.addEventListener('message', listener);
      window.postMessage({ type: 'EG_PRICE_TEST_REQUEST', requestId, action, payload }, location.origin);
    });
  }
  const versionAtLeast = (a, b) => { const l = String(a).split('.').map(Number), r = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { const d = (l[i] || 0) - (r[i] || 0); if (d) return d > 0; } return true; };

  async function download(productId) {
    const product = findProduct(productId);
    let store = null, readError = '';
    try {
      const ping = await extensionRequest('ping', {}, 2500);
      if (!versionAtLeast(ping.version, MIN_EXTENSION)) throw Error(`확장을 ${MIN_EXTENSION} 이상으로 업데이트하세요(현재 ${ping.version}).`);
      toast('11번가에서 옵션명을 읽는 중입니다…(몇 초 걸립니다)', 'info');
      store = await extensionRequest('st11options', { url: _hkChannelProductLink('11st', product) }, 60000);
    } catch (error) { readError = error.message; store = null; }
    const built = window.hk11stBuildRows(productId, store);
    if (built.error) { toast(built.error + (readError ? ` (11번가 읽기: ${readError})` : ''), 'error'); return; }
    if (built.source === 'static' && readError) built.warnings.push(`11번가 읽기 실패: ${readError}`);
    if (built.warnings.length && !confirm(`${built.warnings.join('\n')}\n\n그래도 엑셀을 만들까요?`)) return;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(built.rows);
    const widths = { single: [18, 6, 52, 14, 18, 10, 10, 10, 12, 14], old: [18, 6, 40, 14, 18, 26, 10, 10, 10, 12, 14], new: [24, 18, 6, 40, 26, 14, 14, 12, 10, 10, 10, 14] };
    ws['!cols'] = widths[built.style].map(wch => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, built.fileName);
    toast(`11번가 옵션 엑셀 저장 완료 — ${built.source === 'store' ? '11번가 옵션명 기준' : '단가표 옵션명 기준'}, 기준가 ${built.basePrice.toLocaleString()}원(${built.baseCode}), 옵션 ${built.count}개`, 'success');
    if (built.notes.length) toast(built.notes.join('\n'), 'info');
  }

  window.hk11stExcel = function (productId) {
    if (typeof XLSX === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => download(productId);
      document.head.appendChild(script);
    } else download(productId);
  };
})();
