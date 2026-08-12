/* js/dashboard.js */

/* ================= [Dashboard Logic - Supabase Version] ================= */
let isDashboardLoaded = false;

window.loadDashboardData = async function() {
    if (!supabaseClient || isDashboardLoaded) return;

    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';

    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const [taskRes, memoRes, blogRes, ytRes] = await Promise.all([
            supabaseClient.from('monthly_tasks').select('*').eq('year', year).eq('month', month),
            supabaseClient.from('monthly_memos').select('key, content').eq('type', 'ProductLog').neq('content', ''),
            supabaseClient.from('notes').select('id, title, status, saved_at').eq('type', 'blog').order('saved_at', { ascending: false }).limit(10),
            supabaseClient.from('notes').select('id, title, status, saved_at').eq('type', 'youtube').order('saved_at', { ascending: false }).limit(10),
            loadLabOverviewData()
        ]);

        const tasks = taskRes.data ? {
            status: 'success',
            tasks: taskRes.data.map(t => [t.year, t.month, t.week_id, t.date, t.type, t.row_index, t.category, t.task, t.priority, t.note_deadline, t.is_done])
        } : null;
        const memos = memoRes.data ? memoRes.data.map(m => ({ date: m.key, content: m.content })) : [];

        renderDashTasks(tasks);
        renderDashProdLogs(memos);
        renderDashNotes(blogRes.data || [], 'dash-blog-list', 'blog');
        renderDashNotes(ytRes.data || [], 'dash-yt-list', 'youtube');
        ['tasks', 'prodlogs', 'blog', 'youtube'].forEach(setRefreshTime);
        isDashboardLoaded = true;
    } catch (error) {
        console.error('???? ??? ?? ??:', error);
        showToast('???? ???? ???? ?????.', 'error');
    } finally {
        if (loader) loader.style.display = 'none';
    }
};

window.refreshDashData = async function(type) {
    if (!supabaseClient) return;
    if (type.startsWith('lab-')) {
        const key = type.replace('lab-', '');
        await loadLabOverviewData(key);
        return;
    }
    const timeEl = document.getElementById(`time-${type}`);
    const iconEl = timeEl?.nextElementSibling;
    if (iconEl) iconEl.classList.add('fa-spin');

    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        if (type === 'tasks') {
            const { data } = await supabaseClient.from('monthly_tasks').select('*').eq('year', year).eq('month', month);
            renderDashTasks({ status: 'success', tasks: (data || []).map(t => [t.year, t.month, t.week_id, t.date, t.type, t.row_index, t.category, t.task, t.priority, t.note_deadline, t.is_done]) });
        } else if (type === 'prodlogs') {
            const { data } = await supabaseClient.from('monthly_memos').select('key, content').eq('type', 'ProductLog').neq('content', '');
            renderDashProdLogs((data || []).map(m => ({ date: m.key, content: m.content })));
        } else if (type === 'blog' || type === 'youtube') {
            const { data } = await supabaseClient.from('notes').select('id, title, status, saved_at').eq('type', type).order('saved_at', { ascending: false }).limit(10);
            renderDashNotes(data || [], type === 'blog' ? 'dash-blog-list' : 'dash-yt-list', type);
        }
        setRefreshTime(type);
    } catch (error) {
        console.error('???? ??:', error);
        showToast('???? ? ??? ??????.', 'error');
    } finally {
        if (iconEl) iconEl.classList.remove('fa-spin');
    }
};

const LAB_BASE_URL = 'https://enorangekid.github.io/energuard-lab/';
const DASH_STORE_NAME = '한국 단열';

window.openEnerguardLabPage = function(path) {
    window.open(`${LAB_BASE_URL}${path || ''}`, '_blank', 'noopener');
};

// 매출 현황은 민감정보라 화면 진입 시 기본으로 접혀있게 한다(구버전과 동일).
window.toggleDashLabSales = function() {
    const el = document.getElementById('dash-sales-metrics');
    const icon = document.getElementById('dash-sales-toggle-icon');
    if (!el) return;
    const isHidden = el.style.display === 'none';
    el.style.display = isHidden ? '' : 'none';
    if (icon) icon.style.transform = isHidden ? 'rotate(180deg)' : '';
};

function dashboardDate(date) {
    if (!date) return '-';
    const parts = String(date).slice(0, 10).split('-');
    return parts.length === 3 ? `${Number(parts[1])}.${Number(parts[2])}` : String(date);
}

function dashboardMoney(value) {
    return `${Math.round(Number(value) || 0).toLocaleString('ko-KR')}원`;
}

function dashboardPercent(value) {
    return `${(Number(value) || 0).toFixed(1)}%`;
}

function dashboardComparison(current, previous, suffix = '') {
    if (previous == null) return '<span class="dash-lab-compare muted">이전 데이터 없음</span>';
    if (previous === 0) {
        return current === 0
            ? '<span class="dash-lab-compare muted">이전과 동일</span>'
            : '<span class="dash-lab-compare up">이전 대비 신규</span>';
    }
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 0.05) return '<span class="dash-lab-compare muted">이전과 동일</span>';
    const up = change > 0;
    return `<span class="dash-lab-compare ${up ? 'up' : 'down'}">${up ? '▲' : '▼'}${Math.abs(change).toFixed(1)}%${suffix}</span>`;
}

function dashboardMetric(label, value, note = '', tone = '') {
    return `<div class="dash-lab-metric${tone ? ` ${tone}` : ''}">
        <span class="dash-lab-metric-label">${label}</span>
        <strong>${value}</strong>
        <span class="dash-lab-metric-note">${note || '&nbsp;'}</span>
    </div>`;
}

function setLabCardState(targetId, html) {
    const el = document.getElementById(targetId);
    if (el) el.innerHTML = html;
}

function setLabPeriod(targetId, text) {
    const el = document.getElementById(targetId);
    if (el) el.textContent = text;
}

async function fetchPagedRows(makeQuery, pageSize = 1000) {
    const rows = [];
    for (let from = 0; ; from += pageSize) {
        const { data, error } = await makeQuery(from, from + pageSize - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < pageSize) break;
    }
    return rows;
}

function dateDaysBefore(dateString, days) {
    const date = new Date(`${dateString}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().slice(0, 10);
}

async function latestTableDate(table, column, configure) {
    let query = supabaseClient.from(table).select(column).order(column, { ascending: false }).limit(1);
    if (configure) query = configure(query);
    const { data, error } = await query;
    if (error) throw error;
    return data?.[0]?.[column] || null;
}

// 매출 데이터는 naver_product_daily 테이블에 anon/authenticated 읽기 정책이 없어서(네이버 API
// 인증정보가 서버 쪽에만 있는 구조) 클라이언트에서 테이블을 직접 읽을 수 없다 — 에너가드랩의
// sales-analysis.html이 쓰는 것과 동일한 naver-ad-report 엣지함수를 그대로 호출해서 받는다
// (2026-08-12, 직접 테이블 조회로는 데이터가 항상 비어있던 문제를 고침).
async function fetchSalesDailyRows(dateFrom, dateTo) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/naver-ad-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: 'naverStatSummary', dateFrom, dateTo }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) throw new Error(body.error || `매출 데이터 조회 실패 (${res.status})`);
    return Array.isArray(body.daily) ? body.daily : [];
}

async function fetchCoupangSalesRows(dateFrom, dateTo) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/naver-ad-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: 'coupangSalesSummary', dateFrom, dateTo }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) throw new Error(body.error || `쿠팡 매출 조회 실패 (${res.status})`);
    return Array.isArray(body.items) ? body.items : [];
}

// 구버전 "판매 성과 (스마트스토어 + 쿠팡) * 전월 동기간 대비"와 동일한 방식으로 복원한다.
// 데이터는 수동 입력이라 이번 달 자료가 아직 없을 수 있음 — 달력상 "이번 달"이 아니라
// 실제로 데이터가 있는 가장 최근 두 개 월을 비교한다(예: 8월 자료가 없으면 7월 vs 6월).
async function loadSalesOverview() {
    const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const rangeFrom = dateDaysBefore(today, 119);
    const [naverRows, coupangRows] = await Promise.all([
        fetchSalesDailyRows(rangeFrom, today),
        fetchCoupangSalesRows(rangeFrom, today).catch(() => []),
    ]);

    const byDate = new Map();
    naverRows.forEach(row => {
        const item = byDate.get(row.date) || { sales: 0, orders: 0, visits: 0 };
        item.sales += Number(row.salesNet) || 0;
        item.orders += Number(row.payCount) || 0;
        item.visits += Number(row.visits) || 0;
        byDate.set(row.date, item);
    });
    coupangRows.forEach(row => {
        const item = byDate.get(row.date) || { sales: 0, orders: 0, visits: 0 };
        item.sales += Number(row.sales) || 0;
        item.orders += Number(row.orders) || 0;
        item.visits += Number(row.visitors) || 0;
        byDate.set(row.date, item);
    });

    if (!byDate.size) {
        setLabPeriod('dash-sales-period', '저장 데이터 없음');
        setLabCardState('dash-sales-metrics', '<div class="dash-lab-empty">매출분석에서 판매 자료를 먼저 수집해 주세요.</div>');
        return;
    }

    const monthMap = new Map();
    byDate.forEach((row, date) => {
        const month = date.slice(0, 7);
        const acc = monthMap.get(month) || { sales: 0, orders: 0, visits: 0 };
        acc.sales += row.sales;
        acc.orders += row.orders;
        acc.visits += row.visits;
        monthMap.set(month, acc);
    });
    const sortedMonths = [...monthMap.keys()].sort().reverse();
    const currentMonth = sortedMonths[0];
    const previousMonth = sortedMonths[1] || null;
    const current = monthMap.get(currentMonth);
    const previous = previousMonth ? monthMap.get(previousMonth) : null;

    const conversion = current.visits ? current.orders / current.visits * 100 : 0;
    const previousConversion = previous && previous.visits ? previous.orders / previous.visits * 100 : null;

    const [y, m] = currentMonth.split('-');
    setLabPeriod('dash-sales-period', `${y}년 ${Number(m)}월 · 전월 동기간 대비`);
    setLabCardState('dash-sales-metrics', [
        dashboardMetric('매출', dashboardMoney(current.sales), previous ? dashboardComparison(current.sales, previous.sales) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>', 'accent'),
        dashboardMetric('결제 건수', `${current.orders.toLocaleString('ko-KR')}건`, previous ? dashboardComparison(current.orders, previous.orders) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>'),
        dashboardMetric('방문수', `${current.visits.toLocaleString('ko-KR')}회`, previous ? dashboardComparison(current.visits, previous.visits) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>'),
        dashboardMetric('구매전환율', dashboardPercent(conversion), previousConversion == null ? '<span class="dash-lab-compare muted">이전 데이터 없음</span>' : `<span class="dash-lab-compare ${conversion >= previousConversion ? 'up' : 'down'}">${conversion >= previousConversion ? '▲' : '▼'}${Math.abs(conversion - previousConversion).toFixed(1)}%p</span>`)
    ].join(''));
}

function keywordSummary(rows) {
    const products = new Map();
    rows.forEach(row => {
        const code = String(row.product_code || '').trim();
        if (!code) return;
        const current = products.get(code) || { ranks: [], keywords: new Set() };
        current.keywords.add(row.keyword);
        if (row.rank != null) current.ranks.push(Number(row.rank));
        products.set(code, current);
    });
    const values = [...products.values()];
    return {
        tracked: values.length,
        exposed: values.filter(item => item.ranks.length).length,
        top10: values.filter(item => item.ranks.some(rank => rank <= 10)).length,
        left: values.filter(item => !item.ranks.length).length,
        keywordCount: new Set(rows.map(row => row.keyword).filter(Boolean)).size
    };
}

async function fetchKeywordDateRows(date) {
    return fetchPagedRows((from, to) => supabaseClient
        .from('keyword_rank_history')
        .select('product_code,keyword,rank,product_name,product_image,product_link')
        .eq('store_name', DASH_STORE_NAME)
        .eq('collected_date', date)
        .range(from, to));
}

// 같은 상품+키워드 조합의 순위를 최신/이전 수집일끼리 비교해 급상승/급하락 목록을 만든다.
// diff는 "이전 순위 - 최신 순위"라 양수면 상승(숫자가 작아짐=더 좋은 순위).
function rankDeltaList(latestRows, previousRows) {
    const prevMap = new Map();
    previousRows.forEach(row => {
        if (row.rank == null) return;
        prevMap.set(`${row.product_code}|${row.keyword}`, Number(row.rank));
    });
    const items = [];
    latestRows.forEach(row => {
        if (row.rank == null) return;
        const prevRank = prevMap.get(`${row.product_code}|${row.keyword}`);
        if (prevRank == null) return;
        const diff = prevRank - Number(row.rank);
        if (diff === 0) return;
        items.push({
            name: row.product_name || row.product_code,
            keyword: row.keyword || '',
            thumb: row.product_image || '',
            link: row.product_link || '',
            curRank: Number(row.rank),
            diff,
        });
    });
    return items;
}

function dashRankItemHtml(item, isUp) {
    return `
        <a href="${item.link || '#'}" target="_blank" rel="noopener" class="dash-rank-item">
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width: 48px; flex-shrink: 0; gap: 4px; background: ${isUp ? '#fef2f2' : '#eff6ff'}; padding: 6px 0; border-radius: 8px;">
                <span style="font-size:14px; font-weight:800; color:#1e293b; line-height:1;">${item.curRank}위</span>
                <span class="dash-rank-diff ${isUp ? 'up' : 'down'}" style="font-size:11px; font-weight:700; width:auto; line-height:1;">
                    ${isUp ? '<i class="fa-solid fa-caret-up"></i>' : '<i class="fa-solid fa-caret-down"></i>'} ${Math.abs(item.diff)}
                </span>
            </div>
            <div class="dash-rank-thumb" ${item.thumb ? `style="background-image:url(${item.thumb});margin-left:4px;"` : 'style="margin-left:4px;"'}></div>
            <span style="min-width:0; display:flex; flex-direction:column; gap:2px;">
                <span class="dash-rank-name" title="${item.name}">${item.name}</span>
                <span style="font-size:11px; color:#94a3b8; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.keyword}">${item.keyword}</span>
            </span>
        </a>`;
}

function renderKeywordRankLists(latestRows, previousRows) {
    const deltas = rankDeltaList(latestRows, previousRows);
    const up = deltas.filter(item => item.diff >= 10).sort((a, b) => b.diff - a.diff).slice(0, 10);
    const down = deltas.filter(item => item.diff <= -10).sort((a, b) => a.diff - b.diff).slice(0, 10);

    const upCountEl = document.getElementById('dash-keyword-up-count');
    const downCountEl = document.getElementById('dash-keyword-down-count');
    if (upCountEl) upCountEl.textContent = `${up.length}건`;
    if (downCountEl) downCountEl.textContent = `${down.length}건`;

    const upListEl = document.getElementById('dash-keyword-up-list');
    const downListEl = document.getElementById('dash-keyword-down-list');
    if (upListEl) upListEl.innerHTML = up.length
        ? up.map(item => dashRankItemHtml(item, true)).join('')
        : '<div style="padding:15px; text-align:center; color:#999; font-size:13px;">급상승 내역이 없습니다.</div>';
    if (downListEl) downListEl.innerHTML = down.length
        ? down.map(item => dashRankItemHtml(item, false)).join('')
        : '<div style="padding:15px; text-align:center; color:#999; font-size:13px;">급하락 내역이 없습니다.</div>';
}

async function loadKeywordOverview() {
    const latest = await latestTableDate('keyword_rank_history', 'collected_date', query => query.eq('store_name', DASH_STORE_NAME));
    if (!latest) {
        setLabPeriod('dash-keyword-period', '저장 데이터 없음');
        setLabCardState('dash-keyword-metrics', '<div class="dash-lab-empty">에너가드랩에서 키워드 순위를 먼저 수집해 주세요.</div>');
        renderKeywordRankLists([], []);
        return;
    }
    const previous = await latestTableDate('keyword_rank_history', 'collected_date', query => query.eq('store_name', DASH_STORE_NAME).lt('collected_date', latest));
    const [latestRows, previousRows] = await Promise.all([
        fetchKeywordDateRows(latest),
        previous ? fetchKeywordDateRows(previous) : Promise.resolve([])
    ]);
    const current = keywordSummary(latestRows);
    const before = previous ? keywordSummary(previousRows) : null;

    setLabPeriod('dash-keyword-period', `${dashboardDate(latest)} 수집 · 키워드 ${current.keywordCount}개`);
    setLabCardState('dash-keyword-metrics', [
        dashboardMetric('추적 상품', `${current.tracked.toLocaleString('ko-KR')}개`, before ? dashboardComparison(current.tracked, before.tracked) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>'),
        dashboardMetric('노출 상품', `${current.exposed.toLocaleString('ko-KR')}개`, before ? dashboardComparison(current.exposed, before.exposed) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>', 'accent'),
        dashboardMetric('TOP 10', `${current.top10.toLocaleString('ko-KR')}개`, before ? dashboardComparison(current.top10, before.top10) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>'),
        dashboardMetric('이탈 상품', `${current.left.toLocaleString('ko-KR')}개`, before ? dashboardComparison(current.left, before.left) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>', current.left ? 'warning' : '')
    ].join(''));
    renderKeywordRankLists(latestRows, previousRows);
}

function blogSummary(rows) {
    const byKeyword = new Map();
    rows.forEach(row => {
        const key = `${row.blog_id || ''}::${row.keyword || ''}`;
        if (!byKeyword.has(key)) byKeyword.set(key, row);
    });
    const values = [...byKeyword.values()];
    const exposed = values.filter(row => row.found).length;
    return {
        total: values.length,
        exposed,
        pageOne: values.filter(row => row.found && Number(row.rank) <= 10).length,
        hidden: values.filter(row => !row.found).length,
        rate: values.length ? exposed / values.length * 100 : 0
    };
}

async function fetchBlogDateRows(blogIds, date) {
    return fetchPagedRows((from, to) => supabaseClient
        .from('blog_rank_exposure_history')
        .select('blog_id,keyword,found,rank')
        .in('blog_id', blogIds)
        .eq('provider', 'naver_blog_screen')
        .eq('checked_date', date)
        .range(from, to));
}

function renderBlogRankLists(latestRows, blogNameMap) {
    const nameOf = blogId => (blogNameMap && blogNameMap.get(blogId)) || blogId || '';
    const byKeyword = new Map();
    latestRows.forEach(row => {
        const key = `${row.blog_id || ''}::${row.keyword || ''}`;
        if (!byKeyword.has(key)) byKeyword.set(key, row);
    });
    const values = [...byKeyword.values()];
    const exposed = values.filter(row => row.found && row.rank != null).sort((a, b) => Number(a.rank) - Number(b.rank)).slice(0, 10);
    const hidden = values.filter(row => !row.found).slice(0, 10);

    const exposedEl = document.getElementById('dash-blogrank-exposed');
    const hiddenEl = document.getElementById('dash-blogrank-hidden');
    if (exposedEl) {
        exposedEl.innerHTML = exposed.length
            ? exposed.map(row => `<li><span class="dot success"></span><span class="dash-note-title" title="${row.keyword} · ${nameOf(row.blog_id)}">${row.keyword} <span style="color:#94a3b8;font-weight:500;">· ${nameOf(row.blog_id)}</span></span><span class="dash-date">${row.rank}위</span></li>`).join('')
            : '<li><span class="dash-empty">노출 키워드 없음</span></li>';
    }
    if (hiddenEl) {
        hiddenEl.innerHTML = hidden.length
            ? hidden.map(row => `<li><span class="dot danger"></span><span class="dash-note-title" title="${row.keyword} · ${nameOf(row.blog_id)}">${row.keyword} <span style="color:#94a3b8;font-weight:500;">· ${nameOf(row.blog_id)}</span></span></li>`).join('')
            : '<li><span class="dash-empty">미노출 키워드 없음</span></li>';
    }
}

async function loadBlogOverview() {
    const { data: blogs, error: blogError } = await supabaseClient.from('blog_rank_blogs').select('blog_id,blog_name').eq('is_mine', true).eq('active', true);
    if (blogError) throw blogError;
    const blogIds = (blogs || []).map(row => row.blog_id);
    const blogNameMap = new Map((blogs || []).map(row => [row.blog_id, row.blog_name || row.blog_id]));
    if (!blogIds.length) {
        setLabPeriod('dash-blogrank-period', '내 블로그 없음');
        setLabCardState('dash-blogrank-metrics', '<div class="dash-lab-empty">에너가드랩에서 내 블로그를 등록해 주세요.</div>');
        renderBlogRankLists([]);
        return;
    }
    const latest = await latestTableDate('blog_rank_exposure_history', 'checked_date', query => query.in('blog_id', blogIds).eq('provider', 'naver_blog_screen'));
    if (!latest) {
        setLabPeriod('dash-blogrank-period', '진단 데이터 없음');
        setLabCardState('dash-blogrank-metrics', '<div class="dash-lab-empty">블로그 노출 현황을 먼저 수집해 주세요.</div>');
        renderBlogRankLists([]);
        return;
    }
    const previous = await latestTableDate('blog_rank_exposure_history', 'checked_date', query => query.in('blog_id', blogIds).eq('provider', 'naver_blog_screen').lt('checked_date', latest));
    const [latestRows, previousRows] = await Promise.all([
        fetchBlogDateRows(blogIds, latest),
        previous ? fetchBlogDateRows(blogIds, previous) : Promise.resolve([])
    ]);
    const current = blogSummary(latestRows);
    const before = previous ? blogSummary(previousRows) : null;

    setLabPeriod('dash-blogrank-period', `${dashboardDate(latest)} 진단 · 키워드 ${current.total}개`);
    setLabCardState('dash-blogrank-metrics', [
        dashboardMetric('노출중', `${current.exposed.toLocaleString('ko-KR')}개`, before ? dashboardComparison(current.exposed, before.exposed) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>', 'accent'),
        dashboardMetric('1페이지', `${current.pageOne.toLocaleString('ko-KR')}개`, before ? dashboardComparison(current.pageOne, before.pageOne) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>'),
        dashboardMetric('미노출', `${current.hidden.toLocaleString('ko-KR')}개`, before ? dashboardComparison(current.hidden, before.hidden) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>', current.hidden ? 'warning' : ''),
        dashboardMetric('노출률', dashboardPercent(current.rate), before ? `<span class="dash-lab-compare ${current.rate >= before.rate ? 'up' : 'down'}">${current.rate >= before.rate ? '▲' : '▼'}${Math.abs(current.rate - before.rate).toFixed(1)}%p</span>` : '<span class="dash-lab-compare muted">이전 데이터 없음</span>')
    ].join(''));
    renderBlogRankLists(latestRows, blogNameMap);
}

async function loadLabOverviewData(section = 'all') {
    const loaders = {
        sales: { run: loadSalesOverview, target: 'dash-sales-metrics', label: '매출' },
        keyword: { run: loadKeywordOverview, target: 'dash-keyword-metrics', label: '키워드' },
        blog: { run: loadBlogOverview, target: 'dash-blogrank-metrics', label: '블로그' }
    };
    const entries = section === 'all' ? Object.values(loaders) : [loaders[section]].filter(Boolean);
    await Promise.all(entries.map(async item => {
        const button = document.querySelector(`[onclick="refreshDashData('lab-${Object.keys(loaders).find(key => loaders[key] === item)}')"] i`);
        if (button) button.classList.add('fa-spin');
        try {
            await item.run();
        } catch (error) {
            console.error(`${item.label} 현황 로드 실패:`, error);
            setLabCardState(item.target, `<div class="dash-lab-empty error">${item.label} 데이터를 불러오지 못했습니다.</div>`);
        } finally {
            if (button) button.classList.remove('fa-spin');
        }
    }));
    const time = document.getElementById('time-lab-overview');
    if (time) time.textContent = `기준 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
}

function setRefreshTime(type) {
    const el = document.getElementById(`time-${type}`);
    if (!el) return;
    const now = new Date();
    el.innerText = `?? ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

window.navigateFromDash = function(pageId, tabId) {
    const menuEl = document.querySelector(`.menu-item[onclick*="${pageId}"]`);
    if (menuEl) showPage(pageId, menuEl);
    if (tabId && typeof setNoteTab === 'function') setTimeout(() => setNoteTab(tabId), 100);
};

function getWeekIdForDate(year, month, targetDate) {
    if (typeof generateWeeksData === 'function') {
        const weeks = generateWeeksData(year, month);
        const targetDayStr = String(targetDate).padStart(2, '0');
        const targetFullStr = `${year}-${String(month).padStart(2, '0')}-${targetDayStr}`;
        for (let w of weeks) {
            if (w.days.some(d => d.date === targetFullStr)) { document.getElementById('dash-week-label').innerText = `(${w.name})`; return w.id; }
        }
        return weeks.length > 0 ? weeks[0].id : "w1"; 
    }
    return "w1";
}

function renderDashTasks(wlData) {
    if (!wlData || wlData.status !== "success" || !wlData.tasks) {
        document.getElementById('dash-task-list').innerHTML = '<li><span class="dash-empty">기록된 목표가 없습니다.</span></li>'; return;
    }
    const now = new Date(); const weekId = getWeekIdForDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
    let plans = wlData.tasks.filter(r => r[4] === 'Plan' && r[2] === weekId && r[7]); 
    let listHTML = ''; let count = 0;
    
    for (let r of plans) {
        let isDone = (r[10] === true || r[10] === "TRUE"); let doneStyle = isDone ? 'text-decoration: line-through; color: #9ca3af;' : '';
        let badge = r[6] ? `<span class="badge" style="font-size:10px; padding:2px 6px; margin-right:6px;">${r[6]}</span>` : '';
        listHTML += `<li onclick="navigateFromDash('worklog')" class="dash-hover-bg"><span class="dot ${isDone ? 'secondary' : 'primary'}"></span><span class="dash-note-title dash-hover-underline" style="${doneStyle}">${badge}${r[7]}</span></li>`;
        count++; if (count >= 10) break;
    }
    document.getElementById('dash-task-list').innerHTML = listHTML || '<li><span class="dash-empty">금주 등록된 목표가 없습니다.</span></li>';
}

function renderDashProdLogs(data) {
    if (!data || data.length === 0) {
        document.getElementById('dash-prodlog-list').innerHTML = '<li><span class="dash-empty">상품 수정 내역이 없습니다.</span></li>';
        return;
    }

    let validData = data.map(item => {
        let rawDate = item.date || "";
        let clean = String(rawDate).trim().replace(/\s+/g, '').replace(/\./g, '-').replace(/\//g, '-');
        if (clean.endsWith('-')) clean = clean.slice(0, -1);
        let parts = clean.split('-');
        let sortDate = parts.length >= 3 ? `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}` : clean;
        let displayDate = parts.length >= 3 ? `${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}` : clean;
        return { ...item, sortDate, displayDate };
    }).filter(item => {
        if (!item.content) return false; 
        let text = String(item.content).trim();
        if (text === "" || !isNaN(Number(text)) || !item.sortDate) return false; 
        return true;
    });

    if (validData.length === 0) {
        document.getElementById('dash-prodlog-list').innerHTML = '<li><span class="dash-empty">상품 수정 내역이 없습니다.</span></li>';
        return;
    }

    validData.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

    let listHTML = validData.slice(0, 10).map(item => `
    <li onclick="navigateFromDash('productlogs')" class="dash-hover-bg">
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
            <div style="display:flex; align-items:center; flex:1; min-width:0; margin-right:15px;">
                <span class="dot secondary"></span>
                <span class="dash-note-title dash-hover-underline">${item.content}</span>
            </div>
            <span class="dash-date">${item.displayDate}</span>
        </div>
    </li>`).join('');
    
    document.getElementById('dash-prodlog-list').innerHTML = listHTML;
}


function renderDashNotes(data, elementId, type) {
    if (!data || data.length === 0) {
        document.getElementById(elementId).innerHTML = `<li><span class="dash-empty">등록된 원고가 없습니다.</span></li>`;
        return;
    }
    let listHTML = data.slice(0, 10).map(item => {
        let statusTxt = item.status === 'uploaded' ? '업로드' : '작성중';
        let statusColor = item.status === 'uploaded' ? '#166534' : '#64748b';
        let statusBg = item.status === 'uploaded' ? '#dcfce7' : '#f1f5f9';
        let statusBadge = `<span style="background:${statusBg}; color:${statusColor}; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:6px; white-space:nowrap; font-weight:600;">${statusTxt}</span>`;
        return `
        <li onclick="goNoteFromDash('${item.id}', '${type}')" class="dash-hover-bg">
            <span class="dot ${type === 'blog' ? 'success' : 'danger'}"></span>
            <span class="dash-note-title dash-hover-underline">${item.title}</span>
            ${statusBadge}
        </li>`;
    }).join('');
    document.getElementById(elementId).innerHTML = listHTML;
}

window.goNoteFromDash = function(id, type) {
    showPage('notes', document.querySelector('.menu-item[onclick*="notes"]'));
    if (typeof setNoteTab === 'function') setNoteTab(type);
    setTimeout(() => { if (typeof loadDraftContent === 'function') loadDraftContent(id); }, 200);
}
