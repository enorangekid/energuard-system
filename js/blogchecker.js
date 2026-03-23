/* ================================================================
   js/blogchecker.js  —  블로그 순위 체커 v4
   키워드 선택형 / Supabase 연동 / 메인·서브 섹션 분리
   ================================================================ */

const BC_API = 'http://localhost:5000';

/* ── 내부 상태 ── */
let bcTimer       = null;
let bcRunning     = false;
let bcSaveTimer   = null;
let bcRetryTimer  = null;
let bcAddMode     = false;
let bcSaving      = false;  // 중복 저장 방지 플래그

/* 키워드 저장소: { main: [...], sub: [...] } */
let bcKws = { main: [], sub: [] };

/* 선택 상태: Set of keyword strings */
let bcSelected = new Set();

/* 메인 키워드 기본 목록 */
const BC_MAIN_DEFAULTS = [
  '단열재','단열재종류','불연단열재','준불연단열재',
  '아이소핑크','압출법단열재','스티로폼','네오폴',
  '비드법단열재','경질우레탄보드','PF보드',
  '열반사단열재','단열벽지'
];

/* ────────────────────────────────────────
   서버 상태 확인
──────────────────────────────────────── */
async function bcCheckServer() {
  const el = document.getElementById('bc-server-status');
  if (!el) return;
  clearTimeout(bcRetryTimer);

  try {
    const res = await fetch(BC_API + '/api/status', {
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) {
      el.innerHTML = '<i class="fa-solid fa-circle"></i>서버 연결됨';
      el.className = 'bc-status-on';
      await bcLoadKeywords();
      await bcLoadHistoryList();
      await bcLoadLatestResult();
      return;
    }
  } catch { /* 연결 실패 */ }

  el.innerHTML = '<i class="fa-solid fa-circle"></i>서버 꺼짐';
  el.className = 'bc-status-off';
  await bcLoadHistoryList();
  await bcLoadLatestResult();
  bcRetryTimer = setTimeout(bcCheckServer, 5000);
}

/* ────────────────────────────────────────
   Supabase — 최신 결과 불러오기
──────────────────────────────────────── */
/* ────────────────────────────────────────
   이력 날짜 목록 로드 — Supabase 기반
──────────────────────────────────────── */
async function bcLoadHistoryList() {
  const sel = document.getElementById('bc-history-select');
  if (!sel) return;
  if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from('blog_rank_results')
      .select('id, checked_at')
      .order('checked_at', { ascending: false })
      .limit(50);
    if (error || !data || !data.length) return;
    sel.innerHTML = '<option value="">-- 이력 조회 --</option>' +
      data.map(r => {
        const d = new Date(r.checked_at);
        const label = d.toLocaleString('ko-KR', {
          month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        });
        return `<option value="${r.id}">${label}</option>`;
      }).join('');
  } catch { /* 무시 */ }
}

async function bcLoadHistoryById(id) {
  if (!id) { await bcLoadLatestResult(); return; }
  if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from('blog_rank_results')
      .select('results, checked_at')
      .eq('id', id)
      .single();
    if (!error && data) bcRenderResults(data.results, data.checked_at);
  } catch { /* 무시 */ }
}

async function bcLoadLatestResult() {
  if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from('blog_rank_results')
      .select('results, checked_at')
      .order('checked_at', { ascending: false })
      .limit(1)
      .single();
    if (!error && data) bcRenderResults(data.results, data.checked_at);
  } catch { /* 테이블 미존재 또는 오류 */ }
}

/* ────────────────────────────────────────
   Supabase — 결과 저장
──────────────────────────────────────── */
async function bcSaveResult(results) {
  if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
  try {
    await supabaseClient.from('blog_rank_results').insert({ results });
  } catch (e) { console.warn('bcSaveResult:', e); }
}

/* ────────────────────────────────────────
   키워드 로드
──────────────────────────────────────── */
async function bcLoadKeywords() {
  try {
    const res  = await fetch(BC_API + '/api/keywords', { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    const all  = data.keywords || [];

    bcKws.main = all.filter(k => BC_MAIN_DEFAULTS.includes(k));
    bcKws.sub  = all.filter(k => !BC_MAIN_DEFAULTS.includes(k));

    // 서버에 없는 메인 기본 키워드 추가
    BC_MAIN_DEFAULTS.forEach(k => {
      if (!bcKws.main.includes(k)) bcKws.main.push(k);
    });

    // 처음 로드 시 전체 선택
    if (bcSelected.size === 0) {
      [...bcKws.main, ...bcKws.sub].forEach(k => bcSelected.add(k));
    }

    bcRenderKwButtons();
    bcUpdateSelectedBadge();
  } catch { /* 서버 꺼짐 — 키워드 렌더링 없음 */ }
}

/* ────────────────────────────────────────
   키워드 버튼 렌더링
──────────────────────────────────────── */
function bcRenderKwButtons() {
  const total = bcKws.main.length + bcKws.sub.length;
  document.getElementById('bc-kw-count').textContent = total + '개';

  const renderGroup = (containerId, keywords) => {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.innerHTML = keywords.map(kw => {
      const sel = bcSelected.has(kw);
      return `<button
        class="bc-kw-btn${sel ? ' selected' : ''}"
        onclick="bcToggleKw('${kw.replace(/'/g,"\\'")}', this)"
        oncontextmenu="bcDeleteKw('${kw.replace(/'/g,"\\'")}', '${containerId === 'bc-kw-main-list' ? 'main' : 'sub'}'); return false;"
        title="클릭: 선택/해제 · 우클릭: 삭제"
      >${kw}</button>`;
    }).join('');
  };

  renderGroup('bc-kw-main-list', bcKws.main);
  renderGroup('bc-kw-sub-list',  bcKws.sub);
}

/* ────────────────────────────────────────
   키워드 선택 토글
──────────────────────────────────────── */
function bcToggleKw(kw, btn) {
  if (bcSelected.has(kw)) {
    bcSelected.delete(kw);
    btn.classList.remove('selected');
  } else {
    bcSelected.add(kw);
    btn.classList.add('selected');
  }
  bcUpdateSelectedBadge();
}

/* ────────────────────────────────────────
   전체 선택 / 해제
──────────────────────────────────────── */
function bcSelectAll() {
  [...bcKws.main, ...bcKws.sub].forEach(k => bcSelected.add(k));
  bcRenderKwButtons();
  bcUpdateSelectedBadge();
}

function bcDeselectAll() {
  bcSelected.clear();
  bcRenderKwButtons();
  bcUpdateSelectedBadge();
}

/* ────────────────────────────────────────
   선택 배지 업데이트
──────────────────────────────────────── */
function bcUpdateSelectedBadge() {
  const total = bcKws.main.length + bcKws.sub.length;
  const sel   = bcSelected.size;
  const el    = document.getElementById('bc-kw-selected-count');
  if (!el) return;
  if (sel === total) {
    el.textContent = '전체 선택';
    el.className   = 'bc-kw-sel-badge bc-kw-sel-all';
  } else {
    el.textContent = `${sel}개 선택됨`;
    el.className   = 'bc-kw-sel-badge bc-kw-sel-partial';
  }
}

/* ────────────────────────────────────────
   추가 입력 토글
──────────────────────────────────────── */
function bcToggleAddMode() {
  bcAddMode = !bcAddMode;
  const area = document.getElementById('bc-add-area');
  const btn  = document.querySelector('.bc-kw-ctrl-add');
  area.style.display = bcAddMode ? 'block' : 'none';
  if (btn) btn.classList.toggle('active', bcAddMode);
}

/* ────────────────────────────────────────
   키워드 추가
──────────────────────────────────────── */
function bcAddKeyword() {
  const input   = document.getElementById('bc-kw-input');
  const typeEl  = document.getElementById('bc-add-type');
  const val     = input.value.trim();
  if (!val) return;

  const type   = typeEl ? typeEl.value : 'sub';
  const newKws = val.split(/[\n,]/).map(k => k.trim()).filter(Boolean);
  const existing = bcKws[type];
  newKws.forEach(k => {
    if (!existing.includes(k)) {
      existing.push(k);
      bcSelected.add(k);  // 추가된 키워드는 자동 선택
    }
  });

  input.value = '';
  bcRenderKwButtons();
  bcUpdateSelectedBadge();
  bcShowToast(`${newKws.length}개 추가됨`);
  bcDebounceSave();
}

/* ────────────────────────────────────────
   키워드 삭제 (우클릭)
──────────────────────────────────────── */
function bcDeleteKw(kw, type) {
  bcKws[type] = bcKws[type].filter(k => k !== kw);
  bcSelected.delete(kw);
  bcRenderKwButtons();
  bcUpdateSelectedBadge();
  bcShowToast('키워드 삭제됨');
  bcDebounceSave();
}

/* ────────────────────────────────────────
   디바운스 저장
──────────────────────────────────────── */
function bcDebounceSave() {
  clearTimeout(bcSaveTimer);
  bcSaveTimer = setTimeout(() => {
    const all = [...bcKws.main, ...bcKws.sub];
    bcSaveKeywords(all);
  }, 300);
}

async function bcSaveKeywords(keywords) {
  try {
    await fetch(BC_API + '/api/keywords', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ keywords })
    });
  } catch {
    bcShowToast('저장 실패 — 서버 연결 확인', 'error');
  }
}

/* ────────────────────────────────────────
   토스트
──────────────────────────────────────── */
function bcShowToast(msg, type = 'success') {
  if (typeof showToast === 'function') { showToast(msg, type); return; }
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:28px;right:28px;background:#1e293b;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;z-index:99999;';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

/* ────────────────────────────────────────
   체크 시작 — 선택된 키워드만 서버에 전달
──────────────────────────────────────── */
async function bcStartCheck() {
  if (bcRunning) return;
  if (bcSelected.size === 0) { bcShowToast('선택된 키워드가 없습니다', 'error'); return; }

  const btn = document.getElementById('bc-run-btn');
  bcSaving = false;
  btn.disabled = true;

  const logWrap = document.getElementById('bc-log-wrap');
  logWrap.style.display = 'block';
  document.getElementById('bc-result-wrap').style.display = 'none';
  const tw = document.getElementById('bc-result-table-wrap');
  if (tw) tw.style.display = 'none';
  document.getElementById('bc-error-msg').classList.remove('visible');
  document.getElementById('bc-log-body').innerHTML = '';
  document.getElementById('bc-progress-bar').style.width = '0%';
  const pctEl = document.getElementById('bc-log-pct');
  if (pctEl) pctEl.textContent = '0%';

  // 선택된 키워드만 서버에 임시 저장 후 실행
  const selectedKws = [...bcKws.main, ...bcKws.sub].filter(k => bcSelected.has(k));
  try {
    // 선택된 키워드 임시 저장
    await bcSaveKeywords(selectedKws);
    const res  = await fetch(BC_API + '/api/start', { method: 'POST' });
    const data = await res.json();
    if (!data.ok) { bcShowError(data.msg); btn.disabled = false; return; }
    bcRunning = true;
    clearInterval(bcTimer);
    bcTimer = setInterval(bcPoll, 1200);
  } catch {
    bcShowError('Python 서버에 연결할 수 없습니다.');
    btn.disabled = false;
    // 임시 저장한 키워드를 전체로 원상복구
    await bcSaveKeywords([...bcKws.main, ...bcKws.sub]);
  }
}

/* ────────────────────────────────────────
   폴링
──────────────────────────────────────── */
async function bcPoll() {
  try {
    const res  = await fetch(BC_API + '/api/status');
    const data = await res.json();

    const logEl = document.getElementById('bc-log-body');
    logEl.innerHTML = data.log.map(l => `<div>${l}</div>`).join('');
    logEl.scrollTop = logEl.scrollHeight;

    const total = bcSelected.size || 1;
    const pct   = Math.min(Math.round((data.results.length / total) * 100), 99);
    document.getElementById('bc-progress-bar').style.width = pct + '%';
    const pctEl = document.getElementById('bc-log-pct');
    if (pctEl) pctEl.textContent = pct + '%';

    if (data.error) {
      bcStopPoll();
      bcShowError(data.error);
      document.getElementById('bc-run-btn').disabled = false;
      return;
    }

    if (data.done && !bcSaving) {
      bcSaving = true;
      bcStopPoll();
      document.getElementById('bc-progress-bar').style.width = '100%';
      if (pctEl) pctEl.textContent = '100%';
      // 전체 키워드 다시 저장 (체크 후 원상복구)
      await bcSaveKeywords([...bcKws.main, ...bcKws.sub]);
      // 저장은 app.py(run_crawl)에서만 수행 — JS 측 중복 저장 제거
      bcRenderResults(data.results);
      document.getElementById('bc-run-btn').disabled = false;
      document.getElementById('bc-log-wrap').style.display = 'none';
    }
  } catch {
    bcStopPoll();
    bcShowError('서버 연결이 끊겼습니다.');
    document.getElementById('bc-run-btn').disabled = false;
    bcRetryTimer = setTimeout(bcCheckServer, 3000);
  }
}

function bcStopPoll() {
  clearInterval(bcTimer);
  bcTimer   = null;
  bcRunning = false;
}

/* ────────────────────────────────────────
   결과 렌더링
──────────────────────────────────────── */
function bcRenderResults(results, checkedAt) {
  const ok   = results.filter(r => r.rank).length;
  const fail = results.length - ok;
  const rate = results.length ? Math.round(ok / results.length * 100) : 0;

  document.getElementById('bc-s-total').textContent = results.length;
  document.getElementById('bc-s-ok').textContent    = ok;
  document.getElementById('bc-s-fail').textContent  = fail;
  document.getElementById('bc-s-rate').textContent  = rate + '%';

  const at = checkedAt
    ? new Date(checkedAt).toLocaleString('ko-KR')
    : new Date().toLocaleString('ko-KR');
  document.getElementById('bc-checked-at').textContent = '체크 시각: ' + at;

  const sorted = [...results].sort((a, b) => {
    if (!a.rank && b.rank)  return 1;
    if (a.rank  && !b.rank) return -1;
    return (a.rank || 999) - (b.rank || 999);
  });

  document.getElementById('bc-result-tbody').innerHTML = sorted.map(r => {
    const isMain = BC_MAIN_DEFAULTS.includes(r.keyword);

    const rankHtml = r.rank ? `<span class="bc-rank-val">${r.rank}위</span>` : `<span class="bc-rank-none">-</span>`;
    const prevHtml = r.prev_rank ? `<span class="bc-rank-prev">${r.prev_rank}위</span>` : `<span class="bc-rank-none">-</span>`;

    let badge = '';
    if      (r.status === 'up')   badge = `<span class="badge bc-badge-up">▲ ${r.delta}</span>`;
    else if (r.status === 'down') badge = `<span class="badge bc-badge-down">▼ ${Math.abs(r.delta)}</span>`;
    else if (r.status === 'lost') badge = `<span class="badge bc-badge-lost">이탈</span>`;
    else if (r.status === 'new')  badge = `<span class="badge bc-badge-new">신규</span>`;
    else if (r.status === 'same') badge = `<span class="badge bc-badge-same">유지</span>`;
    else                          badge = `<span class="bc-rank-none">-</span>`;

    const resultBadge = r.rank
      ? `<span class="badge bc-badge-exposed"><i class="fa-solid fa-check"></i>노출</span>`
      : `<span class="badge bc-badge-hidden"><i class="fa-solid fa-xmark"></i>미노출</span>`;

    // 포스팅 날짜 — "2024. 3. 15." 형태를 "24.03.15"로 간결하게 표시
    let dateHtml = '<span class="bc-rank-none">-</span>';
    if (r.post_date) {
      // "N일 전" / "N시간 전" / "어제" 등 상대 날짜는 그대로 표시
      const absMatch = r.post_date.match(/(\d{4})[\.\-]\s*(\d{1,2})[\.\-]\s*(\d{1,2})/);
      if (absMatch) {
        const yy = absMatch[1].slice(2);
        const mm = absMatch[2].padStart(2, '0');
        const dd = absMatch[3].padStart(2, '0');
        dateHtml = `<span class="bc-post-date" title="${r.post_date}">${yy}.${mm}.${dd}</span>`;
      } else {
        dateHtml = `<span class="bc-post-date bc-post-date-rel">${r.post_date}</span>`;
      }
    }

    return `<tr class="${isMain ? 'bc-row-main' : ''}">
      <td class="bc-td-keyword">
        <span class="bc-kw-type-badge ${isMain ? 'bc-kw-type-main' : 'bc-kw-type-sub'}">${isMain ? '메인' : '서브'}</span>
        <a class="bc-kw-search-link" href="https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(r.keyword)}" target="_blank" rel="noopener">${r.keyword}</a>
      </td>
      <td>${rankHtml}</td>
      <td>${prevHtml}</td>
      <td>${badge}</td>
      <td class="bc-td-title">
        ${r.url && r.title
          ? `<a class="bc-title-link" href="${r.url}" target="_blank" rel="noopener" title="${(r.title||'').replace(/"/g,'&quot;')}">${r.title}</a>`
          : (r.title || '-')}
      </td>
      <td>${dateHtml}</td>
      <td>${resultBadge}</td>
    </tr>`;
  }).join('');

  document.getElementById('bc-result-wrap').style.display = 'block';
  const tw = document.getElementById('bc-result-table-wrap');
  if (tw) tw.style.display = 'block';
}

/* ────────────────────────────────────────
   오류 표시
──────────────────────────────────────── */
function bcShowError(msg) {
  const el = document.getElementById('bc-error-msg');
  el.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>${msg}`;
  el.classList.add('visible');
}

/* ────────────────────────────────────────
   showPage 훅
──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof window.showPage === 'function') {
      const _orig = window.showPage;
      window.showPage = function(pageId, el) {
        _orig(pageId, el);
        if (pageId === 'blogranking') bcCheckServer();
      };
    }
  }, 0);
});