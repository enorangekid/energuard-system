/* ===============================================================
   js/pricing-drainboard.js  —  에너가드컴퍼니 단가표 · 경질배수판 탭 (2026-11-17 신설)
   - 사양은 경질우레탄보드 2종 2호(II-A)와 같다: 1000×2000mm(면적 2.0㎡).
   - 판매 두께 50~150T(10T 단위). 판매처가 없고 가격이 대부분 비공개라 비교가 없다 —
     사용자가 순마진율 50~90T 약 30%, 100~150T 약 35%로 정했다(마진 185/170/200원/mm).
   - 원가(원/㎡·mm, 운반비 별도)는 사용자가 준 표: 50~60T 280, 70~90T 260, 100T 이상 240.
     (우레탄 2종 2호 원가 140/135의 약 2배 — 홈 가공품이라 높다고 사용자가 확인)
   - 화면은 경질우레탄보드 탭(pricing.js buildPuTab)과 같은 마크업·스타일·계산 함수를 그대로 쓴다
     (calcSheetRow, _resultThead, _resultRow, _resultCard). 이 파일은 pricing.js 뒤에 불러와야 한다.
   - 장당 판매가 = (원가+마진) × 두께 × 면적 × 1.1, 100원 올림(calcSheetRow).
   - 값은 코드에 고정(에너가드론 탭과 같은 방식). 가격을 바꾸려면 아래 DRAIN_COST_BANDS·DRAIN_MARGIN_BANDS를 고친다.
   =============================================================== */
(function () {
  'use strict';

  const DRAIN_AREA = 2.0;                       // 1000×2000mm
  const DRAIN_ROWS = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150];

  /* 두께 구간별 원가(원/㎡·mm) */
  const DRAIN_COST_BANDS = [
    { min: 50,  max: 60,  cost: 280, label: '50T ~ 60T'   },
    { min: 70,  max: 90,  cost: 260, label: '70T ~ 90T'   },
    { min: 100, max: 150, cost: 240, label: '100T ~ 150T' },
  ];

  /* 두께 구간별 마진(원/mm) — 50~90T는 순마진율 약 30%, 100~150T는 약 35%(판매가 많을 두께라 높게,
     2026-11-17 사용자 결정. 처음엔 25%로 시작했다가 30%로 올리고, 100T 이상만 35%로 한 번 더 올림) */
  const DRAIN_MARGIN_BANDS = [
    { min: 50,  max: 60,  margin: 185 },
    { min: 70,  max: 90,  margin: 170 },
    { min: 100, max: 150, margin: 200 },
  ];

  const bandOf = (bands, t) => bands.find(b => t >= b.min && t <= b.max);

  function draw() {
    const pane = document.getElementById('pricing-tab-drainboard');
    if (!pane) return;
    if (typeof calcSheetRow !== 'function' || typeof _resultRow !== 'function'
        || typeof _resultThead !== 'function' || typeof _resultCard !== 'function') {
      pane.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8;">경질배수판 단가표를 그리려면 pricing.js가 먼저 불러와져야 합니다.</div>';
      return;
    }

    const rows = DRAIN_ROWS.map(t => {
      const cost = bandOf(DRAIN_COST_BANDS, t).cost;
      const margin = bandOf(DRAIN_MARGIN_BANDS, t).margin;
      return { t, r: { t, ...calcSheetRow(cost, margin, t, DRAIN_AREA) } };
    });

    /* 다른 코드(가격검사·엑셀 등)가 가져다 쓸 수 있게 노출 */
    window.DRAINBOARD_PRICES = rows.map(({ t, r }) => ({ thickness: t, price: r.realPrice, cost: r.costPerSheet }));

    /* 원가 입력 테이블 — 품종이 하나뿐이라 아이소핑크 탭처럼 칸을 넓게 쓰는 표(값은 읽기 전용) */
    const costTable = `
      <table class="pricing-cost-unified-table">
        <colgroup><col style="width:150px"><col style="width:140px"><col style="width:155px"><col style="width:80px"></colgroup>
        <thead><tr><th>품명</th><th>두께 구간</th><th>원가 (원/m²)<br><span class="pricing-th-tiny" style="font-weight:400;color:#94a3b8">1mm 두께당, 운반비 별도</span></th><th class="pricing-col-diff">이전대비</th></tr></thead>
        <tbody>${DRAIN_COST_BANDS.map((b, bi) => `
          <tr${bi === 0 ? ' class="pcut-grade-row"' : ''}>
            ${bi === 0 ? `<td rowspan="${DRAIN_COST_BANDS.length}" class="pcut-name-cell pu-iia">경질배수판<br><span class="pcut-name-sub">2종 2호 사양<br>(1000×2000)</span></td>` : ''}
            <td><span class="pricing-range-label">${b.label}</span></td>
            <td><input type="text" inputmode="numeric" class="pricing-input-field pcut-cost-field" value="${b.cost}" readonly></td>
            <td class="pcut-diff-cell"><span class="pcut-diff-empty">—</span></td>
          </tr>`).join('')}
        </tbody>
      </table>`;

    const nameTd = `<td rowspan="${rows.length}" class="pricing-name-cell bead-name-cell pu-iia"><span class="pnc-code">배수판</span><span class="pnc-cat">경질배수판</span><span class="pnc-grade">2종 2호 사양</span></td>`;
    const dash = '<span style="color:#d1d5db;font-size:12px;">—</span>';
    const tbody = rows.map(({ t, r }, i) => _resultRow(t, r, dash, i === 0 ? nameTd : '', dash)).join('');

    /* 경질우레탄 탭의 등급 서브탭 막대와 같은 모양(등급이 하나라 누를 곳은 없다) */
    const subtabBar = `<div class="bead-subtab-bar">
      <button class="bead-subtab pu-subtab active" type="button">배수판<span class="bead-subtab-sub">2종 2호 사양</span></button>
    </div>`;

    const resultTableHtml = `<table class="pricing-table">
      <colgroup>
        <col style="width:100px"><col style="width:60px"><col style="width:72px"><col style="width:55px"><col style="width:72px">
        <col style="width:90px"><col style="width:90px"><col style="width:90px"><col style="width:72px">
        <col style="width:85px"><col style="width:72px"><col style="width:70px"><col style="width:70px"><col style="width:66px"><col style="width:66px">
      </colgroup>
      ${_resultThead(['품명'])}
      <tbody id="drainboardTableBody">${tbody}</tbody>
    </table>`;

    pane.innerHTML =
      `<div class="card pricing-cost-card">
        <div class="pricing-section-title">원가 입력 <span class="pricing-section-sub">— 품종별 m²당 원가를 입력하세요</span></div>
        <div class="pricing-cost-footer">
          <div class="pricing-base-month-wrap">
            <label class="pricing-base-month-label">단가 기준 년월</label>
            <input type="month" class="pricing-input-field pricing-month-field" value="2026-11" readonly>
          </div>
        </div>
        <div class="pricing-cost-card-inner">
          <div class="pricing-input-table-wrap">${costTable}</div>
        </div>
      </div>` +
      _resultCard('경질배수판 단가표', '규격: 1000×2000mm', subtabBar, resultTableHtml);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', draw); else draw();
})();
