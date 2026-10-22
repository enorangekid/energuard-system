/* ═══════════════════════════════════════
   ESM+ 옵션 일괄 입력 엑셀 — 단열벽지 (2026-10-22)

   ESM(G마켓·옥션) 단열벽지는 "단열벽지 → 사이즈 → 디자인" 3단 조합 옵션 상품이라 옵션 가격은 **상품 대표 판매가 + 옵션 추가금액**이다.
   단가표 ESM 단열벽지 표의 상품 그룹 칸 아래 [ESM 옵션 엑셀]을 누르면 ESM+에 그대로 올릴 수 있는 옵션 일괄 입력 파일("옵션입력_Global" 시트)이 내려온다.
   · 옵션 이름 목록 = js/pricing-hankook-esm-options-data.js(G마켓 상품 페이지·ESM+ 옵션 엑셀에서 옮긴 것). ESM 옵션 엑셀은 올리면 옵션 전체를 덮어쓰므로 실제 상품의 옵션과 같아야 한다.
   · 가격 = 단가표 ESM 판매가((판매가+배송비 0)×1.08, 100원 올림). 가장 싼 옵션을 추가금액 0원으로 놓아 추가금액이 음수가 되지 않게 한다 — 그 옵션의 가격이 **상품 대표 판매가**라서
     ESM+에서 대표 판매가를 그 값으로 따로 바꿔야 한다(내려받을 때 알림으로 알려 준다).
   · 판매상태 = 한국단열 단열벽지 정식 상품(647994348)의 옵션 상태와 같게(품절 → 상태 품절, 판매중지 → 품절 + 노출 N).
   · 양식 = data/esm_option_template.xlsx(ESM+가 준 양식). SheetJS로 다시 쓰지 않고 시트 XML에 줄을 직접 넣는다(쿠팡 양식과 같은 이유 — 업로드가 양식 구조를 본다).
   읽기 전용 — 단가표 값은 바꾸지 않고 파일만 만든다.
═══════════════════════════════════════ */
(function () {
  const TYPE_KEYS = [['3D 실크벽지', 'SK'], ['실크', 'SK'], ['이중화이트', 'DW'], ['고급형1', 'P1'], ['고급형2', 'P2']];
  const SIZE_KEYS = { '1m': '1', '2.3m': '23', '10m': '10', '20m': '20' };
  const toast = (message, type) => { if (typeof showToast === 'function') showToast(message, type); else console.log(message); };
  const text = value => String(value ?? '').trim();

  function typeKey(label) {
    const found = TYPE_KEYS.find(([name]) => text(label).includes(name));
    return found ? found[1] : null;
  }

  /* 한 줄의 단가표 ESM 판매가 — 종류·사이즈를 못 읽거나 가격이 없으면 null */
  function esmPriceOf(typeLabel, sizeLabel) {
    const type = typeKey(typeLabel), size = SIZE_KEYS[text(sizeLabel).toLowerCase().replace(/\s+/g, '')];
    if (!type || !size) return null;
    const code = `WP_${type}_5_${size}`;
    const parts = _hkEsmPriceParts('hk_wallpaper', code, HK_CHANNEL_CONFIG.esm, { productCode: code, hkdShipping: 0 });
    return parts && parts.finalPrice > 0 ? { price: parts.finalPrice, code } : null;
  }

  function loadScript(url, ready, callback) {
    if (ready()) return callback();
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
  }
  const withLibs = callback => loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', () => typeof XLSX !== 'undefined',
    () => loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', () => typeof JSZip !== 'undefined', callback));

  /* ═══ 단가표에서 바로 업로드용 ESM 옵션 엑셀 만들기 ═══
     옵션 구조(이름 목록)는 js/pricing-hankook-esm-options-data.js(ESM+에서 내려받은 옵션 엑셀에서 옮긴 것), 가격은 단가표 ESM 판매가, 판매상태는 한국단열 단열벽지 정식 상품(647994348)의 옵션 상태와 같게.
     양식은 data/esm_option_template.xlsx(ESM+가 준 양식) — 7줄부터 옵션 줄을 지우고 새로 넣는다. 글자 칸은 공유 문자열로 쓴다(쿠팡 양식과 같은 이유). */
  const TEMPLATE_URL = 'data/esm_option_template.xlsx';
  const escapeXml = value => String(value).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  window.hkEsmOptionFileReady = productId => !!(window.HK_ESM_OPTION_FILES && window.HK_ESM_OPTION_FILES[String(productId)]);

  /* 한국단열 단열벽지 정식 상품(647994348)의 옵션 이름([종류, 사이즈, 디자인]) → 판매상태(stopped·soldout·없음) */
  function statusMap() {
    const map = new Map();
    const product = (HK_CHANNEL_LISTINGS.hkd || []).find(p => String(p.productId) === '647994348' && p.categoryId === 'hk_wallpaper');
    (product ? product.items : []).forEach(item => { if (Array.isArray(item.optionNames)) map.set(item.optionNames.map(text).join('|'), item.status || ''); });
    return map;
  }

  window.hkEsmBuildOptionFile = async function (productId, templateBuffer) {
    const def = window.HK_ESM_OPTION_FILES && window.HK_ESM_OPTION_FILES[String(productId)];
    if (!def) throw new Error('이 상품의 ESM 옵션 구조가 단가표에 없습니다.');
    const statuses = statusMap();
    const lines = def.rows.map(([type, size, design]) => {
      const priced = esmPriceOf(type, size);
      if (!priced) throw new Error(`단가표 가격을 찾지 못했습니다 — ${type} ${size}`);
      const key = [type, size, design].join('|');
      return { type, size, design, price: priced.price, status: statuses.has(key) ? statuses.get(key) : '' };
    });
    const base = lines.reduce((min, line) => (line.price < min.price ? line : min), lines[0]);
    const unknownStatus = lines.filter(line => !statuses.has([line.type, line.size, line.design].join('|'))).length;

    const zip = await JSZip.loadAsync(templateBuffer);
    const sheetPath = 'xl/worksheets/sheet1.xml';
    let xml = await zip.file(sheetPath).async('string');
    const sstPath = 'xl/sharedStrings.xml';
    let sstXml = await zip.file(sstPath).async('string');
    const sstCount = (sstXml.match(/<si[ >]/g) || []).length;
    const added = new Map();
    let refs = 0;
    const sst = value => { refs += 1; if (!added.has(value)) added.set(value, sstCount + added.size); return added.get(value); };
    const str = (ref, value) => (String(value) === '' ? `<c r="${ref}" s="1"/>` : `<c r="${ref}" s="1" t="s"><v>${sst(String(value))}</v></c>`);
    const num = (ref, value) => (value == null || value === '' ? `<c r="${ref}" s="1"/>` : `<c r="${ref}" s="1"><v>${value}</v></c>`);
    const body = lines.map((line, i) => {
      const r = 7 + i;
      const out = line.status !== ''; // 품절·판매중지
      const cells = [
        str(`A${r}`, '3S'),
        str(`B${r}`, line.type), str(`C${r}`, line.size), str(`D${r}`, line.design),
        str(`E${r}`, line.type), str(`F${r}`, line.size), str(`G${r}`, line.design),
        str(`H${r}`, line.type), str(`I${r}`, line.size), str(`J${r}`, line.design),
        str(`K${r}`, out ? '품절' : '정상'),
        str(`L${r}`, line.status === 'stopped' ? 'N' : 'Y'),
        num(`M${r}`, line.price - base.price || ''),
        str(`N${r}`, ''),
        num(`O${r}`, out ? '' : 99999), num(`P${r}`, out ? '' : 99999),
      ].join('');
      return `<row r="${r}" spans="1:16">${cells}</row>`;
    }).join('');
    // 양식의 예시 옵션 줄(7줄부터)을 지우고 새 줄을 넣는다.
    xml = xml.replace(/<row r="(\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/row>)/g, (m, n) => (Number(n) >= 7 ? '' : m));
    xml = xml.replace('</sheetData>', `${body}</sheetData>`);
    xml = xml.replace(/<dimension ref="[^"]*"\/>/, `<dimension ref="A1:P${6 + lines.length}"/>`);
    zip.file(sheetPath, xml);
    if (added.size) {
      const items = [...added.keys()].map(value => `<si><t xml:space="preserve">${escapeXml(value)}</t></si>`).join('');
      sstXml = sstXml.replace('</sst>', `${items}</sst>`);
      const attr = (name, add) => { sstXml = sstXml.replace(new RegExp(`(<sst[^>]*\\s${name}=")(\\d+)(")`), (m, a, n, b) => `${a}${Number(n) + add}${b}`); };
      attr('count', refs); attr('uniqueCount', added.size);
      zip.file(sstPath, sstXml);
    }
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return { blob, lines, report: { rows: lines.length, basePrice: base.price, baseLabel: `${base.type} ${base.size}`, soldout: lines.filter(l => l.status === 'soldout').length, stopped: lines.filter(l => l.status === 'stopped').length, unknownStatus } };
  };

  window.hkEsmOptionFileDownload = function (productId) {
    withLibs(async () => {
      try {
        const response = await fetch(TEMPLATE_URL);
        if (!response.ok) throw new Error(`양식 파일(${TEMPLATE_URL})을 불러오지 못했습니다.`);
        const { blob, report } = await window.hkEsmBuildOptionFile(productId, await response.arrayBuffer());
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ESM옵션_${productId}_${today}.xlsx`;
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 10000);
        toast(`ESM 옵션 엑셀을 내려받았습니다 — 옵션 ${report.rows}줄 · 품절 ${report.soldout} · 판매중지(노출 N) ${report.stopped}.\n`
          + `★ 상품 대표 판매가를 ${report.basePrice.toLocaleString()}원으로 바꿔야 합니다(추가금액 0원 기준 옵션: ${report.baseLabel}).${report.unknownStatus ? `\n⚠ 판매상태를 단가표에서 못 찾은 옵션 ${report.unknownStatus}개는 정상으로 냈습니다.` : ''}`, report.unknownStatus ? 'warning' : 'success');
      } catch (error) {
        console.error('[ESM 옵션 엑셀]', error);
        toast(`ESM 옵션 엑셀을 만들지 못했습니다 — ${error.message}`, 'error');
      }
    });
  };
})();
