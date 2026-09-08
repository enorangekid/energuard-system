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
// const는 window에 자동으로 안 걸려서, pricing-competitor.js가 window.ISOPINK_ROWS로
// 두께 목록을 가져가려던 게 계속 빈 배열이었다(2026-09-02 발견 — 경쟁사 링크 그룹 색상이
// 아이소핑크에서만 안 나오던 원인).
window.ISOPINK_ROWS = ISOPINK_ROWS;

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
    /* 준불연 — 2026-09-08: 0.9×1.8(ib_09)/0.6×1.2(ib_06) 마진 필드 분리, 둘 다 같은
       기본값에서 시작 */
    fb[`bead_mj_ib_09_t${t}`] = mj[i];
    fb[`bead_mj_ib_06_t${t}`] = mj[i];
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
  // 2026-09-08: 아이소핑크 1호 신설 — 특호(30T~180T/185T+)와 겹치는 구간은 독립 필드로 분리
  'cost_900_1800_1ho_mid','cost_900_1800_1ho_thick',
  'bead_cost_ia1','bead_cost_iia1','bead_cost_iiia2','bead_cost_ia2','bead_cost_iia2','bead_cost_iiib','bead_cost_ib',
  ...PU_GRADES.flatMap(g => g.costBands.map(b => b.costId)),
  'pf_cost_lx_out','pf_cost_lx_in','pf_cost_kd_out','pf_cost_kd_in','pf_cost_im_out','pf_cost_im_in',
  ...FR_GRADES.flatMap(g => g.rows.map(t => `fr_cost_${g.id}_t${t}`)),
];

/* 경쟁사 "동일가로만 맞춤"에서 정수 마진 특성상 정확히 그 가격을 못 만드는 경우
   (두께가 클수록 마진 1단위 변화폭이 커져서 100원 단위를 건너뛰기도 함, 2026-09-04
   사용자 발견) — 마진 계산을 무시하고 가격 자체를 그 경쟁사가로 강제 고정하는 필드.
   margins JSON 컬럼에 같이 저장되게 ALL_MARGIN_FIELDS에 합쳐둔다. 처음엔 아이소핑크만
   지원했다가(iso_price_override_t{T}), 2026-09-04(2차)에 비드법/PU/PF/불연까지 확장
   — 필드 id 규칙은 _getOverrideId(tabId, grade, t)와 반드시 맞춰야 함. */
const ALL_PRICE_OVERRIDE_FIELDS = [
  ...ISOPINK_ROWS.map(t => `iso_price_override_t${t}`),
  // 2026-09-08: 아이소핑크 1호 신설 — 특호와 겹치는 30T~300T 구간은 독립 오버라이드 필드
  ...ISOPINK_ROWS.filter(t => t >= 30).map(t => `iso_price_override_1ho_t${t}`),
  ...BEAD_GRADES.flatMap(g => BEAD_ROWS.map(t => `bead_price_override_${g.id}_t${t}`)),
  ...PU_GRADES.flatMap(g => g.rows.map(t => `pu_price_override_${g.id}_t${t}`)),
  ...PF_GRADES.flatMap(g => PF_ROWS.map(t => `pf_price_override_${g.id}_t${t}`)),
  ...FR_GRADES.flatMap(g => g.rows.map(t => `fr_price_override_${g.id}_t${t}`)),
];

/* 마진 필드 목록 (margins JSON 컬럼에 저장) */
const ALL_MARGIN_FIELDS = [
  ...ISOPINK_ROWS.map(t => `margin_iso_t${t}`),
  // 2026-09-08: 아이소핑크 1호 신설 — 특호와 겹치는 30T~300T 구간은 독립 마진 필드
  ...ISOPINK_ROWS.filter(t => t >= 30).map(t => `margin_iso_1ho_t${t}`),
  ...ALL_PRICE_OVERRIDE_FIELDS,
  // 2026-09-08: 준불연 마진 필드 분리(bead_mj_t{T} → bead_mj_ib_09_t{T}/bead_mj_ib_06_t{T})
  ...BEAD_ROWS.flatMap(t => [`bead_m2_3_t${t}`,`bead_m2_2_t${t}`,`bead_m2_1_t${t}`,`bead_m1_3_t${t}`,`bead_m1_2_t${t}`,`bead_m1_1_t${t}`,`bead_mj_ib_09_t${t}`,`bead_mj_ib_06_t${t}`]),
  ...PU_GRADES.flatMap(g => g.rows.map(t => `pu_m_${g.id}_t${t}`)),
  // 2026-09-08: PF 소형/대형 마진 필드 분리(pf_m_{mk}_t{T} → grade.id 기준 각각)
  ...PF_GRADES.flatMap(g => PF_ROWS.map(t => `pf_m_${g.id}_t${t}`)),
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
  const realPrice     = Math.ceil(vatSell / 100) * 100;        // 100원 단위 올림
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
  return Math.ceil(Math.round((Math.round(costPerM2 * area) + marginPerSheet) * 1.1) / 100) * 100;
}



/* 불연단열재 결과 행 HTML
   컬럼: 품명 | 두께 | m²당원가 | 장당마진 | 장당원가 | 장당판매가 | VAT포함판매가 | 최종판매가 | 이전대비 | 마진금액 | 부가세 | 수수료6% | 순수마진 | 마진율 */
function _frResultRow(t, r, badge, extraCells) {
  if (!r) return `<tr data-t="${t}">${extraCells}<td class="td-thick">${t}</td><td colspan="12" style="text-align:center;color:#d1d5db;font-size:12px;">원가 미입력</td></tr>`;
  const overrideCls = r.overridden ? ' pricing-price-override' : '';
  const overrideTitle = r.overridden ? ' title="정수 마진으로는 경쟁사 가격을 정확히 못 맞춰서, 마진 계산 대신 가격 자체를 경쟁사가로 강제 고정함"' : '';
  return `<tr data-t="${t}">${extraCells}
    <td class="td-thick">${t}</td>
    <td class="td-num">${fmt(r.costPerM2)}</td>
    <td class="td-num">${fmt(r.marginPerSheet)}</td>
    <td class="td-num">${fmt(r.costPerSheet)}</td>
    <td class="td-num">${fmt(r.sellPerSheet)}</td>
    <td class="td-num">${fmt(r.vatSell)}</td>
    <td class="td-highlight${overrideCls}"${overrideTitle}>${fmt(r.realPrice)}</td>
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
  const overrideCls = r.overridden ? ' pricing-price-override' : '';
  const overrideTitle = r.overridden ? ' title="정수 마진으로는 경쟁사 가격을 정확히 못 맞춰서, 마진 계산 대신 가격 자체를 경쟁사가로 강제 고정함"' : '';
  return `<tr data-t="${t}">${extraCells}
    <td class="td-thick">${t}</td>
    <td class="td-num">${fmt(r.costPerM2)}</td><td class="td-num">${fmt(r.marginPerM2)}</td><td class="td-num">${fmt(r.sellPerM2)}</td>
    <td class="td-num">${fmt(r.costPerSheet)}</td><td class="td-num">${fmt(r.sellPerSheet)}</td>
    <td class="td-highlight${overrideCls}"${overrideTitle}>${fmt(r.realPrice)}</td>
    <td class="td-diff">${badge}</td>
    <td class="td-num">${fmt(r.marginAmt)}</td><td class="td-num">${fmt(r.vat)}</td><td class="td-num">${fmt(r.commission)}</td>
    <td class="td-num">${fmt(r.netMargin)}</td>
    <td class="td-diff"><span class="pricing-rate-badge ${rateClass(r.marginRate)}">${r.marginRate}%</span></td>
  </tr>`;
}

/* "동일가로만 맞춤" 가격 오버라이드 공통 처리(2026-09-04, 아이소핑크 전용이던 걸 비드법/
   PU/PF/불연까지 확장) — 정수 마진 특성상 목표가를 정확히 못 만들 때, 마진 계산 결과
   대신 오버라이드 필드값을 실제 판매가로 쓰고 마진분석도 그 가격 기준으로 재계산한다.
   costBasis: calcSheetRow류는 costPerSheet, calcFrSheetRow는 vatCost(둘 다 "VAT 포함
   원가"로 마진액 계산의 기준이 되는 값 — 함수마다 필드명이 달라 인자로 받는다). */
function _applyPriceOverride(r, overridePrice, costBasis) {
  if (overridePrice == null || r.realPrice === overridePrice) return r;
  const marginAmt  = overridePrice - costBasis;
  const vat        = Math.round(marginAmt / 11);
  const commission = Math.round(overridePrice * 0.06);
  const netMargin  = marginAmt - vat - commission;
  const marginRate = overridePrice > 0 ? Math.round((netMargin / overridePrice) * 100) : 0;
  return { ...r, realPrice: overridePrice, marginAmt, vat, commission, netMargin, marginRate, overridden: true };
}

/* 오버라이드 필드 id — 마진 필드(_getMarginId)와 달리 PF 소형/대형처럼 마진을 공유하는
   경우에도 항상 grade(등급) 단위로 독립적으로 둔다(가격 자체를 강제하는 거라 규격별로
   달라야 함, 2026-09-04).
   2026-09-08: 아이소핑크는 특호(grade.id==='isopink')가 예전부터 써오던 iso_price_override_t{T}
   필드를 그대로 유지해야 기존 경쟁사 매칭 데이터가 안 깨진다 — 1호는 특호와 안 겹치는
   t<30 구간만 같은 필드를 같이 쓰고, 겹치는 t>=30 구간은 독립 필드(iso_price_override_1ho_t{T}). */
function _getOverrideId(tabId, grade, t) {
  if (tabId === 'isopink') {
    if (grade.id === 'isopink') return `iso_price_override_t${t}`;
    if (grade.id === '1ho') return t < 30 ? `iso_price_override_t${t}` : `iso_price_override_1ho_t${t}`;
  }
  return `${tabId}_price_override_${grade.id}_t${t}`;
}

/* ═══════════════════════════════════════
   현재 비교 이력
   "이전대비" 배지가 뭘 기준으로 비교하는지 — 기본은 지난달(이전 저장) 대비지만,
   2026-09-02 사용자 요청으로 "지금 실제로 스마트스토어/견적서에 반영중인 값(is_live)"
   대비로도 비교할 수 있게 토글을 추가함. 실제 적용가 대비 모드에서는 어떤 달을 보고
   있든(최초 로드/방금 저장/이력에서 과거 월 클릭) 항상 실제 적용가 하나만 기준으로 삼는다.
═══════════════════════════════════════ */
let _compareData = null;
let _compareMode = 'live'; // 'prev' = 이전달 저장분 대비, 'live' = 실제 적용가 대비 (2026-09-02 기본값을 live로 변경)

/* _cachedLiveCosts({label, costs:{...}, margins:{...}})를 원가 필드는 최상위로 펼치고
   마진은 .margins에 그대로 두는, 이력 row와 똑같은 모양으로 바꿔준다 — 이렇게 해야
   _isoGetCost_fromData/_getMargin 등 기존 비교 로직을 그대로 재사용할 수 있다. */
function _liveCompareRow() {
  const live = window._cachedLiveCosts;
  if (!live) return null;
  return { ...live.costs, margins: { ...live.margins }, label: live.label };
}

window.setPricingCompareMode = function(mode) {
  if (mode !== 'prev' && mode !== 'live') return;
  _compareMode = mode;
  if (mode === 'live' && !window._cachedLiveCosts && typeof showToast === 'function') {
    showToast('현재 실제 적용된 단가가 없어서 비교할 대상이 없습니다.', 'warning');
  }
  if (mode === 'live') {
    _compareData = _liveCompareRow();
  } else {
    const currentLabel = document.getElementById('cost_base_month')?.value || '';
    const prevEntry = (window._historyCache || []).find(h => h.label !== currentLabel);
    _compareData = prevEntry || null;
  }
  Object.keys(_subtabState).forEach(tabId => _recalcTab(tabId));
  renderAllInputDiff();
  _updateCompareModeUI();
};

function _updateCompareModeUI() {
  document.querySelectorAll('.pricing-compare-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === _compareMode);
  });
}

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
function _isoGetPriceOverride(t) {
  const el = document.getElementById(`iso_price_override_t${t}`);
  if (!el || el.value.trim() === '') return null;
  const v = parseFloat(el.value);
  return v > 0 ? v : null;
}

function _isoCalcRow(t) {
  // 아이소핑크는 원가가 원/mm 단위 — area=1로 처리 (기존 로직 유지)
  const cost = _isoGetCost(t);
  if (!cost) return null;
  const margin = _isoGetMargin(t);
  const mmSellPrice  = cost + margin;
  const costPerSheet = Math.round(t * cost * 1.1);
  const sellPerSheet = Math.round(t * mmSellPrice * 1.1);
  // "동일가로만 맞춤" 오버라이드(2026-09-04) — 정수 마진 특성상 경쟁사 가격을 정확히
  // 못 맞추면(autoMatchCompetitorPriceIsopink가 판단) 마진 계산과 무관하게 이 값이
  // 실제 판매가가 된다. 마진분석(마진액/부가세/수수료/순마진/마진율)도 이 가격 기준으로
  // 다시 계산 — 마진 필드(margin)는 화면에 참고용으로만 남고 실제 반영은 안 됨.
  const override = _isoGetPriceOverride(t);
  const realPrice = override ?? (Math.ceil(sellPerSheet / 100) * 100);
  const marginAmt    = realPrice - costPerSheet;
  const vat          = Math.round(marginAmt / 11);
  const commission   = Math.round(realPrice * 0.06);
  const netMargin    = marginAmt - vat - commission;
  const marginRate   = realPrice > 0 ? Math.round((netMargin / realPrice) * 100) : 0;
  // recalcPricing이 r.cost / r.margin / r.mmSellPrice 를 참조하므로 이름 맞춤
  return { t, costPerM2:cost, marginPerM2:margin, cost, margin, mmSellPrice, costPerSheet, sellPerSheet, realPrice, marginAmt, vat, commission, netMargin, marginRate, overridden: override != null };
}

/* 2026-09-08: 예전엔 여기 아이소핑크 전용 window.recalcPricing(#pricingTableBody 직접
   렌더)과 window.autoMatchCompetitorPriceIsopink가 있었다 — 아이소핑크에 1호를 추가하며
   비드법/PU/PF/불연과 똑같은 공통 엔진(_recalcTab/autoMatchCompetitorPriceGeneric)으로
   합류시키면서 삭제. window.recalcIsopink = () => _recalcTab('isopink')로 대체(아래
   _subtabState 등록 부분 참고). _isoGetCost/_isoGetMargin/_isoCalcRow 등은 특호(grade.id
   ==='isopink')의 필드 id가 그대로라 estimate.js 등 외부 소비자를 위해 안 건드리고 유지. */

function _isoGetCost_fromData(s, t) {
  const t1=s.cost_900_1800_thin1||0, t2=s.cost_900_1800_thin2||0;
  const m=s.cost_900_1800_mid||0, th=s.cost_900_1800_thick||0;
  if(t<=15) return t1; if(t<=25) return t2; if(t<=180) return m; return th;
}

/* ── 경쟁사 최저가 자동 맞춤(아이소핑크) ──────────────────────────────
   두께별로 입력돼있는 경쟁사 가격(comp1~3, pricing-competitor.js가 관리) 중 최저가를
   찾아서, 사용자가 지정한 금액만큼 더 낮은 가격이 되도록 마진을 역산해 채워넣는다.
   2026-09-02, 사용자 명시 결정: 수익 방어선(최소 마진율 등)은 일부러 안 둠 — 마진이
   음수가 나와도 그대로 적용한다. 자동저장은 안 하고 표만 다시 그려서 검토 후 기존
   [저장] 버튼(savePricingCosts)을 직접 눌러야 실제 반영됨(draft/is_live 분리 유지). */
/* 경쟁사 최저가보다 "무조건 한 단계(100원) 아래, 100원 단위로 딱 떨어지게" 목표가를 정한다.
   2026-09-02(2차): 처음엔 "얼마나 낮게 맞출지" 원 단위 버퍼를 입력받았는데, 100원 단위로
   내림 처리하다 보니 10원처럼 작은 값을 넣어도 실제 차이가 20~119원 사이로 들쭉날쭉해서
   헷갈린다는 지적 — "8,420원이든 8,500원이든 무조건 8,400원으로 맞추면 되지 않냐"는 요청으로
   버퍼 입력 자체를 없애고 이 규칙 하나로 고정함. 100원 배수와 정확히 같으면 한 단계 더 내림
   (그래야 항상 진짜로 더 싸짐 — 같은 가격은 "더 싸다"가 아니므로). */
function _competitorTarget(compPrice) {
  let target = Math.floor(compPrice / 100) * 100;
  if (target >= compPrice) target -= 100;
  return target;
}

/* 2026-09-04, 사용자 요청: 크린슐라처럼 도매업체가 아니라 제조업체로 보이는 곳은
   가격 구조상 도저히 더 낮출 수 없다(계속 따라가면 밑도 끝도 없이 내려감) — 그런
   업체는 "동일가"(그 업체 가격을 100원 단위로 내림한 값, 절대 더 낮추지 않음)까지만
   맞추고, 산일처럼 정상적으로 맞출 수 있는 업체는 기존처럼 한 단계 더 낮게(
   _competitorTarget). pricing-competitor.js의 comp{n}_match_only 플래그를 따른다. */
function _competitorTargetForSlot(compPrice, matchOnly) {
  return matchOnly ? Math.floor(compPrice / 100) * 100 : _competitorTarget(compPrice);
}

/* ── 경쟁사 최저가 자동 맞춤(아이소핑크 포함 전체 탭 공통) ──────────────────────
   2026-09-02: 아이소핑크에서만 테스트해봤던 걸 전체 탭으로 확장. 로직은 동일(수익
   방어선 없음, 자동저장 안 함) — 계산식만 탭마다 다른 실제 판매가 공식(calcSheetRow/
   calcFrSheetRow)에 맞게 역산한다. 지금 선택된 서브탭(등급)의 두께 전체를 훑는다.
   2026-09-02~09-08: PF 소형/대형, 비드법 준불연 0.9×1.8/0.6×1.2가 원가·마진 필드를
   공유하던 시절엔 여기서 "짝(sibling) 규격"까지 같이 풀어서 서로 안 깨지게 하는
   로직이 있었다. 근데 사용자가 실제로 겪어보니(크린슐라가 0.6×1.2에만 동일가로
   걸려있는데 0.9×1.8까지 같이 깎이는 문제) — 두 규격이 같은 마진을 쓰는 한 이건
   피할 수 없는 결과였다("마진 공유"의 근본적 한계). 그래서 2026-09-08에 마진
   필드 자체를 규격별로 완전히 독립시켰다(_getMarginId 참고) — 이제 sibling을
   고려할 필요가 아예 없어져서, 다시 단순한 "내 등급만" 로직으로 되돌린다. */
window.autoMatchCompetitorPriceGeneric = async function(tabId) {
  if (window.currentUser?.role !== 'admin') return;
  const gradeId = _subtabState[tabId];
  const grade   = _gradesOf(tabId).find(g => g.id === gradeId);
  if (!grade) return;
  const rows = _rowsOf(tabId, grade);

  // 2026-09-02: 두께 범위 끝쪽처럼 어떤 경쟁사도 아예 안 파는 두께는 경쟁가에 맞춰 낮출
  // 필요가 없으니, 반대로 마진을 조금 올려서 가져가고 싶다는 요청. "경쟁사가 하나도 등록
  // 안 된" 두께에만 적용 — 등록은 됐는데 전부 제외 처리된 경우는(그 업체가 실제로 팔고
  // 있다는 뜻이라) 건드리지 않는다. 0을 입력하면 기존처럼 안 건드림.
  const bumpStr = prompt('경쟁사가 아예 없는 두께는 마진을 얼마나 올릴까요? (원 단위, 예: 1000, 0=올리지 않음)', '0');
  if (bumpStr === null) return;
  const marginBump = Number(String(bumpStr).replace(/,/g, ''));
  if (!Number.isFinite(marginBump)) { if (typeof showToast === 'function') showToast('숫자를 입력해주세요.', 'warning'); return; }

  await loadCompPrices(tabId, gradeId);
  const excluded = (typeof _compExcluded === 'function') ? await _compExcluded(tabId, gradeId) : [false, false, false];
  // 제조업체 등 "동일가로만" 맞출 업체 플래그(2026-09-04, comp{n}_match_only 참고)
  const matchOnly = (typeof _compMatchOnly === 'function') ? await _compMatchOnly(tabId, gradeId) : [false, false, false];

  const isFr = tabId === 'fr';
  const priceForGrade = (g, cost, m, t) => isFr
    ? (calcFrSheetRow(cost, m, g.area)?.realPrice ?? 0)
    : Math.ceil(Math.round((cost + m) * (g.tFactor ?? t) * g.area * 1.1) / 100) * 100;
  const priceFor = (cost, m, t) => priceForGrade(grade, cost, m, t);

  // 목표가에 맞는 마진을 정수로 하나씩 찾는다(=최대한 손해를 덜 보는 선에서 목표가 달성)
  function solveMargin(g, cost, t, cappedPrice) {
    let m = isFr
      ? Math.round(cappedPrice / 1.1 - Math.round(cost * g.area))
      : Math.round(cappedPrice / ((g.tFactor ?? t) * g.area * 1.1) - cost);
    let guard = 0;
    while (priceForGrade(g, cost, m, t) > cappedPrice && guard < 200) { m--; guard++; }
    guard = 0;
    while (priceForGrade(g, cost, m + 1, t) <= cappedPrice && guard < 200) { m++; guard++; }
    return m;
  }
  // 특정 (탭,등급,두께)의 경쟁가 기준 목표가 계산 — 없으면 null. match는 comp{n}별
  // "동일가로만" 플래그(2026-09-04) — 업체별로 목표가를 따로 구해서 그중 가장 낮은 걸 쓰고,
  // 그 winner(raw가·matchOnly 여부)도 같이 돌려준다 — 나중에 오버라이드 판단에 필요.
  function targetFor(gId, t, excl, match) {
    const comp = window._compCache?.[tabId]?.[gId]?.[t] || {};
    const raw = [comp.comp1_price, comp.comp2_price, comp.comp3_price];
    const hasAny = raw.some(v => v != null && v > 0);
    const activeIdx = [0, 1, 2].filter(i => !excl[i] && raw[i] != null && raw[i] > 0);
    if (!activeIdx.length) return { hasAny, cappedPrice: null, winner: null };
    const candidates = activeIdx.map(i => ({
      raw: raw[i], matchOnly: match[i], target: _competitorTargetForSlot(raw[i], match[i]),
    }));
    candidates.sort((a, b) => a.target - b.target);
    const winner = candidates[0];
    return { hasAny, cappedPrice: winner.target, winner };
  }

  let applied = 0, skippedNoCost = 0, skippedNoComp = 0, skippedBadTarget = 0, bumped = 0, overridden = 0;

  rows.forEach(t => {
    const costId = _getCostId(tabId, grade, t);
    const cost   = costId ? fieldVal(costId) : 0;
    const overrideField = document.getElementById(_getOverrideId(tabId, grade, t));
    if (!cost) { skippedNoCost++; return; }

    const own = targetFor(gradeId, t, excluded, matchOnly);

    if (own.cappedPrice == null) {
      if (overrideField) overrideField.value = '';
      if (!own.hasAny && marginBump) {
        const marginId = _getMarginId(tabId, grade, t);
        const field = marginId ? document.getElementById(marginId) : null;
        const curMargin = (field && field.value.trim() !== '') ? parseFloat(field.value) : _getMarginFallback(tabId, grade, t);
        if (field) { field.value = curMargin + marginBump; bumped++; }
      } else {
        skippedNoComp++;
      }
      return;
    }
    if (own.cappedPrice <= 0) { skippedBadTarget++; if (overrideField) overrideField.value = ''; return; }

    const margin = solveMargin(grade, cost, t, own.cappedPrice);

    const marginId = _getMarginId(tabId, grade, t);
    const field = marginId ? document.getElementById(marginId) : null;
    if (field) { field.value = margin; applied++; }

    // 정수 마진 특성상 목표가를 정확히 못 맞추는 경우(2026-09-04 발견) — 마진 대신
    // 가격 자체를 강제 고정(아이소핑크와 동일한 로직).
    if (overrideField) {
      if (own.winner?.matchOnly) {
        const achieved = priceForGrade(grade, cost, margin, t);
        if (achieved !== own.winner.raw) { overrideField.value = own.winner.raw; overridden++; }
        else { overrideField.value = ''; }
      } else {
        overrideField.value = '';
      }
    }
  });

  // 두께 역전 보정 — 두께가 클수록 가격이 같거나 비싸야 정상인데, 특정 두께만 경쟁사에
  // 맞춰 낮추다 보면 그보다 얇은 두께가 오히려 더 비싸지는 역전이 생길 수 있다(2026-09-02,
  // 사용자 지적). 두꺼운 쪽부터 내려오면서 얇은 쪽이 더 비싸면 얇은 쪽 마진만 낮춰서 맞춘다
  // (방금 경쟁사에 맞춘 두꺼운 쪽 가격은 건드리지 않음). 지금 보고 있는 탭·등급 기준만.
  // 2026-09-02(2차): "얇은 쪽 <= 두꺼운 쪽"까지만 허용했더니 100원 단위 반올림 때문에
  // 두 두께가 정확히 같은 가격으로 붙는 경우가 자주 생겨서(모음전 옵션 엑셀에 옵션가 0으로
  // 중복 표시됨, 사용자 발견) — 얇은 쪽이 최소 100원(이 시스템 최소 가격 단위)은 더 싸도록
  // 엄격하게 바꿈.
  const MIN_STEP = 100;
  let cascadeFixed = 0;
  let ceiling = null;
  [...rows].sort((a, b) => b - a).forEach(t => {
    const costId = _getCostId(tabId, grade, t);
    const cost   = costId ? fieldVal(costId) : 0;
    if (!cost) return; // 원가 없는 두께는 체인에서 그냥 건너뜀(끊지 않음)
    // 가격이 오버라이드된 행(2026-09-04)은 마진을 건드려도 실제 표시가는 그대로라
    // 마진 조정은 건너뛰고, 이 행의 실제가(오버라이드값)를 다음 두께 비교 기준으로만 쓴다.
    const overrideField = document.getElementById(_getOverrideId(tabId, grade, t));
    const overrideVal = overrideField && overrideField.value.trim() !== '' ? parseFloat(overrideField.value) : null;
    const marginId = _getMarginId(tabId, grade, t);
    const field = marginId ? document.getElementById(marginId) : null;
    let margin = (field && field.value.trim() !== '') ? parseFloat(field.value) : _getMarginFallback(tabId, grade, t);
    let price  = overrideVal ?? priceFor(cost, margin, t);
    if (!overrideVal && ceiling != null && price > ceiling - MIN_STEP) {
      const target = ceiling - MIN_STEP;
      let m = margin, guard = 0;
      while (priceFor(cost, m, t) > target && guard < 200) { m--; guard++; }
      guard = 0;
      while (priceFor(cost, m + 1, t) <= target && guard < 200) { m++; guard++; }
      if (field) { field.value = m; cascadeFixed++; }
      margin = m;
      price  = priceFor(cost, margin, t);
    }
    ceiling = price;
  });

  const recalcFn = { isopink: window.recalcIsopink, bead: recalcBead, pu: recalcPu, pf: recalcPf, fr: recalcFr }[tabId];
  recalcFn?.();

  const parts = [`${applied}개 두께 마진 자동 조정`];
  if (overridden)        parts.push(`동일가 맞춤 중 가격 직접 고정 ${overridden}건(표에 파란색으로 표시)`);
  if (bumped)            parts.push(`경쟁없음 마진 인상 ${bumped}건`);
  if (cascadeFixed)      parts.push(`두께 역전 ${cascadeFixed}건 추가 보정`);
  if (skippedNoComp)     parts.push(`경쟁가 미입력 ${skippedNoComp}건 제외`);
  if (skippedNoCost)     parts.push(`원가 미입력 ${skippedNoCost}건 제외`);
  if (skippedBadTarget)  parts.push(`목표가 비정상 ${skippedBadTarget}건 제외`);
  if (typeof showToast === 'function') {
    showToast(parts.join(' · ') + ' — 표 확인 후 [저장]을 눌러야 반영됩니다.', applied ? 'success' : 'warning');
  }
};

/* 버튼 onclick 하나로 전체 탭 처리 — 아이소핑크는 전용 함수, 나머지는 공통 함수 */
window.autoMatchCompetitorPrice = function() {
  const tabId = window._activePricingTab || 'isopink';
  window.autoMatchCompetitorPriceGeneric(tabId);
};

/* ── 비드법 1종/2종 가격역전 보정 ──────────────────────────────────────
   2026-09-02: 같은 호수(예: 3호)끼리는 1종이 2종보다 항상 저렴해야 정상인데,
   원가/마진을 조정하다 보면 가끔 같아지거나 역전(1종이 더 비쌈)되는 경우가 생겨서,
   두께 30개 × 호수 3개를 일일이 비교하기 번거롭다는 요청으로 만듦. 사용자 결정:
   역전/동일해지면 1종 쪽 마진을 낮춰서 맞춘다(2종은 안 건드림), 기준은 "얼마나
   낮게 유지할지" 금액을 직접 입력받음(경쟁사 최저가 맞춤과 동일한 방식). */
window.fixBeadJongPriceOrder = async function() {
  if (window.currentUser?.role !== 'admin') return;
  const bufferStr = prompt('1종이 2종보다 얼마나 저렴해야 할까요? (원 단위, 예: 100)', '100');
  if (bufferStr === null) return;
  const buffer = Number(String(bufferStr).replace(/,/g, ''));
  if (!Number.isFinite(buffer)) { if (typeof showToast === 'function') showToast('숫자를 입력해주세요.', 'warning'); return; }

  // 같은 호수끼리 짝(1종 id, 2종 id) — BEAD_GRADES의 sub 필드 기준(2026-09-02)
  const PAIRS = [
    { jong1: 'ia2',  jong2: 'ia1',   ho: '3호' },
    { jong1: 'iia2', jong2: 'iia1',  ho: '2호' },
    { jong1: 'iiib', jong2: 'iiia2', ho: '1호' },
  ];
  const gradeOf = id => BEAD_GRADES.find(g => g.id === id);
  const priceFor = (grade, cost, margin, t) => calcSheetRow(cost, margin, t, grade.area).realPrice;

  let fixed = 0, alreadyOk = 0, skipped = 0, overrideLocked = 0;
  PAIRS.forEach(({ jong1, jong2 }) => {
    const g1 = gradeOf(jong1), g2 = gradeOf(jong2);
    BEAD_ROWS.forEach(t => {
      const cost1Id = _getCostId('bead', g1, t);
      const cost1   = cost1Id ? fieldVal(cost1Id) : 0;
      const price2  = _beadRealPrice(g2, t);
      if (!cost1 || price2 == null) { skipped++; return; }

      const cappedPrice = Math.floor((price2 - buffer) / 100) * 100;
      if (cappedPrice <= 0) { skipped++; return; }

      const price1 = _beadRealPrice(g1, t);
      if (price1 != null && price1 <= cappedPrice) { alreadyOk++; return; } // 이미 조건 만족

      // "동일가로만 맞춤"으로 가격이 고정된 행은 마진을 바꿔도 실제 표시가가 안 바뀌므로
      // 건드리지 않는다(2026-09-04) — 여기서 억지로 마진을 다시 계산해봤자 나중에 오버라이드가
      // 풀렸을 때 엉뚱한 값이 남는 문제가 생김. 대신 "오버라이드로 고정되어 조정 불가"로 집계.
      const overrideEl1 = document.getElementById(_getOverrideId('bead', g1, t));
      if (overrideEl1 && overrideEl1.value.trim() !== '') { overrideLocked++; return; }

      let margin = Math.round(cappedPrice / (t * g1.area * 1.1) - cost1);
      let guard = 0;
      while (priceFor(g1, cost1, margin, t) > cappedPrice && guard < 200) { margin--; guard++; }
      guard = 0;
      while (priceFor(g1, cost1, margin + 1, t) <= cappedPrice && guard < 200) { margin++; guard++; }

      const marginId = _getMarginId('bead', g1, t);
      const field = marginId ? document.getElementById(marginId) : null;
      if (field) { field.value = margin; fixed++; }
    });
  });

  recalcBead();

  const parts = [`${fixed}건 보정`];
  if (alreadyOk)       parts.push(`이미 정상 ${alreadyOk}건`);
  if (overrideLocked)  parts.push(`동일가 맞춤으로 고정되어 조정 불가 ${overrideLocked}건`);
  if (skipped)         parts.push(`계산 불가 ${skipped}건`);
  if (typeof showToast === 'function') {
    showToast(parts.join(' · ') + ' — 표 확인 후 [저장]을 눌러야 반영됩니다.', fixed ? 'success' : 'warning');
  }
};

/* ── 경질우레탄 2종1호/2종2호 가격역전 보정 ────────────────────────────
   2026-09-02: 단가표_2026-09(1).xlsx 검수 결과 경질우레탄은 0건이었지만, 비드법과
   동일한 안전장치로 요청받아 추가. 규칙: 같은 두께에서 2종1호(III-A)가 2종2호(II-A)
   보다 항상 비싸야 정상 → 위반 시 2종2호(더 저렴해야 하는 쪽) 마진을 낮춰서 맞춘다.
   PU는 등급별로 rows(두께 범위)가 달라서 두 등급이 공통으로 가진 두께만 비교한다. */
window.fixPuJongPriceOrder = async function() {
  if (window.currentUser?.role !== 'admin') return;
  const bufferStr = prompt('2종2호가 2종1호보다 얼마나 저렴해야 할까요? (원 단위, 예: 100)', '100');
  if (bufferStr === null) return;
  const buffer = Number(String(bufferStr).replace(/,/g, ''));
  if (!Number.isFinite(buffer)) { if (typeof showToast === 'function') showToast('숫자를 입력해주세요.', 'warning'); return; }

  const g1 = PU_GRADES.find(g => g.id === 'iiia'); // 2종1호 — 더 비싸야 함, 안 건드림
  const g2 = PU_GRADES.find(g => g.id === 'iia');  // 2종2호 — 더 저렴해야 함, 마진 낮춰서 맞춤
  const priceFor = (grade, cost, margin, t) => calcSheetRow(cost, margin, t, grade.area).realPrice;

  let fixed = 0, alreadyOk = 0, skipped = 0, overrideLocked = 0;
  const thicknesses = g2.rows.filter(t => g1.rows.includes(t)); // 두 등급 공통 두께만
  thicknesses.forEach(t => {
    const cost2Id = _getCostId('pu', g2, t);
    const cost2   = cost2Id ? fieldVal(cost2Id) : 0;
    const price1  = _puRealPrice(g1, t);
    if (!cost2 || price1 == null) { skipped++; return; }

    const cappedPrice = Math.floor((price1 - buffer) / 100) * 100;
    if (cappedPrice <= 0) { skipped++; return; }

    const price2 = _puRealPrice(g2, t);
    if (price2 != null && price2 <= cappedPrice) { alreadyOk++; return; } // 이미 조건 만족

    // 동일가로만 맞춤 오버라이드가 걸린 행은 마진을 바꿔도 실제 표시가가 안 바뀌므로 건드리지
    // 않는다(2026-09-04, fixBeadJongPriceOrder와 동일한 이유).
    const overrideEl2 = document.getElementById(_getOverrideId('pu', g2, t));
    if (overrideEl2 && overrideEl2.value.trim() !== '') { overrideLocked++; return; }

    let margin = Math.round(cappedPrice / (t * g2.area * 1.1) - cost2);
    let guard = 0;
    while (priceFor(g2, cost2, margin, t) > cappedPrice && guard < 200) { margin--; guard++; }
    guard = 0;
    while (priceFor(g2, cost2, margin + 1, t) <= cappedPrice && guard < 200) { margin++; guard++; }

    const marginId = _getMarginId('pu', g2, t);
    const field = marginId ? document.getElementById(marginId) : null;
    if (field) { field.value = margin; fixed++; }
  });

  recalcPu();

  const parts = [`${fixed}건 보정`];
  if (alreadyOk)      parts.push(`이미 정상 ${alreadyOk}건`);
  if (overrideLocked) parts.push(`동일가 맞춤으로 고정되어 조정 불가 ${overrideLocked}건`);
  if (skipped)        parts.push(`계산 불가 ${skipped}건`);
  if (typeof showToast === 'function') {
    showToast(parts.join(' · ') + ' — 표 확인 후 [저장]을 눌러야 반영됩니다.', fixed ? 'success' : 'warning');
  }
};

/* ── PF보드 브랜드 가격역전 보정 (LX > 국내산 > 수입산) ─────────────────
   2026-09-02: 단가표_2026-09(1).xlsx 검수 결과 소형(0.6×1.2) 규격 위주로 국내산이
   수입산보다 같거나 싸게 책정된 경우가 다수 발견되어 추가. 규칙: 같은 종류(심재
   준불연 mk접미사 'o' / 준불연 'i')·같은 규격(_s/_l)끼리 LX > 국내산 > 수입산 순서가
   유지돼야 함 → 위반 시 하위 브랜드(국내산, 수입산) 마진을 낮춰서 맞춘다.
   2026-09-08: 예전엔 소형(_s)/대형(_l)이 마진 필드를 mk 단위로 공유해서 두 규격을
   동시에 만족하는 마진 중 하나만 골라 써야 했는데(비드법 준불연에서 겪은 것과 같은
   문제 — 크린슐라가 한쪽 규격에만 걸려있으면 반대쪽까지 끌려 내려감), 이제 소형/
   대형 마진 필드가 완전히 독립적이라(_getMarginId 참고) 각자 따로 풀어서 각자의
   필드에 쓰면 된다 — 서로 영향 없음. */
function _pfSolveMargin(grade, cost, t, cappedPrice) {
  const priceFor = m => calcSheetRow(cost, m, t, grade.area).realPrice;
  let margin = Math.round(cappedPrice / (t * grade.area * 1.1) - cost);
  let guard = 0;
  while (priceFor(margin) > cappedPrice && guard < 200) { margin--; guard++; }
  guard = 0;
  while (priceFor(margin + 1) <= cappedPrice && guard < 200) { margin++; guard++; }
  return margin;
}
window.fixPfBrandPriceOrder = async function() {
  if (window.currentUser?.role !== 'admin') return;
  const bufferStr = prompt('하위 브랜드가 상위 브랜드보다 얼마나 저렴해야 할까요? (원 단위, 예: 100)', '100');
  if (bufferStr === null) return;
  const buffer = Number(String(bufferStr).replace(/,/g, ''));
  if (!Number.isFinite(buffer)) { if (typeof showToast === 'function') showToast('숫자를 입력해주세요.', 'warning'); return; }

  const gradeOf = id => PF_GRADES.find(g => g.id === id);
  let fixed = 0, alreadyOk = 0, skipped = 0, overrideLocked = 0;

  // 규격 하나(소형 또는 대형)만 독립적으로 보정 — upper/lower 같은 규격끼리 비교.
  function fixOne(upperGrade, lowerGrade, t) {
    const costLowerId = _getCostId('pf', lowerGrade, t);
    const costLower   = costLowerId ? fieldVal(costLowerId) : 0;
    const priceUpper   = _pfRealPrice(upperGrade, t);
    if (!costLower || priceUpper == null) { skipped++; return; }

    const cap = Math.floor((priceUpper - buffer) / 100) * 100;
    if (cap <= 0) { skipped++; return; }

    const priceLower = _pfRealPrice(lowerGrade, t);
    if (priceLower != null && priceLower <= cap) { alreadyOk++; return; }

    const overrideEl = document.getElementById(_getOverrideId('pf', lowerGrade, t));
    if (overrideEl && overrideEl.value.trim() !== '') { overrideLocked++; return; }

    const margin  = _pfSolveMargin(lowerGrade, costLower, t, cap);
    const marginId = _getMarginId('pf', lowerGrade, t);
    const field = marginId ? document.getElementById(marginId) : null;
    if (field) { field.value = margin; fixed++; }
  }

  const GROUPS = [['lxo', 'kdo', 'imo'], ['lxi', 'kdi', 'imi']]; // [LX, 국내산, 수입산]
  GROUPS.forEach(([lx, kd, im]) => {
    PF_ROWS.forEach(t => {
      ['s', 'l'].forEach(size => {
        const lxG = gradeOf(`${lx}_${size}`), kdG = gradeOf(`${kd}_${size}`), imG = gradeOf(`${im}_${size}`);
        if (lxG && kdG) fixOne(lxG, kdG, t); // 국내산이 LX보다 저렴하도록
        if (kdG && imG) fixOne(kdG, imG, t); // 수입산이 국내산(보정 후)보다 저렴하도록
      });
    });
  });

  recalcPf();

  const parts = [`${fixed}건 보정`];
  if (alreadyOk)      parts.push(`이미 정상 ${alreadyOk}건`);
  if (overrideLocked) parts.push(`동일가 맞춤으로 고정되어 조정 불가 ${overrideLocked}건`);
  if (skipped)         parts.push(`계산 불가 ${skipped}건`);
  if (typeof showToast === 'function') {
    showToast(parts.join(' · ') + ' — 표 확인 후 [저장]을 눌러야 반영됩니다.', fixed ? 'success' : 'warning');
  }
};

/* ═══════════════════════════════════════
   공통 엔진 — 아이소핑크 / 비드법 / 경질우레탄 / PF보드
═══════════════════════════════════════ */

/* ── 아이소핑크 등급(1호/특호) 정의 ─────────────────
   2026-09-08: 1호(전 두께 10~300T) 신설 — 특호(30~300T)와 다른 grade.id를 쓰되, 특호는
   grade.id='isopink'를 그대로 재사용한다(경쟁사가/하이라이트 DB에 이미 이 값으로 저장된
   데이터가 있어서 마이그레이션 없이 그대로 이어받기 위함). area:1인 이유는 아이소핑크
   원가가 원/m²가 아니라 원/mm 단위라, calcSheetRow(cost,margin,t,area)에서 area=1로 두면
   기존 _isoCalcRow의 t*cost*1.1 공식과 결과가 정확히 같아지기 때문(수식 검증 완료). */
const ISOPINK_GRADES = [
  { id:'1ho',    label:'Ⅱ-A',   sub:'1호', colorClass:'grade1',  rows: ISOPINK_ROWS, area:1 },
  { id:'isopink',label:'Ⅱ-B-2', sub:'특호', colorClass:'special', rows: ISOPINK_ROWS.filter(t => t >= 30), area:1 },
];
window.ISOPINK_GRADES = ISOPINK_GRADES;

/* ── 탭별 설정 레지스트리 ─────────────────
   각 상품 탭의 현재 선택 등급 ID를 보관.
   새 상품 추가 시 여기에만 항목 추가하면 됨. */
const _subtabState = { isopink: '1ho', bead: 'ia1', pu: 'ic', pf: 'lxo_s', fr: 'fr_bul' };
window._subtabState = _subtabState; // pricing-competitor.js 연동용

/* ── 상품별 grade 목록 조회 ── */
function _gradesOf(tabId) {
  if (tabId === 'isopink') return ISOPINK_GRADES;
  if (tabId === 'bead') return BEAD_GRADES;
  if (tabId === 'pu')   return PU_GRADES;
  if (tabId === 'pf')   return PF_GRADES;
  if (tabId === 'fr')   return FR_GRADES;
  return [];
}

/* ── 상품별 두께 목록 조회 ── */
function _rowsOf(tabId, grade) {
  if (tabId === 'isopink') return grade.rows;
  if (tabId === 'bead') return BEAD_ROWS;
  if (tabId === 'pu')   return grade.rows;
  if (tabId === 'pf')   return PF_ROWS;
  if (tabId === 'fr')   return grade.rows;
  return [];
}

/* ── 원가 field ID 조회 ──
   2026-09-08: 특호(grade.id==='isopink')는 두께 구간·필드 id가 예전 그대로(cost_900_1800_
   mid/thick) — 1호는 10~25T는 특호가 안 쓰던 thin1/thin2를 같이 쓰고, 특호와 겹치는
   30T~180T/185T+ 구간만 독립 필드(cost_900_1800_1ho_mid/thick)를 쓴다. */
function _getCostId(tabId, grade, t) {
  if (tabId === 'isopink') {
    if (grade.id === '1ho') {
      if (t <= 15) return 'cost_900_1800_thin1';
      if (t <= 25) return 'cost_900_1800_thin2';
      return t <= 180 ? 'cost_900_1800_1ho_mid' : 'cost_900_1800_1ho_thick';
    }
    return t <= 180 ? 'cost_900_1800_mid' : 'cost_900_1800_thick';
  }
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

/* ── 마진 field ID 조회 ──
   2026-09-08: 비드법 준불연(ib_09/ib_06)과 PF 소형/대형(mk 단위)이 예전엔 마진을
   공유해서 한쪽을 경쟁사에 맞추면 반대쪽까지 끌려가는 문제가 있었다(크린슐라가
   0.6×1.2에만 동일가로 걸려있는데 0.9×1.8까지 깎이는 걸 사용자가 발견 — "마진을
   공유하는 한 피할 수 없는 결과"임을 확인하고 분리 결정). 이제 둘 다 grade.id
   기준으로 완전히 독립된 필드를 쓴다 — 대신 "마진 편집" 모달에서는 여전히 하나로
   보여주고 입력하면 양쪽에 같은 값을 채워넣는다(_modalFieldTargets 참고, 대부분
   같은 마진을 쓸 거라는 사용자 판단). */
function _getMarginId(tabId, grade, t) {
  if (tabId === 'isopink') {
    if (grade.id === '1ho') return t < 30 ? `margin_iso_t${t}` : `margin_iso_1ho_t${t}`;
    return `margin_iso_t${t}`; // 특호, 항상 t>=30
  }
  if (tabId === 'bead') {
    const tKey = Math.min(300, Math.max(10, Math.round(t / 10) * 10));
    if (grade.id === 'ib_09' || grade.id === 'ib_06') return `bead_mj_${grade.id}_t${tKey}`;
    return `${grade.marginKey}_t${tKey}`;
  }
  if (tabId === 'pu')  return `pu_m_${grade.id}_t${t}`;
  if (tabId === 'pf')  return `pf_m_${grade.id}_t${t}`;
  if (tabId === 'fr')  return `fr_m_${grade.id}_t${t}`;
  return null;
}

/* ── 마진 기본값 조회 ── */
function _getMarginFallback(tabId, grade, t) {
  if (tabId === 'isopink') return ISO_MARGIN_DEFS[t] ?? 55;
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
  if (tabId === 'isopink') return `<td rowspan="${rowCount}" class="pricing-name-cell pricing-name-${cls}"><span class="pnc-code">${grade.label}</span><span class="pnc-cat">압출법단열재</span><span class="pnc-grade">${grade.sub}</span></td>`;
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
      let r             = calcFrSheetRow(costPerM2, marginSheet, grade.area);
      const overrideEl  = document.getElementById(_getOverrideId(tabId, grade, t));
      const overrideVal = overrideEl && overrideEl.value.trim() !== '' ? parseFloat(overrideEl.value) : null;
      if (r && overrideVal) r = _applyPriceOverride(r, overrideVal, r.vatCost);
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
    let r             = costPerM2 ? { t, ...calcSheetRow(costPerM2, marginPerM2, tEff, grade.area) } : null;
    const overrideEl  = document.getElementById(_getOverrideId(tabId, grade, t));
    const overrideVal = overrideEl && overrideEl.value.trim() !== '' ? parseFloat(overrideEl.value) : null;
    if (r && overrideVal) r = _applyPriceOverride(r, overrideVal, r.costPerSheet);
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
window.setIsopinkSubtab = (id, el) => _setSubtab('isopink', id, el);
window.setBeadSubtab = (id, el) => _setSubtab('bead', id, el);
window.setPuSubtab   = (id, el) => _setSubtab('pu',   id, el);
window.setPfSubtab   = (id, el) => _setSubtab('pf',   id, el);
window.setFrSubtab   = (id, el) => _setSubtab('fr',   id, el);
window.recalcIsopink = () => _recalcTab('isopink');
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
  // 2026-09-08: 아이소핑크도 _subtabState에 들어있어서 여기서 자동으로 같이 처리됨
  if (tabId in _subtabState) _recalcTab(tabId);
  // 앱 가격 탭
  if (tabId === 'app') initAppPriceTab();
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
    .from('pricing_costs_history').select('id, is_live')
    .eq('product_type','all').eq('label', histLabel).maybeSingle();
  if (existingHist?.id) {
    /* 이 라벨이 "실제 적용중"이었어도, 값이 바뀐 이상 지금부터는 실제 적용가와
       다른 draft가 된다 — is_live를 내려서 다시 헷갈리지 않게 한다. 실제 적용된
       값(app_product_prices/_cachedLiveCosts) 자체는 재적용 전까지 그대로 유지됨(2026-08-20). */
    await supabaseClient.from('pricing_costs_history').update({ ...histPayload, is_live: false }).eq('id', existingHist.id);
    if (existingHist.is_live && typeof showToast === 'function') {
      showToast(`"${histLabel}"은 실제 적용 중이던 값이었는데, 수정해서 적용 상태가 해제됐습니다. 다시 반영하려면 이력에서 "실제 적용"을 눌러주세요.`, 'warning');
    }
  } else {
    await supabaseClient.from('pricing_costs_history').insert(histPayload);
  }

  const now = new Date().toLocaleString('ko-KR',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const el = document.getElementById('pricingLastUpdated');
  if (el) el.textContent = '최근 저장: ' + now;
  if (typeof showToast==='function') showToast('단가표가 저장되었습니다','success');
  _viewingIdx = null;
  await loadHistoryList();
  /* 현재 label과 다른 가장 최근 이력을 직전 비교 기준으로 사용 */
  if (window._historyCache?.length) {
    const currentLabel = payload.cost_base_month || '';
    const prevEntry = window._historyCache.find(h => h.label !== currentLabel);
    _compareData = prevEntry || null;
  }
  if (_compareMode === 'live') _compareData = _liveCompareRow(); // 실제 적용가 대비 모드면 덮어씀
  renderAllInputDiff();

  /* 여기서는 이력에 스냅샷만 남긴다 — 앱가격/견적서에 실제로 반영하려면
     이력 목록에서 "실제 적용"을 별도로 눌러야 한다(2026-08-20, applyLivePrice 참고).
     저장 즉시 자동 반영하던 걸 없애서 "조정만 해봄"과 "실제 웹에 반영함"을 분리했다. */
};

/* ═══════════════════════════════════════
   앱 가격 동기화 — app_product_prices 테이블 업데이트
   단가표 저장 시 realPrice → 앱 가격 자동 반영
═══════════════════════════════════════ */
/* source = { costs: {...}, margins: {...} } — 실제 적용(applyLivePrice)으로 지정된
   이력 스냅샷의 값만 사용한다. 화면(DOM)에 지금 입력 중인 값은 절대 참조하지 않는다
   — "조정만 해보는 중"인 값이 저장 없이도 앱/견적서에 새는 것을 막기 위함(2026-08-20). */
async function syncAppProductPrices(source) {
  if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
  const costsData   = source?.costs || {};
  const marginsData = source?.margins || {};
  const cval = (id) => (id && costsData[id] != null) ? (parseFloat(costsData[id]) || 0) : 0;

  const updates = [];

  function push(product_code, price) {
    if (!product_code || !price || price <= 0) return;
    updates.push({ product_code, price });
  }

  /* 1. 아이소핑크 */
  ISOPINK_ROWS.forEach(t => {
    const cost = _isoGetCost_fromData(costsData, t);
    if (!cost) return;
    const margin = _isoGetMargin(t, marginsData);
    // "동일가로만 맞춤" 오버라이드도 margins JSON에 같이 저장돼 있으니(2026-09-04,
    // ALL_PRICE_OVERRIDE_FIELDS 참고) 여기서도 반영 — 안 그러면 화면엔 파란색으로
    // 표시된 강제 가격이 실제 앱/견적서에는 마진 계산값으로 새는 문제가 생김.
    const overrideVal = marginsData?.[`iso_price_override_t${t}`];
    const sellPerSheet = Math.round(t * (cost + margin) * 1.1);
    const realPrice = overrideVal ? overrideVal : Math.ceil(sellPerSheet / 100) * 100;
    push(`Iso_900_1800_${t}_E`, realPrice);
  });

  /* 2. 비드법단열재 */
  const BEAD_CODE_MAP = {
    'iiia2': 'St_1',
    'iia1':  'St_2',
    'ia1':   'St_3',
    'iiib':  'Neo_1',
    'iia2':  'Neo_2',
    'ia2':   'Neo_3',
  };
  // "동일가로만 맞춤" 오버라이드(2026-09-04) — margins JSON에 같이 저장돼 있으니
  // 여기서도 반영. 안 그러면 화면엔 파란색으로 보여도 실제 앱 가격엔 마진 계산값이 샘.
  const overrideFor = (tabId, grade, t) => marginsData?.[_getOverrideId(tabId, grade, t)] || null;

  BEAD_GRADES.forEach(grade => {
    const prefix = BEAD_CODE_MAP[grade.id];
    if (!prefix) return;
    BEAD_ROWS.forEach(t => {
      const costId = _getCostId('bead', grade, t);
      const cost = costId ? cval(costId) : 0;
      const margin = _getMargin('bead', grade, t, marginsData);
      const r = cost ? calcSheetRow(cost, margin, t, grade.area) : null;
      if (!r) return;
      push(`${prefix}_900_1800_${t}_E`, overrideFor('bead', grade, t) ?? r.realPrice);
    });
  });

  // 준불연 비드법
  const beadJun = BEAD_GRADES.find(g => g.id === 'ib_09');
  if (beadJun) {
    BEAD_ROWS.forEach(t => {
      const costId = _getCostId('bead', beadJun, t);
      const cost = costId ? cval(costId) : 0;
      const margin = _getMargin('bead', beadJun, t, marginsData);
      const r = cost ? calcSheetRow(cost, margin, t, beadJun.area) : null;
      if (!r) return;
      const price = overrideFor('bead', beadJun, t) ?? r.realPrice;
      push(`NeoQF_900_1800_${t}_E`, price);
      push(`NeoQF_600_1200_${t}_E`, price);
    });
  }

  /* 3. 경질우레탄 */
  const PU_CODE_MAP = {
    'ic':    'U1_3',
    'iiia':  'U2_1',
    'iia':   'U2_2',
    'id_in': 'UQ',
  };
  PU_GRADES.forEach(grade => {
    const prefix = PU_CODE_MAP[grade.id];
    if (!prefix) return;
    grade.rows.forEach(t => {
      const costId = _getCostId('pu', grade, t);
      const cost = costId ? cval(costId) : 0;
      const margin = _getMargin('pu', grade, t, marginsData);
      const tEff = grade.tFactor ?? t;
      const r = cost ? calcSheetRow(cost, margin, tEff, grade.area) : null;
      if (!r) return;
      push(`${prefix}_1000_2000_${t}_E`, overrideFor('pu', grade, t) ?? r.realPrice);
    });
  });

  /* 4. PF보드 */
  const PF_CODE_MAP = {
    'lxo_s': 'LXPF_QF_600_1200',
    'lxo_l': 'LXPF_QF_1200_2000',
    'lxi_s': 'LXPF_Q_600_1200',
    'lxi_l': 'LXPF_Q_1200_2000',
    'kdo_s': 'KRPF_QF_600_1200',
    'kdo_l': 'KRPF_QF_1200_2000',
    'kdi_s': 'KRPF_Q_600_1200',
    'kdi_l': 'KRPF_Q_1200_2000',
    'imo_l': 'IMPF_QF_1000_1200',
    'imi_l': 'IMPF_Q_1000_1200',
  };
  PF_GRADES.forEach(grade => {
    const prefix = PF_CODE_MAP[grade.id];
    if (!prefix) return;
    PF_ROWS.forEach(t => {
      const cost = cval(grade.costId);
      const margin = _getMargin('pf', grade, t, marginsData);
      const r = cost ? calcSheetRow(cost, margin, t, grade.area) : null;
      if (!r) return;
      push(`${prefix}_${t}_E`, overrideFor('pf', grade, t) ?? r.realPrice);
    });
  });

  /* 5. 미네랄울 불연단열재 */
  const frBul = FR_GRADES.find(g => g.id === 'fr_bul');
  if (frBul) {
    frBul.rows.forEach(t => {
      const costId = _getCostId('fr', frBul, t);
      const cost = costId ? cval(costId) : 0;
      const margin = _getMargin('fr', frBul, t, marginsData);
      const r = cost ? calcFrSheetRow(cost, margin, frBul.area) : null;
      if (!r) return;
      push(`HR_F_1000_1200_${t}_E`, overrideFor('fr', frBul, t) ?? r.realPrice);
    });
  }

  if (updates.length === 0) return;

  /* 기존 행만 UPDATE (INSERT 없음 — product_name NOT NULL 제약 때문) */
  let successCount = 0;
  let failCount = 0;
  await Promise.all(updates.map(async u => {
    const { error } = await supabaseClient
      .from('app_product_prices')
      .update({ price: u.price })
      .eq('product_code', u.product_code);
    if (error) failCount++;
    else successCount++;
  }));

  if (failCount > 0) {
    console.error(`앱 가격 동기화 일부 실패: 성공 ${successCount}건, 실패 ${failCount}건`);
  } else {
    console.log(`앱 가격 동기화 완료: ${successCount}건`);
  }
}

/* ═══════════════════════════════════════
   통합 로드
═══════════════════════════════════════ */
/* 2026-09-08: 비드법 준불연(ib_09/ib_06)·PF보드 소형/대형 마진 필드를 grade별로
   독립시키면서 필드 id가 바뀌었다(bead_mj_t{T} → bead_mj_ib_09_t{T}/…_ib_06_t{T},
   pf_m_{mk}_t{T} → pf_m_{gradeId}_t{T}). DB엔 예전 공유 id로 저장된 값이 이미
   있으니, 로드할 때 새 필드가 비어있으면 예전 값으로 한 번 채워준다(다음에 저장하면
   새 id로 다시 저장되니 1회성 호환용) — 안 그러면 기존에 입력해둔 마진이 화면에서
   전부 빈칸으로 보이는 것처럼 나온다. */
function _migrateLegacySharedMargins(marginsData) {
  BEAD_ROWS.forEach(t => {
    const legacy = marginsData[`bead_mj_t${t}`];
    if (legacy == null) return;
    ['ib_09', 'ib_06'].forEach(gid => {
      const newKey = `bead_mj_${gid}_t${t}`;
      if (marginsData[newKey] == null) marginsData[newKey] = legacy;
    });
  });
  PF_ROWS.forEach(t => {
    ['lxo', 'lxi', 'kdo', 'kdi', 'imo', 'imi'].forEach(mk => {
      const legacy = marginsData[`pf_m_${mk}_t${t}`];
      if (legacy == null) return;
      PF_GRADES.filter(g => g.mk === mk).forEach(g => {
        const newKey = `pf_m_${g.id}_t${t}`;
        if (marginsData[newKey] == null) marginsData[newKey] = legacy;
      });
    });
  });
}

/* 2026-09-08: 아이소핑크 1호 신설 — "가격은 특호와 동일하게" 요청에 따라, 특호와 겹치는
   30T~300T 구간의 1호 전용 필드(cost_900_1800_1ho_mid/thick, margin_iso_1ho_t{T},
   iso_price_override_1ho_t{T})가 비어있을 때만 특호의 현재 DOM 값을 복사해 1회성 기본값으로
   채워준다(DOM만 채움 — 실제 DB 저장은 사용자가 [저장]을 눌러야 반영됨). 이미 값이 있으면
   (사용자가 1호를 따로 조정해뒀거나 이전에 저장된 값이 있으면) 절대 덮어쓰지 않는다. */
function _seedIsopink1hoFromTeukho() {
  const copyIfEmpty = (fromId, toId) => {
    const to = document.getElementById(toId);
    if (!to || to.value.trim() !== '') return;
    const from = document.getElementById(fromId);
    if (from && from.value.trim() !== '') to.value = from.value;
  };
  copyIfEmpty('cost_900_1800_mid', 'cost_900_1800_1ho_mid');
  copyIfEmpty('cost_900_1800_thick', 'cost_900_1800_1ho_thick');
  ISOPINK_ROWS.filter(t => t >= 30).forEach(t => {
    copyIfEmpty(`margin_iso_t${t}`, `margin_iso_1ho_t${t}`);
    copyIfEmpty(`iso_price_override_t${t}`, `iso_price_override_1ho_t${t}`);
  });
}

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
  _migrateLegacySharedMargins(marginsData);
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
  /* 견적서 등 외부에서 원가 참조할 수 있도록 메모리 캐시 저장 — 이건 화면에 보이는
     "작업중(draft)" 값이라 견적서가 직접 참조하면 안 된다(2026-08-20). 견적서는
     반드시 _cachedLiveCosts(실제 적용가)만 봐야 하므로 별도로 갱신한다. */
  window._cachedCosts = {
    costs: Object.fromEntries(ALL_COST_FIELDS.map(f => [f, parseFloat(displayData[f] ?? data[f]) || 0])),
    margins: { ...(displayData.margins || data.margins || {}) }
  };
  _refreshLiveCostsCache();
  /* 직전 비교 기준: [0]의 다음 항목(실제 적용가 대비 모드면 그쪽으로 덮어씀) — recalc보다
     먼저 정해둬야 결과표의 "이전대비" 배지가 첫 렌더부터 바로 맞게 나온다. 예전엔 이 줄이
     recalc 호출들 뒤에 있어서, 페이지를 막 열었을 때는 배지가 전부 "—"로 비어있다가 뭔가
     한 번 더 건드려야만 채워지는 순서 문제가 있었다(2026-09-02 발견·수정). */
  _compareData = window._historyCache?.[1] || null;
  if (_compareMode === 'live') _compareData = _liveCompareRow();
  _seedIsopink1hoFromTeukho();
  // 2026-09-08: 아이소핑크(1호/특호)도 이제 _subtabState에 들어있어서 이 반복문 하나로 처리됨
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
  renderAllInputDiff();
  _updateCompareModeUI();
}

/* ═══════════════════════════════════════
   이력 목록 & 조회
═══════════════════════════════════════ */
let _viewingIdx = null;

async function loadHistoryList() {
  if (typeof supabaseClient==='undefined'||!supabaseClient) return;
  const { data, error } = await supabaseClient.from('pricing_costs_history').select('*')
    .eq('product_type','all').order('label',{ascending:false}).limit(30);
  if (error) {
    console.error('단가 이력 조회 실패:', error);
    if (typeof showToast === 'function') showToast('단가 이력을 불러오지 못했습니다.', 'error');
    return;
  }
  /* listEl 존재 여부와 관계없이 캐시는 항상 갱신 */
  window._historyCache = (data && data.length > 0) ? data : [];
  _refreshLiveCostsCache();
  const listEl = document.getElementById('pricingHistoryList');
  if (!listEl) return;
  if (!data||data.length===0) { listEl.innerHTML = '<div class="pricing-history-empty">저장된 이력이 없습니다</div>'; return; }
  renderHistoryList();
}

/* ── 실제 적용가(is_live) 캐시/배지 ─────────────────────────
   견적서(estimate.js)는 이 캐시(_cachedLiveCosts)만 참조해야 한다 — 화면에 지금
   입력 중인 값이나 저장만 해둔 값(_cachedCosts, 즉 draft)은 절대 보면 안 된다.
   "실제 적용"으로 지정된 이력 하나만 여기 반영된다(2026-08-20). */
function _refreshLiveCostsCache() {
  const liveRow = (window._historyCache || []).find(h => h.is_live);
  const margins = { ...(liveRow?.margins || {}) };
  // 2026-09-08: "실제 적용" 이력이 마진 필드 분리 이전에 저장됐을 수 있다 — 앱 가격/
  // 견적서가 참조하는 캐시라 여기서도 예전 공유 id를 새 id로 옮겨줘야 한다(안 그러면
  // PF·비드법 준불연 실제 판매가가 기본값으로 조용히 되돌아감).
  _migrateLegacySharedMargins(margins);
  window._cachedLiveCosts = liveRow ? {
    label: liveRow.label,
    costs: Object.fromEntries(ALL_COST_FIELDS.map(f => [f, parseFloat(liveRow[f]) || 0])),
    margins
  } : null;
  _updateLiveBadge();
}

function _updateLiveBadge() {
  const badge = document.getElementById('pricingLiveBadge');
  if (!badge) return;
  const liveLabel  = window._cachedLiveCosts?.label;
  const shownLabel = document.getElementById('cost_base_month')?.value || '';
  if (!liveLabel) {
    badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 실제 적용가 미지정';
    badge.className = 'pricing-live-badge warn';
  } else if (shownLabel && shownLabel !== liveLabel) {
    badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 실제 적용가: ${escapeAdminHtml(liveLabel)} (지금 화면과 다름)`;
    badge.className = 'pricing-live-badge warn';
  } else {
    badge.innerHTML = `<i class="fa-solid fa-check"></i> 실제 적용가: ${escapeAdminHtml(liveLabel)}`;
    badge.className = 'pricing-live-badge ok';
  }
}

function renderHistoryList() {
  const listEl = document.getElementById('pricingHistoryList');
  const data = window._historyCache;
  if (!listEl||!data) return;
  // 2026-09-02: 날짜 글자(.phi-label) 클릭해야만 조회되던 걸, 박스(.pricing-history-item)
  // 어디를 눌러도 조회되도록 onclick을 바깥으로 옮김 — "실제 적용" 버튼의
  // event.stopPropagation()은 이걸 염두에 두고 이미 있던 코드라 그대로 맞물림.
  listEl.innerHTML = data.map((row,idx) => `
    <div class="pricing-history-item${_viewingIdx===idx?' selected':''}" onclick="viewHistory(${idx})">
      <div class="phi-left">
        <span class="phi-label">${escapeAdminHtml(row.label || '-')}</span>
        ${idx===0?'<span class="phi-badge phi-badge-latest">최신</span>':''}
        ${_viewingIdx===idx?'<span class="phi-badge phi-badge-viewing">조회중</span>':''}
      </div>
      ${row.is_live
        ? '<span class="phi-badge phi-badge-live"><i class="fa-solid fa-check"></i> 적용중</span>'
        : `<button type="button" class="phi-apply-btn" onclick="event.stopPropagation(); applyLivePrice(${idx})">실제 적용</button>`}
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
  _migrateLegacySharedMargins(rowMargins); // 2026-09-08: 예전 이력엔 공유 id로 저장돼있음
  ALL_MARGIN_FIELDS.forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = rowMargins[f] != null ? rowMargins[f] : '';
  });
  const mEl = document.getElementById('cost_base_month');
  if (mEl) { mEl.value = row.label||''; syncBaseMonth(row.label||''); }
  _compareData = data[idx+1]||null;
  if (_compareMode === 'live') _compareData = _liveCompareRow();
  _viewingIdx  = idx;
  const btn = document.getElementById('pricingHistoryBtn');
  if (btn) {
    if (idx===0) {
      btn.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> 이력 <i class="fa-solid fa-chevron-down" style="font-size:10px;margin-left:2px;"></i>`;
      btn.classList.remove('active');
    } else {
      btn.innerHTML = `<i class="fa-solid fa-calendar-days"></i> ${escapeAdminHtml(row.label || '-')} <i class="fa-solid fa-chevron-down" style="font-size:10px;margin-left:2px;"></i>`;
      btn.classList.add('active');
    }
  }
  closeHistoryDropdown();
  renderHistoryList();
  // 2026-09-08: 이 이력이 1호 신설 이전에 저장됐다면 1호 전용 필드가 비어있을 테니,
  // 특호 값으로 한 번 채워준다(로드 때와 동일한 기본값 규칙).
  _seedIsopink1hoFromTeukho();
  Object.keys(_subtabState).forEach(tabId => _recalcTab(tabId));
  renderAllInputDiff();
  _updateLiveBadge();
  _updateCompareModeUI();
};

/* ── 실제 적용 지정 — 이력 스냅샷 하나를 "웹/앱에 실제 반영된 값"으로 확정한다.
   저장(savePricingCosts)만으로는 여기까지 안 오므로, 조정만 해보고 아직 실제로는
   반영 안 한 값이 견적서로 새는 문제를 막는다(2026-08-20). ── */
window.applyLivePrice = async function(idx) {
  const data = window._historyCache;
  if (!data || !data[idx]) return;
  const row = data[idx];
  if (row.is_live) return;
  if (!confirm(`"${row.label}" 단가를 실제 적용가로 지정하시겠습니까?\n앱 가격과 견적서에 이 값이 바로 반영됩니다.`)) return;

  const { error: e1 } = await supabaseClient.from('pricing_costs_history')
    .update({ is_live: false }).eq('product_type', 'all').eq('is_live', true);
  if (e1) { if (typeof showToast==='function') showToast('적용 실패: '+e1.message, 'error'); return; }
  const { error: e2 } = await supabaseClient.from('pricing_costs_history')
    .update({ is_live: true }).eq('id', row.id);
  if (e2) { if (typeof showToast==='function') showToast('적용 실패: '+e2.message, 'error'); return; }

  await syncAppProductPrices({ costs: row, margins: row.margins || {} });
  await loadHistoryList();
  if (typeof showToast==='function') showToast(`"${row.label}" 단가가 실제 적용가로 지정되었습니다.`, 'success');
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
/* 2026-09-08: 아이소핑크 1호 신설 — 1호(10~300T)/특호(30~300T) 두 등급이 이제 완전히
   독립된 마진 필드를 쓰므로(_getMarginId 참고), PU 모달처럼 두 컬럼으로 나란히 보여준다.
   특호가 없는 10T~25T 구간은 "—"로 표시. */
function buildIsopinkModalBody() {
  const g1ho  = ISOPINK_GRADES.find(g => g.id === '1ho');
  const gTeuk = ISOPINK_GRADES.find(g => g.id === 'isopink');
  let html = `<div class="pim-section-title">아이소핑크 — 두께별 마진 (원/mm)</div>
    <div class="pim-margin-hint">각 두께마다 개별 마진을 설정합니다. 비어있으면 기본값이 사용됩니다. — 는 해당 등급에 없는 두께입니다.</div>
    <div class="pim-table-scroll-wrap">
    <table class="pim-table pim-margin-only-table" style="min-width:420px">
      <thead><tr>
        <th style="width:64px">두께</th>
        <th class="pim-th-margin" style="width:90px">1호</th><th class="pim-th-diff">이전대비</th>
        <th class="pim-th-margin" style="width:90px">특호</th><th class="pim-th-diff">이전대비</th>
      </tr></thead><tbody>`;
  ISOPINK_ROWS.forEach(t => {
    html += `<tr><td class="pim-td-t">${t}T</td>`;
    const id1 = _getMarginId('isopink', g1ho, t);
    html += `<td><input type="text" inputmode="numeric" id="${_pimId(id1)}" class="pim-input pim-input-margin" placeholder="${ISO_MARGIN_DEFS[t]??55}" value="${_realVal(id1)}" style="width:74px"></td>
      <td class="pim-td-diff" id="pimdiff_${id1}"><span class="pcut-diff-empty">—</span></td>`;
    if (t < 30) {
      html += `<td class="pim-td-na">—</td><td class="pim-td-na pim-td-diff-na"></td>`;
    } else {
      const id2 = _getMarginId('isopink', gTeuk, t);
      html += `<td><input type="text" inputmode="numeric" id="${_pimId(id2)}" class="pim-input pim-input-margin" placeholder="${ISO_MARGIN_DEFS[t]??55}" value="${_realVal(id2)}" style="width:74px"></td>
        <td class="pim-td-diff" id="pimdiff_${id2}"><span class="pcut-diff-empty">—</span></td>`;
    }
    html += `</tr>`;
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
      // 준불연은 대표(가상) id라 실제 값은 첫 번째 실 필드(ib_09)에서 읽어온다(2026-09-08).
      const realId = _modalFieldTargets('bead', fieldId)[0];
      const fb = BEAD_MARGIN_FALLBACK[realId] ?? 0;
      html += `<td><input type="text" inputmode="numeric" id="${_pimId(fieldId)}" class="pim-input pim-input-margin" placeholder="${fb}" value="${_realVal(realId)}" style="width:58px"></td>
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
      const id = `pf_m_${g.mk}_t${t}`; // 대표(가상) id
      // 소형/대형 마진이 독립 필드라(2026-09-08) 실제 값은 첫 번째(소형)에서 읽어온다.
      const realId = _modalFieldTargets('pf', id)[0];
      html += `<td><input type="text" inputmode="numeric" id="${_pimId(id)}" class="pim-input pim-input-margin" placeholder="${PF_FB[g.mk]?.[t]??35}" value="${_realVal(realId)}"></td>
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

/* ── 모달 이전대비 diff ──
   compareFieldId: 2026-09-08 — 비드법 준불연/PF 소형·대형처럼 모달의 대표(가상)
   fieldId가 실제 저장 필드와 다른 경우, 비교에 쓸 진짜 필드 id를 따로 받는다
   (안 주면 fieldId 그대로 사용 — 기존 1:1 타입은 동작 그대로). */
function _renderPimDiff(el, fieldId, fallback, compareFieldId) {
  if (!el) return;
  const inputEl = document.getElementById(_pimId(fieldId));
  const curr = parseFloat(inputEl?.value) || parseFloat(inputEl?.placeholder) || fallback || 0;
  const cmpId = compareFieldId || fieldId;
  /* 마진 필드는 _compareData.margins 에서, 원가 필드는 직접 */
  const prevRaw = ALL_MARGIN_FIELDS.includes(cmpId)
    ? (_compareData?.margins?.[cmpId])
    : (_compareData?.[cmpId]);
  const prev = prevRaw!=null ? parseFloat(prevRaw) : fallback;
  if (prev==null||(curr===0&&prev===0)) { el.innerHTML='<span class="pcut-diff-empty">—</span>'; return; }
  const diff = curr - prev;
  if (diff===0) { el.innerHTML='<span class="pcut-diff-same">±0</span>'; return; }
  const sign = diff>0?'+':'';
  el.innerHTML = `<span class="pricing-diff-badge ${diff>0?'up':'down'}">${sign}${Number(diff).toLocaleString('ko-KR')}</span>`;
}


/* ── 타입별 마진 fieldId 목록 ──
   2026-09-08: 여기 나오는 bead_mj_t{T} / pf_m_{mk}_t{T}는 이제 "대표(가상) id"다 —
   실제 DOM 필드는 규격별로 분리됐지만(_getMarginId 참고), "마진 편집" 모달에는
   여전히 하나로 보여주고 싶다는 요청(어차피 대부분 같은 값을 쓸 거라서) —
   _modalFieldTargets()가 이 대표 id 하나를 실제 필드 여러 개로 풀어준다. */
function _modalMarginFields(type) {
  // 2026-09-08: 1호/특호가 이제 완전히 독립된 필드라 두 등급 것 전부 나열(가상 id 아님)
  if (type === 'isopink') return ISOPINK_GRADES.flatMap(g => g.rows.map(t => _getMarginId('isopink', g, t)));
  if (type === 'bead')    return BEAD_ROWS.flatMap(t => [`bead_m2_3_t${t}`,`bead_m2_2_t${t}`,`bead_m2_1_t${t}`,`bead_m1_3_t${t}`,`bead_m1_2_t${t}`,`bead_m1_1_t${t}`,`bead_mj_t${t}`]);
  if (type === 'pu')      return [...new Set(PU_GRADES.flatMap(g => g.rows.map(t => `pu_m_${g.id}_t${t}`)))];
  if (type === 'pf')      return PF_ROWS.flatMap(t => ['lxo','lxi','kdo','kdi','imo','imi'].map(mk => `pf_m_${mk}_t${t}`));
  if (type === 'fr')      return FR_GRADES.flatMap(g => g.rows.map(t => `fr_m_${g.id}_t${t}`));
  return [];
}

/* "마진 편집" 모달의 대표(가상) 필드 id 하나가 실제로 반영해야 할 진짜 필드 목록.
   기본은 1:1이지만, 비드법 준불연(ib_09/ib_06)과 PF 소형/대형(_s/_l)처럼 화면엔
   하나로 보여주되 실제 저장은 독립적인 경우 여기서 묶는다(2026-09-08). */
function _modalFieldTargets(type, repId) {
  if (type === 'bead') {
    const m = repId.match(/^bead_mj_t(\d+)$/);
    if (m) return [`bead_mj_ib_09_t${m[1]}`, `bead_mj_ib_06_t${m[1]}`];
  }
  if (type === 'pf') {
    const m = repId.match(/^pf_m_([^_]+)_t(\d+)$/);
    if (m) return [`pf_m_${m[1]}_s_t${m[2]}`, `pf_m_${m[1]}_l_t${m[2]}`];
  }
  return [repId];
}

function renderModalDiff(type) {
  if (!_compareData) return;
  _modalMarginFields(type).forEach(id => {
    const el = document.getElementById('pimdiff_' + id);
    if (!el) return;
    // 기본값: isopink는 ISO_MARGIN_DEFS, 나머지는 _getMarginFallback 활용
    let fb = 0;
    if (type === 'isopink') {
      // margin_iso_t{T} / margin_iso_1ho_t{T} 둘 다 매칭되도록 끝의 _t(\d+)만 뽑는다
      const m = id.match(/_t(\d+)$/);
      fb = m ? (ISO_MARGIN_DEFS[+m[1]] ?? 55) : 55;
    } else if (type === 'bead') {
      fb = BEAD_MARGIN_FALLBACK[_modalFieldTargets('bead', id)[0]] ?? 0;
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
    _renderPimDiff(el, id, fb, _modalFieldTargets(type, id)[0]);
  });
}

/* ── 모달 닫기 / 확인 ── */
window.closePricingModal = function() {
  document.getElementById('pricingInputModal').style.display = 'none';
  _pimType = null;
};
window.confirmPricingModal = function() {
  if (!_pimType) return;
  // 2026-09-08: 대표(가상) 필드 하나가 실제로는 여러 필드(비드법 준불연/PF 소형·대형)에
  // 반영돼야 할 수 있어서 _modalFieldTargets로 풀어서 전부 써준다.
  _modalMarginFields(_pimType).forEach(id => {
    const modalEl = document.getElementById(_pimId(id));
    if (!modalEl) return;
    _modalFieldTargets(_pimType, id).forEach(realId => {
      const realEl = document.getElementById(realId);
      if (realEl) realEl.value = modalEl.value;
    });
  });
  const recalc = { isopink: window.recalcIsopink, bead: recalcBead, pu: recalcPu, pf: recalcPf, fr: recalcFr };
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
      <button class="pricing-margin-edit-btn" onclick="autoMatchCompetitorPrice()" title="두께별 경쟁사 최저가보다 100원 단위로 한 단계 낮게 마진을 맞추고, 그로 인한 두께 역전도 같이 보정합니다. 경쟁사가 아예 없는 두께는 원하면 마진을 올릴 수도 있습니다(아이소핑크/비드법/PU/PF는 지금 선택된 등급 기준)">
        <i class="fa-solid fa-bolt"></i> 경쟁사 최저가 맞춤
      </button>
      ${tabId === 'bead' ? `<button class="pricing-margin-edit-btn" onclick="fixBeadJongPriceOrder()" title="같은 호수끼리 1종이 2종보다 비싸지거나 같아진 경우, 1종 마진을 낮춰서 항상 더 저렴하게 자동 보정합니다">
        <i class="fa-solid fa-arrow-down-wide-short"></i> 1종·2종 가격역전 보정
      </button>` : ''}
      ${tabId === 'pu' ? `<button class="pricing-margin-edit-btn" onclick="fixPuJongPriceOrder()" title="2종1호가 2종2호보다 비싸지거나 같아진 경우, 2종2호 마진을 낮춰서 항상 더 저렴하게 자동 보정합니다">
        <i class="fa-solid fa-arrow-down-wide-short"></i> 2종1호·2종2호 가격역전 보정
      </button>` : ''}
      ${tabId === 'pf' ? `<button class="pricing-margin-edit-btn" onclick="fixPfBrandPriceOrder()" title="같은 종류(심재준불연/준불연)·같은 규격끼리 LX > 국내산 > 수입산 순서가 무너진 경우, 하위 브랜드 마진을 낮춰서 자동 보정합니다">
        <i class="fa-solid fa-arrow-down-wide-short"></i> 브랜드 가격역전 보정
      </button>` : ''}
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
  // 2026-09-08: 1호(10~300T) 신설 — 특호와 겹치는 30T~180T/185T+ 구간은 독립 원가 필드
  // (cost_900_1800_1ho_mid/thick), 안 겹치는 10T~25T는 특호도 안 쓰던 thin1/thin2를 같이 씀.
  const costTableHtml = `
    <table class="pricing-cost-unified-table">
      <colgroup><col style="width:150px"><col style="width:140px"><col style="width:155px"><col style="width:80px"></colgroup>
      <thead><tr><th>품명</th><th>두께 구간</th><th>원가 (원/mm)<br><span class="pricing-th-tiny" style="font-weight:400;color:#94a3b8">= 원/m² ÷ 두께(mm)</span></th><th class="pricing-col-diff">이전대비</th></tr></thead>
      <tbody>
        <tr class="pcut-grade-row">
          <td rowspan="4" class="pcut-name-cell pcut-grade1">Ⅱ-A<br><span class="pcut-name-sub">압출법 단열재<br>(1호)</span></td>
          <td><span class="pricing-range-label">10T ~ 15T</span></td>
          <td><input type="text" inputmode="numeric" id="cost_900_1800_thin1" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcIsopink()"></td>
          <td class="pcut-diff-cell" id="diff_cost_900_1800_thin1"><span class="pcut-diff-empty">—</span></td>
        </tr><tr>
          <td><span class="pricing-range-label">20T ~ 25T</span></td>
          <td><input type="text" inputmode="numeric" id="cost_900_1800_thin2" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcIsopink()"></td>
          <td class="pcut-diff-cell" id="diff_cost_900_1800_thin2"><span class="pcut-diff-empty">—</span></td>
        </tr><tr>
          <td><span class="pricing-range-label">30T ~ 180T</span></td>
          <td><input type="text" inputmode="numeric" id="cost_900_1800_1ho_mid" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcIsopink()"></td>
          <td class="pcut-diff-cell" id="diff_cost_900_1800_1ho_mid"><span class="pcut-diff-empty">—</span></td>
        </tr><tr>
          <td><span class="pricing-range-label">185T 이상</span></td>
          <td><input type="text" inputmode="numeric" id="cost_900_1800_1ho_thick" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcIsopink()"></td>
          <td class="pcut-diff-cell" id="diff_cost_900_1800_1ho_thick"><span class="pcut-diff-empty">—</span></td>
        </tr>
        <tr class="pcut-grade-row">
          <td rowspan="2" class="pcut-name-cell pcut-special">Ⅱ-B-2<br><span class="pcut-name-sub">압출법 단열재<br>(특호)</span></td>
          <td><span class="pricing-range-label">30T ~ 180T</span></td>
          <td><input type="text" inputmode="numeric" id="cost_900_1800_mid" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcIsopink()"></td>
          <td class="pcut-diff-cell" id="diff_cost_900_1800_mid"><span class="pcut-diff-empty">—</span></td>
        </tr><tr>
          <td><span class="pricing-range-label">185T 이상</span></td>
          <td><input type="text" inputmode="numeric" id="cost_900_1800_thick" class="pricing-input-field pcut-cost-field" placeholder="0" oninput="recalcIsopink()"></td>
          <td class="pcut-diff-cell" id="diff_cost_900_1800_thick"><span class="pcut-diff-empty">—</span></td>
        </tr>
      </tbody>
    </table>`;
  const marginIds   = ISOPINK_GRADES.flatMap(g => g.rows.map(t => _getMarginId('isopink', g, t)));
  const overrideIds = ISOPINK_GRADES.flatMap(g => g.rows.map(t => _getOverrideId('isopink', g, t)));
  const hiddenHtml = _hiddenFields(marginIds, 'recalcIsopink') + _hiddenFields(overrideIds, 'recalcIsopink');
  const subtabBar = `<div class="bead-subtab-bar">
    ${ISOPINK_GRADES.map((g,i)=>`<button class="bead-subtab isopink-subtab${i===0?' active':''}" onclick="setIsopinkSubtab('${g.id}',this)">${g.label}<span class="bead-subtab-sub">${g.sub}</span></button>`).join('')}
  </div>`;
  const resultTableHtml = `<table class="pricing-table">
    <colgroup>
      <col style="width:110px"><col style="width:60px"><col style="width:72px"><col style="width:55px"><col style="width:72px">
      <col style="width:90px"><col style="width:90px"><col style="width:90px"><col style="width:72px">
      <col style="width:85px"><col style="width:72px"><col style="width:70px"><col style="width:70px"><col style="width:70px">
    </colgroup>
    ${_resultThead(['품명'], 'mm')}
    <tbody id="isopinkTableBody"></tbody>
  </table>`;
  document.getElementById('pricing-tab-isopink').innerHTML =
    _costCard('isopink','isopink','매월 업체 고지 단가 기준으로 변경된 항목만 수정하세요', costTableHtml, hiddenHtml) +
    _resultCard('아이소핑크 단가표','규격: 900×1800mm', subtabBar, resultTableHtml);
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
  const hiddenHtml = _hiddenFields(BEAD_ROWS.flatMap(t=>[`bead_m2_3_t${t}`,`bead_m2_2_t${t}`,`bead_m2_1_t${t}`,`bead_m1_3_t${t}`,`bead_m1_2_t${t}`,`bead_m1_1_t${t}`,`bead_mj_ib_09_t${t}`,`bead_mj_ib_06_t${t}`]),'recalcBead')
    + _hiddenFields(BEAD_GRADES.flatMap(g => BEAD_ROWS.map(t => _getOverrideId('bead', g, t))), 'recalcBead');
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
  const puOverrideIds = PU_GRADES.flatMap(g => g.rows.map(t => _getOverrideId('pu', g, t)));
  document.getElementById('pricing-tab-pu').innerHTML =
    _costCard('pu','pu','품종별 m²당 원가를 입력하세요', `<div class="pu-cost-tables-row">${gradeTables}</div>`, _hiddenFields(hiddenIds,'recalcPu') + _hiddenFields(puOverrideIds,'recalcPu')) +
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
  const hiddenHtml = _hiddenFields(PF_GRADES.flatMap(g => PF_ROWS.map(t => _getMarginId('pf', g, t))),'recalcPf')
    + _hiddenFields(PF_GRADES.flatMap(g => PF_ROWS.map(t => _getOverrideId('pf', g, t))), 'recalcPf');
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
  ) + _hiddenFields(
    FR_GRADES.flatMap(g => g.rows.map(t => _getOverrideId('fr', g, t))), 'recalcFr'
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
   회사 선택 (에너가드컴퍼니 / 한국단열 / 앱가격)
   업무노트의 일반노트/프로젝트 .store-chips 드롭박스와 같은 패턴(2026-08-18).
   한국단열은 아직 자체 단가 데이터가 없어 "준비중" 안내만 보여준다.
═══════════════════════════════════════ */
const PRICING_COMPANY_LABELS = { energuard: '에너가드컴퍼니', hkd: '한국단열', app: '앱가격' };
let _lastEnerguardTab = 'isopink';

document.addEventListener('click', (e) => {
    const chips = document.getElementById('pricingCompanyChips');
    if (!chips) return;
    if (e.target.closest('[data-action="toggle-pricing-company-menu"]')) {
        chips.classList.toggle('open');
        return;
    }
    const option = e.target.closest('[data-pricing-company]');
    if (option) {
        chips.classList.remove('open');
        setPricingCompany(option.dataset.pricingCompany);
        return;
    }
    if (!e.target.closest('#pricingCompanyChips')) chips.classList.remove('open');
});

window.setPricingCompany = function(company) {
    const label = document.getElementById('pricingCompanyLabel');
    if (label) label.textContent = PRICING_COMPANY_LABELS[company] || company;
    document.querySelectorAll('#pricingCompanyChips [data-pricing-company]').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.pricingCompany === company);
    });

    const tabsBar    = document.getElementById('pricingTabsBar');
    const comingSoon = document.getElementById('pricingComingSoon');
    const bodyWrap   = document.getElementById('pricingBodyWrap');
    const headerRight = document.getElementById('pricingHeaderRight');
    const appHeaderRight = document.getElementById('pricingAppHeaderRight');
    // 한국단열 전용 영역(js/pricing-hankook.js) — 에너가드컴퍼니 영역과 완전히 분리되어
    // 별도 탭바/바디를 가진다(2026-09-04, 그 전까지는 "준비중" 안내만 있었음).
    const hkTabsBar  = document.getElementById('hkPricingTabsBar');
    const hkBodyWrap = document.getElementById('hkPricingBodyWrap');

    comingSoon.style.display = 'none'; // 더 이상 안 씀, 하위호환으로만 유지

    if (company === 'hkd') {
        tabsBar.style.display = 'none';
        bodyWrap.style.display = 'none';
        headerRight.style.display = 'none';
        appHeaderRight.style.display = 'none';
        if (hkTabsBar)  hkTabsBar.style.display = '';
        if (hkBodyWrap) hkBodyWrap.style.display = '';
        return;
    }

    if (hkTabsBar)  hkTabsBar.style.display = 'none';
    if (hkBodyWrap) hkBodyWrap.style.display = 'none';
    bodyWrap.style.display = '';

    if (company === 'app') {
        tabsBar.style.display = 'none';
        headerRight.style.display = 'none';
        appHeaderRight.style.display = 'flex';
        setPricingTab('app', null);
    } else {
        tabsBar.style.display = '';
        headerRight.style.display = '';
        appHeaderRight.style.display = 'none';
        setPricingTab(_lastEnerguardTab, document.querySelector(`.pricing-tab[onclick*="'${_lastEnerguardTab}'"]`));
    }
};

// setPricingTab이 material 탭(아이소핑크 등)으로 이동할 때마다 "마지막 선택"을 기억해둔다 —
// 앱가격에서 에너가드컴퍼니로 돌아올 때 그 탭으로 복귀시키기 위함.
const _origSetPricingTab = window.setPricingTab;
window.setPricingTab = function(tabId, el) {
    _origSetPricingTab(tabId, el);
    if (tabId !== 'app') _lastEnerguardTab = tabId;
};
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

async function _doExport() {
  /* 엑셀 저장 전 모든 탭/등급 경쟁사 데이터 병렬 로드 */
  if (typeof loadCompPrices === 'function') {
    const loadTasks = [
      loadCompPrices('isopink', 'isopink'),
      ...BEAD_GRADES.map(g => loadCompPrices('bead', g.id)),
      ...PU_GRADES.map(g => loadCompPrices('pu', g.id)),
      ...PF_GRADES.map(g => loadCompPrices('pf', g.id)),
      ...FR_GRADES.map(g => loadCompPrices('fr', g.id)),
    ];
    await Promise.all(loadTasks);
  }

  /* 2026-09-02: 헤더의 경쟁사 이름(크린슐라/산일상사/대유물류)이 localStorage에 저장된
     낡은 값(_compExportNames)을 쓰고 있어서, 화면에서 "이름 변경"으로 실제 DB(competitor_names)
     에 저장한 이름(예: 대유물류→바로상사)이 엑셀에는 반영이 안 되던 버그를 고쳤었다.
     2026-09-04(2차): 근데 그 수정도 반쪽짜리였다 — "지금 화면에 보이는 탭 하나"의
     이름을 5개 시트(아이소핑크/비드법/PU/PF/불연) 전부에 그대로 재사용하고 있어서,
     예를 들어 비드법 탭을 보다가 엑셀저장을 누르면 아이소핑크 시트 헤더에도 비드법의
     이름이 찍혔다(사용자가 "아이소핑크에 아직도 대유물류로 나온다"고 재차 지적해서
     발견 — DB엔 이미 바로상사로 정확히 저장돼 있었음). 이제 탭마다 실제 이름을 각각
     따로 불러와서 그 탭의 시트에만 쓴다 — 서브탭(등급)별로 다를 수도 있지만(2026-09-02
     마이그레이션 때 등급별로 분리해뒀음) 시트 하나엔 여러 등급이 섞여 있어 전부
     다르게 낼 수는 없으므로, 각 탭의 "대표 등급"(등급별 분리 마이그레이션 때 옮겨둔
     기본값) 기준으로 통일한다. */
  const TAB_REP_GRADE = { isopink: 'isopink', bead: 'ia1', pu: 'ic', pf: 'lxo_s', fr: 'fr_bul' };
  const compNamesByTab = {};
  for (const tab of Object.keys(TAB_REP_GRADE)) {
    let names = ['크린슐라', '산일상사', '대유물류'];
    if (typeof _compMeta === 'function') {
      try {
        const meta = await _compMeta(tab, TAB_REP_GRADE[tab]);
        if (meta?.names?.length === 3) names = meta.names;
      } catch (_) { /* 조회 실패 시 기본값 유지 */ }
    }
    compNamesByTab[tab] = names;
  }
  function _compHeaderCellsFor(tabId) {
    return compNamesByTab[tabId].flatMap(n => [`${n} 단가`, `${n} 차이`, `${n} 링크`]);
  }
  function _commonHeaderFor(tabId) {
    return ['품명', '두께(mm)', '규격(m²당원가)', '장당마진', 'm²당판매가',
      '장당원가(VAT미포함)', '장당판매가(VAT미포함)', '최종판매가(VAT포함)', '마진금액', '부가세', '수수료6%', '순수마진', '마진율(%)',
      ..._compHeaderCellsFor(tabId)];
  }

  const wb = XLSX.utils.book_new();
  const baseMonth = document.getElementById('cost_base_month')?.value || '';
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}`;

  // ── 헤더 스타일 공통 ──
  const H = (v) => ({ v, t:'s' });

  // ── 숫자 셀 ──
  const N = (v) => v != null && v !== '' && !isNaN(v) ? { v: Number(v), t:'n' } : { v: '-', t:'s' };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. 아이소핑크
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  (function buildIsopink() {
    const rows = [
      ['아이소핑크 단가표', '', '', '', '', '', '', '', '', '', '', '', ''],
      [`기준월: ${baseMonth || dateStr}`, '', '', '', '', '', '', '', '', '', '', '', ''],
      [],
      _commonHeaderFor('isopink'),
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
      _commonHeaderFor('bead'),
    ];
    BEAD_GRADES.forEach(grade => {
      BEAD_ROWS.forEach(t => {
        const costId = _getCostId('bead', grade, t);
        const costPerM2 = costId ? fieldVal(costId) : 0;
        const marginPerM2 = _getMargin('bead', grade, t);
        let r = costPerM2 ? calcSheetRow(costPerM2, marginPerM2, t, grade.area) : null;
        const overrideEl = document.getElementById(_getOverrideId('bead', grade, t));
        const overrideVal = overrideEl && overrideEl.value.trim() !== '' ? parseFloat(overrideEl.value) : null;
        if (r && overrideVal) r = _applyPriceOverride(r, overrideVal, r.costPerSheet);
        const gradeName = `${grade.label} 비드법단열재 ${grade.sub}`;
        // ⚠️ 여기 'fr'로 돼있던 오타 수정(2026-09-04) — 원가 미입력 행에서 엉뚱하게
        // 불연단열재 캐시를 참조하고 있었음(경쟁사 데이터 안 뜨는 것 외엔 눈에 안 띄던 버그).
        if (!r) { rows.push([gradeName, t, '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', ..._compCells('bead', grade.id, t)]); return; }
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
      _commonHeaderFor('pu'),
    ];
    PU_GRADES.forEach(grade => {
      grade.rows.forEach(t => {
        const costId = _getCostId('pu', grade, t);
        const costPerM2 = costId ? fieldVal(costId) : 0;
        const marginPerM2 = _getMargin('pu', grade, t);
        const tEff = grade.tFactor ?? t;
        let r = costPerM2 ? calcSheetRow(costPerM2, marginPerM2, tEff, grade.area) : null;
        const overrideEl = document.getElementById(_getOverrideId('pu', grade, t));
        const overrideVal = overrideEl && overrideEl.value.trim() !== '' ? parseFloat(overrideEl.value) : null;
        if (r && overrideVal) r = _applyPriceOverride(r, overrideVal, r.costPerSheet);
        const gradeName = `${grade.label} 경질우레탄 ${grade.sub2||grade.sub1}`;
        // ⚠️ 여기도 'fr' 오타 수정(2026-09-04, buildBead와 동일한 문제)
        if (!r) { rows.push([gradeName, t, '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', ..._compCells('pu', grade.id, t)]); return; }
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
      _commonHeaderFor('pf'),
    ];
    PF_GRADES.forEach(grade => {
      PF_ROWS.forEach(t => {
        const costPerM2 = fieldVal(grade.costId);
        const marginPerM2 = _getMargin('pf', grade, t);
        let r = costPerM2 ? calcSheetRow(costPerM2, marginPerM2, t, grade.area) : null;
        const overrideEl = document.getElementById(_getOverrideId('pf', grade, t));
        const overrideVal = overrideEl && overrideEl.value.trim() !== '' ? parseFloat(overrideEl.value) : null;
        if (r && overrideVal) r = _applyPriceOverride(r, overrideVal, r.costPerSheet);
        const gradeName = `${grade.pfCat} ${grade.pfGrade} ${grade.areaLabel}`;
        // ⚠️ 여기도 'fr' 오타 수정(2026-09-04, buildBead와 동일한 문제)
        if (!r) { rows.push([gradeName, t, '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', ..._compCells('pf', grade.id, t)]); return; }
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
       ..._compHeaderCellsFor('fr')],
    ];
    FR_GRADES.forEach(grade => {
      grade.rows.forEach(t => {
        const costId = _getCostId('fr', grade, t);
        const costPerM2 = costId ? fieldVal(costId) : 0;
        const marginSheet = _getMargin('fr', grade, t);
        let r = calcFrSheetRow(costPerM2, marginSheet, grade.area);
        const overrideEl = document.getElementById(_getOverrideId('fr', grade, t));
        const overrideVal = overrideEl && overrideEl.value.trim() !== '' ? parseFloat(overrideEl.value) : null;
        if (r && overrideVal) r = _applyPriceOverride(r, overrideVal, r.vatCost);
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

/* 경쟁사 데이터 조회 */
function _getCompData(tabId, gradeId, t) {
  return window._compCache?.[tabId]?.[gradeId]?.[t] || {};
}

/* 2026-09-02: 경쟁사 이름/헤더는 _doExport() 안에서 실제 DB(competitor_names) 기준으로
   compHeaderCells를 미리 계산해서 쓴다 — _compExportNames/_compHeaders(localStorage
   기반, 실제 이름 변경이 반영 안 되던 낡은 방식)는 제거함. */

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
  // "동일가로만 맞춤" 오버라이드가 걸려있으면 그게 진짜 표시가(2026-09-04) — 마진
  // 계산값이 아니라 이걸 반환해야 가격역전 보정 등 다른 로직도 실제 화면과 일치함.
  const overrideEl = document.getElementById(_getOverrideId('bead', grade, t));
  const overrideVal = overrideEl && overrideEl.value.trim() !== '' ? parseFloat(overrideEl.value) : null;
  if (overrideVal) return overrideVal;
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
  const overrideEl = document.getElementById(_getOverrideId('pu', grade, t));
  const overrideVal = overrideEl && overrideEl.value.trim() !== '' ? parseFloat(overrideEl.value) : null;
  if (overrideVal) return overrideVal;
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
  const overrideEl = document.getElementById(_getOverrideId('pf', grade, t));
  const overrideVal = overrideEl && overrideEl.value.trim() !== '' ? parseFloat(overrideEl.value) : null;
  if (overrideVal) return overrideVal;
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
/* ═══════════════════════════════════════════════════════════════
   앱 가격 탭
   - 연동 상품: 단가표 realPrice 자동 표시 (읽기전용)
   - 직접 입력: 열반사단열재, 접착식 단열벽지
═══════════════════════════════════════════════════════════════ */

/* 앱 가격 탭 내부 서브탭 상태 */
let _appPriceSubTab = 'isopink';

/* 직접 입력 상품 데이터 (id 기반) */
const APP_MANUAL_PRODUCTS = {
  reflective: {
    label: '열반사단열재',
    items: [
      { id: 601, name: '고급형 비접착',  spec: '1M×40M', thickness: 5,  unit: '롤' },
      { id: 603, name: '고급형 비접착',  spec: '1M×20M', thickness: 10, unit: '롤' },
      { id: 605, name: '고급형 비접착',  spec: '1M×10M', thickness: 20, unit: '롤' },
      { id: 602, name: '고급형 한쪽접착', spec: '1M×40M', thickness: 5,  unit: '롤' },
      { id: 604, name: '고급형 한쪽접착', spec: '1M×20M', thickness: 10, unit: '롤' },
      { id: 606, name: '고급형 한쪽접착', spec: '1M×10M', thickness: 20, unit: '롤' },
    ]
  },
  wallpaper: {
    label: '접착식 단열벽지',
    items: [
      { id: 607, name: '고급형',   spec: '1M×20M', thickness: 5, unit: '롤' },
      { id: 608, name: '3D실크형', spec: '1M×20M', thickness: 5, unit: '롤' },
    ]
  },
  pufoam: {
    label: '이액형 폴리우레탄폼',
    items: [
      { id: 701, sub1: '경질', name: '타이거폼 2K', unit: '세트' },
      { id: 702, sub1: '경질', name: '라이트폼',    unit: '세트' },
      { id: 703, sub1: '연질', name: '타이거폼 2K', unit: '세트' },
      { id: 704, sub1: '연질', name: '라이트폼',    unit: '세트' },
    ]
  }
};

/* 앱 가격 탭 서브탭 목록 */
const APP_PRICE_SUBTABS = [
  { id: 'isopink',    label: '아이소핑크' },
  { id: 'bead',       label: '비드법단열재' },
  { id: 'pu',         label: '경질우레탄' },
  { id: 'pf',         label: 'PF보드' },
  { id: 'fr',         label: '미네랄울 불연' },
  { id: 'reflective', label: '열반사단열재' },
  { id: 'wallpaper',  label: '접착식 단열벽지' },
  { id: 'pufoam',     label: '이액형 PU폼' },
];

/* 앱 가격 탭 초기화 */
async function initAppPriceTab() {
  const wrap = document.getElementById('pricing-tab-app');
  if (!wrap) return;

  // 로딩
  wrap.innerHTML = `<div style="padding:40px;text-align:center;color:#94a3b8;">
    <i class="fa-solid fa-spinner fa-spin"></i> 가격 데이터 불러오는 중...
  </div>`;

  // 직접 입력 상품 현재 가격 로드
  let manualPrices = {};
  if (typeof supabaseClient !== 'undefined') {
    const allIds = [
      ...APP_MANUAL_PRODUCTS.reflective.items.map(i => i.id),
      ...APP_MANUAL_PRODUCTS.wallpaper.items.map(i => i.id),
      ...APP_MANUAL_PRODUCTS.pufoam.items.map(i => i.id),
    ];
    const { data } = await supabaseClient
      .from('app_product_prices')
      .select('id, price')
      .in('id', allIds);
    if (data) data.forEach(r => { manualPrices[r.id] = r.price; });
  }

  // 서브탭 버튼 — 에너가드탭의 단열재 종류 탭(.pricing-tab)과 같은 스타일로 통일(2026-08-18)
  const tabBtns = APP_PRICE_SUBTABS.map(t =>
    `<button class="pricing-tab${t.id === _appPriceSubTab ? ' active' : ''}"
      onclick="switchAppPriceSubTab('${t.id}',this)">${t.label}</button>`
  ).join('');

  // 공지 데이터 로드
  let existingNotices = [];
  if (typeof supabaseClient !== 'undefined') {
    const { data: nData } = await supabaseClient
      .from('app_notices')
      .select('*')
      .order('created_at', { ascending: false });
    if (nData) existingNotices = nData;
  }
  window._appNotices = existingNotices;

  wrap.innerHTML = `
    <!-- 카테고리 탭 — 에너가드탭의 .pricing-tabs-bar와 같은 별도 카드로 분리(2026-08-18,
         이전엔 앱 판매가 현황 카드 안에 붙어있었음) -->
    <div class="pricing-tabs-bar">
      <div class="pricing-tabs" id="appPriceSubtabBar">${tabBtns}</div>
    </div>

    <div class="card pricing-result-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">앱 판매가 현황<span class="pricing-spec-badge">단가표 자동 연동</span></div>
      </div>
      <div class="pricing-table-scroll" id="app-price-content"></div>
    </div>

    <!-- ── 공지 관리 섹션 ── -->
    <div class="card pricing-cost-card app-notice-section">
      <div class="app-notice-section-title">
        <i class="fa-solid fa-bell" style="color:#e85d2f;"></i> 앱 공지사항 관리
      </div>

      <div class="app-notice-form">
        <div class="app-notice-form-row">
          <label class="app-notice-label">제목 <span style="color:#e85d2f;">*</span></label>
          <input type="text" id="noticeInputTitle" class="app-notice-input"
            placeholder="예: 2026년 6월 단가가 업데이트 되었습니다">
        </div>
        <div class="app-notice-form-row">
          <label class="app-notice-label">내용 <span style="color:#e85d2f;">*</span></label>
          <textarea id="noticeInputContent" class="app-notice-textarea"
            placeholder="공지 내용을 입력하세요."></textarea>
        </div>
        <div class="app-notice-form-row" style="display:flex;gap:12px;align-items:flex-end;">
          <div style="flex:1;">
            <label class="app-notice-label">만료일 <span style="color:#94a3b8;font-weight:400;">(비워두면 상시 표시)</span></label>
            <input type="date" id="noticeInputExpires" class="app-notice-input">
          </div>
          <label style="display:flex;align-items:center;gap:6px;padding-bottom:10px;cursor:pointer;white-space:nowrap;font-size:13px;font-weight:600;color:#e85d2f;">
            <input type="checkbox" id="noticeInputImportant" style="width:16px;height:16px;accent-color:#e85d2f;cursor:pointer;">
            📌 중요공지
          </label>
          <button class="btn-notice-add" onclick="addAppNotice()">
            <i class="fa-solid fa-plus"></i> 공지 등록
          </button>
        </div>
      </div>

      <div class="app-notice-list-title">등록된 공지</div>
      <div id="appNoticeList"></div>
    </div>
  `;

  // 현재 서브탭 렌더
  window._appManualPrices = manualPrices;
  renderAppPriceSubTab(_appPriceSubTab);
  renderAppNoticeList();
}

/* 서브탭 전환 */
window.switchAppPriceSubTab = function(tabId, el) {
  _appPriceSubTab = tabId;
  document.querySelectorAll('#appPriceSubtabBar .pricing-tab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderAppPriceSubTab(tabId);
};

/* 서브탭 콘텐츠 렌더 */
function renderAppPriceSubTab(tabId) {
  const content = document.getElementById('app-price-content');
  if (!content) return;

  if (tabId === 'reflective' || tabId === 'wallpaper' || tabId === 'pufoam') {
    content.innerHTML = buildManualPriceTable(tabId);
    return;
  }
  content.innerHTML = buildAutoPriceTable(tabId);
}

/* 자동 연동 가격 테이블 (읽기전용) */
function buildAutoPriceTable(tabId) {
  const fmt = v => v ? v.toLocaleString() + '원' : '—';
  let rows = '';

  if (tabId === 'isopink') {
    ISOPINK_ROWS.forEach(t => {
      const r = _isoCalcRow(t);
      const grade = (t === 10 || t === 20) ? '1호' : '특호';
      rows += `<tr>
        <td style="text-align:left;font-weight:600;">아이소핑크 압출법단열재</td>
        <td style="text-align:center;">${grade}</td><td style="text-align:center;">900×1800</td><td class="td-thick">${t}T</td>
        <td class="td-highlight">${fmt(r?.realPrice)}</td><td style="text-align:center;">장</td>
      </tr>`;
    });
  }

  else if (tabId === 'bead') {
    const BEAD_CODE_MAP = {
      'iiia2': { name: '비드법단열재 1종', sub: '1호' },
      'iia1':  { name: '비드법단열재 1종', sub: '2호' },
      'ia1':   { name: '비드법단열재 1종', sub: '3호' },
      'iiib':  { name: '비드법단열재 2종', sub: '1호' },
      'iia2':  { name: '비드법단열재 2종', sub: '2호' },
      'ia2':   { name: '비드법단열재 2종', sub: '3호' },
    };
    BEAD_GRADES.forEach(grade => {
      const info = BEAD_CODE_MAP[grade.id];
      if (!info) return;
      BEAD_ROWS.forEach(t => {
        const costId = _getCostId('bead', grade, t);
        const cost = costId ? fieldVal(costId) : 0;
        const margin = _getMargin('bead', grade, t);
        const r = cost ? calcSheetRow(cost, margin, t, grade.area) : null;
        rows += `<tr>
          <td style="text-align:left;font-weight:600;">${info.name}</td>
          <td style="text-align:center;">${info.sub}</td><td style="text-align:center;">900×1800</td><td class="td-thick">${t}T</td>
          <td class="td-highlight">${fmt(r?.realPrice)}</td><td style="text-align:center;">장</td>
        </tr>`;
      });
    });
  }

  else if (tabId === 'pu') {
    const PU_NAME_MAP = {
      'ic':    { name: '경질우레탄보드', sub: '1종 3호' },
      'iiia':  { name: '경질우레탄보드', sub: '2종 1호' },
      'iia':   { name: '경질우레탄보드', sub: '2종 2호' },
      'id_in': { name: '준불연 경질우레탄보드', sub: '준불연' },
    };
    PU_GRADES.forEach(grade => {
      const info = PU_NAME_MAP[grade.id];
      if (!info) return;
      grade.rows.forEach(t => {
        const costId = _getCostId('pu', grade, t);
        const cost = costId ? fieldVal(costId) : 0;
        const margin = _getMargin('pu', grade, t);
        const tEff = grade.tFactor ?? t;
        const r = cost ? calcSheetRow(cost, margin, tEff, grade.area) : null;
        rows += `<tr>
          <td style="text-align:left;font-weight:600;">${info.name}</td>
          <td style="text-align:center;">${info.sub}</td><td style="text-align:center;">1000×2000</td><td class="td-thick">${t}T</td>
          <td class="td-highlight">${fmt(r?.realPrice)}</td><td style="text-align:center;">장</td>
        </tr>`;
      });
    });
  }

  else if (tabId === 'pf') {
    const PF_NAME_MAP = {
      'lxo_s': { name: '준불연 PF보드', sub1: 'LX하우시스', sub2: '심재준불연', spec: '600×1200' },
      'lxo_l': { name: '준불연 PF보드', sub1: 'LX하우시스', sub2: '심재준불연', spec: '1200×2000' },
      'lxi_s': { name: '준불연 PF보드', sub1: 'LX하우시스', sub2: '준불연',    spec: '600×1200' },
      'lxi_l': { name: '준불연 PF보드', sub1: 'LX하우시스', sub2: '준불연',    spec: '1200×2000' },
      'kdo_s': { name: '준불연 PF보드', sub1: '국내산',     sub2: '심재준불연', spec: '600×1200' },
      'kdo_l': { name: '준불연 PF보드', sub1: '국내산',     sub2: '심재준불연', spec: '1200×2000' },
      'kdi_s': { name: '준불연 PF보드', sub1: '국내산',     sub2: '준불연',    spec: '600×1200' },
      'kdi_l': { name: '준불연 PF보드', sub1: '국내산',     sub2: '준불연',    spec: '1200×2000' },
      'imo_l': { name: '준불연 PF보드', sub1: '수입산',     sub2: '심재준불연', spec: '1000×1200' },
      'imi_l': { name: '준불연 PF보드', sub1: '수입산',     sub2: '준불연',    spec: '1000×1200' },
    };
    PF_GRADES.forEach(grade => {
      const info = PF_NAME_MAP[grade.id];
      if (!info) return;
      PF_ROWS.forEach(t => {
        const cost = fieldVal(grade.costId);
        const margin = _getMargin('pf', grade, t);
        const r = cost ? calcSheetRow(cost, margin, t, grade.area) : null;
        rows += `<tr>
          <td style="text-align:left;font-weight:600;">${info.name}</td>
          <td style="text-align:center;">${info.sub1} ${info.sub2}</td><td style="text-align:center;">${info.spec}</td><td class="td-thick">${t}T</td>
          <td class="td-highlight">${fmt(r?.realPrice)}</td><td style="text-align:center;">장</td>
        </tr>`;
      });
    });
  }

  else if (tabId === 'fr') {
    const frBul = FR_GRADES.find(g => g.id === 'fr_bul');
    if (frBul) {
      frBul.rows.forEach(t => {
        const costId = _getCostId('fr', frBul, t);
        const cost = costId ? fieldVal(costId) : 0;
        const margin = _getMargin('fr', frBul, t);
        const r = cost ? calcFrSheetRow(cost, margin, frBul.area) : null;
        rows += `<tr>
          <td style="text-align:left;font-weight:600;">미네랄울 불연단열재</td>
          <td style="text-align:center;">—</td><td style="text-align:center;">1000×1200</td><td class="td-thick">${t}T</td>
          <td class="td-highlight">${fmt(r?.realPrice)}</td><td style="text-align:center;">장</td>
        </tr>`;
      });
    }
  }

  return `
    <table class="pricing-table">
      <thead><tr>
        <th style="text-align:left;">상품명</th>
        <th>등급</th><th>규격</th><th>두께</th>
        <th class="pricing-col-highlight">앱 판매가</th>
        <th>단위</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* 직접 입력 가격 테이블 */
function buildManualPriceTable(tabId) {
  const product = APP_MANUAL_PRODUCTS[tabId];
  const manualPrices = window._appManualPrices || {};

  if (tabId === 'pufoam') {
    const rows = product.items.map(item => `
      <tr>
        <td style="text-align:center;font-weight:600;">${item.sub1}</td>
        <td style="text-align:center;">${item.name}</td>
        <td class="td-highlight" style="padding:6px 12px;">
          <input type="text" inputmode="numeric" class="app-price-input"
            id="app-manual-${item.id}"
            value="${manualPrices[item.id] ?? ''}"
            placeholder="0">
        </td>
        <td style="text-align:center;">${item.unit}</td>
      </tr>`).join('');
    return `
      <table class="pricing-table">
        <thead><tr>
          <th>종류 <span class="pricing-spec-badge" style="vertical-align:middle;font-size:10px;">직접 입력</span></th>
          <th>브랜드</th>
          <th class="pricing-col-highlight">앱 판매가</th>
          <th>단위</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  const thicknessHeader = product.thicknessHeader || '두께';

  let rows = product.items.map(item => `
    <tr>
      <td style="text-align:left;font-weight:600;">${item.name}</td>
      <td style="text-align:center;">${item.spec}</td>
      <td class="td-thick">${item.thicknessDisplay ?? (item.thickness != null ? item.thickness + 'T' : '-')}</td>
      <td class="td-highlight" style="padding:6px 12px;">
        <input type="text" inputmode="numeric" class="app-price-input"
          id="app-manual-${item.id}"
          value="${manualPrices[item.id] ?? ''}"
          placeholder="0">
      </td>
      <td style="text-align:center;">${item.unit}</td>
    </tr>`).join('');

  return `
    <table class="pricing-table">
      <thead><tr>
        <th style="text-align:left;">종류 <span class="pricing-spec-badge" style="vertical-align:middle;font-size:10px;">직접 입력</span></th>
        <th>규격</th><th>${thicknessHeader}</th>
        <th class="pricing-col-highlight">앱 판매가</th>
        <th>단위</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* 직접 입력 상품 저장 */
window.saveAppManualPrices = async function() {
  if (typeof supabaseClient === 'undefined') return;

  const allItems = [
    ...APP_MANUAL_PRODUCTS.reflective.items,
    ...APP_MANUAL_PRODUCTS.wallpaper.items,
    ...APP_MANUAL_PRODUCTS.pufoam.items,
  ];

  const statusEl = document.getElementById('appPriceSaveStatus');
  if (statusEl) statusEl.textContent = '저장 중...';

  let successCount = 0, failCount = 0;

  await Promise.all(allItems.map(async item => {
    const el = document.getElementById(`app-manual-${item.id}`);
    if (!el) return;
    const val = parseInt(el.value.replace(/,/g, ''));
    if (!val || val <= 0) return;

    const { error } = await supabaseClient
      .from('app_product_prices')
      .update({ price: val })
      .eq('id', item.id);

    if (error) failCount++;
    else {
      successCount++;
      if (window._appManualPrices) window._appManualPrices[item.id] = val;
    }
  }));

  const now = new Date().toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (statusEl) {
    statusEl.textContent = failCount > 0
      ? `일부 실패 (성공 ${successCount}건, 실패 ${failCount}건)`
      : `저장 완료: ${now}`;
  }
  if (typeof showToast === 'function') {
    showToast(failCount > 0 ? `일부 저장 실패 (${failCount}건)` : `앱 가격 저장 완료 (${successCount}건)`, failCount > 0 ? 'error' : 'success');
  }
};

/* ═══════════════════════════════════════════════════════════════
   앱 공지 관리
═══════════════════════════════════════════════════════════════ */

function renderAppNoticeList() {
  const el = document.getElementById('appNoticeList');
  if (!el) return;
  const notices = window._appNotices || [];
  if (!notices.length) {
    el.innerHTML = '<div class="app-notice-empty">등록된 공지가 없습니다.</div>';
    return;
  }
  el.innerHTML = notices.map(n => {
    const date = new Date(n.created_at).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });
    const expires = n.expires_at
      ? `· 만료: ${new Date(n.expires_at).toLocaleDateString('ko-KR')}`
      : '· 상시 표시';
    const isActive = n.is_active;
    const isImportant = !!n.is_important;
    const borderStyle = isImportant ? 'border-left:3px solid #e85d2f;' : '';
    return `
      <div class="app-notice-item${isActive ? '' : ' inactive'}" style="${borderStyle}">
        <div class="app-notice-item-header">
          <span class="app-notice-item-badge${isActive ? '' : ' off'}">${isActive ? '게시중' : '비활성'}</span>
          ${isImportant ? '<span style="font-size:11px;font-weight:700;color:#e85d2f;background:#fff1ec;padding:2px 7px;border-radius:4px;margin-right:4px;">📌 중요</span>' : ''}
          <span class="app-notice-item-title">${escapeAdminHtml(n.title)}</span>
          <div class="app-notice-item-actions">
            <button class="btn-notice-toggle" onclick="toggleImportantNotice(${n.id}, ${isImportant})" title="${isImportant ? '중요 해제' : '중요 설정'}" style="color:${isImportant ? '#e85d2f' : '#94a3b8'};">
              <i class="fa-solid fa-thumbtack"></i>
            </button>
            <button class="btn-notice-toggle" onclick="toggleAppNotice(${n.id}, ${isActive})" title="${isActive ? '비활성화' : '활성화'}">
              <i class="fa-solid fa-${isActive ? 'eye-slash' : 'eye'}"></i>
            </button>
            <button class="btn-notice-del" onclick="deleteAppNotice(${n.id})" title="삭제">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="app-notice-item-content">${escapeAdminHtml(n.content)}</div>
        <div class="app-notice-item-meta">${escapeAdminHtml(date)} ${escapeAdminHtml(expires)}</div>
      </div>`;
  }).join('');
}

window.addAppNotice = async function() {
  const title   = document.getElementById('noticeInputTitle')?.value.trim();
  const content = document.getElementById('noticeInputContent')?.value.trim();
  const expires = document.getElementById('noticeInputExpires')?.value;

  if (!title)   { if(typeof showToast==='function') showToast('제목을 입력해주세요.', 'error'); return; }
  if (!content) { if(typeof showToast==='function') showToast('내용을 입력해주세요.', 'error'); return; }
  if (!supabaseClient) return;

  const btn = document.querySelector('.btn-notice-add');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }

  const isImportant = document.getElementById('noticeInputImportant')?.checked || false;

  const payload = {
    title,
    content,
    is_active: true,
    is_important: isImportant,
    expires_at: expires ? new Date(expires).toISOString() : null,
  };

  const { data, error } = await supabaseClient
    .from('app_notices')
    .insert([payload])
    .select()
    .single();

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-plus"></i> 공지 등록'; }

  if (error) {
    console.error('공지 등록 오류:', error.code, error.message, error.details);
    if(typeof showToast==='function') showToast(`공지 등록 실패: ${error.message}`, 'error');
    return;
  }

  window._appNotices = [data, ...(window._appNotices || [])];
  document.getElementById('noticeInputTitle').value = '';
  document.getElementById('noticeInputContent').value = '';
  document.getElementById('noticeInputExpires').value = '';
  document.getElementById('noticeInputImportant').checked = false;
  renderAppNoticeList();
  if(typeof showToast==='function') showToast('공지가 등록되었습니다.', 'success');
};

window.deleteAppNotice = async function(id) {
  if (!confirm('공지를 삭제하시겠습니까?')) return;
  if (typeof supabaseClient === 'undefined') return;

  const { error } = await supabaseClient.from('app_notices').delete().eq('id', id);
  if (error) { if(typeof showToast==='function') showToast('삭제 실패', 'error'); return; }

  window._appNotices = (window._appNotices || []).filter(n => n.id !== id);
  renderAppNoticeList();
  if(typeof showToast==='function') showToast('공지가 삭제되었습니다.', 'success');
};

window.toggleImportantNotice = async function(id, currentImportant) {
  if (typeof supabaseClient === 'undefined') return;

  const { error } = await supabaseClient
    .from('app_notices')
    .update({ is_important: !currentImportant })
    .eq('id', id);

  if (error) { if(typeof showToast==='function') showToast('변경 실패', 'error'); return; }

  window._appNotices = (window._appNotices || []).map(n =>
    n.id === id ? { ...n, is_important: !currentImportant } : n
  );
  renderAppNoticeList();
  if(typeof showToast==='function') showToast(currentImportant ? '중요 공지를 해제했습니다.' : '중요 공지로 설정했습니다.', 'success');
};

window.toggleAppNotice = async function(id, currentActive) {
  if (typeof supabaseClient === 'undefined') return;

  const { error } = await supabaseClient
    .from('app_notices')
    .update({ is_active: !currentActive })
    .eq('id', id);

  if (error) { if(typeof showToast==='function') showToast('변경 실패', 'error'); return; }

  window._appNotices = (window._appNotices || []).map(n =>
    n.id === id ? { ...n, is_active: !currentActive } : n
  );
  renderAppNoticeList();
  if(typeof showToast==='function') showToast(currentActive ? '공지를 비활성화했습니다.' : '공지를 활성화했습니다.', 'success');
};
