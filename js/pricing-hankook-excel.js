/* ===============================================================
   js/pricing-hankook-excel.js — 한국단열 단가표 엑셀 저장 (2026-10-16, 사용자 요청)

   [단가표 엑셀] 단추 → 지금 화면에 그려진 한국단열 단가표를 카테고리별 시트로 저장한다.
   - 값은 화면의 표(머리글·행·입력칸 값)를 그대로 읽어 온다 — 카테고리마다 계산 코드가 달라서 따로 계산하지 않고,
     화면과 엑셀이 어긋나지 않게 이미 계산되어 그려진 표를 변환한다. 공식은 넣지 않고 값만 저장한다.
   - 시트 = 카테고리(아이소핑크·스티로폼·열반사·단열벽지·창문형·기타단열재·부자재·추가상품).
     시트 안은 위에 원가 카드, 그 아래 상품군(아코디언)마다 구분 줄 + 표 순서다.
   - 서식은 에너가드 엑셀(js/pricing.js _styleSheet)과 같은 모양: 제목, 짙은 머리글, 쉼표 숫자, 상품군 구분.
   - 경쟁사 비교 엑셀은 이 파일과 별개다(따로 만든다).
   - 창문형의 두께×규격 가격 매트릭스(70개 이상씩)는 아코디언을 열 때 계산되는 표라 이 엑셀에는 넣지 않는다(두께별 고정값 표만).
=============================================================== */
(function () {
  'use strict';

  const CATS = [
    { id: 'hk_isopink', name: '아이소핑크' },
    { id: 'hk_bead', name: '스티로폼' },
    { id: 'hk_reflective', name: '열반사' },
    { id: 'hk_wallpaper', name: '단열벽지' },
    { id: 'hk_window', name: '창문형' },
    { id: 'hk_etc', name: '기타단열재' },
    { id: 'hk_sub', name: '부자재' },
    { id: 'hk_supp', name: '추가상품' },
  ];
  const FONT = '맑은 고딕';

  const toast = (message, type) => { if (typeof showToast === 'function') showToast(message, type); else console.warn('[단가표 엑셀]', message); };

  /* ─── 화면 표 읽기 ─── */
  function cellText(cell) {
    const input = cell.querySelector('input:not([type="checkbox"]):not([type="hidden"]):not([type="radio"])');
    if (input && String(input.value).trim() !== '') return String(input.value).trim();
    const select = cell.querySelector('select');
    if (select && select.options[select.selectedIndex]) return select.options[select.selectedIndex].text.trim();
    const clone = cell.cloneNode(true);
    clone.querySelectorAll('[hidden], button, .hk-iso-price-history, .hk-iso-code-alias, script, style').forEach(node => node.remove());
    clone.querySelectorAll('br').forEach(node => node.replaceWith(' '));          // 줄바꿈은 공백으로("실제 원가" + "원/mm"이 붙지 않게)
    clone.querySelectorAll('div, p, li').forEach(node => node.append(' '));
    clone.querySelectorAll('small').forEach(node => node.before(' '));              // 판매사이즈 칸의 '430*430-3' 뒤에 붙은 상품코드(small)와 띄운다
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  /* rowspan·colspan을 풀어 글자 격자로 만든다 */
  function gridOf(trs) {
    const grid = [];
    trs.forEach((tr, r) => {
      grid[r] = grid[r] || [];
      let c = 0;
      [...tr.children].forEach(cell => {
        while (grid[r][c] !== undefined) c++;
        const rs = cell.rowSpan || 1, cs = cell.colSpan || 1;
        const text = cellText(cell);
        for (let i = 0; i < rs; i++) {
          grid[r + i] = grid[r + i] || [];
          for (let j = 0; j < cs; j++) grid[r + i][c + j] = text;
        }
        c += cs;
      });
    });
    return grid;
  }

  const visible = tr => !tr.hidden && tr.style.display !== 'none';

  function readTable(table) {
    const headTrs = [...table.querySelectorAll(':scope > thead > tr')].filter(visible);
    const bodyTrs = [...table.querySelectorAll(':scope > tbody > tr')].filter(visible);
    const hg = gridOf(headTrs);
    const width = Math.max(0, ...hg.map(r => r.length), ...bodyTrs.map(tr => [...tr.children].reduce((n, c) => n + (c.colSpan || 1), 0)));
    const header = [];
    for (let c = 0; c < width; c++) {
      const parts = [];
      hg.forEach(row => { const t = row[c]; if (t && parts[parts.length - 1] !== t) parts.push(t); });
      header.push(parts.join(' '));
    }
    const rows = gridOf(bodyTrs).map(r => { const row = []; for (let c = 0; c < width; c++) row.push(r[c] === undefined ? '' : r[c]); return row; })
      .filter(r => r.some(v => v !== ''));
    return { header, rows, width };
  }

  /* 글자 → 엑셀 값 */
  function toValue(text) {
    const t = String(text == null ? '' : text).trim();
    if (t === '' || t === '—' || t === '-' || t === '–') return { v: '' };
    const withBadge = t.match(/^(-?\d[\d,]*)\s*(동일|인상|인하)$/); // "104,000동일" — 숫자 뒤에 붙은 비교 표시는 떼고 값만
    if (withBadge) return { v: Number(withBadge[1].replace(/,/g, '')), z: '#,##0' };
    if (/^-?\d{1,3}(,\d{3})+$/.test(t) || /^-?\d+$/.test(t)) return { v: Number(t.replace(/,/g, '')), z: '#,##0' };
    if (/^-?\d{1,3}(,\d{3})*\.\d+$/.test(t) || /^-?\d+\.\d+$/.test(t)) return { v: Number(t.replace(/,/g, '')), z: '#,##0.##' };
    if (/^-?\d+(\.\d+)?%$/.test(t)) return { v: Number(t.replace('%', '')) / 100, z: '0%' };
    return { v: t };
  }

  /* ─── 시트 만들기 ─── */
  function buildSheet(XL, cat, month) {
    const pane = document.getElementById(`pricing-tab-${cat.id}`);
    if (!pane) return null;
    const blocks = []; // { kind:'group'|'head'|'data'|'sep'|'note', cells:[...], band }
    let maxCols = 1;
    const addTable = (table, band) => {
      const t = readTable(table);
      if (!t.width || (!t.rows.length && !t.header.some(Boolean))) return;
      maxCols = Math.max(maxCols, t.width);
      if (t.header.some(Boolean)) blocks.push({ kind: 'head', cells: t.header });
      t.rows.forEach(row => {
        const distinct = [...new Set(row.filter(v => v !== ''))];
        if (row.length > 2 && distinct.length === 1 && row.filter(v => v !== '').length >= Math.min(row.length, 3)) blocks.push({ kind: 'sep', cells: [distinct[0]] });
        else blocks.push({ kind: 'data', cells: row, band });
      });
    };

    // 원가 카드(아코디언 밖) — 표가 있는 것만
    const costTables = [...pane.querySelectorAll('.pricing-cost-card table')].filter(tb => !tb.closest('.hk-iso-accordion'));
    if (costTables.length) {
      blocks.push({ kind: 'group', cells: ['원가 설정'] });
      costTables.forEach(tb => addTable(tb, 0));
    }

    // 상품군(아코디언)마다 구분 줄 + 표
    let band = 0;
    let skippedLazy = 0;
    pane.querySelectorAll('.hk-iso-accordion').forEach(acc => {
      const id = acc.id || '';
      const body = acc.querySelector('.hk-iso-accordion-body');
      if (cat.id === 'hk_window' && !/^hkIsoAcc-win_g\d+$/.test(id)) { skippedLazy++; return; }
      const tables = body ? [...body.querySelectorAll('table')] : [];
      if (!tables.length) return;
      const title = ((acc.querySelector('.hk-iso-accordion-title') || {}).textContent || '').trim();
      const count = ((acc.querySelector('.hk-iso-accordion-count') || {}).textContent || '').trim();
      blocks.push({ kind: 'group', cells: [[title, count].filter(Boolean).join('  ·  ') || id] });
      band = 1 - band;
      tables.forEach(tb => addTable(tb, band));
    });
    if (skippedLazy) blocks.push({ kind: 'note', cells: [`※ 창문형의 규격별 가격 매트릭스(${skippedLazy}개 표)는 화면에서 아코디언을 열 때 계산되는 표라 이 엑셀에는 넣지 않았습니다.`] });
    if (!blocks.length) return null;

    return writeBlocksSheet(XL, { title: `한국단열 ${cat.name} 단가표`, sub: `기준월: ${month || ''}`, blocks, maxCols });
  }

  /* 줄 묶음(blocks) → 서식이 적용된 시트.
     block: { kind:'group'|'head'|'data'|'sep'|'note', cells:[글자|숫자|{v,z,diff}], band, spans:[[열시작,열끝],…](head 줄 병합) } */
  function writeBlocksSheet(XL, { title, sub, blocks, maxCols: forcedCols }) {
    let maxCols = forcedCols || 1;
    blocks.forEach(b => { maxCols = Math.max(maxCols, b.cells.length); });
    const aoa = [[title], [sub || ''], []];
    const kinds = ['title', 'sub', 'blank'];
    const meta = [null, null, null];
    blocks.forEach(b => { aoa.push(b.cells.map(c => (c && typeof c === 'object' ? c.v : c))); kinds.push(b.kind); meta.push(b); });
    const ws = XL.utils.aoa_to_sheet(aoa);
    const at = (r, c) => XL.utils.encode_cell({ r, c });
    const merges = [];
    const widths = new Array(maxCols).fill(6);
    const border = color => ({ top: { style: 'thin', color: { rgb: color } }, bottom: { style: 'thin', color: { rgb: color } }, left: { style: 'thin', color: { rgb: color } }, right: { style: 'thin', color: { rgb: color } } });
    const displayWidth = text => [...String(text)].reduce((n, ch) => n + (ch.charCodeAt(0) > 255 ? 2 : 1), 0);

    kinds.forEach((kind, r) => {
      const last = maxCols - 1;
      if (kind === 'title') {
        merges.push({ s: { r, c: 0 }, e: { r, c: last } });
        ws[at(r, 0)].s = { font: { name: FONT, sz: 16, bold: true, color: { rgb: '1E293B' } }, alignment: { horizontal: 'left', vertical: 'center' } };
        return;
      }
      if (kind === 'sub') {
        merges.push({ s: { r, c: 0 }, e: { r, c: last } });
        const cell = ws[at(r, 0)] || (ws[at(r, 0)] = { t: 's', v: '' });
        cell.s = { font: { name: FONT, sz: 10, color: { rgb: '64748B' } }, alignment: { horizontal: 'left', vertical: 'center' } };
        return;
      }
      if (kind === 'blank') return;
      if (kind === 'group' || kind === 'sep' || kind === 'note') {
        const cell = ws[at(r, 0)] || (ws[at(r, 0)] = { t: 's', v: '' });
        const style = kind === 'group'
          ? { font: { name: FONT, sz: 11, bold: true, color: { rgb: '312E81' } }, fill: { patternType: 'solid', fgColor: { rgb: 'E0E7FF' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: border('A5B4FC') }
          : (kind === 'sep'
            ? { font: { name: FONT, sz: 10, italic: true, color: { rgb: '475569' } }, fill: { patternType: 'solid', fgColor: { rgb: 'F1F5F9' } }, alignment: { horizontal: 'left', vertical: 'center' } }
            : { font: { name: FONT, sz: 10, color: { rgb: '64748B' } }, alignment: { horizontal: 'left', vertical: 'center', wrapText: false } });
        cell.s = style;
        for (let c = 1; c <= last; c++) ws[at(r, c)] = { t: 's', v: '', s: style };
        merges.push({ s: { r, c: 0 }, e: { r, c: last } });
        return;
      }
      if (kind === 'head') {
        const spans = (meta[r] && meta[r].spans) || [];
        for (let c = 0; c < maxCols; c++) {
          const cell = ws[at(r, c)] || (ws[at(r, c)] = { t: 's', v: '' });
          cell.t = 's';
          cell.s = { font: { name: FONT, sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, fill: { patternType: 'solid', fgColor: { rgb: spans.length ? '334155' : '1E293B' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: border('94A3B8') };
          widths[c] = Math.max(widths[c], Math.min(18, Math.ceil(displayWidth(cell.v) / 2) + 2));
        }
        spans.forEach(([c0, c1]) => { if (c1 > c0) merges.push({ s: { r, c: c0 }, e: { r, c: c1 } }); });
        return;
      }
      // data
      const bg = (meta[r] && meta[r].band) ? 'F8FAFC' : 'FFFFFF';
      for (let c = 0; c < maxCols; c++) {
        const src = (meta[r].cells[c] === undefined) ? '' : meta[r].cells[c];
        let value = src, z = null, isDiff = false;
        if (src && typeof src === 'object') { value = src.v; z = src.z || null; isDiff = !!src.diff; }
        let conv;
        if (typeof value === 'number') conv = { v: value, z: z || '#,##0' };
        else conv = toValue(value);
        if (z && typeof conv.v === 'number') conv.z = z;
        const isNum = typeof conv.v === 'number';
        const cell = { t: isNum ? 'n' : 's', v: conv.v };
        if (conv.z) cell.z = conv.z;
        let color = '1E293B';
        if (isNum && isDiff) color = conv.v > 0 ? 'DC2626' : (conv.v < 0 ? '2563EB' : '64748B'); // 우리가 비싸면 빨강, 싸면 파랑
        else if (isNum && conv.v < 0) color = 'DC2626';
        const isLink = typeof conv.v === 'string' && /^https?:\/\//i.test(conv.v);
        cell.s = {
          font: { name: FONT, sz: isLink ? 9 : 10, color: { rgb: isLink ? '64748B' : color } },
          fill: { patternType: 'solid', fgColor: { rgb: bg } },
          alignment: { horizontal: isNum ? 'right' : 'left', vertical: 'center' },
          border: border('E2E8F0'),
        };
        ws[at(r, c)] = cell;
        const shown = isNum ? (conv.z === '0%' ? `${Math.round(conv.v * 100)}%` : Number(conv.v).toLocaleString('ko-KR')) : String(conv.v);
        widths[c] = Math.max(widths[c], Math.min(isLink ? 44 : 40, displayWidth(shown) + 2));
      }
    });

    ws['!merges'] = merges;
    ws['!cols'] = widths.map(w => ({ wch: Math.max(8, w) }));
    ws['!rows'] = [{ hpt: 28 }, { hpt: 18 }];
    ws['!ref'] = XL.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: maxCols - 1 } });
    return ws;
  }

  /* ─── 저장 ─── */
  window.exportHkPricingExcel = async function () {
    const loader = typeof _loadStyledXlsx === 'function' ? _loadStyledXlsx : null; // js/pricing.js — 서식을 쓸 수 있는 SheetJS 판
    const XL = (loader ? await loader() : null) || window.XLSX;
    if (!XL || !XL.utils) { toast('엑셀 라이브러리를 불러오지 못했습니다. 새로고침 후 다시 눌러 주세요.', 'error'); return; }
    const month = (typeof HK_ISO_DRAFT_BASE_MONTH !== 'undefined' && HK_ISO_DRAFT_BASE_MONTH) || (document.getElementById('hkIsoBaseMonth') || {}).value || '';
    const wb = XL.utils.book_new();
    let sheets = 0;
    CATS.forEach(cat => {
      try {
        const ws = buildSheet(XL, cat, month);
        if (ws) { XL.utils.book_append_sheet(wb, ws, cat.name); sheets++; }
      } catch (error) {
        console.error('[단가표 엑셀]', cat.id, error);
      }
    });
    if (!sheets) { toast('저장할 단가표를 찾지 못했습니다. 한국단열 단가표를 연 뒤 다시 눌러 주세요.', 'error'); return; }
    const now = new Date();
    const stamp = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fileName = `한국단열_단가표_${stamp}.xlsx`;
    XL.writeFile(wb, fileName);
    toast(`${fileName} 저장 완료 (${sheets}개 시트)`, 'success');
  };
  window.exportHkCompareExcel = async function () {
    if (typeof window.hkCompareExportSheets !== 'function') { toast('경쟁사 비교 화면을 불러오지 못했습니다. 새로고침 후 다시 눌러 주세요.', 'error'); return; }
    const loader = typeof _loadStyledXlsx === 'function' ? _loadStyledXlsx : null;
    const XL = (loader ? await loader() : null) || window.XLSX;
    if (!XL || !XL.utils) { toast('엑셀 라이브러리를 불러오지 못했습니다. 새로고침 후 다시 눌러 주세요.', 'error'); return; }
    let data;
    try { data = await window.hkCompareExportSheets(); } catch (error) { console.error('[경쟁사 비교 엑셀]', error); toast('경쟁사 비교 자료를 읽지 못했습니다.', 'error'); return; }
    if (!data || !data.sheets || !data.sheets.length) { toast('저장할 경쟁사 비교 자료가 없습니다.', 'error'); return; }
    const month = (typeof HK_ISO_DRAFT_BASE_MONTH !== 'undefined' && HK_ISO_DRAFT_BASE_MONTH) || '';
    const savedAt = data.savedAt ? new Date(data.savedAt) : null;
    const savedText = savedAt && !Number.isNaN(savedAt.getTime()) ? ` · 경쟁사 가격 마지막 저장 ${savedAt.toLocaleString('ko-KR')}` : '';
    const wb = XL.utils.book_new();
    data.sheets.forEach(sheet => {
      try {
        const ws = writeBlocksSheet(XL, { title: `한국단열 ${sheet.title}`, sub: `${sheet.sub || ''}${savedText}`, blocks: sheet.blocks });
        XL.utils.book_append_sheet(wb, ws, sheet.name);
      } catch (error) { console.error('[경쟁사 비교 엑셀]', sheet.name, error); }
    });
    const now = new Date();
    const stamp = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fileName = `한국단열_경쟁사비교_${stamp}.xlsx`;
    XL.writeFile(wb, fileName);
    toast(`${fileName} 저장 완료 (${wb.SheetNames.length}개 시트)`, 'success');
  };
})();
