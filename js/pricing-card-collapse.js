/* ===============================================================
   js/pricing-card-collapse.js — 단가표 원가 카드 접기·펴기 (2026-10-15, 사용자 요청)

   에너가드컴퍼니·한국단열 단가표 맨 위의 원가 카드(원가 입력 · 공통 원가·배송 설정 · 원가 설정 등)는
   표가 길어서 단가표를 밀어 내린다. 카드 제목을 누르면 원가 표 부분이 접히고 다시 누르면 펴진다.
   - 기본은 펼친 상태다. 페이지를 새로 열면 항상 펼친 상태로 시작한다(접은 상태를 브라우저에 저장하지 않는다).
   - 제목 아래 버튼 줄(단가 기준 년월·마진 편집·가격검사 등 .pricing-cost-footer)은 접어도 그대로 보인다.
   - 카드는 탭을 바꾸거나 값을 불러올 때 통째로 다시 그려지므로, 접은 상태는 이 화면을 보는 동안만 카드 이름 기준으로 기억해 다시 적용한다.
   - 배송 세부설정·몰별 목록 카드(.hk-iso-shipping-block, .hk-iso-channel-listing)는 대상이 아니다.
   index.html·pricing-view.html 둘 다 불러온다(보기 전용에서도 접을 수 있다).
=============================================================== */
(function () {
  const CARD = '.pricing-cost-card:not(.hk-iso-shipping-block):not(.hk-iso-channel-listing):not(.app-notice-section)';
  // 접은 상태는 이 화면을 보는 동안(탭을 오가거나 값을 불러와 카드가 다시 그려질 때)만 유지한다. 브라우저에 저장하지 않으므로
  // 페이지를 새로 열면 항상 펼친 상태로 시작한다(사용자 지시: 기본은 펼침). 이전 버전이 남긴 저장값은 지운다.
  const collapsed = {};
  try { localStorage.removeItem('pricingCostCardCollapsed'); } catch { /* 저장소를 못 쓰면 지울 것도 없다 */ }

  const isKeep = el => el.classList.contains('pricing-section-title') || el.classList.contains('pricing-cost-footer');
  const titleOf = card => card.querySelector(':scope > .pricing-section-title');

  function keyOf(card) {
    const pane = card.closest('.pricing-tab-pane');
    const title = titleOf(card);
    const name = title && title.firstChild ? String(title.firstChild.textContent || '').trim() : '';
    return `${pane ? pane.id : (card.closest('.page-section') || {}).id || ''}|${card.dataset.draftTab || ''}|${name}`;
  }

  function decorate() {
    document.querySelectorAll(CARD).forEach(card => {
      if (card.dataset.collapseReady) return;
      const title = titleOf(card);
      if (!title) return;
      // 접을 내용이 없는 카드(제목 + 버튼 줄뿐)는 건드리지 않는다
      const hideable = [...card.children].some(c => !isKeep(c) && c.style.display !== 'none');
      if (!hideable) return;
      card.dataset.collapseReady = '1';
      card.classList.add('is-collapsible');
      title.title = '누르면 원가 표를 접거나 펼칩니다';
      if (collapsed[keyOf(card)]) card.classList.add('is-collapsed');
    });
  }

  document.addEventListener('click', event => {
    const title = event.target.closest && event.target.closest('.pricing-cost-card.is-collapsible > .pricing-section-title');
    if (!title) return;
    if (event.target.closest('button, input, select, textarea, a, label')) return;
    const card = title.parentElement;
    const now = card.classList.toggle('is-collapsed');
    const key = keyOf(card);
    if (now) collapsed[key] = 1; else delete collapsed[key];
  });

  // 카드가 다시 그려질 때마다 접힌 상태를 바로 적용한다 — MutationObserver 콜백은 화면이 그려지기 전에 실행되므로,
  // 펼쳐진 채로 한 번 보였다가 접히는 깜박임이 없다(예전엔 80ms 지연 적용이라 보였음). 관찰 대상은 childList뿐이라 여기서 클래스를
  // 바꿔도 다시 호출되지 않는다.
  const start = () => {
    decorate();
    new MutationObserver(decorate).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
