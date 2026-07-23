/* ================================================================
   js/rankcollect.js  —  순위 수집 (API) 페이지
   네이버 쇼핑 검색 API 기반 · 수집 → 확인 → 선택 저장
   크롬 확장(bbdb) 병행 검증용 — 기존 검색순위 탭/데이터 형식과 호환
   ================================================================ */

const RC_BATCH_SIZE = 4;   // Edge Function 1회 호출당 키워드 수
let rcCollecting = false;
let rcData = null;         // 마지막 수집 결과 { year, month, week, results: [...] }
let rcWeekOverride = null; // 사용자가 주차를 수동 변경한 경우

function rcFnConfig() {
  let url = 'https://eukwfypbfqojbaihfqye.supabase.co';
  let key = 'sb_publishable_MiBvlf3d6ulcVBsi7Odcgw_PTXSmXKj';
  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      url = supabaseClient.supabaseUrl || url;
      key = supabaseClient.supabaseKey || key;
    }
  } catch { /* fallback */ }
  return { fnUrl: url + '/functions/v1/shop-rank-collect', key };
}

/* ── 진입 시 초기화 ── */
function rcInit() {
  // 권한: admin 전용 (메뉴 숨김 + 이중 방어)
  const guard = document.getElementById('rc-admin-guard');
  const main  = document.getElementById('rc-main');
  const isAdmin = (typeof currentUser !== 'undefined') && currentUser && currentUser.role === 'admin';
  if (guard) guard.style.display = isAdmin ? 'none' : 'block';
  if (main)  main.style.display  = isAdmin ? 'block' : 'none';
  if (!isAdmin) return;

  rcUpdateWeekBadge();
  rcUpdateKwCounts();
}

/* ── 주차 자동 계산 (KST) ── */
function rcAutoWeek() {
  const day = new Date().getDate();
  return Math.min(5, Math.ceil(day / 7));
}
function rcCurrentWeek() {
  return rcWeekOverride || rcAutoWeek();
}
function rcUpdateWeekBadge() {
  const now = new Date();
  const el = document.getElementById('rc-week-badge');
  if (el) el.textContent = `${now.getMonth() + 1}월 ${rcCurrentWeek()}주차`;
  const sel = document.getElementById('rc-week-select');
  if (sel) sel.value = String(rcCurrentWeek());
}
function rcChangeWeek(v) {
  rcWeekOverride = parseInt(v, 10) || null;
  rcUpdateWeekBadge();
  const note = document.getElementById('rc-week-note');
  if (note) note.style.display = (rcWeekOverride && rcWeekOverride !== rcAutoWeek()) ? 'inline' : 'none';
}

/* ── 키워드 목록 (config.js의 KW_TREE 사용) ── */
function rcKeywords(mode) {
  if (typeof KW_TREE === 'undefined') return [];
  if (mode === 'main') return KW_TREE.map(g => g.main);
  // 전체: 메인 + 서브 (중복 제거)
  return [...new Set(KW_TREE.flatMap(g => [g.main, ...g.subs]))];
}
function rcUpdateKwCounts() {
  const m = document.getElementById('rc-btn-main');
  const a = document.getElementById('rc-btn-all');
  if (m) m.innerHTML = `<i class="fa-solid fa-play"></i> 메인 수집 (${rcKeywords('main').length})`;
  if (a) a.innerHTML = `<i class="fa-solid fa-forward"></i> 전체 수집 (${rcKeywords('all').length})`;
}

/* ── 수집 실행: 배치 나눠 호출, 실제 진행률 표시 ── */
async function rcCollect(mode) {
  if (rcCollecting) { rcCollecting = false; return; } // 실행 중 클릭 = 중단
  const keywords = rcKeywords(mode);
  if (!keywords.length) { rcToast('KW_TREE 키워드를 찾을 수 없습니다 (config.js 확인)', 'error'); return; }

  rcCollecting = true;
  rcData = null;
  const activeBtn = document.getElementById(mode === 'main' ? 'rc-btn-main' : 'rc-btn-all');
  const otherBtn  = document.getElementById(mode === 'main' ? 'rc-btn-all' : 'rc-btn-main');
  const origHtml = activeBtn.innerHTML;
  activeBtn.innerHTML = '<i class="fa-solid fa-stop"></i> 중단';
  activeBtn.classList.add('rc-btn-stop');
  otherBtn.disabled = true;
  document.getElementById('rc-save-bar').style.display = 'none';
  document.getElementById('rc-results').innerHTML = '';
  document.getElementById('rc-progress-wrap').style.display = 'block';

  const merged = { results: [] };
  let done = 0;
  const { fnUrl, key } = rcFnConfig();

  try {
    for (let i = 0; i < keywords.length; i += RC_BATCH_SIZE) {
      if (!rcCollecting) break; // 중단
      const batch = keywords.slice(i, i + RC_BATCH_SIZE);
      rcSetProgress(done, keywords.length, `조회 중: ${batch.join(', ')}`);

      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
          'apikey': key,
        },
        body: JSON.stringify({ action: 'collect', keywords: batch }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || ('HTTP ' + res.status));

      merged.year = data.year; merged.month = data.month;
      merged.autoWeek = data.week;
      merged.results.push(...data.results);
      done += batch.length;
      rcSetProgress(done, keywords.length, '');
      rcRenderResults(merged); // 배치마다 즉시 갱신 (진행하면서 확인 가능)
    }

    rcData = merged;
    const st = rcCollecting ? '수집 완료' : '중단됨 (수집분까지 표시)';
    rcSetProgress(done, keywords.length, st);
    rcRenderResults(merged);
    rcUpdateSaveBar();
  } catch (e) {
    rcToast('수집 실패: ' + (e.message || '네트워크 오류'), 'error');
    rcSetProgress(done, keywords.length, '오류로 중단됨');
    if (merged.results.length) { rcData = merged; rcRenderResults(merged); rcUpdateSaveBar(); }
  } finally {
    rcCollecting = false;
    activeBtn.innerHTML = origHtml;
    activeBtn.classList.remove('rc-btn-stop');
    otherBtn.disabled = false;
    setTimeout(() => { document.getElementById('rc-progress-wrap').style.display = 'none'; }, 1500);
  }
}

function rcSetProgress(done, total, msg) {
  const pct = total ? Math.round(done / total * 100) : 0;
  document.getElementById('rc-progress-bar').style.width = pct + '%';
  document.getElementById('rc-progress-pct').textContent = `${done}/${total} 키워드 (${pct}%)`;
  const m = document.getElementById('rc-progress-msg');
  if (msg) m.textContent = msg;
}

/* ── 결과 렌더링 ── */
function rcRenderResults(data) {
  const wrap = document.getElementById('rc-results');
  const week = rcCurrentWeek();

  let totalMatch = 0, totalMissing = 0, totalSkipped = 0;

  wrap.innerHTML = data.results.map((r, gi) => {
    if (r.skipped) { totalSkipped++; return ''; } // 등록 상품 없는 키워드는 숨김
    if (r.error) {
      return `<div class="card rc-kw-card"><div class="rc-kw-head">
        <span class="rc-kw-name">${rcEsc(r.keyword)}</span>
        <span class="rc-kw-err"><i class="fa-solid fa-triangle-exclamation"></i> ${rcEsc(r.error)}</span>
      </div></div>`;
    }
    totalMatch += r.matches.length;
    totalMissing += r.missing.length;

    const rows = r.matches.map((m, mi) => {
      const typeBadge = m.product_type === 'watch'
        ? `<span class="rc-type rc-type-watch">관찰${m.company_name ? '·' + rcEsc(m.company_name) : ''}</span>`
        : `<span class="rc-type rc-type-mine">내상품</span>`;
      const cur = m.current != null ? m.current + '위' : '-';
      let diffHtml = '';
      if (m.current != null) {
        const d = m.current - m.rank;
        if (d > 0)      diffHtml = `<span class="rc-diff-up">▲${d}</span>`;
        else if (d < 0) diffHtml = `<span class="rc-diff-down">▼${Math.abs(d)}</span>`;
        else            diffHtml = `<span class="rc-diff-same">=</span>`;
      }
      return `<tr>
        <td><input type="checkbox" class="rc-check" checked
              data-keyword="${rcEsc(r.keyword)}" data-code="${rcEsc(String(m.code))}" data-rank="${m.rank}"
              onchange="rcUpdateSaveBar()"></td>
        <td>${typeBadge}</td>
        <td class="rc-td-name" title="${rcEsc(m.name)}">${rcEsc(m.name)}</td>
        <td class="rc-td-rank"><b>${m.rank}위</b></td>
        <td class="rc-td-cur">${cur} ${diffHtml}</td>
        <td class="rc-td-price">${m.price ? m.price.toLocaleString() + '원' : '-'}</td>
      </tr>`;
    }).join('');

    const missingRows = r.missing.map(m => {
      const typeBadge = m.product_type === 'watch'
        ? `<span class="rc-type rc-type-watch">관찰${m.company_name ? '·' + rcEsc(m.company_name) : ''}</span>`
        : `<span class="rc-type rc-type-mine">내상품</span>`;
      return `<tr class="rc-row-missing">
        <td><input type="checkbox" disabled></td>
        <td>${typeBadge}</td>
        <td class="rc-td-name" title="${rcEsc(m.name)}">${rcEsc(m.name)}</td>
        <td class="rc-td-rank"><span class="rank-out-badge">이탈</span></td>
        <td class="rc-td-cur">${m.current != null ? m.current + '위' : '-'}</td>
        <td class="rc-td-price">400위 밖 · 저장 안 함</td>
      </tr>`;
    }).join('');

    return `<div class="card rc-kw-card">
      <div class="rc-kw-head">
        <span class="rc-kw-name">${rcEsc(r.keyword)}</span>
        <span class="rc-kw-stat">매칭 ${r.matches.length} · 이탈 ${r.missing.length}</span>
        <label class="rc-kw-toggle"><input type="checkbox" checked
          onchange="rcToggleGroup(this, ${gi})"> 전체</label>
      </div>
      <table class="timeline-table rc-table">
        <thead><tr>
          <th style="width:36px"></th><th style="width:110px">유형</th><th>상품명</th>
          <th style="width:80px">API 순위</th><th style="width:110px">현재 ${week}주차</th><th style="width:110px">가격</th>
        </tr></thead>
        <tbody data-group="${gi}">${rows}${missingRows}</tbody>
      </table>
    </div>`;
  }).join('');

  document.getElementById('rc-summary').innerHTML =
    `매칭 <b>${totalMatch}</b>건 · 이탈 <b class="rc-sum-miss">${totalMissing}</b>건` +
    (totalSkipped ? ` · 등록상품 없는 키워드 ${totalSkipped}개 생략` : '');
}

function rcToggleGroup(cb, gi) {
  document.querySelectorAll(`tbody[data-group="${gi}"] .rc-check`).forEach(c => { c.checked = cb.checked; });
  rcUpdateSaveBar();
}

function rcUpdateSaveBar() {
  const bar = document.getElementById('rc-save-bar');
  const n = document.querySelectorAll('.rc-check:checked').length;
  bar.style.display = n > 0 ? 'flex' : 'none';
  document.getElementById('rc-save-btn').innerHTML =
    `<i class="fa-solid fa-floppy-disk"></i> 선택 ${n}건 저장 (rank_w${rcCurrentWeek()})`;
}

/* ── 저장 ── */
async function rcSave() {
  const checks = [...document.querySelectorAll('.rc-check:checked')];
  if (!checks.length) return;
  const week = rcCurrentWeek();
  if (!confirm(`${checks.length}건을 ${new Date().getMonth() + 1}월 ${week}주차(rank_w${week})에 저장할까요?`)) return;

  const btn = document.getElementById('rc-save-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...';

  const rows = checks.map(c => ({
    keyword: c.dataset.keyword,
    product_code: c.dataset.code,
    rank: parseInt(c.dataset.rank, 10),
  }));

  try {
    const { fnUrl, key } = rcFnConfig();
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
        'apikey': key,
      },
      body: JSON.stringify({ action: 'save', week, rows }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || ('HTTP ' + res.status));

    const errN = (data.errors || []).length;
    rcToast(`저장 완료 — 업데이트 ${data.patched}건 · 신규 ${data.posted}건` + (errN ? ` · 실패 ${errN}건` : ''),
            errN ? 'error' : 'success');
    if (errN) console.warn('[rankcollect] 저장 실패 목록:', data.errors);

    // 저장된 행 표시
    checks.forEach(c => {
      c.checked = false; c.disabled = true;
      c.closest('tr').classList.add('rc-row-saved');
    });
    rcUpdateSaveBar();
  } catch (e) {
    rcToast('저장 실패: ' + (e.message || '네트워크 오류'), 'error');
  } finally {
    btn.disabled = false;
    rcUpdateSaveBar();
  }
}

/* ── 유틸 ── */
function rcEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function rcToast(msg, type = 'success') {
  if (typeof showToast === 'function') { showToast(msg, type); return; }
  alert(msg);
}

/* ── showPage 훅 ── */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof window.showPage === 'function') {
      const _orig = window.showPage;
      window.showPage = function(pageId, el, isHistoryAction) {
        _orig(pageId, el, isHistoryAction);
        if (pageId === 'rankcollect') rcInit();
      };
    }
  }, 0);
});
