/* ═══════════════════════════════════════
   한국단열 모음전 옵션 엑셀 — 스마트스토어 옵션 가격 일괄 수정용 (에너가드컴퍼니 단가표의 "모음전 옵션"과 같은 형태)
   · 모음전 = 한 상품 안에 두께·규격이 옵션으로 여러 개 들어 있는 상품. 상품 대표가(기준 옵션 가격)를 0원으로 놓고
     각 옵션의 옵션가 = 그 옵션 현재 판매가 − 대표가 로 적는다.
   · 맨 위 요약 3줄(판매가·즉시할인가·실제판매가)은 에너가드 모음전 엑셀과 같은 규칙이다 — 네이버 옵션 추가금액에
     상한이 있어서, 옵션가 중 가장 큰 값의 2배를 판매가로 잡고(넉넉히), 즉시할인가 = 판매가 − 최저가, 실제판매가 = 최저가.
   · **옵션명은 엑셀을 만드는 순간 확장이 스마트스토어 상품 페이지에서 직접 읽어 온다**(2026-10-01) —
     스토어에서 이름을 바꿔도 항상 최신 이름이고, 단가표에 따로 저장하거나 맞출 필요가 없다. 단가표 옵션과는 **관리코드**로 짝짓는다.
     (확장이 없거나 오래돼서 못 읽으면, 스토어 옵션명(item.storeName)이 전부 적힌 상품은 그 이름으로 만든다.)
   · **옵션 항목 제목(첫 줄 첫 칸)은 1단 옵션이면 전부 '제품선택'**(사용자 결정. 업로드할 때 첫 칸 글자가 스토어의 옵션 항목 이름과 달라도 가격은 그대로 반영된다 — 사용자 확인 2026-10-01). 상품에 moeumOptionTitle로
     따로 적을 수 있고, 2~3단 옵션 상품은 열마다 제목이 달라서 moeumOptionTitles(열 순서 목록)를 적어야 한다.
   · 재고수량은 99999 고정(판매중지·품절은 0), 사용여부는 판매중지만 N.
   · 버튼은 모음전 상품(옵션 여러 개)에 뜬다 — 모음전·단품 구분을 적용하는 카테고리(HK_CHANNEL_KIND_SPLIT)의 모음전 상품 전부. 그 밖의 상품은
     moeumLive: true를 적거나 storeName을 전부 적으면 뜬다. 단품에는 없다.
   읽기 전용 — 단가표 값은 바꾸지 않고 파일만 내려받는다.
═══════════════════════════════════════ */
(function () {
  const DEFAULT_TITLE = '제품선택'; // 1단 옵션 상품의 옵션 항목 제목(첫 줄 첫 칸) — 에너가드 불연·준불연 모음전 엑셀과 같은 이름
  const MIN_EXTENSION = '0.32.0';

  function findProduct(channelId, productId) {
    return (HK_CHANNEL_LISTINGS[channelId] || []).find(product => String(product.productId) === String(productId)) || null;
  }
  const staticReady = product => Array.isArray(product.items) && product.items.length > 1
    && product.items.every(item => String(item.storeName || '').trim() && item.productCode);

  /* [모음전 엑셀] 버튼을 보일 상품 — 모음전 상품(옵션이 여러 개)이면 전부. 모음전·단품 구분을 적용하는 채널·카테고리(HK_CHANNEL_KIND_SPLIT)의 모음전 상품이거나,
     moeumLive 표시가 있거나, 스토어 옵션명이 옵션마다 전부 적혀 있는 상품. 단품(옵션 하나)에는 없다.
     옵션명은 스토어에서 읽어 와 관리코드로 짝짓기 때문에, 스토어 옵션에 단가표와 같은 관리코드가 등록돼 있어야 만들어진다(안 맞으면 안내 후 중단). */
  // 스마트스토어 채널(한국단열·한국단열라이프)의 이 카테고리는 옵션이 여러 개인 상품 전부에 버튼을 연다(2026-10-08 — 상품마다 moeumLive를 적지 않아도 되게).
  // 1단 옵션이면 열 제목이 '제품선택'이라 따로 줄 정보가 없고, 옵션명은 눌렀을 때 확장이 스토어에서 읽는다. 2~3단 옵션이면 만들 때 moeumOptionTitles를 적으라는 안내가 뜬다.
  const AUTO_CATEGORIES = { hkd: ['hk_sub'], hkd_life: ['hk_sub'] };
  window.hkMoeumReady = function (channelId, product) {
    if (!product || !Array.isArray(product.items) || product.items.length < 2 || !product.items.every(item => item.productCode)) return false;
    const inKindSplit = typeof _hkChannelKindSplit === 'function' && (_hkChannelKindSplit(channelId, product.categoryId) || _hkChannelProductTabbed(channelId, product.categoryId));
    return inKindSplit || product.moeumLive === true || staticReady(product) || (AUTO_CATEGORIES[channelId] || []).includes(product.categoryId);
  };

  /* 화면과 같은 가격 계산(_hkChannelTargetPrice) — 옵션별 현재 판매가와 대표가(기준 옵션). */
  function calculate(channelId, product) {
    const compute = () => {
      // 옵션에 자기 카테고리가 적힌 항목(아이소핑크 상품에 섞인 단열벽지 옵션 등)은 그 카테고리 가격표로 계산한다(채널 표와 같은 규칙).
      const prices = product.items.map(item => _hkChannelTargetPrice(item.categoryId || product.categoryId, item.productCode, channelId, product, item));
      const baseIndex = _hkChannelBaseIndex(product);
      const basePrice = product.basePrice != null ? Number(product.basePrice) : prices[baseIndex];
      return { prices, baseIndex, basePrice };
    };
    const calc = typeof _hkRunLookupPass === 'function' ? _hkRunLookupPass(compute) : compute();
    if (!(calc.basePrice > 0)) return { error: '대표가(기준 옵션 가격)를 계산하지 못했습니다.' };
    const missing = product.items.filter((item, i) => !(calc.prices[i] > 0));
    if (missing.length) return { error: `판매가를 계산하지 못한 옵션이 있습니다: ${missing.map(item => item.productCode).join(', ')}` };
    return calc;
  }

  function summaryRows(prices, basePrice) {
    // 실제판매가(= 판매가 − 즉시할인가)는 옵션가 0원인 기준 옵션의 가격이어야 옵션가(= 옵션 판매가 − 대표가)가 맞는다. 기준 옵션이 가장 싼 상품이면 최저가와 같고(지금까지 전부),
    // 기준 옵션보다 싼 옵션이 있는 상품(옵션가 음수 — 단열벽지 11502054249)은 기준 옵션 가격으로 둔다(2026-10-02, 예전엔 최저가를 써서 이런 상품은 3,000원 어긋났다).
    // 옵션가가 전부 0 이하인 상품(기준 옵션이 가장 비싼 방습단열초배지 560852218 — 0.2T −98,000 · 1T −60,000 · 5T 0)은 최대 옵션가가 0이라 판매가가 0원으로 나오던 것을,
    // 이 경우에만 가장 싼 옵션과의 차이(옵션가 절댓값 최대)로 계산한다(2026-10-08). 양수 옵션가가 있는 기존 상품은 값이 그대로다.
    let maxOffset = Math.max(...prices) - basePrice;
    if (maxOffset <= 0) maxOffset = basePrice - Math.min(...prices);
    const listPrice = maxOffset * 2;
    return { rows: [['판매가', listPrice], ['즉시할인가', listPrice - basePrice], ['실제판매가', basePrice], []], listPrice, minPrice: basePrice };
  }
  // 재고는 기본 99999. 스토어 재고가 99만대인 상품은 상품에 moeumStock을 적어 그 값으로 낸다(난방필름 4705673971 = 999999 — 99999로 내면 재고가 줄어든다).
  const stockAndUse = (item, product) => { const status = item.status || ''; return [status ? 0 : (Number(product && product.moeumStock) || 99999), status === 'stopped' ? 'N' : 'Y']; };
  const stamp = () => { const now = new Date(); return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`; };

  /* 스토어에서 읽은 옵션(store.rows: {optionName1~3, code…})으로 엑셀 행을 만든다. 순서·이름은 스토어 그대로, 가격은 단가표 값.
     titles = 옵션 항목 제목(스토어에서 읽은 것 → 상품에 적어 둔 것 → 사용자가 입력한 것 순서). 못 구하면 needTitle. */
  function buildFromStore(channelId, product, calc, store) {
    const byCode = new Map(product.items.map((item, i) => [String(item.productCode).trim().toLowerCase(), i]));
    const axes = Math.max(1, ...store.rows.map(row => row.optionName3 ? 3 : row.optionName2 ? 2 : 1));
    // 옵션 항목 제목 — 1단 옵션은 전부 '제품선택'으로 통일한다(2026-10-01 사용자 결정, 스토어 옵션 항목 이름도 이걸로 맞춘다).
    // 2~3단 옵션은 열마다 제목이 달라야 해서 상품에 적어 둔 moeumOptionTitles(열 순서 목록) → 스토어에서 읽은 제목 순서로 쓴다.
    let titles;
    if (axes === 1) titles = [String(product.moeumOptionTitle || DEFAULT_TITLE).trim()];
    else {
      titles = (Array.isArray(product.moeumOptionTitles) && product.moeumOptionTitles.length >= axes ? product.moeumOptionTitles : (store.groupNames || [])).slice(0, axes);
      if (titles.length < axes) return { error: `${axes}단 옵션 상품이라 열마다 옵션 항목 이름이 필요합니다 — 상품에 moeumOptionTitles: [${Array.from({ length: axes }, (_, k) => `'이름${k + 1}'`).join(', ')}]을 적어 주세요.` };
    }
    const unmatched = [], usedItems = new Set(), body = [], storeSoldOut = [];
    store.rows.forEach(row => {
      const key = String(row.code || '').trim().toLowerCase();
      const index = byCode.has(key) ? byCode.get(key) : -1;
      if (index < 0) { unmatched.push(row.label || row.optionName1 || '(이름 없음)'); return; }
      usedItems.add(index);
      const item = product.items[index];
      // 스토어에서 이미 품절인 옵션은 단가표에 품절 표시가 없어도 재고 0으로 낸다(엑셀을 올려 99999로 되살리는 것 방지, 2026-10-02).
      let [stock, use] = stockAndUse(item, product);
      if (row.soldOut && stock !== 0) { stock = 0; storeSoldOut.push(String(row.code).trim()); }
      const names = [row.optionName1, row.optionName2, row.optionName3].slice(0, axes).map(v => v || '');
      body.push([...names, calc.prices[index] - calc.basePrice, stock, String(row.code).trim(), use]);
    });
    if (unmatched.length) {
      return { error: `스토어 옵션 중 관리코드가 단가표와 맞지 않는 것이 ${unmatched.length}개 있어 만들지 않았습니다 — ${unmatched.slice(0, 5).join(', ')}${unmatched.length > 5 ? ' …' : ''}` };
    }
    // 스토어 상품 페이지는 판매중지(사용 안 함) 옵션을 보여 주지 않아 읽히지 않는다. 그래도 엑셀에서 빠지면 업로드할 때 그 옵션이 스토어에서 어떻게 되는지 알 수 없으니,
    // 단가표에서 판매중지인 옵션은 단가표 이름으로 파일 끝에 재고 0·사용여부 N으로 넣는다(2026-10-02). 1단 옵션은 상품명 한 칸,
    // 2~3단 옵션은 열마다 이름이 필요해서 항목에 optionNames(열 순서 목록)가 적혀 있을 때만 — 없으면 제외하고 경고.
    const stoppedAdded = [];
    product.items.forEach((item, index) => {
      if (usedItems.has(index) || item.status !== 'stopped') return;
      const names = axes === 1 ? [_hkChannelItemName(item.categoryId || product.categoryId, product, item)]
        : (Array.isArray(item.optionNames) && item.optionNames.length === axes ? item.optionNames : null);
      if (!names) return;
      usedItems.add(index);
      stoppedAdded.push(item.productCode);
      body.push([...names, calc.prices[index] - calc.basePrice, 0, String(item.productCode).trim(), 'N']);
    });
    const absent = product.items.filter((_, i) => !usedItems.has(i)).map(item => item.productCode);
    const summary = summaryRows(calc.prices, calc.basePrice);
    return {
      rows: [...summary.rows, [...titles, '옵션가', '재고수량', '관리코드', '사용여부'], ...body],
      warnings: absent.length ? [`단가표에는 있지만 스토어에서 읽히지 않은 옵션 ${absent.length}개(${absent.slice(0, 5).join(', ')}${absent.length > 5 ? ' …' : ''}) — 파일에는 넣지 않았습니다.`] : [],
      notes: [
        ...(stoppedAdded.length ? [`판매중지 옵션 ${stoppedAdded.length}개(${stoppedAdded.slice(0, 5).join(', ')}${stoppedAdded.length > 5 ? ' …' : ''})는 스토어 페이지에 안 보여서 단가표 이름으로 파일 끝에 넣었습니다(재고 0·사용여부 N).`] : []),
        ...(storeSoldOut.length ? [`스토어에서 품절인데 단가표엔 품절 표시가 없는 옵션 ${storeSoldOut.length}개(${storeSoldOut.slice(0, 5).join(', ')}${storeSoldOut.length > 5 ? ' …' : ''}) — 재고 0으로 냈습니다. 단가표 판매상태도 품절로 바꿔 두세요.`] : []),
      ],
      source: 'store', axes, titles, listPrice: summary.listPrice, minPrice: summary.minPrice,
    };
  }

  /* 스토어를 못 읽을 때(확장 없음 등) — 단가표에 적어 둔 스토어 옵션명(storeName)으로 만든다. */
  function buildFromStatic(channelId, product, calc) {
    if (!staticReady(product)) return { error: '스토어에서 옵션명을 읽지 못했고, 단가표에 적어 둔 스토어 옵션명도 없습니다.' };
    const summary = summaryRows(calc.prices, calc.basePrice);
    const body = product.items.map((item, i) => { const [stock, use] = stockAndUse(item, product); return [String(item.storeName).trim(), calc.prices[i] - calc.basePrice, stock, item.productCode, use]; });
    return {
      rows: [...summary.rows, [product.moeumOptionTitle || DEFAULT_TITLE, '옵션가', '재고수량', '관리코드', '사용여부'], ...body],
      warnings: ['스토어에서 옵션명을 읽지 못해 단가표에 적어 둔 이름으로 만들었습니다 — 업로드 전에 스토어 옵션명과 같은지 확인하세요.'],
      source: 'static', axes: 1, titles: [product.moeumOptionTitle || DEFAULT_TITLE], listPrice: summary.listPrice, minPrice: summary.minPrice,
    };
  }

  /* 엑셀 내용(행 목록)과 파일 이름. store를 넘기면 스토어에서 읽은 이름으로, 안 넘기면 단가표에 적어 둔 이름으로 만든다. */
  window.hkMoeumBuildRows = function (channelId, productId, store) {
    const product = findProduct(channelId, productId);
    if (!product) return { error: '상품을 찾지 못했습니다.' };
    if (!window.hkMoeumReady(channelId, product)) return { error: '이 상품은 모음전 엑셀을 지원하지 않습니다.' };
    const calc = calculate(channelId, product);
    if (calc.error) return calc;
    const built = store ? buildFromStore(channelId, product, calc, store) : buildFromStatic(channelId, product, calc);
    if (built.error) return built;
    return { ...built, basePrice: calc.basePrice, baseName: product.items[calc.baseIndex].productCode, fileName: `스마트스토어_한국단열_${product.productId}_모음전옵션_${stamp()}.xls` };
  };

  /* ── 확장과 대화 — 검사 화면(pricing-check-test.js)과 같은 메시지 규칙이지만 스토어 읽기는 오래 걸려서 제한 시간이 길다. ── */
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
  const toast = (message, type) => { if (typeof showToast === 'function') showToast(message, type); else console.log(message); };

  async function download(channelId, productId) {
    const product = findProduct(channelId, productId);
    let built = null, store = null, readError = '';
    // 버튼이 뜨는 상품은 전부 스토어에서 먼저 읽는다(moeumLive 표시와 무관 — 모음전 상품 전체에 버튼이 뜨게 바꾼 뒤 이 조건이 남아
    // 있어서 새로 연결된 상품이 스토어를 읽지 않고 실패하던 문제, 2026-10-02 수정). 못 읽을 때만 단가표에 적어 둔 이름으로 만든다.
    if (product) {
      try {
        const ping = await extensionRequest('ping', {}, 2500);
        if (!versionAtLeast(ping.version, MIN_EXTENSION)) throw Error(`확장을 ${MIN_EXTENSION} 이상으로 업데이트하세요(현재 ${ping.version}).`);
        toast('스마트스토어에서 옵션명을 읽는 중입니다…(몇 초 걸립니다)', 'info');
        store = await extensionRequest('moeum', { url: _hkChannelProductLink(channelId, product) }, 70000);
      } catch (error) { readError = error.message; store = null; }
    }
    built = window.hkMoeumBuildRows(channelId, productId, store);
    if (built.error) { toast(built.error + (readError ? ` (스토어 읽기: ${readError})` : ''), 'error'); return; }
    if (built.source === 'static' && readError) built.warnings = [...(built.warnings || []), `스토어 읽기 실패: ${readError}`];
    if (built.warnings?.length && !confirm(`${built.warnings.join('\n')}\n\n그래도 엑셀을 만들까요?`)) return;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(built.rows);
    ws['!cols'] = [...Array(built.axes).fill({ wch: 36 }), { wch: 10 }, { wch: 10 }, { wch: 22 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws, '모음전 옵션');
    XLSX.writeFile(wb, built.fileName);
    toast(`모음전 옵션 엑셀 저장 완료 — ${built.source === 'store' ? '스토어 옵션명 기준' : '단가표 옵션명 기준'}, 대표가 ${built.basePrice.toLocaleString()}원`, 'success');
    if (built.notes?.length) toast(built.notes.join('\n'), 'info');
  }

  window.hkMoeumExcel = function (channelId, productId) {
    if (typeof XLSX === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => download(channelId, productId);
      document.head.appendChild(script);
    } else download(channelId, productId);
  };
})();
