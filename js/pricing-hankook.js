/* ═══════════════════════════════════════
   한국단열 단가표 — 전용 파일 (2026-09-04 신설)

   에너가드컴퍼니 단가표(js/pricing.js)와 완전히 분리된 별도 엔진이다.
   합치지 않고 파일을 나눈 이유: pricing.js가 이미 3,000줄이 넘고,
   한국단열 원본 자료(한국단열단가표.xlsx)가 에너가드보다 카테고리도
   많고(아이소핑크/스티로폼/열반사단열재/단열벽지/창문형단열재/기타단열재/부자재)
   카테고리마다 단위·계산방식이 서로 달라서(장당·두께별 / m당·롤당 / 개당 등)
   pricing.js의 기존 엔진(_gradesOf/_getCostId/calcSheetRow 등)에 억지로
   끼워맞추면 관리가 더 어려워진다.

   tabId는 전부 hk_ 접두어를 붙여 에너가드 tabId(isopink/bead/pu/pf/fr)와
   절대 겹치지 않게 한다.

   지금은 틀(탭바 + "입력 전" 빈 상태)만 만든 상태 — 카테고리별 실제 엑셀을
   하나씩 받으면, 그 카테고리에 한해 GRADES/ROWS 정의와 원가입력 테이블,
   계산식을 채워넣는다. renderHkCategoryPane()의 분기만 늘려가면 되는 구조.
═══════════════════════════════════════ */

const HK_CATEGORIES = [
  { id: 'hk_isopink',    label: '아이소핑크' },
  { id: 'hk_bead',       label: '스티로폼' },
  { id: 'hk_reflective', label: '열반사단열재' },
  { id: 'hk_wallpaper',  label: '단열벽지' },
  { id: 'hk_window',     label: '창문형단열재' },
  { id: 'hk_etc',        label: '기타단열재' },
  { id: 'hk_sub',        label: '부자재' },
];

let _activeHkTab = HK_CATEGORIES[0].id;
window._activeHkTab = _activeHkTab;

/* ═══════════════════════════════════════
   탭바 + 빈 콘텐츠 초기 렌더
═══════════════════════════════════════ */
function initHkPricingTabs() {
  const tabsBar  = document.getElementById('hkPricingTabsBar');
  const bodyWrap = document.getElementById('hkPricingBodyWrap');
  if (!tabsBar || !bodyWrap) return;

  tabsBar.innerHTML = `<div class="pricing-tabs">${HK_CATEGORIES.map((c, i) =>
    `<button class="pricing-tab${i === 0 ? ' active' : ''}" onclick="setHkPricingTab('${c.id}',this)">${c.label}</button>`
  ).join('')}</div>`;

  bodyWrap.innerHTML = HK_CATEGORIES.map((c, i) =>
    `<div id="pricing-tab-${c.id}" class="pricing-tab-pane${i === 0 ? ' active' : ''}">${renderHkCategoryPane(c.id)}</div>`
  ).join('');
}
document.addEventListener('DOMContentLoaded', initHkPricingTabs);

/* ═══════════════════════════════════════
   탭 전환
═══════════════════════════════════════ */
window.setHkPricingTab = function(tabId, el) {
  _activeHkTab = tabId;
  window._activeHkTab = tabId;
  document.querySelectorAll('#hkPricingTabsBar .pricing-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#hkPricingBodyWrap .pricing-tab-pane').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('pricing-tab-' + tabId)?.classList.add('active');
};

/* ═══════════════════════════════════════
   카테고리별 콘텐츠 — 실제 데이터 들어오면 이 분기를 채운다.
   지금은 전부 "입력 전" 빈 상태만 반환.
═══════════════════════════════════════ */
function renderHkCategoryPane(tabId) {
  const cat = HK_CATEGORIES.find(c => c.id === tabId);
  if (!cat) return '';

  // 카테고리 하나가 채워지면 여기 if(tabId==='hk_isopink'){...} 식으로
  // 전용 렌더 함수를 추가하면 됨 (pricing.js의 buildIsopinkTab류와 같은 패턴).

  return `
    <div class="pricing-coming-soon">
      <i class="fa-solid fa-file-excel"></i>
      <p>${cat.label} 원가표는 아직 입력 전입니다.</p>
    </div>`;
}
