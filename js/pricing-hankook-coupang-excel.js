/* ═══════════════════════════════════════
   쿠팡 윙 "가격/재고/판매상태 일괄변경" 엑셀 (2026-10-08)

   쿠팡 윙은 상품조회에서 내려받은 엑셀(ver.1.2)의 "변경/수정 요청" 칸(판매가격·할인율기준가·판매상태·잔여수량)에 적어 다시 올려서 수정한다.
   단가표의 쿠팡 채널(쿠팡·쿠팡_부자재)에 버튼 2개(+ 상품 줄의 [쿠팡 양식]):
   ① [쿠팡 목록 등록] — 쿠팡 윙에서 내려받은 **전체 옵션 목록 엑셀**(여러 개 가능)을 올리면 옵션 ID별로 Supabase(hk_settings 'coupang_catalog')에 저장한다. 쿠팡에 상품·옵션이 바뀌면 다시 올린다.
      목록의 처음 값은 저장소의 data/coupang_catalog.json(2026-10-08 전체 목록 — 1,132옵션)이라 **처음에는 등록할 필요가 없다**. DB에 올린 목록이 있으면 그것이 우선한다.
   ② [쿠팡 수정 엑셀] — 지금 고른 분류(전체·아이소핑크·스티로폼…)의 옵션 전부, 또는 상품 줄의 [쿠팡 양식] 버튼으로 그 상품의 옵션을 **쿠팡 일괄변경 양식**(data/coupang_bulk_template.xlsx = 쿠팡이 준 양식에서 데이터 줄을 뺀 것)에
      담아 한 번에 내려받는다. **단가표를 안 고쳤어도** 양식은 나온다 — 단가표 값이 쿠팡 목록과 다른 옵션만 "변경/수정 요청" 칸(판매가격·판매상태)이 채워져 있고 나머지는 비어 있다(사람이 직접 고칠 수 있게). 쿠팡에서 다시 내려받을 필요가 없다.
   ★ 짝짓기는 **옵션 ID로만** 한다. Product ID는 쿠팡에서 매핑을 바꾸면 달라질 수 있어 단가표와 안 맞는 경우가 있다(사용자 지적 2026-10-08) — 무시하고, 다를 때만 개수를 알려 준다.
   · 판매가격 = 단가표의 쿠팡 등록가(_hkChannelTargetPrice — 몰별 표의 "현재 판매가"와 같은 값). 지금 가격과 같으면 비워 둔다.
   · 판매상태 = 단가표에서 품절·판매중지면 "판매중지", 아니면 "판매중". 지금 상태와 같으면 비워 둔다(쿠팡은 판매중/판매중지 두 가지뿐이라 품절도 판매중지로 낸다).
   · 할인율기준가·잔여수량 칸은 건드리지 않는다. 판매중지로 내는 옵션은 가격을 채우지 않는다.
   · 안 채우고 알려 주는 경우: 승인완료가 아닌 옵션(쿠팡이 수정 불가), 1회 변경 한도(인하 50%·인상 100%)를 넘는 가격, 10원 단위가 아닌 가격, 계산 못 한 옵션. 단가표에 없는 옵션 ID는 목록으로만 알려 준다.
   단가표 값은 바꾸지 않고 파일만 만든다(읽기 전용).

   ★ 파일은 SheetJS로 다시 쓰지 않는다 — SheetJS로 쓴 파일은 쿠팡 업로드에서 "올바른 형식이 아니다"로 거절됐다(2026-10-08 사용자 확인). ②는 쿠팡 양식(zip)의 시트 XML에 줄을 직접 넣는다
     (다른 부품은 바이트까지 그대로). 한 파일은 옵션 1,500개까지라 넘으면 여러 파일로 나눈다.
   (쿠팡에서 내려받은 파일을 올려 그 파일의 칸만 채우는 [쿠팡 파일로 채우기]도 만들었다가 2026-10-08에 뺐다 — 저장한 목록과 [쿠팡 목록 등록]으로 충분하다는 사용자 판단.)
═══════════════════════════════════════ */
(function () {
  const CHANNELS = ['coupang', 'coupang_sub'];
  const CHANNEL_LABEL = { coupang: '쿠팡', coupang_sub: '쿠팡_부자재' };
  const CATALOG_KEY = 'coupang_catalog';
  const TEMPLATE_URL = 'data/coupang_bulk_template.xlsx';
  const CATALOG_SEED_URL = 'data/coupang_catalog.json'; // 처음 목록(쿠팡 전체 목록 엑셀을 옵션 ID별로 옮긴 것) — DB에 올린 목록이 없을 때 쓴다
  const MAX_ROWS = 1500;
  // 쿠팡 양식 앞쪽 15칸(조회 결과) — 순서 그대로 목록에 저장한다.
  const INFO_HEADERS = ['업체상품ID', 'ProductID', '옵션ID', '상품상태', '바코드', '업체상품코드', '쿠팡노출상품명', '업체등록상품명', '등록옵션명', '판매가격', '할인율기준가', '판매상태', '잔여수량(재고)', '판매수량', '승인상태'];
  const OPTION = 2, PRICE = 9, STATUS = 11, APPROVAL = 14, PRODUCT = 1, NAME = 8;
  const toast = (message, type) => { if (typeof showToast === 'function') showToast(message, type); else console.log(message); };
  const text = value => String(value ?? '').trim();
  const norm = value => text(value).replace(/\s+/g, '');
  const number = value => { const n = Number(text(value).replace(/,/g, '')); return Number.isFinite(n) ? n : null; };
  const escapeXml = value => String(value).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  /* ── 시트 읽기 ── */
  // 쿠팡 엑셀은 시트 크기 표시(dimension)가 머리 3줄(A1:S3)까지만 적혀 있고 데이터 줄은 그 밖에 있다 — SheetJS는 이 크기만 읽으므로
  // 그대로 두면 데이터가 하나도 안 읽힌다. 읽기용으로만 실제 셀 위치에 맞춰 범위를 다시 잡는다(파일 자체는 안 바꾼다).
  function fixRange(ws) {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    Object.keys(ws).filter(key => key[0] !== '!').forEach(key => {
      const cell = XLSX.utils.decode_cell(key);
      if (cell.r > range.e.r) range.e.r = cell.r;
      if (cell.c > range.e.c) range.e.c = cell.c;
    });
    ws['!ref'] = XLSX.utils.encode_range(range);
  }

  function readSheet(buffer) {
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    fixRange(ws);
    return XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  }

  /* 머리 줄("옵션 ID"가 있는 줄)에서 열 위치. 판매가격·판매상태는 두 번 나온다(앞 = 조회 결과, 뒤 = 변경 요청). */
  function locate(rows) {
    const headerRow = rows.findIndex(row => row.some(cell => norm(cell) === '옵션ID'));
    if (headerRow < 0) return { error: '쿠팡 일괄변경 엑셀이 아닌 것 같습니다 — "옵션 ID" 열을 찾지 못했습니다.' };
    const header = rows[headerRow].map(norm);
    const info = INFO_HEADERS.map(name => header.indexOf(norm(name)));
    if (info.some(index => index < 0)) return { error: `쿠팡 양식 ver.1.2가 맞는지 확인하세요 — 없는 열: ${INFO_HEADERS.filter((_, i) => info[i] < 0).join(', ')}` };
    const all = name => header.map((cell, index) => (cell === norm(name) ? index : -1)).filter(index => index >= 0);
    const prices = all('판매가격'), statuses = all('판매상태');
    if (prices.length < 2 || statuses.length < 2) return { error: '"변경/수정 요청"의 판매가격·판매상태 칸을 찾지 못했습니다(양식 ver.1.2가 맞는지 확인하세요).' };
    return { headerRow, info, newPrice: prices[prices.length - 1], newStatus: statuses[statuses.length - 1] };
  }

  /* ── 단가표 쪽 ── */
  function optionIndex(channelId) {
    const map = new Map();
    (HK_CHANNEL_LISTINGS[channelId] || []).forEach(product => product.items.forEach(item => { if (item.optionId) map.set(text(item.optionId), { product, item }); }));
    return map;
  }

  /* 옵션 하나를 어떻게 고칠지 정한다 — cur = { price, status, approval } (쿠팡의 지금 값). 돌려주는 값 = { price, status, issues:[[종류, 글]] }. */
  function decide(channelId, found, cur) {
    const out = { price: null, status: null, issues: [] };
    if (cur.approval && cur.approval !== '승인완료') { out.issues.push(['notApproved', cur.approval]); return out; }
    const { product, item } = found;
    const wantStatus = item.status ? '판매중지' : '판매중';
    if (cur.status !== wantStatus) out.status = wantStatus;
    if (!item.status) { // 판매중지로 내는 옵션은 가격을 채우지 않는다
      const target = _hkChannelTargetPrice(item.categoryId || product.categoryId, item.productCode, channelId, product, item);
      if (!(target > 0)) out.issues.push(['noPrice', '']);
      else if (cur.price != null && target !== cur.price) {
        if (target % 10) out.issues.push(['badUnit', `${target.toLocaleString()}원`]);
        else if (target > cur.price * 2 || target < cur.price * 0.5) out.issues.push(['overLimit', `${cur.price.toLocaleString()} → ${target.toLocaleString()}원`]);
        else out.price = target;
      }
    }
    // 판매중지였던 옵션을 판매중으로 되살리는데 가격을 못 고치면(한도 초과 등) 되살리지 않는다 — 엉뚱한 옛 가격으로 팔리게 되므로. 가격부터 맞춘 뒤 다시 만든다.
    if (out.status === '판매중' && out.issues.length) { out.status = null; out.issues.push(['revive', '가격을 못 고쳐 판매중으로 되살리지 않음']); }
    return out;
  }

  const newReport = () => ({ rows: 0, price: [], status: [], same: 0, notFound: [], notApproved: [], overLimit: [], badUnit: [], noPrice: [], info: [] });
  function logDecision(report, label, decision, cur) {
    decision.issues.forEach(([kind, detail]) => {
      const line = detail ? `${label} — ${detail}` : label;
      if (kind === 'notApproved') report.notApproved.push(line);
      else if (kind === 'overLimit') report.overLimit.push(line);
      else if (kind === 'badUnit') report.badUnit.push(line);
      else if (kind === 'noPrice') report.noPrice.push(label);
      else if (kind === 'revive') report.overLimit.push(`${label} — ${detail}`);
    });
    if (decision.status) report.status.push(`${label} → ${decision.status}`);
    if (decision.price != null) report.price.push(`${label} ${cur.price.toLocaleString()} → ${decision.price.toLocaleString()}원`);
    if (decision.status == null && decision.price == null && !decision.issues.length) report.same++;
  }

  const sample = (list, count = 5) => `${list.slice(0, count).join('\n  ')}${list.length > count ? `\n  … 외 ${list.length - count}개` : ''}`;
  function reportText(title, report) {
    const lines = [`${title}: 옵션 ${report.rows}개 중 가격 ${report.price.length}개 · 판매상태 ${report.status.length}개를 채웠고, 변경 없음 ${report.same}개`];
    const add = (head, list) => { if (list.length) lines.push(`${head} ${list.length}개:\n  ${sample(list)}`); };
    add('⚠ 변경 한도(인하 50%·인상 100%)를 넘어 안 채움', report.overLimit);
    add('⚠ 10원 단위가 아니라 안 채움', report.badUnit);
    add('⚠ 승인완료가 아니라 안 채움', report.notApproved);
    add('⚠ 단가표에 없는 옵션 ID', report.notFound);
    add('⚠ 단가표 가격을 계산하지 못함', report.noPrice);
    report.info.forEach(line => lines.push(line));
    return lines.join('\n');
  }

  /* ═══ 목록(카탈로그) — Supabase hk_settings 'coupang_catalog' ═══ */
  const client = () => (typeof supabaseClient !== 'undefined' ? supabaseClient : null);

  async function loadCatalog() {
    const db = client();
    if (db) {
      const { data, error } = await db.from('hk_settings').select('value,updated_at').eq('key', CATALOG_KEY).maybeSingle();
      if (!error && data && data.value && data.value.options) return { ...data.value, savedAt: data.updated_at, from: 'DB' };
    }
    const response = await fetch(CATALOG_SEED_URL);
    if (!response.ok) return null;
    return { ...(await response.json()), from: '기본 목록' };
  }

  async function saveCatalog(catalog) {
    const db = client();
    if (!db) throw new Error('Supabase에 연결되지 않았습니다.');
    const { error } = await db.from('hk_settings').upsert({ key: CATALOG_KEY, value: catalog, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw new Error(error.message || String(error));
  }

  /* 쿠팡 엑셀 여러 개 → { 옵션ID: [15칸] } */
  async function parseCatalogFiles(files) {
    const options = {};
    const perFile = [];
    for (const file of files) {
      const rows = readSheet(await file.arrayBuffer());
      const at = locate(rows);
      if (at.error) throw new Error(`${file.name}: ${at.error}`);
      let count = 0;
      for (let r = at.headerRow + 1; r < rows.length; r++) {
        const record = at.info.map(index => text(rows[r][index]));
        if (!record[OPTION]) continue;
        options[record[OPTION]] = record;
        count++;
      }
      perFile.push(`${file.name} ${count}개`);
    }
    return { options, perFile };
  }

  window.hkCoupangParseCatalog = parseCatalogFiles; // 시험용으로도 쓴다(저장 없이 파일만 읽기)

  async function handleCatalogFiles(files) {
    try {
      const { options, perFile } = await parseCatalogFiles(files);
      const ids = Object.keys(options);
      if (!ids.length) { toast('옵션을 하나도 읽지 못했습니다.', 'error'); return; }
      let previous = null;
      try { previous = await loadCatalog(); } catch (error) { /* 처음이면 없다 */ }
      const before = previous?.options || {};
      const added = ids.filter(id => !before[id]).length;
      const gone = Object.keys(before).filter(id => !options[id]);
      const products = new Set(ids.map(id => options[id][PRODUCT])).size;
      const index = new Map([...optionIndex('coupang'), ...optionIndex('coupang_sub')]);
      const unmapped = ids.filter(id => !index.has(id)).length;
      let merged = { ...options };
      let note = '';
      if (gone.length) {
        // 올린 파일이 쿠팡 전체 목록이면 파일에 없는 옛 옵션은 지워진 것이다. 일부만 올렸다면 남겨 둔다.
        if (confirm(`올린 파일(${perFile.join(', ')})에는 옵션 ${ids.length}개가 있고, 저장된 목록에는 있는데 이번 파일에 없는 옵션이 ${gone.length}개 있습니다.\n\n이번 파일이 쿠팡 전체 목록이면 [확인] — 없는 옵션을 목록에서 지웁니다.\n일부 상품만 올린 거면 [취소] — 기존 옵션은 그대로 두고 이번 옵션만 갱신합니다.`)) note = ` · 사라진 옵션 ${gone.length}개 삭제`;
        else merged = { ...before, ...options };
      } else merged = { ...before, ...options };
      await saveCatalog({ updatedAt: new Date().toISOString(), options: merged });
      toast(`쿠팡 목록을 저장했습니다 — 이번 파일 옵션 ${ids.length}개(상품 ${products}개), 새로 추가 ${added}개${note}\n전체 ${Object.keys(merged).length}개 옵션 · 단가표(쿠팡·쿠팡_부자재)에 없는 옵션 ${unmapped}개`, 'success');
    } catch (error) {
      console.error('[쿠팡 목록 등록]', error);
      toast(`쿠팡 목록을 저장하지 못했습니다 — ${error.message}`, 'error');
    }
  }

  /* ═══ ② 저장한 목록과 단가표를 비교해 바뀐 옵션만 쿠팡 양식에 담기 ═══ */
  function rowXml(r, record, change) {
    const cells = record.map((value, c) => `<c r="${String.fromCharCode(65 + c)}${r}" s="11" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`).join('');
    const price = change.price != null ? `<c r="P${r}" s="11"><v>${change.price}</v></c>` : `<c r="P${r}" s="11"></c>`;
    const status = change.status ? `<c r="R${r}" s="11" t="inlineStr"><is><t>${escapeXml(change.status)}</t></is></c>` : `<c r="R${r}" s="11"></c>`;
    return `<row r="${r}">\n${cells}${price}<c r="Q${r}" s="11"></c>${status}<c r="S${r}" s="11"></c><c r="T${r}" s="11"></c></row>`;
  }

  async function templateWith(templateBuffer, changes) {
    const zip = await JSZip.loadAsync(templateBuffer);
    const sheetPath = Object.keys(zip.files).filter(name => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort()[0];
    let xml = await zip.file(sheetPath).async('string');
    if (!xml.includes('</sheetData>')) throw new Error('양식 파일의 시트 구조가 다릅니다.');
    const body = changes.map((change, i) => rowXml(4 + i, change.record, change)).join('');
    xml = xml.replace('</sheetData>', `${body}</sheetData>`);
    zip.file(sheetPath, xml);
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /* 저장한 목록(catalog.options)의 옵션을 단가표(이 채널)와 옵션 ID로 짝지어, scope 안의 옵션을 전부 고른다.
     scope = { category:'all'|카테고리ID } 또는 { productId:'단가표 상품ID' }(단가표의 상품 기준 — 쿠팡의 Product ID가 아니다).
     돌려주는 값 = { report, rows:[{ record, price, status }] } — price·status는 단가표 값이 쿠팡 목록과 다를 때만 있다(없으면 null = 양식 칸을 비워 둔다). */
  window.hkCoupangPlanFromCatalog = function (channelId, catalog, scope = { category: 'all' }) {
    const mine = optionIndex(channelId);
    const other = optionIndex(channelId === 'coupang' ? 'coupang_sub' : 'coupang');
    const report = newReport();
    const rows = [];
    let productDiffers = 0;
    const inScope = found => {
      if (scope.productId) return text(found.product.productId) === text(scope.productId);
      return !scope.category || scope.category === 'all' || found.product.categoryId === scope.category;
    };
    const compute = () => {
      Object.values(catalog.options).forEach(rec => {
        const optionId = rec[OPTION];
        const label = `${optionId}${rec[NAME] ? ` (${rec[NAME]})` : ''}`;
        const found = mine.get(optionId);
        if (!found) { if (!other.has(optionId) && !scope.productId && (!scope.category || scope.category === 'all')) report.notFound.push(label); return; } // 다른 쿠팡 채널에 있으면 그쪽 버튼에서 다룬다
        if (!inScope(found)) return;
        report.rows++;
        if (text(found.product.productId) !== rec[PRODUCT]) productDiffers++;
        const cur = { price: number(rec[PRICE]), status: rec[STATUS], approval: rec[APPROVAL] };
        const decision = decide(channelId, found, cur);
        rows.push({ record: rec, price: decision.price, status: decision.status });
        logDecision(report, label, decision, cur);
      });
    };
    if (typeof _hkRunLookupPass === 'function') _hkRunLookupPass(compute); else compute();
    const absent = [...mine.entries()].filter(([id, found]) => !catalog.options[id] && inScope(found)).map(([id]) => id);
    if (productDiffers) report.info.push(`ℹ Product ID가 단가표와 다른 옵션 ${productDiffers}개 — 옵션 ID로 짝지었습니다.`);
    if (absent.length) report.info.push(`ℹ 단가표에는 있지만 쿠팡 목록에 없는 옵션 ${absent.length}개(${absent.slice(0, 3).join(', ')}${absent.length > 3 ? ' …' : ''}) — 쿠팡에 새로 등록했다면 [쿠팡 목록 등록]으로 목록을 갱신하세요.`);
    return { report, rows };
  };

  /* 양식 + 바뀐 옵션 줄 → 파일(Blob). 내려받기·시험 공용. */
  window.hkCoupangBuildFile = async function (changes) {
    const response = await fetch(TEMPLATE_URL);
    if (!response.ok) throw new Error('쿠팡 양식 파일(data/coupang_bulk_template.xlsx)을 불러오지 못했습니다.');
    return templateWith(await response.arrayBuffer(), changes);
  };

  function loadScript(url, ready, callback) {
    if (ready()) return callback();
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
  }
  const withLibs = callback => loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', () => typeof XLSX !== 'undefined',
    () => loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', () => typeof JSZip !== 'undefined', callback));

  function download(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function pickFiles(multiple, onFiles) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';
    input.multiple = multiple;
    input.onchange = () => { if (input.files.length) onFiles([...input.files]); };
    input.click();
  }

  window.hkCoupangCatalogPick = function () {
    withLibs(() => pickFiles(true, handleCatalogFiles));
  };

  /* [쿠팡 수정 엑셀] / 상품 줄의 [쿠팡 양식] — 저장한 목록 + 단가표 → 쿠팡 양식 파일(들).
     scope를 안 주면 지금 몰별 표에서 고른 분류(전체·아이소핑크…)다. { productId } 를 주면 그 상품의 옵션만. */
  window.hkCoupangExcelDownload = function (channelId, scope) {
    if (!CHANNELS.includes(channelId)) return;
    if (!scope || typeof scope !== 'object') scope = { category: typeof _activeHkChannelCategory !== 'undefined' ? _activeHkChannelCategory : 'all' };
    withLibs(async () => {
      try {
        const catalog = await loadCatalog();
        if (!catalog || !catalog.options || !Object.keys(catalog.options).length) { toast('쿠팡 목록이 없습니다 — [쿠팡 목록 등록]으로 쿠팡 윙의 전체 목록 엑셀을 올려 주세요.', 'warning'); return; }
        const { report, rows } = window.hkCoupangPlanFromCatalog(channelId, catalog, scope);
        const categoryLabel = scope.productId ? `상품 ${scope.productId}` : (scope.category === 'all' ? '전체' : (HK_CATEGORIES.find(c => c.id === scope.category)?.label || scope.category));
        const savedAt = (catalog.updatedAt || catalog.savedAt) ? new Date(catalog.updatedAt || catalog.savedAt).toLocaleString('ko-KR') : '';
        report.info.push(`ℹ 쿠팡 목록 기준: ${catalog.from || ''} ${savedAt} — 그 뒤에 쿠팡에서 직접 고친 값은 모릅니다.`);
        if (!rows.length) { toast(`${CHANNEL_LABEL[channelId]} ${categoryLabel}: 담을 옵션이 없습니다(단가표 옵션 ID가 쿠팡 목록에 없습니다).\n${report.info.join('\n')}`, 'warning'); return; }
        const message = reportText(`${CHANNEL_LABEL[channelId]} ${categoryLabel} 수정 양식`, report);
        const warned = /⚠/.test(message);
        const filled = report.price.length + report.status.length;
        if (warned && !confirm(`${message}\n\n경고한 옵션은 변경 칸을 비워 두고 양식에 담아 받을까요?`)) return;
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const parts = Math.ceil(rows.length / MAX_ROWS);
        const labelForFile = scope.productId ? `상품${scope.productId}` : categoryLabel;
        for (let i = 0; i < parts; i++) {
          const blob = await window.hkCoupangBuildFile(rows.slice(i * MAX_ROWS, (i + 1) * MAX_ROWS));
          download(blob, `쿠팡_수정양식_${CHANNEL_LABEL[channelId]}_${labelForFile}_${today}${parts > 1 ? `_${i + 1}` : ''}.xlsx`);
        }
        toast(`${message}\n\n옵션 ${rows.length}개를 ${parts}개 파일로 내려받았습니다.${filled ? '' : ' (단가표와 쿠팡 목록이 같아 변경 칸은 비어 있습니다 — 양식만 담았습니다.)'}`, warned ? 'warning' : 'success');
      } catch (error) {
        console.error('[쿠팡 수정 엑셀]', error);
        toast(`쿠팡 수정 양식을 만들지 못했습니다 — ${error.message}`, 'error');
      }
    });
  };
})();
