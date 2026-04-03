// ===============================================================
// estimate.js — 견적서 패널 계산 & 인쇄 로직
// 의존성: common.js (pricing.js의 단가 데이터 접근)
// ===============================================================

// ================= [견적서 패널 자동 계산 & 인쇄 로직] =================

// 숫자 콤마 포맷
function formatEstNum(num) {
    if (!num) return "";
    return Number(num).toLocaleString();
}

// 콤마 제거하고 순수 숫자로 변환
function unformatEstNum(str) {
    if (!str) return 0;
    return Number(String(str).replace(/,/g, ''));
}

// 수량/단가 입력 시 자동 계산 함수
window.calcEst = function() {
    let totalSupply = 0;
    let totalTax = 0;

    const rows = document.querySelectorAll('#estTbody tr');
    rows.forEach(row => {
        const qtyInput = row.querySelector('.est-qty');
        const priceInput = row.querySelector('.est-price');
        const supplyInput = row.querySelector('.est-supply');
        const taxInput = row.querySelector('.est-tax');

        const qty = unformatEstNum(qtyInput.value);
        const price = unformatEstNum(priceInput.value);
        // 주의: VAT토글 활성 시 priceInput에는 이미 역산된 공급가가 표시됨
        // toggleVatMode에서 표시값 변환 완료, calcEst는 표시된 값 그대로 사용

        // 둘 다 입력되었을 때만 계산
        if (qty > 0 && price > 0) {
            const supply = qty * price;
            const tax = Math.floor(supply * 0.1); // 10% 부가세 (소수점 버림)
            
            supplyInput.value = formatEstNum(supply);
            taxInput.value = formatEstNum(tax);
            
            totalSupply += supply;
            totalTax += tax;
            
            // 입력 중이 아닌 칸은 콤마 유지 (사용자 편의성)
            if(document.activeElement !== qtyInput) qtyInput.value = formatEstNum(qty);
            if(document.activeElement !== priceInput) priceInput.value = formatEstNum(unformatEstNum(priceInput.value));

        } else {
            supplyInput.value = "";
            taxInput.value = "";
        }
    });

    // 하단 및 상단 총계 업데이트
    document.getElementById('estSumSupply').value = formatEstNum(totalSupply);
    document.getElementById('estSumTax').value = formatEstNum(totalTax);
    document.getElementById('estTotalDisplay').innerText = formatEstNum(totalSupply + totalTax);
}

/* ── 운송비 마진 계산기 ──
   실제운송비 × 1.1(VAT) × 1.25(마진) → 만원 단위 반올림 → 단가 자동입력 */
window.calcShippingMargin = function(el) {
    const btn = el.closest('button') || el;
    const row = btn.closest('tr');
    if (!row) { console.warn('[운송비] tr을 찾지 못함'); return; }

    const costInput = row.querySelector('.est-shipping-cost-input');
    if (!costInput) { console.warn('[운송비] .est-shipping-cost-input 없음'); return; }

    // mousedown에서 캐시한 값 우선 사용 (blur 타이밍 문제 방지)
    const rawStr = btn._cachedCostVal !== undefined ? btn._cachedCostVal : costInput.value;
    const raw = unformatEstNum(rawStr);
    if (!raw || raw <= 0) { console.warn('[운송비] 입력값 없음 또는 0:', rawStr); return; }
    btn._cachedCostVal = undefined;

    const priceInput = row.querySelector('.est-price');
    if (!priceInput) { console.warn('[운송비] .est-price 없음'); return; }

    const calculated = Math.round((raw * 1.1 * 1.25) / 10000) * 10000;
    priceInput.value = formatEstNum(calculated);

    const qtyInput = row.querySelector('.est-qty');
    if (qtyInput && !unformatEstNum(qtyInput.value)) {
        qtyInput.value = '1';
    }
    calcEst();
};

// VAT포함가 역산 토글
window.toggleVatMode = function(btn) {
    btn.classList.toggle('active');
    const label = btn.querySelector('.vat-label');
    const isActive = btn.classList.contains('active');
    label.textContent = isActive ? 'VAT포함' : 'VAT제외';

    // 단가 표시값도 즉시 변환
    const row = btn.closest('tr');
    const priceInput = row ? row.querySelector('.est-price') : null;
    if (priceInput) {
        const raw = unformatEstNum(priceInput.value);
        if (raw > 0) {
            if (isActive) {
                // VAT포함가 → 공급가 역산: 10원 단위 내림 (우리 측 손해 방향)
                priceInput.value = formatEstNum(Math.floor(raw / 1.1 / 10) * 10);
            } else {
                // 역산된 공급가 → VAT포함가 복원: 10원 단위 올림
                priceInput.value = formatEstNum(Math.ceil(raw * 1.1 / 10) * 10);
            }
        }
    }
    calcEst();
};

// 포커스가 빠질 때 콤마 찍기
document.addEventListener('focusout', function(e) {
    if (e.target.classList.contains('est-qty') || e.target.classList.contains('est-price')) {
        const val = unformatEstNum(e.target.value);
        if(val > 0) e.target.value = formatEstNum(val);
        else e.target.value = "";
    }
});

// 포커스가 들어갈 때 콤마 빼기 (수정하기 쉽게)
document.addEventListener('focusin', function(e) {
    if (e.target.classList.contains('est-qty') || e.target.classList.contains('est-price')) {
        const val = unformatEstNum(e.target.value);
        e.target.value = val > 0 ? val : "";
    }
});

/* ═══════════════════════════════════════
   견적서 ↔ 단가표 연동
═══════════════════════════════════════ */

const EST_PRODUCT_META = {
  iso_iia:    { rows:[10,20],                                                                                                          name:'압출법단열재 (1호)',          specFn:t=>`${t}×900×1800` },
  iso_iib2:   { rows:[30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300],       name:'압출법단열재 (특호)',        specFn:t=>`${t}×900×1800` },
  bead_ia1:   { rows:[10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300], name:'비드법단열재 (2종 3호)',     specFn:t=>`${t}×900×1800` },
  bead_iia1:  { rows:[10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300], name:'비드법단열재 (2종 2호)',    specFn:t=>`${t}×900×1800` },
  bead_iiia2: { rows:[10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300], name:'비드법단열재 (2종 1호)',   specFn:t=>`${t}×900×1800` },
  bead_ia2:   { rows:[10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300], name:'비드법단열재 (1종 3호)',     specFn:t=>`${t}×900×1800` },
  bead_iia2:  { rows:[10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300], name:'비드법단열재 (1종 2호)',    specFn:t=>`${t}×900×1800` },
  bead_iiib:  { rows:[10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300], name:'비드법단열재 (1종 1호)',     specFn:t=>`${t}×900×1800` },
  bead_ib_09: { rows:[10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300], name:'비드법단열재 I-B (준불연)',         specFn:t=>`${t}×900×1800` },
  bead_ib_06: { rows:[10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300], name:'비드법단열재 I-B (준불연)',         specFn:t=>`${t}×600×1200` },
  pu_ic:      { rows:[40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300], name:'경질우레탄 (1종 3호)',       specFn:t=>`${t}×1000×2000` },
  pu_iiia:    { rows:[30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230],                          name:'경질우레탄 (2종 1호)',     specFn:t=>`${t}×1000×2000` },
  pu_iia:     { rows:[30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260],              name:'경질우레탄 (2종 2호)',      specFn:t=>`${t}×1000×2000` },
  pu_id_in:   { rows:[30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220],                              name:'경질우레탄 (준불연)',         specFn:t=>`${t}×1000×2000` },
  pu_id_out:  { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220],                                    name:'경질우레탄 (심재 준불연)',   specFn:t=>`${t}×1000×2000` },
  pf_lxo_s:   { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220], name:'LX PF보드 (심재 준불연)',    specFn:t=>`${t}×600×1200`  },
  pf_lxo_l:   { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220], name:'LX PF보드 (심재 준불연)',    specFn:t=>`${t}×1200×2000` },
  pf_lxi_s:   { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220], name:'LX PF보드 (준불연)',         specFn:t=>`${t}×600×1200`  },
  pf_lxi_l:   { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220], name:'LX PF보드 (준불연)',         specFn:t=>`${t}×1200×2000` },
  pf_kdo_s:   { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220], name:'국내산 PF보드 (심재 준불연)', specFn:t=>`${t}×600×1200`  },
  pf_kdo_l:   { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220], name:'국내산 PF보드 (심재 준불연)', specFn:t=>`${t}×1200×2000` },
  pf_kdi_s:   { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220], name:'국내산 PF보드 (준불연)',      specFn:t=>`${t}×600×1200`  },
  pf_kdi_l:   { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220], name:'국내산 PF보드 (준불연)',      specFn:t=>`${t}×1200×2000` },
  pf_imo_s:   { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220], name:'수입산 PF보드 (심재 준불연)', specFn:t=>`${t}×600×1200`  },
  pf_imo_l:   { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220], name:'수입산 PF보드 (심재 준불연)', specFn:t=>`${t}×1000×1200` },
  pf_imi_s:   { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220], name:'수입산 PF보드 (준불연)',      specFn:t=>`${t}×600×1200`  },
  pf_imi_l:   { rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220], name:'수입산 PF보드 (준불연)',      specFn:t=>`${t}×1000×1200` },
  // 불연단열재
  fr_bul:     { rows:[40,50,60,70], name:'불연 열반사단열재 (불연)',   specFn:t=>`${t}×1000×1200` },
  fr_jun:     { rows:[40,50],       name:'준불연 열반사단열재 (준불연)', specFn:t=>`${t}×1000×1200` },
};

// pricing.js 계산 함수로 실제 장당판매가 계산
// DOM input 값보다 _cachedCosts(Supabase에서 로드된 캐시)를 우선 참조
function _estGetCostVal(fieldId) {
  const cached = window._cachedCosts?.costs?.[fieldId];
  if (cached != null && cached !== 0) return cached;
  return parseFloat(document.getElementById(fieldId)?.value) || 0;
}

function _estGetRealPrice(productId, t) {
  try {
    const marginSrc = window._cachedCosts?.margins || null;

    // ── 아이소핑크 ──
    if (productId.startsWith('iso_')) {
      const r = _isoCalcRow(t);
      return r ? r.realPrice : null;
    }

    // ── 비드법 ──
    if (productId.startsWith('bead_')) {
      const gidMap = {
        bead_ia1:'ia1', bead_iia1:'iia1', bead_iiia2:'iiia2',
        bead_ia2:'ia2', bead_iia2:'iia2', bead_iiib:'iiib',
        bead_ib_09:'ib_09', bead_ib_06:'ib_06'
      };
      const grade = BEAD_GRADES.find(g => g.id === gidMap[productId]);
      if (!grade) return null;
      const costId = (grade.id === 'ib_09' || grade.id === 'ib_06') ? 'bead_cost_ib' : `bead_cost_${grade.id}`;
      const costPerM2 = _estGetCostVal(costId);
      if (!costPerM2) return null;
      const marginPerM2 = _getMargin('bead', grade, t, marginSrc);
      const r = calcSheetRow(costPerM2, marginPerM2, t, grade.area);
      return r.realPrice;
    }

    // ── 경질우레탄 ──
    if (productId.startsWith('pu_')) {
      const gidMap = {pu_ic:'ic', pu_iiia:'iiia', pu_iia:'iia', pu_id_in:'id_in', pu_id_out:'id_out'};
      const grade = PU_GRADES.find(g => g.id === gidMap[productId]);
      if (!grade) return null;
      const band = grade.costBands?.find(b => t >= b.min && t <= b.max);
      if (!band) return null;
      const costPerM2 = _estGetCostVal(band.costId);
      if (!costPerM2) return null;
      const marginPerM2 = _getMargin('pu', grade, t, marginSrc);
      const r = calcSheetRow(costPerM2, marginPerM2, t, grade.area);
      return r.realPrice;
    }

    // ── PF보드 ──
    if (productId.startsWith('pf_')) {
      const grade = PF_GRADES.find(g => g.id === productId.replace('pf_', ''));
      if (!grade) return null;
      const costPerM2 = _estGetCostVal(grade.costId);
      if (!costPerM2) return null;
      const marginPerM2 = _getMargin('pf', grade, t, marginSrc);
      const r = calcSheetRow(costPerM2, marginPerM2, t, grade.area);
      return r.realPrice;
    }

    // ── 불연단열재 ──
    if (productId.startsWith('fr_')) {
      const gidMap = { fr_bul: 'fr_bul', fr_jun: 'fr_jun' };
      const grade = FR_GRADES.find(g => g.id === gidMap[productId]);
      if (!grade) { console.warn('[fr] grade 없음', productId); return null; }
      const costId = `fr_cost_${grade.id}_t${t}`;
      // 캐시/DOM 우선, 없으면 FR_COST_DEFAULTS 기본값 폴백
      let costPerM2 = _estGetCostVal(costId);
      if (!costPerM2) costPerM2 = FR_COST_DEFAULTS?.[grade.costId]?.[t] ?? 0;
      const marginPerSheet = _getMargin('fr', grade, t, marginSrc);
      if (!costPerM2) return null;
      const r = calcFrSheetRow(costPerM2, marginPerSheet, grade.area);
      return r ? r.realPrice : null;
    }

  } catch(e) { console.error('[_estGetRealPrice]', productId, t, e); return null; }
  return null;
}

/* ═══════════════════════════════════════
   견적서 품명 행 동적 추가 / 삭제
═══════════════════════════════════════ */
const _EST_OPTS_HTML = `<option value="">-- 상품 선택 --</option>
  <optgroup label="아이소핑크">
    <option value="iso_iia">압출법단열재 (1호)</option>
    <option value="iso_iib2">압출법단열재 (특호)</option>
  </optgroup>
  <optgroup label="비드법단열재">
    <option value="bead_ia1">비드법단열재 (2종 3호)</option>
    <option value="bead_iia1">비드법단열재 (2종 2호)</option>
    <option value="bead_iiia2">비드법단열재 (2종 1호)</option>
    <option value="bead_ia2">비드법단열재 (1종 3호)</option>
    <option value="bead_iia2">비드법단열재 (1종 2호)</option>
    <option value="bead_iiib">비드법단열재 (1종 1호)</option>
    <option value="bead_ib_09">비드법단열재 (준불연 0.9×1.8)</option>
    <option value="bead_ib_06">비드법단열재 (준불연 0.6×1.2)</option>
  </optgroup>
  <optgroup label="경질우레탄">
    <option value="pu_ic">경질우레탄 (1종 3호)</option>
    <option value="pu_iiia">경질우레탄 (2종 1호)</option>
    <option value="pu_iia">경질우레탄 (2종 2호)</option>
    <option value="pu_id_in">경질우레탄 (준불연)</option>
    <option value="pu_id_out">경질우레탄 (심재 준불연)</option>
  </optgroup>
  <optgroup label="PF보드">
    <option value="pf_lxo_s">LX PF보드 심재준불연 (0.6×1.2)</option>
    <option value="pf_lxo_l">LX PF보드 심재준불연 (1.2×2)</option>
    <option value="pf_lxi_s">LX PF보드 준불연 (0.6×1.2)</option>
    <option value="pf_lxi_l">LX PF보드 준불연 (1.2×2)</option>
    <option value="pf_kdo_s">국내산 PF보드 심재준불연 (0.6×1.2)</option>
    <option value="pf_kdo_l">국내산 PF보드 심재준불연 (1.2×2)</option>
    <option value="pf_kdi_s">국내산 PF보드 준불연 (0.6×1.2)</option>
    <option value="pf_kdi_l">국내산 PF보드 준불연 (1.2×2)</option>
    <option value="pf_imo_s">수입산 PF보드 심재준불연 (0.6×1.2)</option>
    <option value="pf_imo_l">수입산 PF보드 심재준불연 (1×1.2)</option>
    <option value="pf_imi_s">수입산 PF보드 준불연 (0.6×1.2)</option>
    <option value="pf_imi_l">수입산 PF보드 준불연 (1×1.2)</option>
  </optgroup>
  <optgroup label="불연단열재">
    <option value="fr_bul">불연 열반사단열재 (불연)</option>
    <option value="fr_jun">준불연 열반사단열재 (준불연)</option>
  </optgroup>`;

function _makeEstItemRow() {
  const tr = document.createElement('tr');
  tr.className = 'est-item-row';
  tr.innerHTML = `
  <td class="est-td-name">
    <div class="est-screen-ui">
      <div class="est-selects-row">
        <select class="est-sel-product" onchange="estOnProductChange(this)">${_EST_OPTS_HTML}</select>
        <select class="est-sel-thick" onchange="estOnThickChange(this)" disabled><option value="">두께</option></select>
        <button class="est-del-row-btn est-screen-ui" onclick="removeEstRow(this)" title="행 삭제"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>
    <div class="est-print-name"></div>
  </td>
  <td><input type="text" class="est-spec-input align-center"></td>
  <td><input type="text" class="est-qty align-right" oninput="calcEst()"></td>
  <td><input type="text" class="est-price align-right" oninput="calcEst()"></td>
  <td><input type="text" class="est-supply align-right" readonly></td>
  <td><input type="text" class="est-tax align-right" readonly></td>
  <td><input type="text" class="est-remark"></td>`;
  return tr;
}

// 삭제 버튼 표시/숨김 동기화 (행이 1개면 × 숨김)
function _syncEstDelBtns() {
  const tbody = document.getElementById('estTbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr.est-item-row');
  rows.forEach(function(row) {
    const btn = row.querySelector('.est-del-row-btn');
    if (btn) btn.style.display = rows.length > 1 ? '' : 'none';
  });
}

window.addEstRow = function() {
  const tbody = document.getElementById('estTbody');
  const shippingRow = tbody.querySelector('.est-shipping-row');
  // 첫 행에 × 버튼 없으면 추가
  const firstRow = tbody.querySelector('tr.est-item-row');
  if (firstRow && !firstRow.querySelector('.est-del-row-btn')) {
    const delBtn = document.createElement('button');
    delBtn.className = 'est-del-row-btn est-screen-ui';
    delBtn.title = '행 삭제';
    delBtn.setAttribute('onclick', 'removeEstRow(this)');
    delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    firstRow.querySelector('.est-selects-row').appendChild(delBtn);
  }
  const newRow = _makeEstItemRow();
  tbody.insertBefore(newRow, shippingRow);
  _syncEstDelBtns();
};

window.removeEstRow = function(btn) {
  const row = btn.closest('tr.est-item-row');
  if (!row) return;
  const tbody = document.getElementById('estTbody');
  if (tbody.querySelectorAll('tr.est-item-row').length <= 1) return; // 최소 1행 유지
  row.remove();
  calcEst();
  _syncEstDelBtns();
};

// 상품 선택 → 두께 드롭다운 채우기
window.estOnProductChange = function(sel) {
  const row = sel.closest('tr');
  const thickSel = row.querySelector('.est-sel-thick');
  const productId = sel.value;
  const meta = EST_PRODUCT_META[productId];
  thickSel.innerHTML = '<option value="">두께 선택</option>';
  thickSel.disabled = !meta;
  if (!meta) {
    row.querySelector('.est-print-name').textContent = '';
    row.querySelector('.est-spec-input').value = '';
    row.querySelector('.est-price').value = '';
    calcEst(); return;
  }
  meta.rows.forEach(t => {
    const price = _estGetRealPrice(productId, t);
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = `${t}T${price ? ' — ' + price.toLocaleString('ko-KR') + '원' : ''}`;
    thickSel.appendChild(opt);
  });
};

// 두께 선택 → 품명/규격/단가 자동 입력
window.estOnThickChange = function(sel) {
  const row = sel.closest('tr');
  const t = parseInt(sel.value);
  if (!t) return;
  const productId = row.querySelector('.est-sel-product').value;
  const meta = EST_PRODUCT_META[productId];
  if (!meta) return;
  const price = _estGetRealPrice(productId, t);
  row.querySelector('.est-print-name').textContent = meta.name;
  row.querySelector('.est-spec-input').value = meta.specFn(t);
  // VAT토글 상태 확인 후 단가 세팅
  const vatBtn = row.querySelector('.est-vat-toggle');
  const isVatActive = vatBtn && vatBtn.classList.contains('active');
  let displayPrice = price || 0;
  if (isVatActive && displayPrice > 0) {
      // VAT포함 모드: 원가 → 공급가 역산 (10원 단위 내림)
      displayPrice = Math.floor(displayPrice / 1.1 / 10) * 10;
  }
  row.querySelector('.est-price').value = displayPrice ? displayPrice.toLocaleString('ko-KR') : '';
  calcEst();
  row.style.transition = 'background 0.4s';
  row.style.background = '#eff6ff';
  setTimeout(() => { row.style.background = ''; }, 1000);
};


function toggleEstimatePanel() {
    openPanel('estimatePanel', () => {
        // 패널을 열 때 오늘 날짜를 견적서 양식에 자동 기입
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        document.getElementById('estDateStr').value = `${year} 년 ${month} 월 ${date} 일`;
        // 단가표 방문 전이면 Supabase에서 원가 데이터 로드
        if (!window._cachedCosts && typeof loadPricingCosts === 'function') {
            loadPricingCosts();
        }
    });
}

/* ================= [견적서 인쇄 및 PDF 기능 수정] ================= */

// 1. 종이 인쇄 (우측 잘림 방지)
function printEstimate() {
    const MIN_PRINT_ROWS = 8;
    const tbody = document.getElementById('estTbody');
    const itemRows = tbody ? tbody.querySelectorAll('tr.est-item-row') : [];
    const blanksNeeded = Math.max(0, MIN_PRINT_ROWS - itemRows.length);
    const shippingRow = tbody ? tbody.querySelector('.est-shipping-row') : null;
    const addedRows = [];

    // 빈 행 삽입 — 운송비 바로 뒤에 (운송비가 품명 다음에 오도록)
    const afterShipping = shippingRow ? shippingRow.nextSibling : null;
    for (let b = 0; b < blanksNeeded; b++) {
        const blankTr = document.createElement('tr');
        blankTr.className = 'est-print-blank';
        blankTr.innerHTML = '<td></td><td></td><td></td><td></td><td></td><td></td><td></td>';
        tbody.insertBefore(blankTr, afterShipping);
        addedRows.push(blankTr);
    }

    document.body.classList.add('print-mode-wrap');
    window.print();

    setTimeout(() => {
        // 빈 행 제거
        addedRows.forEach(r => r.remove());
        document.body.classList.remove('print-mode-wrap');
    }, 500);
}
/* ── 자료실 저장 (Supabase Storage quote 폴더) ── */
async function saveEstimateToArchive() {
    if (!supabaseClient) { showToast('Supabase 연결 없음', 'error'); return; }
    if (typeof html2pdf === 'undefined') { showToast('PDF 라이브러리 로드 실패', 'error'); return; }

    const btn = document.querySelector('.btn-est-save');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...';
    btn.disabled = true;

    try {
        // 파일명 생성: YYMMDD_거래처명
        const now = new Date();
        const yy = String(now.getFullYear()).slice(2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const receiverEl = document.getElementById('estReceiverName');
        const receiver = (receiverEl?.value?.trim() || '').replace(/[^a-zA-Z0-9가-힣_-]/g, '') || '거래처';
        const originalName = `${yy}${mm}${dd}_${receiver}.pdf`;

        // 스토리지용 파일명
        const safeName = `${Date.now()}___${originalName}`;

        const source = document.getElementById('estimatePrintArea');

        // 캡처 전: UI 전용 요소 직접 숨김
        const screenEls = source.querySelectorAll('.est-screen-ui, .est-screen-only, .est-add-row-wrap, .est-footer-info, .est-shipping-calc-wrap, .est-vat-toggle');
        screenEls.forEach(el => {
            el.dataset.origVisibility = el.style.visibility;
            el.dataset.origPosition = el.style.position;
            el.style.visibility = 'hidden';
            el.style.position = 'absolute';
        });

        // input border 제거 (깔끔한 PDF용)
        const inputs = source.querySelectorAll('input, textarea');
        inputs.forEach(el => {
            el.dataset.origBorder = el.style.border;
            el.dataset.origBg = el.style.background;
            el.style.border = 'none';
            el.style.background = 'transparent';
        });

        const pdfBlob = await html2pdf()
            .set({
                margin: [8, 8, 8, 8],
                filename: originalName,
                image: { type: 'jpeg', quality: 0.97 },
                html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            })
            .from(source)
            .outputPdf('blob');

        // 캡처 후: 원상복구
        screenEls.forEach(el => {
            el.style.visibility = el.dataset.origVisibility || '';
            el.style.position = el.dataset.origPosition || '';
        });
        inputs.forEach(el => { el.style.border = el.dataset.origBorder || ''; el.style.background = el.dataset.origBg || ''; });

        // Supabase Storage 업로드
        const { error } = await supabaseClient.storage
            .from('archives')
            .upload(`quote/${safeName}`, pdfBlob, {
                contentType: 'application/pdf',
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        showToast(`자료실에 저장됐습니다 — ${originalName}`, 'success');

    } catch(e) {
        console.error('견적서 저장 실패:', e);
        showToast(`저장 실패: ${e.message}`, 'error');
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}