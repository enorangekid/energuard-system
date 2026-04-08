/* ===============================================================
   js/pricing.js  —  에너가드컴퍼니 단가표
   모든 상품 통합 저장/이력 관리 (product_type = 'all')
   =============================================================== */

/* ═══════════════════════════════════════
   상품 데이터 정의
═══════════════════════════════════════ */

const ISOPINK_ROWS = [
  10,20,30,40,50,60,70,80,90,100,
  110,120,130,140,150,160,170,180,
  190,200,210,220,230,240,250,260,270,280,290,300
];

/* 아이소핑크 마진 기본값 (원/mm) */
const ISO_MARGIN_DEFS = {
  10:35, 20:70, 30:60, 40:60, 50:60, 60:60, 70:60, 80:60, 90:60, 100:60,
  110:60,120:60,130:60,140:60,150:60,160:60,170:60,180:60,
  190:55,200:55,210:55,220:55,230:55,240:55,250:55,260:55,270:55,280:55,290:55,300:55
};

const PU_GRADES = [
  { id:'ic',     label:'I-C',   sub1:'경질우레탄', sub2:'1종 3호',           area:2.0, colorClass:'pu-ic',
    rows:[40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300],
    fallback:{40:100,50:90,60:70,70:55,80:50,90:45,100:35,110:35,120:35,130:35,140:35,150:35,160:35,170:35,180:35,190:35,200:35,210:35,220:35,230:35,240:35,250:35,260:35,270:35,280:35,290:35,300:35},
    costBands:[
      { min:40, max:45,  costId:'pu_cost_ic_b1', label:'40T ~ 45T'  },
      { min:50, max:65,  costId:'pu_cost_ic_b2', label:'50T ~ 65T'  },
      { min:70, max:300, costId:'pu_cost_ic_b3', label:'70T ~ 230T' },
    ]
  },
  { id:'iiia',   label:'III-A', sub1:'경질우레탄', sub2:'2종 1호',           area:2.0, colorClass:'pu-iiia',
    rows:[30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230],
    fallback:{30:45,40:95,50:85,60:65,70:50,80:45,90:40,100:30,110:30,120:30,130:30,140:30,150:30,160:30,170:30,180:30,190:30,200:30,210:30,220:30,230:30},
    costBands:[
      { min:30, max:35,  costId:'pu_cost_iiia_b1', label:'30T ~ 35T'  },
      { min:40, max:45,  costId:'pu_cost_iiia_b2', label:'40T ~ 45T'  },
      { min:50, max:65,  costId:'pu_cost_iiia_b3', label:'50T ~ 65T'  },
      { min:70, max:230, costId:'pu_cost_iiia_b4', label:'70T ~ 230T' },
    ]
  },
  { id:'iia',    label:'II-A',  sub1:'경질우레탄', sub2:'2종 2호',           area:2.0, colorClass:'pu-iia',
    rows:[30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260],
    fallback:{30:40,40:42,50:35,60:35,70:30,80:30,90:30,100:22,110:22,120:22,130:22,140:22,150:22,160:25,170:25,180:25,190:25,200:25,210:25,220:22,230:25,240:40,250:40,260:40},
    costBands:[
      { min:30, max:35,  costId:'pu_cost_iia_b1', label:'30T ~ 35T'   },
      { min:40, max:45,  costId:'pu_cost_iia_b2', label:'40T ~ 45T'   },
      { min:50, max:65,  costId:'pu_cost_iia_b3', label:'50T ~ 65T'   },
      { min:70, max:230, costId:'pu_cost_iia_b4', label:'70T ~ 230T'  },
      { min:235,max:260, costId:'pu_cost_iia_b5', label:'235T ~ 260T' },
    ]
  },
  { id:'id_in',  label:'I-D',   sub1:'경질우레탄', sub2:'준불연',   area:2.0, colorClass:'pu-id',
    rows:[30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220],
    fallback:{30:100,40:100,50:45,60:40,70:40,80:35,90:35,100:35,110:35,120:35,130:35,140:35,150:35,160:35,170:35,180:35,190:35,200:35,210:35,220:35},
    costBands:[
      { min:30, max:30,  costId:'pu_cost_id_in_b1', label:'30T'        },
      { min:40, max:40,  costId:'pu_cost_id_in_b2', label:'40T'        },
      { min:50, max:70,  costId:'pu_cost_id_in_b3', label:'50T ~ 70T'  },
      { min:80, max:225, costId:'pu_cost_id_in_b4', label:'80T ~ 225T' },
    ]
  },
  { id:'id_out', label:'I-D',   sub1:'경질우레탄', sub2:'심재 준불연', area:2.0, colorClass:'pu-id-out',
    rows:[50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220],
    fallback:{50:85,60:80,70:75,80:75,90:70,100:70,110:70,120:70,130:70,140:70,150:70,160:70,170:70,180:70,190:70,200:70,210:70,220:70},
    costBands:[
      { min:50, max:60,  costId:'pu_cost_id_out_b1', label:'50T ~ 60T'  },
      { min:70, max:220, costId:'pu_cost_id_out_b2', label:'70T ~ 220T' },
    ]
  },
];

const BEAD_ROWS = [
  10,20,30,40,50,60,70,80,90,100,
  110,120,130,140,150,160,170,180,
  190,200,210,220,230,240,250,260,270,280,290,300
];

const BEAD_GRADES = [
  { id:'ia1',   label:'I-A-1',   sub:'2종 3호', area:1.62, colorClass:'bead-2jong', marginKey:'bead_m2_3' },
  { id:'iia1',  label:'II-A-1',  sub:'2종 2호', area:1.62, colorClass:'bead-2jong', marginKey:'bead_m2_2' },
  { id:'iiia2', label:'III-A-2', sub:'2종 1호', area:1.62, colorClass:'bead-2jong', marginKey:'bead_m2_1' },
  { id:'ia2',   label:'I-A-2',   sub:'1종 3호', area:1.62, colorClass:'bead-1jong', marginKey:'bead_m1_3' },
  { id:'iia2',  label:'II-A-2',  sub:'1종 2호', area:1.62, colorClass:'bead-1jong', marginKey:'bead_m1_2' },
  { id:'iiib',  label:'III-B',   sub:'1종 1호', area:1.62, colorClass:'bead-1jong', marginKey:'bead_m1_1' },
  { id:'ib_09', label:'I-B',     sub:'심재 준불연 0.9×1.8', area:1.62, colorClass:'bead-junbul', marginKey:'bead_mj' },
  { id:'ib_06', label:'I-B',     sub:'심재 준불연 0.6×1.2', area:0.72, colorClass:'bead-junbul', marginKey:'bead_mj' },
];

/* 비드법 마진 기본값 */
const BEAD_MARGIN_FALLBACK = (() => {
  const fb = {};
  const T = BEAD_ROWS;
  const m2 = [85,75,65,55,45,40,35,35,35,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30];
  const m1 = [75,65,55,45,35,30,25,25,25,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20];
  const mj = [80,70,60,50,35,35,35,35,35,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30];
  T.forEach((t,i) => {
    /* 2종: 3호/2호/1호 개별 + 기존 호환용 bead_m2 */
    fb[`bead_m2_3_t${t}`] = m2[i];
    fb[`bead_m2_2_t${t}`] = m2[i];
    fb[`bead_m2_1_t${t}`] = m2[i];
    /* 1종: 3호/2호/1호 개별 + 기존 호환용 bead_m1 */
    fb[`bead_m1_3_t${t}`] = m1[i];
    fb[`bead_m1_2_t${t}`] = m1[i];
    fb[`bead_m1_1_t${t}`] = m1[i];
    /* 준불연 */
    fb[`bead_mj_t${t}`] = mj[i];
  });
  return fb;
})();

const PF_ROWS = [50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220];

const PF_FB = {
  lxo: {50:35,60:35,70:35,80:35,90:35,100:35,110:35,120:35,130:35,140:35,150:35,160:35,170:35,180:35,190:35,200:35,210:35,220:35},
  lxi: {50:45,60:45,70:45,80:45,90:45,100:45,110:45,120:45,130:45,140:45,150:45,160:45,170:45,180:45,190:45,200:45,210:45,220:45},
  kdo: {50:30,60:30,70:30,80:30,90:30,100:30,110:30,120:30,130:30,140:30,150:30,160:30,170:30,180:30,190:30,200:30,210:30,220:30},
  kdi: {50:40,60:30,70:30,80:30,90:30,100:30,110:30,120:30,130:30,140:30,150:30,160:30,170:30,180:30,190:30,200:30,210:30,220:30},
  imo: {50:35,60:35,70:35,80:35,90:35,100:35,110:35,120:35,130:35,140:35,150:35,160:35,170:35,180:35,190:35,200:35,210:35,220:35},
  imi: {50:50,60:50,70:40,80:40,90:40,100:40,110:40,120:40,130:40,140:40,150:40,160:40,170:40,180:40,190:40,200:40,210:40,220:40},
};

const PF_GRADES = [
  { id:'lxo_s', mk:'lxo', label:'I-C', pfCat:'LX PF보드', pfGrade:'심재 준불연', subLabel:'심재 준불연<br>외단열', costId:'pf_cost_lx_out', colorClass:'pf-lx', area:0.72, areaLabel:'0.6×1.2' },
  { id:'lxo_l', mk:'lxo', label:'I-C', pfCat:'LX PF보드', pfGrade:'심재 준불연', subLabel:'심재 준불연<br>외단열', costId:'pf_cost_lx_out', colorClass:'pf-lx', area:2.4,  areaLabel:'1.2×2'   },
  { id:'lxi_s', mk:'lxi', label:'I-C', pfCat:'LX PF보드', pfGrade:'준불연', subLabel:'준불연<br>내단열',   costId:'pf_cost_lx_in',  colorClass:'pf-lx', area:0.72, areaLabel:'0.6×1.2' },
  { id:'lxi_l', mk:'lxi', label:'I-C', pfCat:'LX PF보드', pfGrade:'준불연', subLabel:'준불연<br>내단열',   costId:'pf_cost_lx_in',  colorClass:'pf-lx', area:2.4,  areaLabel:'1.2×2'   },
  { id:'kdo_s', mk:'kdo', label:'I-C', pfCat:'국내산 PF보드', pfGrade:'심재 준불연', subLabel:'심재 준불연<br>외단열', costId:'pf_cost_kd_out', colorClass:'pf-kd', area:0.72, areaLabel:'0.6×1.2' },
  { id:'kdo_l', mk:'kdo', label:'I-C', pfCat:'국내산 PF보드', pfGrade:'심재 준불연', subLabel:'심재 준불연<br>외단열', costId:'pf_cost_kd_out', colorClass:'pf-kd', area:2.4,  areaLabel:'1.2×2'   },
  { id:'kdi_s', mk:'kdi', label:'I-C', pfCat:'국내산 PF보드', pfGrade:'준불연', subLabel:'준불연<br>내단열',   costId:'pf_cost_kd_in',  colorClass:'pf-kd', area:0.72, areaLabel:'0.6×1.2' },
  { id:'kdi_l', mk:'kdi', label:'I-C', pfCat:'국내산 PF보드', pfGrade:'준불연', subLabel:'준불연<br>내단열',   costId:'pf_cost_kd_in',  colorClass:'pf-kd', area:2.4,  areaLabel:'1.2×2'   },
  { id:'imo_s', mk:'imo', label:'I-C', pfCat:'수입산 PF보드', pfGrade:'심재 준불연', subLabel:'심재 준불연<br>외단열', costId:'pf_cost_im_out', colorClass:'pf-im', area:0.72, areaLabel:'0.6×1.2' },
  { id:'imo_l', mk:'imo', label:'I-C', pfCat:'수입산 PF보드', pfGrade:'심재 준불연', subLabel:'심재 준불연<br>외단열', costId:'pf_cost_im_out', colorClass:'pf-im', area:1.2,  areaLabel:'1×1.2'   },
  { id:'imi_s', mk:'imi', label:'I-C', pfCat:'수입산 PF보드', pfGrade:'준불연', subLabel:'준불연<br>내단열',   costId:'pf_cost_im_in',  colorClass:'pf-im', area:0.72, areaLabel:'0.6×1.2' },
  { id:'imi_l', mk:'imi', label:'I-C', pfCat:'수입산 PF보드', pfGrade:'준불연', subLabel:'준불연<br>내단열',   costId:'pf_cost_im_in',  colorClass:'pf-im', area:1.2,  areaLabel:'1×1.2'   },
];

/* 불연단열재 */
const FR_ROWS = { bul: [40,50,60,70], jun: [40,50] };  // bul=불연, jun=준불연

const FR_GRADES = [
  { id:'fr_bul', label:'불연',   sub1:'불연 열반사단열재',   sub2:'불연',   colorClass:'fr-bul',
    costId:'fr_cost_bul', area:1.2, tFactor:1,
    rows: FR_ROWS.bul,
    fallback: { 40:3000, 50:4000, 60:4000, 70:5000 },
  },
  { id:'fr_jun', label:'준불연', sub1:'준불연 열반사단열재', sub2:'준불연', colorClass:'fr-jun',
    costId:'fr_cost_jun', area:1.2, tFactor:1,
    rows: FR_ROWS.jun,
    fallback: { 40:3000, 50:4000 },
  },
];

const FR_COST_DEFAULTS = {
  fr_cost_bul: { 40:7000, 50:9000, 60:13000, 70:13000 },
  fr_cost_jun: { 40:12600, 50:15000 },
};

/* 원가 필드 목록 (DB 컬럼으로 직접 저장) */
const ALL_COST_FIELDS = [
  'cost_900_1800_thin1','cost_900_1800_thin2','cost_900_1800_mid','cost_900_1800_thick',
  'bead_cost_ia1','bead_cost_iia1','bead_cost_iiia2','bead_cost_ia2','bead_cost_iia2','bead_cost_iiib','bead_cost_ib',
  ...PU_GRADES.flatMap(g => g.costBands.map(b => b.costId)),
  'pf_cost_lx_out','pf_cost_lx_in','pf_cost_kd_out','pf_cost_kd_in','pf_cost_im_out','pf_cost_im_in',
  ...FR_GRADES.flatMap(g => g.rows.map(t => `fr_cost_${g.id}_t${t}`)),
];

/* 마진 필드 목록 (margins JSON 컬럼에 저장) */
const ALL_MARGIN_FIELDS = [
  ...ISOPINK_ROWS.map(t => `margin_iso_t${t}`),
  ...BEAD_ROWS.flatMap(t => [`bead_m2_3_t${t}`,`bead_m2_2_t${t}`,`bead_m2_1_t${t}`,`bead_m1_3_t${t}`,`bead_m1_2_t${t}`,`bead_m1_1_t${t}`,`bead_mj_t${t}`]),
  ...PU_GRADES.flatMap(g => g.rows.map(t => `pu_m_${g.id}_t${t}`)),
  ...PF_ROWS.flatMap(t => ['lxo','lxi','kdo','kdi','imo','imi'].map(mk => `pf_m_${mk}_t${t}`)),
  ...FR_GRADES.flatMap(g => g.rows.map(t => `fr_m_${g.id}_t${t}`)),
];

/* 하위 호환용 통합 목록 */
const ALL_NUM_FIELDS = [...ALL_COST_FIELDS, ...ALL_MARGIN_FIELDS];

/* ═══════════════════════════════════════
   공통 계산 유틸
═══════════════════════════════════════ */
function fmt(n) { return (n==null||isNaN(n)) ? '-' : Number(n).toLocaleString('ko-KR'); }
function rateClass(r) { return r>=20 ? 'good' : r>=13 ? 'mid' : 'low'; }
function fieldVal(id) {
  const el = document.getElementById(id);
  if (el && el.value.trim() !== '') return parseFloat(el.value) || 0;
  // DOM에 없을 때 (견적서 패널 등) → 메모리 캐시 폴백
  const cached = window._cachedCosts;
  if (cached) {
    if (cached.costs && cached.costs[id] != null) return parseFloat(cached.costs[id]) || 0;
    if (cached.margins && cached.margins[id] != null) return parseFloat(cached.margins[id]) || 0;
  }
  return 0;
}

function diffBadge(curr, prev) {
  if (prev==null||curr==null) return '<span style="color:#d1d5db;font-size:12px;">—</span>';
  const diff = curr - prev;
  if (diff===0) return '<span style="color:#94a3b8;font-size:12px;">±0</span>';
  const sign = diff>0 ? '+' : '';
  return `<span class="pricing-diff-badge ${diff>0?'up':'down'}">${sign}${Number(diff).toLocaleString('ko-KR')}</span>`;
}

/* 핵심 공통 계산 — 모든 상품에서 사용 */
function calcSheetRow(costPerM2, marginPerM2, t, area) {
  const sellPerM2    = costPerM2 + marginPerM2;
  const costPerSheet = Math.round(costPerM2 * t * area * 1.1);
  const sellPerSheet = Math.round(sellPerM2  * t * area * 1.1);
  const realPrice    = Math.ceil(sellPerSheet / 100) * 100;
  const marginAmt    = realPrice - costPerSheet;
  const vat          = Math.round(marginAmt / 11);
  const commission   = Math.round(realPrice * 0.06);
  const netMargin    = marginAmt - vat - commission;
  const marginRate   = realPrice > 0 ? Math.round((netMargin / realPrice) * 100) : 0;
  return { costPerM2, marginPerM2, sellPerM2, costPerSheet, sellPerSheet, realPrice, marginAmt, vat, commission, netMargin, marginRate };
}

/* 직전 이력 기준 실제 판매가 계산 (비교용) */
function compareRealPrice(costPerM2, marginPerM2, t, area) {
  if (!costPerM2) return null;
  return Math.ceil(Math.round((costPerM2 + marginPerM2) * t * area * 1.1) / 100) * 100;
}

/* 불연단열재 전용 계산
   장당원가       = costPerM2 × area                  (VAT 미포함)
   장당판매가     = 장당원가 + marginPerSheet           (VAT 미포함)
   VAT포함판매가  = 장당판매가 × 1.1
   최종판매가     = round(VAT포함판매가 / 500) × 500
   마진분석은 최종판매가 기준 */
function calcFrSheetRow(costPerM2, marginPerSheet, area) {
  if (!costPerM2) return null;
  const costPerSheet  = Math.round(costPerM2 * area);          // 8,400
  const sellPerSheet  = costPerSheet + marginPerSheet;          // 11,400
  const vatSell       = Math.round(sellPerSheet * 1.1);        // 12,540
  const realPrice     = Math.round(vatSell / 500) * 500;       // 12,500
  const vatCost       = Math.round(costPerSheet * 1.1);        // 9,240 (비교용)
  const marginAmt     = realPrice - vatCost;                   // 3,260
  const vat           = Math.round(marginAmt / 11);            // 296
  const commission    = Math.round(realPrice * 0.06);          // 750
  const netMargin     = marginAmt - vat - commission;          // 2,214
  const marginRate    = realPrice > 0 ? Math.round((netMargin / realPrice) * 100) : 0;
  return { costPerM2, marginPerSheet, costPerSheet, vatCost, sellPerSheet, vatSell, realPrice, marginAmt, vat, commission, netMargin, marginRate };
}
function compareFrSheetRealPrice(costPerM2, marginPerSheet, area) {
  if (!costPerM2) return null;
  return Math.round(Math.round((Math.round(costPerM2 * area) + marginPerSheet) * 1.1) / 500) * 500;
}



/* 불연단열재 결과 행 HTML
   컬럼: 품명 | 두께 | m²당원가 | 장당마진 | 장당원가 | 장당판매가 | VAT포함판매가 | 최종판매가 | 이전대비 | 마진금액 | 부가세 | 수수료6% | 순수마진 | 마진율 */
function _frResultRow(t, r, badge, extraCells) {
  if (!r) return `<tr data-t="${t}">${extraCells}<td class="td-thick">${t}</td><td colspan="12" style="text-align:center;color:#d1d5db;font-size:12px;">원가 미입력</td></tr>`;
  return `<tr data-t="${t}">${extraCells}
    <td class="td-thick">${t}</td>
    <td class="td-num">${fmt(r.costPerM2)}</td>
    <td class="td-num">${fmt(r.marginPerSheet)}</td>
    <td class="td-num">${fmt(r.costPerSheet)}</td>
    <td class="td-num">${fmt(r.sellPerSheet)}</td>
    <td class="td-num">${fmt(r.vatSell)}</td>
    <td class="td-highlight">${fmt(r.realPrice)}</td>
    <td class="td-diff">${badge}</td>
    <td class="td-num">${fmt(r.marginAmt)}</td>
    <td class="td-num">${fmt(r.vat)}</td>
    <td class="td-num">${fmt(r.commission)}</td>
    <td class="td-num">${fmt(r.netMargin)}</td>
    <td class="td-diff"><span class="pricing-rate-badge ${rateClass(r.marginRate)}">${r.marginRate}%</span></td>
  </tr>`;
}

/* 결과 테이블 행 HTML (비드법·PU·PF 공통) */
function _resultRow(t, r, badge, extraCells) {
  if (!r) return `<tr data-t="${t}">${extraCells}<td class="td-thick">${t}</td><td colspan="12" style="text-align:center;color:#d1d5db;font-size:12px;">원가 미입력</td></tr>`;
  return `<tr data-t="${t}">${extraCells}
    <td class="td-thick">${t}</td>
    <td class="td-num">${fmt(r.costPerM2)}</td><td class="td-num">${fmt(r.marginPerM2)}</td><td class="td-num">${fmt(r.sellPerM2)}</td>
    <td class="td-num">${fmt(r.costPerSheet)}</td><td class="td-num">${fmt(r.sellPerSheet)}</td>
    <td class="td-highlight">${fmt(r.realPrice)}</td>
    <td class="td-diff">${badge}</td>
    <td class="td-num">${fmt(r.marginAmt)}</td><td class="td-num">${fmt(r.vat)}</td><td class="td-num">${fmt(r.commission)}</td>
    <td class="td-num">${fmt(r.netMargin)}</td>
    <td class="td-diff"><span class="pricing-rate-badge ${rateClass(r.marginRate)}">${r.marginRate}%</span></td>
  </tr>`;
}

/* ═══════════════════════════════════════
   현재 비교 이력
═══════════════════════════════════════ */
let _compareData = null;

/* ═══════════════════════════════════════
   아이소핑크
═══════════════════════════════════════ */
function _isoGetCost(t) {
  const thin1 = fieldVal('cost_900_1800_thin1'), thin2 = fieldVal('cost_900_1800_thin2');
  const mid   = fieldVal('cost_900_1800_mid'),   thick = fieldVal('cost_900_1800_thick');
  if (t<=15) return thin1; if (t<=25) return thin2; if (t<=180) return mid; return thick;
}
function _isoGetMargin(t, src) {
  const k = `margin_iso_t${t}`;
  if (src) return src[k] != null ? parseFloat(src[k]) : (ISO_MARGIN_DEFS[t] ?? 55);
  const el = document.getElementById(k);
  if (el && el.value.trim() !== '') return parseFloat(el.value);
  // 캐시 폴백
  const cached = window._cachedCosts?.margins;
  if (cached && cached[k] != null) return parseFloat(cached[k]);
  return ISO_MARGIN_DEFS[t] ?? 55;
}
function _isoCalcRow(t) {
  // 아이소핑크는 원가가 원/mm 단위 — area=1로 처리 (기존 로직 유지)
  const cost = _isoGetCost(t);
  if (!cost) return null;
  const margin = _isoGetMargin(t);
  const mmSellPrice  = cost + margin;
  const costPerSheet = Math.round(t * cost * 1.1);
  const sellPerSheet = Math.round(t * mmSellPrice * 1.1);
  const realPrice    = Math.ceil(sellPerSheet / 100) * 100;
  const marginAmt    = realPrice - costPerSheet;
  const vat          = Math.round(marginAmt / 11);
  const commission   = Math.round(realPrice * 0.06);
  const netMargin    = marginAmt - vat - commission;
  const marginRate   = realPrice > 0 ? Math.round((netMargin / realPrice) * 100) : 0;
  // recalcPricing이 r.cost / r.margin / r.mmSellPrice 를 참조하므로 이름 맞춤
  return { t, costPerM2:cost, marginPerM2:margin, cost, margin, mmSellPrice, costPerSheet, sellPerSheet, realPrice, marginAmt, vat, commission, netMargin, marginRate };
}

window.recalcPricing = function() {
  const tbody = document.getElementById('pricingTableBody');
  if (!tbody) return;
  const grade1Rows  = ISOPINK_ROWS.filter(t => t===10||t===20);
  const specialRows = ISOPINK_ROWS.filter(t => t!==10&&t!==20);

  function buildRows(rows, gradeLabel, gradeClass) {
    return rows.map((t, i) => {
      const r = _isoCalcRow(t);
      const nameTd = i===0 ? `<td rowspan="${rows.length}" class="pricing-name-cell pricing-name-${gradeClass}">${gradeLabel}</td>` : '';
      if (!r) return `<tr data-t="${t}">${nameTd}<td class="td-thick">${t}</td><td colspan="12" style="text-align:center;color:#d1d5db;font-size:12px;">원가 미입력</td></tr>`;
      const prevCost   = _compareData ? (_isoGetCost_fromData(_compareData, t)) : null;
      const prevMargin = _compareData ? _isoGetMargin(t, _compareData) : null;
      const prevPrice  = prevCost ? Math.ceil(Math.round(t*(prevCost+prevMargin)*1.1)/100)*100 : null;
      const badge = diffBadge(r.realPrice, prevPrice);
      return `<tr data-t="${t}">${nameTd}
        <td class="td-thick">${t}</td>
        <td class="td-num">${fmt(r.cost)}</td><td class="td-num">${fmt(r.margin)}</td><td class="td-num">${fmt(r.mmSellPrice)}</td>
        <td class="td-num">${fmt(r.costPerSheet)}</td><td class="td-num">${fmt(r.sellPerSheet)}</td>
        <td class="td-highlight">${fmt(r.realPrice)}</td>
        <td class="td-diff">${badge}</td>
        <td class="td-num">${fmt(r.marginAmt)}</td><td class="td-num">${fmt(r.vat)}</td><td class="td-num">${fmt(r.commission)}</td>
        <td class="td-num">${fmt(r.netMargin)}</td>
        <td class="td-diff"><span class="pricing-rate-badge ${rateClass(r.marginRate)}">${r.marginRate}%</span></td>
      </tr>`;
    }).join('');
  }
  tbody.innerHTML =
    buildRows(grade1Rows,  '<span class="pnc-code">Ⅱ-A</span><span class="pnc-cat">압출법단열재</span><span class="pnc-grade">1호</span>',  'grade1') +
    buildRows(specialRows, '<span class="pnc-code">Ⅱ-B-2</span><span class="pnc-cat">압출법단열재</span><span class="pnc-grade">특호</span>', 'special');
  renderAllInputDiff();
};

function _isoGetCost_fromData(s, t) {
  const t1=s.cost_900_1800_thin1||0, t2=s.cost_900_1800_thin2||0;
  const m=s.cost_900_1800_mid||0, th=s.cost_900_1800_thick||0;
  if(t<=15) return t1; if(t<=25) return t2; if(t<=180) return m; return th;
}

/* ═══════════════════════════════════════
   공통 엔진 — 비드법 / 경질우레탄 / PF보드
   (아이소핑크는 원가 단위가 달라 별도 유지)
═══════════════════════════════════════ */

/* ── 탭별 설정 레지스트리 ─────────────────
   각 상품 탭의 현재 선택 등급 ID를 보관.
   새 상품 추가 시 여기에만 항목 추가하면 됨. */
const _subtabState = { bead: 'ia1', pu: 'ic', pf: 'lxo_s', fr: 'fr_bul' };
window._subtabState = _subtabState; // pricing-competitor.js 연동용

/* ── 상품별 grade 목록 조회 ── */
function _gradesOf(tabId) {
  if (tabId === 'bead') return BEAD_GRADES;
  if (tabId === 'pu')   return PU_GRADES;
  if (tabId === 'pf')   return PF_GRADES;
  if (tabId === 'fr')   return FR_GRADES;
  return [];
}

/* ── 상품별 두께 목록 조회 ── */
function _rowsOf(tabId, grade) {
  if (tabId === 'bead') return BEAD_ROWS;
  if (tabId === 'pu')   return grade.rows;
  if (tabId === 'pf')   return PF_ROWS;
  if (tabId === 'fr')   return grade.rows;
  return [];
}

/* ── 원가 field ID 조회 ── */
function _getCostId(tabId, grade, t) {
  if (tabId === 'bead') {
    return (grade.id === 'ib_09' || grade.id === 'ib_06') ? 'bead_cost_ib' : `bead_cost_${grade.id}`;
  }
  if (tabId === 'pu') {
    const band = grade.costBands?.find(b => t >= b.min && t <= b.max);
    return band ? band.costId : null;
  }
  if (tabId === 'pf') return grade.costId;
  if (tabId === 'fr') return `fr_cost_${grade.id}_t${t}`;
  return null;
}

/* ── 마진 field ID 조회 ── */
function _getMarginId(tabId, grade, t) {
  if (tabId === 'bead') {
    const tKey = Math.min(300, Math.max(10, Math.round(t / 10) * 10));
    return `${grade.marginKey}_t${tKey}`;
  }
  if (tabId === 'pu')  return `pu_m_${grade.id}_t${t}`;
  if (tabId === 'pf')  return `pf_m_${grade.mk}_t${t}`;
  if (tabId === 'fr')  return `fr_m_${grade.id}_t${t}`;
  return null;
}

/* ── 마진 기본값 조회 ── */
function _getMarginFallback(tabId, grade, t) {
  if (tabId === 'bead') return BEAD_MARGIN_FALLBACK[_getMarginId('bead', grade, t)] ?? 0;
  if (tabId === 'pu')   return grade.fallback?.[t] ?? 0;
  if (tabId === 'pf')   return PF_FB[grade.mk]?.[t] ?? 35;
  if (tabId === 'fr')   return grade.fallback?.[t] ?? 0;
  return 0;
}

/* ── 마진 값 읽기 (DOM or 이력 데이터) ── */
function _getMargin(tabId, grade, t, src) {
  const id = _getMarginId(tabId, grade, t);
  const fb = _getMarginFallback(tabId, grade, t);
  if (src) return src[id] != null ? parseFloat(src[id]) : fb;
  const el = document.getElementById(id);
  return (el && el.value.trim() !== '') ? parseFloat(el.value) : fb;
}

/* ── name 셀 HTML ── */
function _nameCell(tabId, grade, rowCount) {
  const cls = grade.colorClass;
  if (tabId === 'bead') return `<td rowspan="${rowCount}" class="pricing-name-cell bead-name-cell ${cls}"><span class="pnc-code">${grade.label}</span><span class="pnc-cat">비드법단열재</span><span class="pnc-grade">${grade.sub}</span></td>`;
  if (tabId === 'pu')   return `<td rowspan="${rowCount}" class="pricing-name-cell bead-name-cell ${cls}"><span class="pnc-code">${grade.label}</span><span class="pnc-cat">경질우레탄</span><span class="pnc-grade">${grade.sub2 || grade.sub1}</span></td>`;
  if (tabId === 'pf')   return `<td rowspan="${rowCount}" class="pricing-name-cell bead-name-cell ${cls}"><span class="pnc-code">${grade.label}</span><span class="pnc-cat">${grade.pfCat}</span><span class="pnc-grade">${grade.pfGrade}</span></td>`;
  if (tabId === 'fr')   return `<td rowspan="${rowCount}" class="pricing-name-cell bead-name-cell ${cls}"><span class="pnc-code">${grade.label}</span><span class="pnc-cat">${grade.sub1}</span><span class="pnc-grade">${grade.sub2}</span></td>`;
  return '';
}

/* ── 공통 재계산 엔진 ── */
function _recalcTab(tabId) {
  const tbody = document.getElementById(`${tabId}TableBody`);
  if (!tbody) return;
  const gradeId = _subtabState[tabId];
  const grade   = _gradesOf(tabId).find(g => g.id === gradeId);
  if (!grade) return;
  const rows = _rowsOf(tabId, grade);

  // 불연단열재: 마진은 장당(원/장), 두께 곱셈 없음
  if (tabId === 'fr') {
    tbody.innerHTML = rows.map((t, i) => {
      const costId      = _getCostId(tabId, grade, t);
      const costPerM2   = costId ? fieldVal(costId) : 0;
      const marginSheet = _getMargin(tabId, grade, t);
      const r           = calcFrSheetRow(costPerM2, marginSheet, grade.area);
      const prevCost    = (_compareData && costId) ? (_compareData[costId] || 0) : null;
      const prevMargin  = _compareData ? _getMargin(tabId, grade, t, _compareData.margins ?? _compareData) : null;
      const badge       = diffBadge(r?.realPrice, prevCost ? compareFrSheetRealPrice(prevCost, prevMargin, grade.area) : null);
      const nameTd      = i === 0 ? _nameCell(tabId, grade, rows.length) : '';
      return _frResultRow(t, r, badge, nameTd);
    }).join('');
    renderAllInputDiff();
    return;
  }

  tbody.innerHTML = rows.map((t, i) => {
    const costId      = _getCostId(tabId, grade, t);
    const costPerM2   = costId ? fieldVal(costId) : 0;
    const marginPerM2 = _getMargin(tabId, grade, t);
    const tEff        = grade.tFactor ?? t;
    const r           = costPerM2 ? { t, ...calcSheetRow(costPerM2, marginPerM2, tEff, grade.area) } : null;
    const prevCost    = (_compareData && costId) ? (_compareData[costId] || 0) : null;
    const prevMargin  = _compareData ? _getMargin(tabId, grade, t, _compareData.margins ?? _compareData) : null;
    const badge       = diffBadge(r?.realPrice, prevCost ? compareRealPrice(prevCost, prevMargin, tEff, grade.area) : null);
    const nameTd      = i === 0 ? _nameCell(tabId, grade, rows.length) : '';
    return _resultRow(t, r, badge, nameTd);
  }).join('');

  renderAllInputDiff();
}

/* ── 서브탭 전환 (공통) ── */
function _setSubtab(tabId, gradeId, btnEl) {
  _subtabState[tabId] = gradeId;
  const cls = tabId === 'pf' ? '.pf-subtab' : `.${tabId}-subtab`;
  document.querySelectorAll(cls).forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  _recalcTab(tabId);
}

/* ── window 노출 (기존 호출부 호환 유지) ── */
window.setBeadSubtab = (id, el) => _setSubtab('bead', id, el);
window.setPuSubtab   = (id, el) => _setSubtab('pu',   id, el);
window.setPfSubtab   = (id, el) => _setSubtab('pf',   id, el);
window.setFrSubtab   = (id, el) => _setSubtab('fr',   id, el);
window.recalcBead    = () => _recalcTab('bead');
window.recalcPu      = () => _recalcTab('pu');
window.recalcPf      = () => _recalcTab('pf');
window.recalcFr      = () => _recalcTab('fr');

/* ── PU 두께 펼치기/접기 (PU 전용 UI) ── */
window.togglePuExtraRows = function(btn) {
  const rows  = document.querySelectorAll('.pu-extra-row');
  const label = btn.querySelector('.pu-toggle-label');
  const icon  = btn.querySelector('.pu-toggle-icon');
  const isOpen = rows[0]?.style.display !== 'none';
  rows.forEach(r => r.style.display = isOpen ? 'none' : '');
  label.textContent = isOpen ? 'II-A 110T ~ 260T 펼치기' : 'II-A 110T ~ 260T 접기';
  icon.textContent  = isOpen ? '▼' : '▲';
  btn.closest('tr').classList.toggle('open', !isOpen);
};

/* 하위 호환 유지 */
function _pfMarginId(mk, t)     { return _getMarginId('pf', { mk }, t); }
function getPfMarginFieldId(mk, t) { return _pfMarginId(mk, t); }

/* ═══════════════════════════════════════
   입력표 변동 배지
═══════════════════════════════════════ */
function renderAllInputDiff() {
  const compareMargins = _compareData?.margins || {};
  ALL_NUM_FIELDS.forEach(id => {
    const cell = document.getElementById('diff_' + id);
    if (!cell) return;
    if (!_compareData) { cell.innerHTML = '<span class="pcut-diff-empty">—</span>'; return; }
    const curr = parseFloat(document.getElementById(id)?.value) || 0;
    const isMargin = ALL_MARGIN_FIELDS.includes(id);
    const prev = isMargin
      ? (compareMargins[id] != null ? compareMargins[id] : null)
      : (_compareData[id] != null ? _compareData[id] : null);
    if (prev===null||(curr===0&&prev===0)) { cell.innerHTML = '<span class="pcut-diff-empty">—</span>'; return; }
    const diff = curr - prev;
    if (diff===0) { cell.innerHTML = '<span class="pcut-diff-same">±0</span>'; return; }
    const sign = diff>0 ? '+' : '';
    cell.innerHTML = `<span class="pricing-diff-badge ${diff>0?'up':'down'}">${sign}${Number(diff).toLocaleString('ko-KR')}</span>`;
  });
}

/* ═══════════════════════════════════════
   탭 전환
═══════════════════════════════════════ */
let _activePricingTab = 'isopink';
window._activePricingTab = _activePricingTab; // pricing-competitor.js 연동용
window.setPricingTab = function(tabId, el) {
  _activePricingTab = tabId;
  window._activePricingTab = tabId; // 동기화
  document.querySelectorAll('.pricing-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.pricing-tab-pane').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('pricing-tab-' + tabId)?.classList.add('active');
  // 공통 엔진 대상 탭은 _recalcTab으로 통합, 아이소핑크는 별도 유지
  if (tabId in _subtabState) _recalcTab(tabId);
};

/* 현재 탭에 맞는 모음전 엑셀 export */
window.exportCurrentTabOption = function() {
  if (_activePricingTab === 'isopink') {
    exportSmartStoreOptionExcel();
  } else if (_activePricingTab === 'bead') {
    const sub = _subtabState.bead;
    const jong1 = ['ia2','iia2','iiib'];
    const jong2 = ['ia1','iia1','iiia2'];
    const junbul = ['ib_09','ib_06'];
    if (jong1.includes(sub))        exportBeadOptionExcel1jong();
    else if (jong2.includes(sub))   exportBeadOptionExcel2jong();
    else if (junbul.includes(sub))  exportBeadOptionExcelJunbul();
    else showToast('현재 탭에서는 모음전 옵션 엑셀을 지원하지 않습니다.', 'error');
  } else if (_activePricingTab === 'pu') {
    exportPuOptionExcel(_subtabState.pu);
  } else if (_activePricingTab === 'fr') {
    exportFrOptionExcel(_subtabState.fr);
  } else if (_activePricingTab === 'pf') {
    exportPfOptionExcel(_subtabState.pf);
  } else {
    showToast('현재 탭에서는 모음전 옵션 엑셀을 지원하지 않습니다.', 'error');
  }
};

/* ═══════════════════════════════════════
   단가 기준 년월 동기화
═══════════════════════════════════════ */
const BASE_MONTH_IDS = ['cost_base_month','bead_base_month','pu_base_month','pf_base_month','fr_base_month'];
window.syncBaseMonth = function(value) {
  BASE_MONTH_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value !== value) el.value = value;
  });
};

/* ═══════════════════════════════════════
   통합 저장
═══════════════════════════════════════ */
window.savePricingCosts = async function() {
  if (typeof supabaseClient==='undefined'||!supabaseClient) {
    if (typeof showToast==='function') showToast('Supabase 연결 오류','error'); return;
  }

  /* 원가: DB 컬럼으로 직접 저장 */
  const payload = { product_type:'all', updated_at: new Date().toISOString() };
  ALL_COST_FIELDS.forEach(f => {
    const el = document.getElementById(f);
    payload[f] = (el && el.value.trim()) ? parseFloat(el.value) : null;
  });
  const mEl = document.getElementById('cost_base_month');
  payload.cost_base_month = mEl?.value.trim() || null;

  /* 마진: margins JSON 컬럼에 저장 */
  const margins = {};
  ALL_MARGIN_FIELDS.forEach(f => {
    const el = document.getElementById(f);
    margins[f] = (el && el.value.trim()) ? parseFloat(el.value) : null;
  });
  payload.margins = margins;

  const { error } = await supabaseClient.from('pricing_costs').upsert(payload, { onConflict:'product_type' });
  if (error) { if (typeof showToast==='function') showToast('저장 실패: '+error.message,'error'); return; }

  const histLabel = payload.cost_base_month || new Date().toISOString().slice(0,7);
  const histPayload = { ...payload, saved_at: new Date().toISOString(), label: histLabel };
  delete histPayload.updated_at;

  /* 같은 label이 이미 있으면 update, 없으면 insert — saved_at 확실히 갱신 */
  const { data: existingHist } = await supabaseClient
    .from('pricing_costs_history').select('id')
    .eq('product_type','all').eq('label', histLabel).maybeSingle();
  if (existingHist?.id) {
    await supabaseClient.from('pricing_costs_history').update(histPayload).eq('id', existingHist.id);
  } else {
    await supabaseClient.from('pricing_costs_history').insert(histPayload);
  }

  const now = new Date().toLocaleString('ko-KR',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const el = document.getElementById('pricingLastUpdated');
  if (el) el.textContent = '최근 저장: ' + now;
  if (typeof showToast==='function') showToast('원가가 저장되었습니다','success');
  _viewingIdx = null;
  await loadHistoryList();
  /* 현재 label과 다른 가장 최근 이력을 직전 비교 기준으로 사용 */
  if (window._historyCache?.length) {
    const currentLabel = payload.cost_base_month || '';
    const prevEntry = window._historyCache.find(h => h.label !== currentLabel);
    _compareData = prevEntry || null;
  }
  renderAllInputDiff();
};

/* ═══════════════════════════════════════
   통합 로드
═══════════════════════════════════════ */
async function loadPricingCosts() {
  if (typeof supabaseClient==='undefined'||!supabaseClient) return;
  const { data, error } = await supabaseClient.from('pricing_costs').select('*').eq('product_type','all').maybeSingle();
  if (error||!data) return;

  /* 이력 목록을 label 내림차순으로 먼저 로드 → [0]이 진짜 최신 */
  await loadHistoryList();

  /* pricing_costs 대신 history [0](label 최대값)을 화면에 표시
     → saved_at 기준이 아니라 label 기준이므로 어떤 순서로 저장해도 항상 최신 label이 표시됨 */
  const displayData = window._historyCache?.[0] || data;
  const displayLabel = displayData.label || displayData.cost_base_month || '';

  /* 원가 필드 복원 */
  ALL_COST_FIELDS.forEach(f => {
    const el = document.getElementById(f);
    if (el && displayData[f] != null) el.value = displayData[f];
    else if (el && data[f] != null && !window._historyCache?.length) el.value = data[f];
  });
  /* 마진 필드 복원 — margins JSON에서 */
  const marginsData = displayData.margins || data.margins || {};
  ALL_MARGIN_FIELDS.forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = marginsData[f] != null ? marginsData[f] : '';
  });
  if (displayLabel) {
    const mEl = document.getElementById('cost_base_month');
    if (mEl) { mEl.value = displayLabel; syncBaseMonth(displayLabel); }
  }
  /* 최근 저장 표시: history [0]의 saved_at 사용 */
  const savedAt = displayData.saved_at || data.updated_at;
  if (savedAt) {
    const timeLabel = new Date(savedAt).toLocaleString('ko-KR',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
    const el = document.getElementById('pricingLastUpdated');
    if (el) el.textContent = '최근 저장: ' + timeLabel;
  }
  /* 견적서 등 외부에서 원가 참조할 수 있도록 메모리 캐시 저장 */
  window._cachedCosts = {
    costs: Object.fromEntries(ALL_COST_FIELDS.map(f => [f, parseFloat(displayData[f] ?? data[f]) || 0])),
    margins: { ...(displayData.margins || data.margins || {}) }
  };
  recalcPricing();
  Object.keys(_subtabState).forEach(tabId => _recalcTab(tabId));
  _viewingIdx = null;
  /* 경쟁사 단가 컬럼 주입 콜백 (pricing-competitor.js 연동) */
  if (typeof window._onPricingLoaded === 'function') window._onPricingLoaded();
  if (typeof window._applyHighlights === 'function') window._applyHighlights();
  /* 이력 버튼 UI 초기화 */
  const histBtn = document.getElementById('pricingHistoryBtn');
  if (histBtn) {
    histBtn.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> 이력 <i class="fa-solid fa-chevron-down" style="font-size:10px;margin-left:2px;"></i>`;
    histBtn.classList.remove('active');
  }
  /* 직전 비교 기준: [0]의 다음 항목 */
  _compareData = window._historyCache?.[1] || null;
  renderAllInputDiff();
}

/* ═══════════════════════════════════════
   이력 목록 & 조회
═══════════════════════════════════════ */
let _viewingIdx = null;

async function loadHistoryList() {
  if (typeof supabaseClient==='undefined'||!supabaseClient) return;
  const { data } = await supabaseClient.from('pricing_costs_history').select('*')
    .eq('product_type','all').order('label',{ascending:false}).limit(30);
  /* listEl 존재 여부와 관계없이 캐시는 항상 갱신 */
  window._historyCache = (data && data.length > 0) ? data : [];
  const listEl = document.getElementById('pricingHistoryList');
  if (!listEl) return;
  if (!data||data.length===0) { listEl.innerHTML = '<div class="pricing-history-empty">저장된 이력이 없습니다</div>'; return; }
  renderHistoryList();
}

function renderHistoryList() {
  const listEl = document.getElementById('pricingHistoryList');
  const data = window._historyCache;
  if (!listEl||!data) return;
  listEl.innerHTML = data.map((row,idx) => `
    <div class="pricing-history-item${_viewingIdx===idx?' selected':''}" onclick="viewHistory(${idx})">
      <span class="phi-label">${row.label||'-'}</span>
      ${idx===0?'<span class="phi-badge phi-badge-latest">최신</span>':''}
      ${_viewingIdx===idx?'<span class="phi-badge phi-badge-viewing">조회중</span>':''}
    </div>`).join('');
}

window.viewHistory = function(idx) {
  const data = window._historyCache;
  if (!data||!data[idx]) return;
  const row = data[idx];
  ALL_COST_FIELDS.forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = row[f] != null ? row[f] : '';
  });
  const rowMargins = row.margins || {};
  ALL_MARGIN_FIELDS.forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = rowMargins[f] != null ? rowMargins[f] : '';
  });
  const mEl = document.getElementById('cost_base_month');
  if (mEl) { mEl.value = row.label||''; syncBaseMonth(row.label||''); }
  _compareData = data[idx+1]||null;
  _viewingIdx  = idx;
  const btn = document.getElementById('pricingHistoryBtn');
  if (btn) {
    if (idx===0) {
      btn.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> 이력 <i class="fa-solid fa-chevron-down" style="font-size:10px;margin-left:2px;"></i>`;
      btn.classList.remove('active');
    } else {
      btn.innerHTML = `<i class="fa-solid fa-calendar-days"></i> ${row.label} <i class="fa-solid fa-chevron-down" style="font-size:10px;margin-left:2px;"></i>`;
      btn.classList.add('active');
    }
  }
  closeHistoryDropdown();
  renderHistoryList();
  recalcPricing();
  Object.keys(_subtabState).forEach(tabId => _recalcTab(tabId));
  renderAllInputDiff();
};

window.toggleHistoryDropdown = function() {
  document.getElementById('pricingHistoryDropdown')?.classList.toggle('open');
};
function closeHistoryDropdown() {
  document.getElementById('pricingHistoryDropdown')?.classList.remove('open');
}
document.addEventListener('click', function(e) {
  const wrap = document.getElementById('pricingHistoryWrap');
  if (wrap&&!wrap.contains(e.target)) closeHistoryDropdown();
});

/* showPage 래퍼 */
(function() {
  const _orig = window.showPage;
  window.showPage = function(pageId, element, isHistoryAction) {
    _orig(pageId, element, isHistoryAction);  // _orig 내부에서 loader를 none으로 끔
    if (pageId === 'pricing') {
      /* _orig 실행 후 loader를 다시 켜고 데이터 로드 완료 시 끄기 */
      const loader = document.getElementById('loader');
      if (loader) loader.style.display = 'flex';
      loadPricingCosts().finally(() => {
        if (loader) loader.style.display = 'none';
      });
    }
  };
})();

/* ═══════════════════════════════════════
   원가·마진 입력 모달
═══════════════════════════════════════ */
let _pimBuffer = {};
let _pimType   = null;
function _pimId(id) { return 'pim_' + id; }
function _realVal(id) { return document.getElementById(id)?.value || ''; }

/* ── 모달 바디 빌더: 아이소핑크 ── */
function buildIsopinkModalBody() {
  const gradeOf = t => t<=15?'a':t<=25?'b':t<=180?'c':'d';
  const gradeLabel = { a:'Ⅱ-A (1호) 10~15T', b:'Ⅱ-A (1호) 20~25T', c:'Ⅱ-B-2 (특호) 30~180T', d:'Ⅱ-B-2 (특호) 185T+' };
  const gradeColor = { a:'#eef2ff', b:'#eef2ff', c:'#fffbeb', d:'#fff7ed' };
  let html = `<div class="pim-section-title">아이소핑크 — 두께별 마진 (원/mm)</div>
    <div class="pim-margin-hint">각 두께마다 개별 마진을 설정합니다. 비어있으면 기본값이 사용됩니다.</div>
    <div class="pim-table-scroll-wrap">
    <table class="pim-table pim-margin-only-table" style="min-width:320px">
      <thead><tr>
        <th style="width:90px">등급</th><th style="width:72px">두께</th>
        <th class="pim-th-margin" style="width:110px">마진 (원/mm)</th>
        <th class="pim-th-diff" style="width:80px">이전대비</th>
      </tr></thead><tbody>`;
  let prev = null;
  ISOPINK_ROWS.forEach(t => {
    const g = gradeOf(t);
    const isFirst = g !== prev;
    const rowspan = isFirst ? ISOPINK_ROWS.filter(r=>gradeOf(r)===g).length : 0;
    const id = `margin_iso_t${t}`;
    html += `<tr${isFirst?' class="pim-group-first"':''}>`;
    if (isFirst) html += `<td rowspan="${rowspan}" style="background:${gradeColor[g]};font-size:11px;font-weight:700;color:#475569;text-align:center;vertical-align:middle;line-height:1.5;padding:8px 10px;">${gradeLabel[g]}</td>`;
    html += `<td class="pim-td-t">${t}T</td>
      <td><input type="text" inputmode="numeric" id="${_pimId(id)}" class="pim-input pim-input-margin" placeholder="${ISO_MARGIN_DEFS[t]??55}" value="${_realVal(id)}" style="width:90px"></td>
      <td class="pim-td-diff" id="pimdiff_${id}"><span class="pcut-diff-empty">—</span></td></tr>`;
    prev = g;
  });
  return html + `</tbody></table></div>`;
}

/* ── 모달 바디 빌더: 비드법 ── */
function buildBeadModalBody() {
  // 2종 3개, 1종 3개, 준불연 1개 — 각 등급별 개별 마진
  const grades = [
    { key:'bead_m2_3', label:'2종 3호', cls:'bead-2jong-th' },
    { key:'bead_m2_2', label:'2종 2호', cls:'bead-2jong-th' },
    { key:'bead_m2_1', label:'2종 1호', cls:'bead-2jong-th' },
    { key:'bead_m1_3', label:'1종 3호', cls:'bead-1jong-th' },
    { key:'bead_m1_2', label:'1종 2호', cls:'bead-1jong-th' },
    { key:'bead_m1_1', label:'1종 1호', cls:'bead-1jong-th' },
    { key:'bead_mj',   label:'준불연',  cls:'bead-junbul-th' },
  ];
  let html = `<div class="pim-section-title">비드법 단열재 — 두께별 마진 (원/m²)</div>
    <div class="pim-table-scroll-wrap">
    <table class="pim-table pim-margin-only-table" style="min-width:720px">
      <thead><tr>
        <th>두께</th>
        ${grades.map(g => `<th class="${g.cls}" style="min-width:68px">${g.label}</th><th class="pim-th-diff">이전대비</th>`).join('')}
      </tr></thead><tbody>`;
  BEAD_ROWS.forEach(t => {
    html += `<tr><td class="pim-td-t">${t}T</td>`;
    grades.forEach(g => {
      const fieldId = `${g.key}_t${t}`;
      const fb = BEAD_MARGIN_FALLBACK[fieldId] ?? 0;
      html += `<td><input type="text" inputmode="numeric" id="${_pimId(fieldId)}" class="pim-input pim-input-margin" placeholder="${fb}" value="${_realVal(fieldId)}" style="width:58px"></td>
      <td class="pim-td-diff" id="pimdiff_${fieldId}"><span class="pcut-diff-empty">—</span></td>`;
    });
    html += `</tr>`;
  });
  return html + `</tbody></table></div>`;
}

/* ── 모달 바디 빌더: PU ── */
function buildPuModalBody() {
  const colIds = ['ic','iiia','iia','id_in','id_out'];
  const colLabels = { ic:'I-C', iiia:'III-A', iia:'II-A', id_in:'I-D내', id_out:'I-D외' };
  const colTh     = { ic:'pu-ic-th', iiia:'pu-iiia-th', iia:'pu-iia-th', id_in:'pu-id-th', id_out:'pu-id-out-th' };
  const allT = [...new Set(PU_GRADES.flatMap(g=>g.rows))].sort((a,b)=>a-b);
  let html = `<div class="pim-section-title">경질우레탄보드 — 두께별 마진 (원/m²)</div>
    <div class="pim-margin-hint">각 두께마다 개별 마진을 설정합니다. — 는 해당 등급에 없는 두께입니다.</div>
    <div class="pim-table-scroll-wrap">
    <table class="pim-table pim-margin-only-table pim-pu-table">
      <thead><tr>
        <th style="width:72px">두께</th>
        ${colIds.map(c=>`<th class="pim-th-margin ${colTh[c]}">${colLabels[c]}</th><th class="pim-th-diff">이전대비</th>`).join('')}
      </tr></thead><tbody>`;
  allT.forEach(t => {
    html += `<tr><td class="pim-td-t">${t}T</td>`;
    colIds.forEach(col => {
      const grade = PU_GRADES.find(g=>g.id===col);
      if (!grade||!grade.rows.includes(t)) {
        html += `<td class="pim-td-na">—</td><td class="pim-td-na pim-td-diff-na"></td>`;
      } else {
        const fieldId = `pu_m_${col}_t${t}`;
        html += `<td><input type="text" inputmode="numeric" id="${_pimId(fieldId)}" class="pim-input pim-input-margin" placeholder="${grade.fallback[t]??''}" value="${_realVal(fieldId)}" style="width:52px"></td>
          <td class="pim-td-diff" id="pimdiff_${fieldId}"><span class="pcut-diff-empty">—</span></td>`;
      }
    });
    html += `</tr>`;
  });
  return html + `</tbody></table></div>`;
}

/* ── 모달 바디 빌더: PF ── */
function buildPfModalBody() {
  const groups = [
    { mk:'lxo', label:'LX국산\n외단열', cls:'pf-lx-th' },
    { mk:'lxi', label:'LX국산\n내단열', cls:'pf-lx-th' },
    { mk:'kdo', label:'국내산\n외단열', cls:'pf-kd-th' },
    { mk:'kdi', label:'국내산\n내단열', cls:'pf-kd-th' },
    { mk:'imo', label:'수입산\n외단열', cls:'pf-im-th' },
    { mk:'imi', label:'수입산\n내단열', cls:'pf-im-th' },
  ];
  // 두께50 + (마진65 + 이전대비44) × 6 = 704px → 모달 760px에 맞음
  const colW = { t:'50px', m:'65px', d:'44px' };
  let html = `<div class="pim-section-title">PF 보드 — 두께별 마진 (원/m²)</div>
    <div class="pim-margin-hint">품종·용도별 마진. 비어있으면 기본값 사용 / 규격(소·대) 공통.</div>
    <div class="pim-table-scroll-wrap">
    <table class="pim-table pim-margin-only-table pim-pf-table">
      <colgroup>
        <col style="width:${colW.t}">
        ${groups.map(()=>`<col style="width:${colW.m}"><col style="width:${colW.d}">`).join('')}
      </colgroup>
      <thead><tr>
        <th>두께</th>
        ${groups.map(g=>`<th class="${g.cls}" style="font-size:11px;line-height:1.4;white-space:pre">${g.label}</th><th class="pim-th-diff">이전대비</th>`).join('')}
      </tr></thead><tbody>`;
  PF_ROWS.forEach(t => {
    html += `<tr><td class="pim-td-t">${t}T</td>`;
    groups.forEach(g => {
      const id = _pfMarginId(g.mk, t);
      html += `<td><input type="text" inputmode="numeric" id="${_pimId(id)}" class="pim-input pim-input-margin" placeholder="${PF_FB[g.mk]?.[t]??35}" value="${_realVal(id)}"></td>
        <td class="pim-td-diff" id="pimdiff_${id}"><span class="pcut-diff-empty">—</span></td>`;
    });
    html += `</tr>`;
  });
  return html + `</tbody></table></div>`;
}

/* ── 모달 바디 빌더: 불연단열재 ── */
function buildFrModalBody() {
  let html = `<div class="pim-section-title">불연단열재 — 두께별 마진 (원/장)</div>
    <div class="pim-table-scroll-wrap">
    <table class="pim-table pim-margin-only-table" style="min-width:420px">
      <thead><tr>
        <th style="width:60px">두께</th>
        <th class="fr-bul-th pim-th-margin">불연</th><th class="pim-th-diff">이전대비</th>
        <th class="fr-jun-th pim-th-margin">준불연</th><th class="pim-th-diff">이전대비</th>
      </tr></thead><tbody>`;
  const allT = [...new Set(FR_GRADES.flatMap(g => g.rows))].sort((a,b) => a-b);
  allT.forEach(t => {
    html += `<tr><td class="pim-td-t">${t}T</td>`;
    FR_GRADES.forEach(g => {
      if (!g.rows.includes(t)) {
        html += `<td class="pim-td-na">—</td><td class="pim-td-na pim-td-diff-na"></td>`;
      } else {
        const id = `fr_m_${g.id}_t${t}`;
        html += `<td><input type="text" inputmode="numeric" id="${_pimId(id)}" class="pim-input pim-input-margin" placeholder="${g.fallback[t]??0}" value="${_realVal(id)}" style="width:70px"></td>
          <td class="pim-td-diff" id="pimdiff_${id}"><span class="pcut-diff-empty">—</span></td>`;
      }
    });
    html += `</tr>`;
  });
  return html + `</tbody></table></div>`;
}

/* ── 모달 열기 ── */
const _modalConfig = {
  isopink: { title:'아이소핑크 마진 편집',    sub:'압출법단열재 — 두께별 마진 (원/mm)', width:'500px', builder: buildIsopinkModalBody },
  bead:    { title:'비드법 단열재 마진 편집',  sub:'두께별 마진 (원/m²)',               width:'560px', builder: buildBeadModalBody    },
  pu:      { title:'경질우레탄보드 마진 편집', sub:'두께별 마진 (원/m²)',               width:'720px', builder: buildPuModalBody      },
  pf:      { title:'PF 보드 마진 편집',       sub:'두께별 마진 (원/m²)',               width:'760px', builder: buildPfModalBody      },
  fr:      { title:'불연단열재 마진 편집',     sub:'두께별 마진 (원/장)',               width:'500px', builder: buildFrModalBody      },
};
window.openPricingModal = function(type) {
  if (window.currentUser?.role !== 'admin') return; // general 계정 접근 차단
  _pimType = type;
  const cfg = _modalConfig[type];
  if (!cfg) return;
  const modal = document.getElementById('pricingInputModal');
  modal.querySelector('.pricing-input-modal-box').style.width = cfg.width;
  document.getElementById('pimTitle').textContent = cfg.title;
  document.getElementById('pimSub').textContent   = cfg.sub;
  document.getElementById('pimBody').innerHTML    = cfg.builder();
  renderModalDiff(type);
  modal.style.display = 'flex';
};

/* ── 모달 이전대비 diff ── */
function _renderPimDiff(el, fieldId, fallback) {
  if (!el) return;
  const inputEl = document.getElementById(_pimId(fieldId));
  const curr = parseFloat(inputEl?.value) || parseFloat(inputEl?.placeholder) || fallback || 0;
  /* 마진 필드는 _compareData.margins 에서, 원가 필드는 직접 */
  const prevRaw = ALL_MARGIN_FIELDS.includes(fieldId)
    ? (_compareData?.margins?.[fieldId])
    : (_compareData?.[fieldId]);
  const prev = prevRaw!=null ? parseFloat(prevRaw) : fallback;
  if (prev==null||(curr===0&&prev===0)) { el.innerHTML='<span class="pcut-diff-empty">—</span>'; return; }
  const diff = curr - prev;
  if (diff===0) { el.innerHTML='<span class="pcut-diff-same">±0</span>'; return; }
  const sign = diff>0?'+':'';
  el.innerHTML = `<span class="pricing-diff-badge ${diff>0?'up':'down'}">${sign}${Number(diff).toLocaleString('ko-KR')}</span>`;
}


/* ── 타입별 마진 fieldId 목록 ── */
function _modalMarginFields(type) {
  if (type === 'isopink') return ISOPINK_ROWS.map(t => `margin_iso_t${t}`);
  if (type === 'bead')    return BEAD_ROWS.flatMap(t => [`bead_m2_3_t${t}`,`bead_m2_2_t${t}`,`bead_m2_1_t${t}`,`bead_m1_3_t${t}`,`bead_m1_2_t${t}`,`bead_m1_1_t${t}`,`bead_mj_t${t}`]);
  if (type === 'pu')      return [...new Set(PU_GRADES.flatMap(g => g.rows.map(t => `pu_m_${g.id}_t${t}`)))];
  if (type === 'pf')      return PF_ROWS.flatMap(t => ['lxo','lxi','kdo','kdi','imo','imi'].map(mk => `pf_m_${mk}_t${t}`));
  if (type === 'fr')      return FR_GRADES.flatMap(g => g.rows.map(t => `fr_m_${g.id}_t${t}`));
  return [];
}

function renderModalDiff(type) {
  if (!_compareData) return;
  _modalMarginFields(type).forEach(id => {
    const el = document.getElementById('pimdiff_' + id);
    if (!el) return;
    // 기본값: isopink는 ISO_MARGIN_DEFS, 나머지는 _getMarginFallback 활용
    let fb = 0;
    if (type === 'isopink') {
      const t = parseInt(id.replace('margin_iso_t', ''));
      fb = ISO_MARGIN_DEFS[t] ?? 55;
    } else if (type === 'bead') {
      fb = BEAD_MARGIN_FALLBACK[id] ?? 0;  // marginKey 기반 필드명이므로 그대로 조회
    } else if (type === 'pu') {
      const m = id.match(/^pu_m_(.+)_t(\d+)$/);
      if (m) { const g = PU_GRADES.find(g => g.id === m[1]); fb = g?.fallback?.[+m[2]] ?? 0; }
    } else if (type === 'pf') {
      const m = id.match(/^pf_m_([^_]+)_t(\d+)$/);
      if (m) fb = PF_FB[m[1]]?.[+m[2]] ?? 35;
    } else if (type === 'fr') {
      const m = id.match(/^fr_m_(.+)_t(\d+)$/);
      if (m) { const g = FR_GRADES.find(g => g.id === m[1]); fb = g?.fallback?.[+m[2]] ?? 0; }
    }
    _renderPimDiff(el, id, fb);
  });
}

/* ── 모달 닫기 / 확인 ── */
window.closePricingModal = function() {
  document.getElementById('pricingInputModal').style.display = 'none';
  _pimType = null;
};
window.confirmPricingModal = function() {
  if (!_pimType) return;
  _modalMarginFields(_pimType).forEach(id => {
    const modalEl = document.getElementById(_pimId(id));
    const realEl  = document.getElementById(id);
    if (modalEl && realEl) realEl.value = modalEl.value;
  });
  const recalc = { isopink: recalcPricing, bead: recalcBead, pu: recalcPu, pf: recalcPf, fr: recalcFr };
  recalc[_pimType]?.();
  renderAllInputDiff();
  closePricingModal();
  savePricingCosts().then(() => {
    if (typeof showToast==='function') showToast('마진이 저장되었습니다', 'success');
  }).catch(() => {
    if (typeof showToast==='function') showToast('마진 저장 실패', 'error');
  });
};
document.addEventListener('click', function(e) {
  const modal = document.getElementById('pricingInputModal');
  if (modal && e.target === modal) closePricingModal();
});

/* ═══════════════════════════════════════
   탭 HTML 동적 생성
═══════════════════════════════════════ */
function _resultThead(extraCols, sellUnit) {
  /* sellUnit: 'mm' = mm당 판매가(아이소핑크), 'm2' = m²당 판매가(기타) */
  const sellLabel = sellUnit === 'mm' ? 'mm당<br>판매가' : 'm²당<br>판매가';
  return `<thead>
    <tr>
      ${extraCols.map(c=>`<th rowspan="2">${c}</th>`).join('')}
      <th rowspan="2">두께<br>(mm)</th>
      <th rowspan="2">원가</th><th rowspan="2">마진</th><th rowspan="2">${sellLabel}</th>
      <th rowspan="2">장당원가<br><span class="pricing-th-tiny">VAT포함</span></th>
      <th rowspan="2">장당판매가<br><span class="pricing-th-tiny">VAT포함</span></th>
      <th rowspan="2" class="pricing-col-highlight">실제<br>장당판매가</th>
      <th rowspan="2" class="pricing-col-diff">이전<br>대비</th>
      <th colspan="5" class="pricing-col-margin-group">마진 분석</th>
    </tr>
    <tr>
      <th class="pricing-col-margin">마진금액</th>
      <th class="pricing-col-margin">부가세</th>
      <th class="pricing-col-margin">수수료 6%</th>
      <th class="pricing-col-margin">장당마진</th>
      <th class="pricing-col-margin">순수마진율</th>
    </tr>
  </thead>`;
}
function _costCard(tabId, modalType, titleSub, tableBodyHtml, hiddenHtml) {
  const monthId = tabId === 'isopink' ? 'cost_base_month' : `${tabId}_base_month`;
  return `<div class="card pricing-cost-card">
    <div class="pricing-section-title">원가 입력 <span class="pricing-section-sub">— ${titleSub}</span></div>
    <div class="pricing-cost-footer">
      <div class="pricing-base-month-wrap">
        <label class="pricing-base-month-label">단가 기준 년월</label>
        <input type="month" id="${monthId}" class="pricing-input-field pricing-month-field" oninput="syncBaseMonth(this.value)">
      </div>
      <button class="pricing-margin-edit-btn" onclick="openPricingModal('${modalType}')">
        <i class="fa-solid fa-sliders"></i> 마진 편집
      </button>
    </div>
    <div class="pricing-cost-card-inner">
      <div class="pricing-input-table-wrap">${tableBodyHtml}</div>
    </div>
    <div style="display:none">${hiddenHtml}</div>
  </div>`;
}
function _resultCard(title, specBadge, subtabBarHtml, tableHtml) {
  return `<div class="card pricing-result-card">
    <div class="pricing-result-header">
      <div class="pricing-result-title">${title}<span class="pricing-spec-badge">${specBadge}</span></div>
      <span class="pricing-result-hint">수수료 6% 기준</span>
    </div>
    ${subtabBarHtml}
    <div class="pricing-table-scroll">${tableHtml}</div>
  </div>`;
}
function _hiddenFields(ids, recalcFn) {
  return ids.map(id => `<input type="text" id="${id}" oninput="${recalcFn}()"><span id="diff_${id}"></span>`).join('');
}

/* ── 아이소핑크 탭 ── */
function buildIsopinkTab() {
  const costTableHtml = `
    <table class="pricing-cost-unified-table">
      <colgroup><col style="width:150px"><col style="width:140px"><col style="width:155px"><col style="width:80px"></colgroup>
      <thead><tr><th>품명</th><th>두께 구간</th><th>원가 (원/mm)<br><span class="pricing-th-tiny" style="font-weight:400;color:#94a3b8">= 원/m² ÷ 두께(mm)</span></th><th class="pricing-col-diff">이전대비</th></tr></thead>
      <tbody>
        <tr class="pcut-grade-row">
          <td rowspan="2" class="pcut-name-cell pcut-grade1">Ⅱ-A<br><span class="pcut-name-sub">압출법 단열재<br>(1호)</span></td>
          <td><span class="pricing-range-label">10T ~ 15T</span></td>
          <td><input type="text" inputmode="numeric" id="cost_900_1800_thin1" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcPricing()"></td>
          <td class="pcut-diff-cell" id="diff_cost_900_1800_thin1"><span class="pcut-diff-empty">—</span></td>
        </tr><tr>
          <td><span class="pricing-range-label">20T ~ 25T</span></td>
          <td><input type="text" inputmode="numeric" id="cost_900_1800_thin2" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcPricing()"></td>
          <td class="pcut-diff-cell" id="diff_cost_900_1800_thin2"><span class="pcut-diff-empty">—</span></td>
        </tr>
        <tr class="pcut-grade-row">
          <td rowspan="2" class="pcut-name-cell pcut-special">Ⅱ-B-2<br><span class="pcut-name-sub">압출법 단열재<br>(특호)</span></td>
          <td><span class="pricing-range-label">30T ~ 180T</span></td>
          <td><input type="text" inputmode="numeric" id="cost_900_1800_mid" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcPricing()"></td>
          <td class="pcut-diff-cell" id="diff_cost_900_1800_mid"><span class="pcut-diff-empty">—</span></td>
        </tr><tr>
          <td><span class="pricing-range-label">185T 이상</span></td>
          <td><input type="text" inputmode="numeric" id="cost_900_1800_thick" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcPricing()"></td>
          <td class="pcut-diff-cell" id="diff_cost_900_1800_thick"><span class="pcut-diff-empty">—</span></td>
        </tr>
      </tbody>
    </table>`;
  const hiddenHtml = _hiddenFields(ISOPINK_ROWS.map(t=>`margin_iso_t${t}`),'recalcPricing');
  const resultTableHtml = `<table class="pricing-table">
    <colgroup>
      <col style="width:110px"><col style="width:60px"><col style="width:72px"><col style="width:55px"><col style="width:72px">
      <col style="width:90px"><col style="width:90px"><col style="width:90px"><col style="width:72px">
      <col style="width:85px"><col style="width:72px"><col style="width:70px"><col style="width:70px"><col style="width:70px">
    </colgroup>
    ${_resultThead(['품명'], 'mm')}
    <tbody id="pricingTableBody"></tbody>
  </table>`;
  document.getElementById('pricing-tab-isopink').innerHTML =
    _costCard('isopink','isopink','매월 업체 고지 단가 기준으로 변경된 항목만 수정하세요', costTableHtml, hiddenHtml) +
    _resultCard('아이소핑크 단가표','규격: 900×1800mm','', resultTableHtml);
}

/* ── 비드법 탭 ── */
function buildBeadTab() {
  const costGrades = [
    { id:'ia1',   cls:'pcut-grade1',  label:'2종',   name:'I-A-1 (2종 3호)',   rowspan:3 },
    { id:'iia1',  cls:'pcut-grade1',  label:null,    name:'II-A-1 (2종 2호)',  rowspan:0 },
    { id:'iiia2', cls:'pcut-grade1',  label:null,    name:'III-A-2 (2종 1호)', rowspan:0 },
    { id:'ia2',   cls:'pcut-special', label:'1종',   name:'I-A-2 (1종 3호)',   rowspan:3 },
    { id:'iia2',  cls:'pcut-special', label:null,    name:'II-A-2 (1종 2호)',  rowspan:0 },
    { id:'iiib',  cls:'pcut-special', label:null,    name:'III-B (1종 1호)',   rowspan:0 },
    { id:'ib',    cls:'bead-junbul',  label:'준불연', name:'I-B (준불연)',      rowspan:1 },
  ];
  const costRows = costGrades.map((g, i) => `
    <tr${i===0||i===3||i===6?' class="pcut-grade-row"':''}>
      ${g.rowspan>0?`<td rowspan="${g.rowspan}" class="pcut-name-cell ${g.cls}" style="border-bottom:none !important;">${g.label}</td>`:''}
      <td><span class="pricing-range-label">${g.name}</span></td>
      <td><input type="text" inputmode="numeric" id="bead_cost_${g.id}" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcBead()"></td>
      <td class="pcut-diff-cell" id="diff_bead_cost_${g.id}"><span class="pcut-diff-empty">—</span></td>
    </tr>`).join('');
  const costTableHtml = `<table class="pricing-cost-unified-table">
    <colgroup><col style="width:80px"><col style="width:210px"><col style="width:155px"><col style="width:80px"></colgroup>
    <thead><tr><th>종류</th><th>품명</th><th>단가 (원/m²)</th><th class="pricing-col-diff">이전대비</th></tr></thead>
    <tbody>${costRows}</tbody>
  </table>`;
  const hiddenHtml = _hiddenFields(BEAD_ROWS.flatMap(t=>[`bead_m2_3_t${t}`,`bead_m2_2_t${t}`,`bead_m2_1_t${t}`,`bead_m1_3_t${t}`,`bead_m1_2_t${t}`,`bead_m1_1_t${t}`,`bead_mj_t${t}`]),'recalcBead');
  const subtabBar = `<div class="bead-subtab-bar">
    ${BEAD_GRADES.map((g,i)=>`<button class="bead-subtab${i===0?' active':''}" onclick="setBeadSubtab('${g.id}',this)">${g.label}<span class="bead-subtab-sub">${g.sub}</span></button>`).join('')}
  </div>`;
  const resultTableHtml = `<table class="pricing-table">
    <colgroup>
      <col style="width:130px"><col style="width:60px"><col style="width:72px"><col style="width:55px"><col style="width:72px">
      <col style="width:90px"><col style="width:90px"><col style="width:90px"><col style="width:72px">
      <col style="width:85px"><col style="width:72px"><col style="width:70px"><col style="width:70px"><col style="width:70px">
    </colgroup>
    ${_resultThead(['품명'])}
    <tbody id="beadTableBody"></tbody>
  </table>`;
  document.getElementById('pricing-tab-bead').innerHTML =
    _costCard('bead','bead','품종별 m²당 원가를 입력하세요', costTableHtml, hiddenHtml) +
    _resultCard('비드법 단열재 단가표','규격: 900×1800mm / 600×1200mm(준불연)', subtabBar, resultTableHtml);
}

/* ── 경질우레탄 탭 ── */
function buildPuTab() {
  const ordered = [
    { g:PU_GRADES.find(g=>g.id==='id_out'), cls:'pu-id-out', label:'I-D', sub:'심재 준불연' },
    { g:PU_GRADES.find(g=>g.id==='id_in'),  cls:'pu-id',     label:'I-D', sub:'준불연' },
    { g:PU_GRADES.find(g=>g.id==='iia'),    cls:'pu-iia',    label:'II-A',         sub:'2종 2호' },
    { g:PU_GRADES.find(g=>g.id==='iiia'),   cls:'pu-iiia',   label:'III-A',        sub:'2종 1호' },
    { g:PU_GRADES.find(g=>g.id==='ic'),     cls:'pu-ic',     label:'I-C',          sub:'1종 3호' },
  ];
  const gradeTables = ordered.map(({ g, cls, label, sub }) => `
    <table class="pricing-cost-unified-table pu-cost-sub-table">
      <colgroup><col style="width:27%"><col style="width:28%"><col style="width:31%"><col style="width:14%"></colgroup>
      <thead><tr><th>품명</th><th>두께 구간</th><th>단가 (원/m²)</th><th class="pricing-col-diff">이전<br>대비</th></tr></thead>
      <tbody>${g.costBands.map((band, bi) => `
        <tr${bi===0?' class="pcut-grade-row"':''}>
          ${bi===0?`<td rowspan="${g.costBands.length}" class="pcut-name-cell ${cls}">${label}<br><span class="pcut-name-sub">${sub}</span></td>`:''}
          <td><span class="pricing-range-label">${band.label}</span></td>
          <td><input type="text" inputmode="numeric" id="${band.costId}" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcPu()"></td>
          <td class="pcut-diff-cell" id="diff_${band.costId}"><span class="pcut-diff-empty">—</span></td>
        </tr>`).join('')}
      </tbody>
    </table>`).join('');
  const hiddenIds = [...new Set(PU_GRADES.flatMap(g=>[...g.rows.map(t=>`pu_m_${g.id}_t${t}`),...g.costBands.map(b=>b.costId)]))];
  const subtabBar = `<div class="bead-subtab-bar">
    ${PU_GRADES.map((g,i)=>`<button class="bead-subtab pu-subtab${i===0?' active':''}" onclick="setPuSubtab('${g.id}',this)">${g.label}<span class="bead-subtab-sub">${g.sub2}</span></button>`).join('')}
  </div>`;
  const resultTableHtml = `<table class="pricing-table">
    <colgroup>
      <col style="width:130px"><col style="width:60px"><col style="width:72px"><col style="width:55px"><col style="width:72px">
      <col style="width:90px"><col style="width:90px"><col style="width:90px"><col style="width:72px">
      <col style="width:85px"><col style="width:72px"><col style="width:70px"><col style="width:70px"><col style="width:70px">
    </colgroup>
    ${_resultThead(['품명'])}
    <tbody id="puTableBody"></tbody>
  </table>`;
  document.getElementById('pricing-tab-pu').innerHTML =
    _costCard('pu','pu','품종별 m²당 원가를 입력하세요', `<div class="pu-cost-tables-row">${gradeTables}</div>`, _hiddenFields(hiddenIds,'recalcPu')) +
    _resultCard('경질우레탄보드 단가표','규격: 1000×2000mm', subtabBar, resultTableHtml);
}

/* ── PF 보드 탭 ── */
function buildPfTab() {
  /* PF 원가 테이블: 품명(rowspan2) | 부위 | 단가(m²) | 이전대비 */
  const pfGroups = [
    { nameCell:'I-C 페놀보드<br><span class="pcut-name-sub">(LX: 국내산)</span>', cls:'pf-lx-cell',
      rows:[
        { id:'lx_out', use:'심재 외벽용',   useClass:'pf-use-out' },
        { id:'lx_in',  use:'내단열 내벽용', useClass:'pf-use-in'  },
      ]
    },
    { nameCell:'I-C 페놀보드<br><span class="pcut-name-sub">(국내산)</span>', cls:'pf-kd-cell',
      rows:[
        { id:'kd_out', use:'심재 외벽용',   useClass:'pf-use-out' },
        { id:'kd_in',  use:'내단열 내벽용', useClass:'pf-use-in'  },
      ]
    },
    { nameCell:'I-C 페놀보드<br><span class="pcut-name-sub">(수입산)</span>', cls:'pf-im-cell',
      rows:[
        { id:'im_out', use:'심재 외벽용',   useClass:'pf-use-out' },
        { id:'im_in',  use:'내단열 내벽용', useClass:'pf-use-in'  },
      ]
    },
  ];
  const costRows = pfGroups.map(grp =>
    grp.rows.map((row, ri) => `
    <tr class="pcut-grade-row">
      ${ri === 0 ? `<td rowspan="${grp.rows.length}" class="pcut-name-cell ${grp.cls}">${grp.nameCell}</td>` : ''}
      <td><span class="pricing-range-label ${row.useClass}">${row.use}</span></td>
      <td><input type="text" inputmode="numeric" id="pf_cost_${row.id}" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcPf()"></td>
      <td class="pcut-diff-cell" id="diff_pf_cost_${row.id}"><span class="pcut-diff-empty">—</span></td>
    </tr>`).join('')
  ).join('');
  const costTableHtml = `<table class="pricing-cost-unified-table">
    <colgroup>
      <col style="width:155px">
      <col style="width:100px">
      <col style="width:155px">
      <col style="width:70px">
    </colgroup>
    <thead><tr><th>품명</th><th>부위</th><th>단가 (원/m²)</th><th class="pricing-col-diff">이전대비</th></tr></thead>
    <tbody>${costRows}</tbody>
  </table>`;
  const hiddenHtml = _hiddenFields(PF_ROWS.flatMap(t=>['lxo','lxi','kdo','kdi','imo','imi'].map(mk=>`pf_m_${mk}_t${t}`)),'recalcPf');
  const subtabGroups = [
    { label:'LX 국내산', cls:'pf-lx-label', tabs:[
      {id:'lxo_s',text:'I-C',sub:'심재 준불연 0.6×1.2'},{id:'lxo_l',text:'I-C',sub:'심재 준불연 1.2×2'},
      {id:'lxi_s',text:'I-C',sub:'준불연 0.6×1.2'},{id:'lxi_l',text:'I-C',sub:'준불연1.2×2'}]},
    { label:'국내산', cls:'pf-kd-label', tabs:[
      {id:'kdo_s',text:'I-C',sub:'심재 준불연 0.6×1.2'},{id:'kdo_l',text:'I-C',sub:'심재 준불연 1.2×2'},
      {id:'kdi_s',text:'I-C',sub:'준불연 0.6×1.2'},{id:'kdi_l',text:'I-C',sub:'준불연 1.2×2'}]},
    { label:'수입산', cls:'pf-im-label', tabs:[
      {id:'imo_s',text:'I-C',sub:'심재 준불연 0.6×1.2'},{id:'imo_l',text:'I-C',sub:'심재 준불연 1×1.2'},
      {id:'imi_s',text:'I-C',sub:'준불연 0.6×1.2'},{id:'imi_l',text:'I-C',sub:'준불연 1×1.2'}]},
  ];
  let firstTab = true;
  const subtabBar = `<div class="bead-subtab-bar pf-subtab-bar">
    ${subtabGroups.map(grp=>`<div class="pf-subtab-group">
      <span class="pf-subtab-group-label ${grp.cls}">${grp.label}</span>
      ${grp.tabs.map(t=>{
        const a = firstTab?' active':''; if(firstTab) firstTab=false;
        return `<button class="pf-subtab bead-subtab${a}" onclick="setPfSubtab('${t.id}',this)">${t.text}<span class="bead-subtab-sub">${t.sub}</span></button>`;
      }).join('')}
    </div>`).join('')}
  </div>`;
  const resultTableHtml = `<table class="pricing-table">
    <colgroup>
      <col style="width:140px"><col style="width:60px"><col style="width:72px"><col style="width:55px"><col style="width:72px">
      <col style="width:90px"><col style="width:90px"><col style="width:90px"><col style="width:72px">
      <col style="width:85px"><col style="width:72px"><col style="width:70px"><col style="width:70px"><col style="width:70px">
    </colgroup>
    ${_resultThead(['품명'])}
    <tbody id="pfTableBody"></tbody>
  </table>`;
  document.getElementById('pricing-tab-pf').innerHTML =
    _costCard('pf','pf','품종별 m²당 원가를 입력하세요', costTableHtml, hiddenHtml) +
    _resultCard('PF 보드 단가표','규격: 600×1200mm / 1200×2000mm / 1000×1200mm(수입산)', subtabBar, resultTableHtml);
}

/* ── 불연단열재 탭 ── */
function buildFrTab() {
  const costGrades = [
    { grade: FR_GRADES[0], cls:'fr-bul-cell',  label:'불연',   name:'불연 열반사단열재 (1×1.2m)',   rowspan:FR_GRADES[0].rows.length },
    { grade: FR_GRADES[1], cls:'fr-jun-cell',  label:'준불연', name:'준불연 열반사단열재 (1×1.2m)', rowspan:FR_GRADES[1].rows.length },
  ];
  const costRows = costGrades.map(({ grade, cls, label, name, rowspan }, gi) =>
    grade.rows.map((t, bi) => `
    <tr${bi===0?' class="pcut-grade-row"':''}>
      ${bi===0 ? `<td rowspan="${rowspan}" class="pcut-name-cell ${cls}" style="border-bottom:none !important;">${label}</td>` : ''}
      <td><span class="pricing-range-label">${t}T</span></td>
      <td><input type="text" inputmode="numeric" id="fr_cost_${grade.id}_t${t}" class="pricing-input-field pcut-cost-field" placeholder="${FR_COST_DEFAULTS[grade.costId]?.[t] ?? 0}" oninput="recalcFr()"></td>
      <td class="pcut-diff-cell" id="diff_fr_cost_${grade.id}_t${t}"><span class="pcut-diff-empty">—</span></td>
    </tr>`).join('')
  ).join('');
  const costTableHtml = `<table class="pricing-cost-unified-table">
    <colgroup><col style="width:80px"><col style="width:210px"><col style="width:155px"><col style="width:80px"></colgroup>
    <thead><tr><th>종류</th><th>두께</th><th>단가 (원/m²)</th><th class="pricing-col-diff">이전대비</th></tr></thead>
    <tbody>${costRows}</tbody>
  </table>`;
  const hiddenHtml = _hiddenFields(
    FR_GRADES.flatMap(g => g.rows.map(t => `fr_m_${g.id}_t${t}`)), 'recalcFr'
  );
  const subtabBar = `<div class="bead-subtab-bar">
    ${FR_GRADES.map((g, i) => `<button class="fr-subtab bead-subtab${i===0?' active':''}" onclick="setFrSubtab('${g.id}',this)">${g.label}<span class="bead-subtab-sub">${g.sub1}</span></button>`).join('')}
  </div>`;
  const resultTableHtml = `<table class="pricing-table">
    <colgroup>
      <col style="width:130px"><col style="width:55px">
      <col style="width:75px"><col style="width:80px">
      <col style="width:85px"><col style="width:85px"><col style="width:90px">
      <col style="width:90px"><col style="width:72px">
      <col style="width:80px"><col style="width:72px"><col style="width:72px"><col style="width:75px"><col style="width:70px">
    </colgroup>
    <thead>
      <tr>
        <th rowspan="2">품명</th>
        <th rowspan="2">두께<br>(mm)</th>
        <th rowspan="2">m²당<br>원가</th>
        <th rowspan="2">장당<br>마진</th>
        <th rowspan="2">장당원가<br><span class="pricing-th-tiny">VAT미포함</span></th>
        <th rowspan="2">장당판매가<br><span class="pricing-th-tiny">VAT미포함</span></th>
        <th rowspan="2">VAT포함<br>판매가</th>
        <th rowspan="2" class="pricing-col-highlight">최종<br>판매가</th>
        <th rowspan="2" class="pricing-col-diff">이전<br>대비</th>
        <th colspan="5" class="pricing-col-margin-group">마진 분석</th>
      </tr>
      <tr>
        <th class="pricing-col-margin">마진금액</th>
        <th class="pricing-col-margin">부가세</th>
        <th class="pricing-col-margin">수수료 6%</th>
        <th class="pricing-col-margin">순수마진</th>
        <th class="pricing-col-margin">마진율</th>
      </tr>
    </thead>
    <tbody id="frTableBody"></tbody>
  </table>`;
  document.getElementById('pricing-tab-fr').innerHTML =
    _costCard('fr', 'fr', '품종별 m²당 원가를 입력하세요', costTableHtml, hiddenHtml) +
    _resultCard('불연단열재 단가표', '규격: 1000×1200mm', subtabBar, resultTableHtml);
}

/* ── 최초 실행 ── */
function initPricingTabs() {
  buildIsopinkTab();
  buildBeadTab();
  buildPuTab();
  buildPfTab();
  buildFrTab();
}
document.addEventListener('DOMContentLoaded', initPricingTabs);
/* ═══════════════════════════════════════
   엑셀 저장 — 모든 탭 전체 데이터
   SheetJS(XLSX) CDN 사용
═══════════════════════════════════════ */
window.exportPricingExcel = function() {
  if (typeof XLSX === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => _doExport();
    document.head.appendChild(s);
  } else {
    _doExport();
  }
};

function _doExport() {
  const wb = XLSX.utils.book_new();
  const baseMonth = document.getElementById('cost_base_month')?.value || '';
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}`;

  // ── 헤더 스타일 공통 ──
  const H = (v) => ({ v, t:'s' });

  // ── 숫자 셀 ──
  const N = (v) => v != null && v !== '' && !isNaN(v) ? { v: Number(v), t:'n' } : { v: '-', t:'s' };

  // ── 시트 공통 헤더 ──
  const COMMON_HEADER = ['품명', '두께(mm)', '규격(m²당원가)', '장당마진', 'm²당판매가',
    '장당원가(VAT미포함)', '장당판매가(VAT미포함)', '최종판매가(VAT포함)', '마진금액', '부가세', '수수료6%', '순수마진', '마진율(%)',
    ..._compHeaders()];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. 아이소핑크
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  (function buildIsopink() {
    const rows = [
      ['아이소핑크 단가표', '', '', '', '', '', '', '', '', '', '', '', ''],
      [`기준월: ${baseMonth || dateStr}`, '', '', '', '', '', '', '', '', '', '', '', ''],
      [],
      COMMON_HEADER,
    ];
    ISOPINK_ROWS.forEach(t => {
      const r = _isoCalcRow(t);
      const grade = (t===10||t===20) ? 'II-A 압출법단열재 1호' : 'II-B-2 압출법단열재 특호';
      if (!r) { rows.push([grade, t, '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', ..._compCells('isopink', 'isopink', t)]); return; }
      rows.push([grade, t, r.cost, r.margin, r.mmSellPrice,
        r.costPerSheet, r.sellPerSheet, r.realPrice,
        r.marginAmt, r.vat, r.commission, r.netMargin, r.marginRate,
        ..._compCells('isopink', 'isopink', t, r.realPrice)]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    _styleSheet(ws, rows.length);
    XLSX.utils.book_append_sheet(wb, ws, '아이소핑크');
  })();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. 비드법
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  (function buildBead() {
    const rows = [
      ['비드법단열재 단가표', '', '', '', '', '', '', '', '', '', '', '', ''],
      [`기준월: ${baseMonth || dateStr}`, '', '', '', '', '', '', '', '', '', '', '', ''],
      [],
      COMMON_HEADER,
    ];
    BEAD_GRADES.forEach(grade => {
      BEAD_ROWS.forEach(t => {
        const costId = _getCostId('bead', grade, t);
        const costPerM2 = costId ? fieldVal(costId) : 0;
        const marginPerM2 = _getMargin('bead', grade, t);
        const r = costPerM2 ? calcSheetRow(costPerM2, marginPerM2, t, grade.area) : null;
        const gradeName = `${grade.label} 비드법단열재 ${grade.sub}`;
        if (!r) { rows.push([gradeName, t, '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', ..._compCells('fr', grade.id, t)]); return; }
        rows.push([gradeName, t, r.costPerM2, r.marginPerM2, r.sellPerM2,
          r.costPerSheet, r.sellPerSheet, r.realPrice,
          r.marginAmt, r.vat, r.commission, r.netMargin, r.marginRate,
          ..._compCells('bead', grade.id, t, r.realPrice)]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    _styleSheet(ws, rows.length);
    XLSX.utils.book_append_sheet(wb, ws, '비드법단열재');
  })();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. 경질우레탄
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  (function buildPu() {
    const rows = [
      ['경질우레탄 단가표', '', '', '', '', '', '', '', '', '', '', '', ''],
      [`기준월: ${baseMonth || dateStr}`, '', '', '', '', '', '', '', '', '', '', '', ''],
      [],
      COMMON_HEADER,
    ];
    PU_GRADES.forEach(grade => {
      grade.rows.forEach(t => {
        const costId = _getCostId('pu', grade, t);
        const costPerM2 = costId ? fieldVal(costId) : 0;
        const marginPerM2 = _getMargin('pu', grade, t);
        const tEff = grade.tFactor ?? t;
        const r = costPerM2 ? calcSheetRow(costPerM2, marginPerM2, tEff, grade.area) : null;
        const gradeName = `${grade.label} 경질우레탄 ${grade.sub2||grade.sub1}`;
        if (!r) { rows.push([gradeName, t, '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', ..._compCells('fr', grade.id, t)]); return; }
        rows.push([gradeName, t, r.costPerM2, r.marginPerM2, r.sellPerM2,
          r.costPerSheet, r.sellPerSheet, r.realPrice,
          r.marginAmt, r.vat, r.commission, r.netMargin, r.marginRate,
          ..._compCells('pu', grade.id, t, r.realPrice)]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    _styleSheet(ws, rows.length);
    XLSX.utils.book_append_sheet(wb, ws, '경질우레탄');
  })();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. PF보드
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  (function buildPf() {
    const rows = [
      ['PF보드 단가표', '', '', '', '', '', '', '', '', '', '', '', ''],
      [`기준월: ${baseMonth || dateStr}`, '', '', '', '', '', '', '', '', '', '', '', ''],
      [],
      COMMON_HEADER,
    ];
    PF_GRADES.forEach(grade => {
      PF_ROWS.forEach(t => {
        const costPerM2 = fieldVal(grade.costId);
        const marginPerM2 = _getMargin('pf', grade, t);
        const r = costPerM2 ? calcSheetRow(costPerM2, marginPerM2, t, grade.area) : null;
        const gradeName = `${grade.pfCat} ${grade.pfGrade} ${grade.areaLabel}`;
        if (!r) { rows.push([gradeName, t, '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', ..._compCells('fr', grade.id, t)]); return; }
        rows.push([gradeName, t, r.costPerM2, r.marginPerM2, r.sellPerM2,
          r.costPerSheet, r.sellPerSheet, r.realPrice,
          r.marginAmt, r.vat, r.commission, r.netMargin, r.marginRate,
          ..._compCells('pf', grade.id, t, r.realPrice)]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    _styleSheet(ws, rows.length);
    XLSX.utils.book_append_sheet(wb, ws, 'PF보드');
  })();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. 불연단열재 (컬럼 구성이 다름)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  (function buildFr() {
    const rows = [
      ['불연단열재 단가표', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [`기준월: ${baseMonth || dateStr}`, '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [],
      ['품명', '두께(mm)', 'm²당원가', '장당마진', '장당원가(VAT미포함)', '장당판매가(VAT미포함)',
       'VAT포함판매가', '최종판매가', '마진금액', '부가세', '수수료6%', '순수마진', '마진율(%)',
       ..._compHeaders()],
    ];
    FR_GRADES.forEach(grade => {
      grade.rows.forEach(t => {
        const costId = _getCostId('fr', grade, t);
        const costPerM2 = costId ? fieldVal(costId) : 0;
        const marginSheet = _getMargin('fr', grade, t);
        const r = calcFrSheetRow(costPerM2, marginSheet, grade.area);
        const gradeName = `${grade.sub1} ${grade.sub2}`;
        if (!r) { rows.push([gradeName, t, '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', ..._compCells('fr', grade.id, t)]); return; }
        rows.push([gradeName, t, r.costPerM2, r.marginPerSheet,
          r.costPerSheet, r.sellPerSheet, r.vatSell, r.realPrice,
          r.marginAmt, r.vat, r.commission, r.netMargin, r.marginRate,
          ..._compCells('fr', grade.id, t, r.realPrice)]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    _styleSheet(ws, rows.length);
    XLSX.utils.book_append_sheet(wb, ws, '불연단열재');
  })();

  // 파일 저장
  const fileName = `단가표_${baseMonth || dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
  if (typeof showToast === 'function') showToast(`${fileName} 저장 완료`, 'success');
}

/* 공통 시트 스타일 적용 */
/* ═══════════════════════════════════════
   엑셀 서식 유틸
═══════════════════════════════════════ */

/* 경쟁사 이름 배열 */
function _compNames() {
  try {
    const s = JSON.parse(localStorage.getItem('energuard_comp_names') || '[]');
    return ['크린슐라','산일상사','대유물류'].map((d,i) => s[i] || d);
  } catch { return ['크린슐라','산일상사','대유물류']; }
}

/* 경쟁사 데이터 조회 */
function _getCompData(tabId, gradeId, t) {
  return window._compCache?.[tabId]?.[gradeId]?.[t] || {};
}

/* 경쟁사 헤더: 단가 / 차이 / 링크 */
function _compHeaders() {
  return _compNames().flatMap(n => [`${n} 단가`, `${n} 차이`, `${n} 링크`]);
}

/* 경쟁사 데이터 셀: 단가 / 차이(우리-경쟁사) / 링크 */
function _compCells(tabId, gradeId, t, ourPrice) {
  const d = _getCompData(tabId, gradeId, t);
  const result = [];
  for (let i = 1; i <= 3; i++) {
    const price = d[`comp${i}_price`];
    const link  = d[`comp${i}_link`];
    const diff  = (ourPrice != null && price != null) ? (ourPrice - price) : null;
    result.push(price != null ? price : '-');
    result.push(diff  != null ? diff  : '-');
    result.push(link  ? link  : '-');
  }
  return result;
}

/* 셀 서식 적용
   - 1~2행: 제목/기준월 (병합+굵게+배경)
   - 4행: 헤더 (배경+굵게+가운데)
   - 데이터행: 숫자 천단위, 마진율 %, 차이 양수빨강/음수파랑, 링크 파란색
*/
function _styleSheet(ws, totalRows) {
  // 열 너비만 설정 (값만 저장, 서식은 추후 적용)
  ws['!cols'] = [
    { wch: 28 }, // 품명
    { wch: 8  }, // 두께
    { wch: 12 }, // m²당원가
    { wch: 10 }, // 장당마진
    { wch: 12 }, // m²당판매가
    { wch: 14 }, // 장당원가
    { wch: 14 }, // 장당판매가
    { wch: 14 }, // 최종판매가
    { wch: 12 }, // 마진금액
    { wch: 10 }, // 부가세
    { wch: 10 }, // 수수료
    { wch: 12 }, // 순수마진
    { wch: 8  }, // 마진율
    // 경쟁사 3개 × (단가/차이/링크)
    { wch: 12 }, { wch: 10 }, { wch: 40 },
    { wch: 12 }, { wch: 10 }, { wch: 40 },
    { wch: 12 }, { wch: 10 }, { wch: 40 },
  ];
}

/* ═══════════════════════════════════════
   모음전 옵션 엑셀 — 스마트스토어 업로드용
═══════════════════════════════════════ */

// 비드법 단일 등급 realPrice 계산 헬퍼
function _beadRealPrice(grade, t) {
  const costId = _getCostId('bead', grade, t);
  const cost   = costId ? fieldVal(costId) : 0;
  const margin = _getMargin('bead', grade, t);
  if (!cost) return null;
  return calcSheetRow(cost, margin, t, grade.area).realPrice;
}

// ── 비드법 1종 모음전 ──
window.exportBeadOptionExcel1jong = function() {
  if (typeof XLSX === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => _doBeadExport('1jong');
    document.head.appendChild(s);
  } else { _doBeadExport('1jong'); }
};

// ── 비드법 2종 모음전 ──
window.exportBeadOptionExcel2jong = function() {
  if (typeof XLSX === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => _doBeadExport('2jong');
    document.head.appendChild(s);
  } else { _doBeadExport('2jong'); }
};

// ── 비드법 준불연 모음전 ──
window.exportBeadOptionExcelJunbul = function() {
  if (typeof XLSX === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => _doBeadExport('junbul');
    document.head.appendChild(s);
  } else { _doBeadExport('junbul'); }
};

function _doBeadExport(type) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const wb = XLSX.utils.book_new();

  if (type === '1jong' || type === '2jong') {
    const gradeIds  = type === '1jong' ? ['ia2','iia2','iiib'] : ['ia1','iia1','iiia2'];
    const gradeObjs = gradeIds.map(id => BEAD_GRADES.find(g => g.id === id));
    const jong      = type === '1jong' ? '1종' : '2종';
    const basePrice = _beadRealPrice(gradeObjs[0], BEAD_ROWS[0]);
    if (!basePrice) { showToast(`비드법 ${jong} 원가 데이터가 없습니다.`, 'error'); return; }
    const rows = [['종류', '규격', '옵션가', '재고수량', '관리코드', '사용여부']];
    BEAD_ROWS.forEach(t => {
      gradeObjs.forEach(grade => {
        const rp = _beadRealPrice(grade, t);
        if (rp == null) return;
        const gradeNum = grade.sub.replace(/.*?(\d호)$/, '$1');
        rows.push([`비드법단열재 ${jong}${gradeNum}`, `900x1800 ${t}T`, rp - basePrice, 99999, '', 'Y']);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws, `비드법${jong} 옵션`);
    XLSX.writeFile(wb, `스마트스토어_비드법${jong}_옵션_${dateStr}.xls`);
    showToast(`비드법 ${jong} 모음전 엑셀 저장 완료!`, 'success');

  } else if (type === 'junbul') {
    const g09 = BEAD_GRADES.find(g => g.id === 'ib_09');
    const g06 = BEAD_GRADES.find(g => g.id === 'ib_06');
    // 기준가: 600x1200 10T = 0
    const basePrice = _beadRealPrice(g06, BEAD_ROWS[0]);
    if (!basePrice) { showToast('준불연 원가 데이터가 없습니다.', 'error'); return; }
    const rows = [['두께', '규격', '옵션가', '재고수량', '관리코드', '사용여부']];
    BEAD_ROWS.forEach(t => {
      const rp06 = _beadRealPrice(g06, t);
      const rp09 = _beadRealPrice(g09, t);
      const name = `심재준불연 비드법 단열재 ${t}T`;
      // 순서: 600x1200 → 900x1800
      if (rp06 != null) rows.push([name, '600x1200', rp06 - basePrice, 99999, '', 'Y']);
      if (rp09 != null) rows.push([name, '900x1800', rp09 - basePrice, 99999, '', 'Y']);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 26 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws, '준불연 옵션');
    XLSX.writeFile(wb, `스마트스토어_비드법준불연_옵션_${dateStr}.xls`);
    showToast('준불연 모음전 엑셀 저장 완료!', 'success');
  }
}

// ── 아이소핑크 모음전 ──
window.exportSmartStoreOptionExcel = function() {
  if (typeof XLSX === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => _doSmartStoreExport();
    document.head.appendChild(s);
  } else {
    _doSmartStoreExport();
  }
};

function _doSmartStoreExport() {
  const wb = XLSX.utils.book_new();

  // 아이소핑크 모음전 옵션 시트
  const baseRow = _isoCalcRow(ISOPINK_ROWS[0]);
  if (!baseRow) { showToast('아이소핑크 원가 데이터가 없습니다.', 'error'); return; }
  const basePrice = baseRow.realPrice;

  const rows = [['아이소핑크 두께 선택', '옵션가', '재고수량', '관리코드', '사용여부']];
  ISOPINK_ROWS.forEach(t => {
    const r = _isoCalcRow(t);
    if (!r) return;
    const optionName = `아이소핑크 KS정품 900x1800 ${t}T`;
    const optionPrice = r.realPrice - basePrice;
    rows.push([optionName, optionPrice, 99999, '', 'Y']);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 36 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, ws, '아이소핑크 옵션');

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  XLSX.writeFile(wb, `스마트스토어_아이소핑크_옵션_${dateStr}.xls`);
  showToast('모음전 옵션 엑셀 저장 완료!', 'success');
}

/* ═══════════════════════════════════════
   경질우레탄 모음전 옵션 엑셀
═══════════════════════════════════════ */
function _puRealPrice(grade, t) {
  const band = grade.costBands?.find(b => t >= b.min && t <= b.max);
  if (!band) return null;
  const cost   = fieldVal(band.costId);
  const margin = _getMargin('pu', grade, t);
  if (!cost) return null;
  return calcSheetRow(cost, margin, t, grade.area).realPrice;
}

const PU_OPTION_MAP = {
  ic:     { header: '경질 우레탄보드 I-C (1종3호)',    fileName: '경질우레탄_1종3호' },
  iiia:   { header: '경질 우레탄보드 III-A (2종1호)',  fileName: '경질우레탄_2종1호' },
  iia:    { header: '경질 우레탄보드 II-A (2종2호)',   fileName: '경질우레탄_2종2호' },
  id_in:  { header: '준불연 경질 우레탄보드',           fileName: '준불연_경질우레탄' },
  id_out: { header: '심재 준불연 경질 우레탄보드',      fileName: '심재준불연_경질우레탄' },
};

window.exportPuOptionExcel = function(gradeId) {
  if (typeof XLSX === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => _doPuExport(gradeId);
    document.head.appendChild(s);
  } else { _doPuExport(gradeId); }
};

function _doPuExport(gradeId) {
  const grade = PU_GRADES.find(g => g.id === gradeId);
  const cfg   = PU_OPTION_MAP[gradeId];
  if (!grade || !cfg) { showToast('지원하지 않는 경질우레탄 등급입니다.', 'error'); return; }
  const basePrice = _puRealPrice(grade, grade.rows[0]);
  if (!basePrice) { showToast(`${cfg.header} 원가 데이터가 없습니다.`, 'error'); return; }
  const rows = [[cfg.header, '옵션가', '재고수량', '관리코드', '사용여부']];
  grade.rows.forEach(t => {
    const rp = _puRealPrice(grade, t);
    if (rp == null) return;
    rows.push([`1000x2000 ${t}T`, rp - basePrice, 99999, '', 'Y']);
  });
  const wb  = XLSX.utils.book_new();
  const ws  = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, ws, '경질우레탄 옵션');
  const now     = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  XLSX.writeFile(wb, `스마트스토어_${cfg.fileName}_옵션_${dateStr}.xls`);
  showToast(`${cfg.header} 모음전 엑셀 저장 완료!`, 'success');
}

/* ═══════════════════════════════════════
   불연/준불연 열반사 모음전 옵션 엑셀
═══════════════════════════════════════ */
const FR_OPTION_MAP = {
  fr_bul: { header: '미네랄울 불연단열재',       fileName: '불연_열반사' },
  fr_jun: { header: '심재 준불연 열반사단열재',   fileName: '준불연_열반사' },
};

function _frRealPriceById(grade, t) {
  const costId  = `fr_cost_${grade.id}_t${t}`;
  const costEl  = document.getElementById(costId);
  const costDefault = FR_COST_DEFAULTS[grade.costId]?.[t] || 0;
  const costPerM2   = (costEl && costEl.value.trim() !== '') ? parseFloat(costEl.value) : costDefault;
  const marginId    = `fr_m_${grade.id}_t${t}`;
  const marginEl    = document.getElementById(marginId);
  const margin      = (marginEl && marginEl.value.trim() !== '') ? parseFloat(marginEl.value) : (grade.fallback?.[t] || 0);
  const r = calcFrSheetRow(costPerM2, margin, grade.area);
  return r ? r.realPrice : null;
}

window.exportFrOptionExcel = function(gradeId) {
  if (typeof XLSX === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => _doFrExport(gradeId);
    document.head.appendChild(s);
  } else { _doFrExport(gradeId); }
};

function _doFrExport(gradeId) {
  const grade = FR_GRADES.find(g => g.id === gradeId);
  const cfg   = FR_OPTION_MAP[gradeId];
  if (!grade || !cfg) { showToast('지원하지 않는 열반사 등급입니다.', 'error'); return; }
  const basePrice = _frRealPriceById(grade, grade.rows[0]);
  if (!basePrice) { showToast(`${cfg.header} 원가 데이터가 없습니다.`, 'error'); return; }
  const rows = [['제품선택', '옵션가', '재고수량', '관리코드', '사용여부']];
  grade.rows.forEach(t => {
    const rp = _frRealPriceById(grade, t);
    if (rp == null) return;
    rows.push([`${cfg.header} ${t}T`, rp - basePrice, 99999, '', 'Y']);
  });
  const wb  = XLSX.utils.book_new();
  const ws  = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, ws, '열반사 옵션');
  const now     = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  XLSX.writeFile(wb, `스마트스토어_${cfg.fileName}_옵션_${dateStr}.xls`);
  showToast(`${cfg.header} 모음전 엑셀 저장 완료!`, 'success');
}

/* ═══════════════════════════════════════
   PF보드 모음전 옵션 엑셀
═══════════════════════════════════════ */

// PF realPrice 헬퍼
function _pfRealPrice(grade, t) {
  const cost   = fieldVal(grade.costId);
  const margin = _getMargin('pf', grade, t);
  if (!cost) return null;
  return calcSheetRow(cost, margin, t, grade.area).realPrice;
}

// PF 모음전 설정: 서브탭 ID → { 소형 grade, 대형 grade, 소형 규격, 대형 규격, 옵션명 prefix, 파일명 }
const PF_OPTION_MAP = {
  lxi_s: { s: 'lxi_s', l: 'lxi_l', sSize: '600x1200', lSize: '1200x2000', prefix: 'LX하우시스 PF보드 준불연',    fileName: 'PF보드_LX_준불연'    },
  lxi_l: { s: 'lxi_s', l: 'lxi_l', sSize: '600x1200', lSize: '1200x2000', prefix: 'LX하우시스 PF보드 준불연',    fileName: 'PF보드_LX_준불연'    },
  lxo_s: { s: 'lxo_s', l: 'lxo_l', sSize: '600x1200', lSize: '1200x2000', prefix: 'LX하우시스 PF보드 심재준불연', fileName: 'PF보드_LX_심재준불연'  },
  lxo_l: { s: 'lxo_s', l: 'lxo_l', sSize: '600x1200', lSize: '1200x2000', prefix: 'LX하우시스 PF보드 심재준불연', fileName: 'PF보드_LX_심재준불연'  },
  kdi_s: { s: 'kdi_s', l: 'kdi_l', sSize: '600x1200', lSize: '1200x2000', prefix: '국산 PF보드 준불연',          fileName: 'PF보드_국산_준불연'   },
  kdi_l: { s: 'kdi_s', l: 'kdi_l', sSize: '600x1200', lSize: '1200x2000', prefix: '국산 PF보드 준불연',          fileName: 'PF보드_국산_준불연'   },
  kdo_s: { s: 'kdo_s', l: 'kdo_l', sSize: '600x1200', lSize: '1200x2000', prefix: '국산 PF보드 심재준불연',       fileName: 'PF보드_국산_심재준불연' },
  kdo_l: { s: 'kdo_s', l: 'kdo_l', sSize: '600x1200', lSize: '1200x2000', prefix: '국산 PF보드 심재준불연',       fileName: 'PF보드_국산_심재준불연' },
  imi_s: { s: 'imi_s', l: 'imi_l', sSize: '600x1200', lSize: '1000x1200',     prefix: '수입산 PF보드 준불연',         fileName: 'PF보드_수입_준불연'   },
  imi_l: { s: 'imi_s', l: 'imi_l', sSize: '600x1200', lSize: '1000x1200',     prefix: '수입산 PF보드 준불연',         fileName: 'PF보드_수입_준불연'   },
  imo_s: { s: 'imo_s', l: 'imo_l', sSize: '600x1200', lSize: '1000x1200',     prefix: '수입산 PF보드 심재준불연',      fileName: 'PF보드_수입_심재준불연' },
  imo_l: { s: 'imo_s', l: 'imo_l', sSize: '600x1200', lSize: '1000x1200',     prefix: '수입산 PF보드 심재준불연',      fileName: 'PF보드_수입_심재준불연' },
};

window.exportPfOptionExcel = function(subtabId) {
  if (typeof XLSX === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => _doPfExport(subtabId);
    document.head.appendChild(s);
  } else { _doPfExport(subtabId); }
};

function _doPfExport(subtabId) {
  const cfg = PF_OPTION_MAP[subtabId];
  if (!cfg) { showToast('지원하지 않는 PF보드 등급입니다.', 'error'); return; }

  const gradeS = PF_GRADES.find(g => g.id === cfg.s);
  const gradeL = PF_GRADES.find(g => g.id === cfg.l);
  if (!gradeS || !gradeL) { showToast('PF보드 등급 데이터가 없습니다.', 'error'); return; }

  const basePrice = _pfRealPrice(gradeS, PF_ROWS[0]);
  if (!basePrice) { showToast(`${cfg.prefix} 원가 데이터가 없습니다.`, 'error'); return; }

  const rows = [['두께', '규격', '옵션가', '재고수량', '관리코드', '사용여부']];
  PF_ROWS.forEach(t => {
    const rpS = _pfRealPrice(gradeS, t);
    const rpL = _pfRealPrice(gradeL, t);
    if (rpS != null) rows.push([`${cfg.prefix} ${t}T`, cfg.sSize, rpS - basePrice, 99999, '', 'Y']);
    if (rpL != null) rows.push([`${cfg.prefix} ${t}T`, cfg.lSize, rpL - basePrice, 99999, '', 'Y']);
  });

  const wb  = XLSX.utils.book_new();
  const ws  = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, ws, 'PF보드 옵션');

  const now     = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  XLSX.writeFile(wb, `스마트스토어_${cfg.fileName}_옵션_${dateStr}.xls`);
  showToast(`${cfg.prefix} 모음전 엑셀 저장 완료!`, 'success');
}