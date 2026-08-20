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
            loadLabOverviewData(),
            loadTrackedItemsOverview(),
            loadCompetitorBlogOverview()
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
        ['worklog', 'content', 'competitor'].forEach(setRefreshTime);
        isDashboardLoaded = true;
    } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
        showToast('대시보드 데이터를 불러오지 못했습니다.', 'error');
    } finally {
        if (loader) loader.style.display = 'none';
    }
};

async function fetchDashType(type) {
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
    } else if (type === 'trackeditems') {
        await loadTrackedItemsOverview();
    } else if (type === 'competitorblog') {
        await loadCompetitorBlogOverview();
    }
}

// 카드당 새로고침 버튼 1개만 두기로 해서(2026-08-14), "업무 진행 상황"/"콘텐츠 진행 상황"처럼
// 버튼 하나가 그 안의 여러 데이터 타입(예: tasks+prodlogs)을 한꺼번에 불러오는 경우를
// groupTypes로 지원한다 — 안 넘기면 type 하나만 불러오던 기존 동작 그대로.
window.refreshDashData = async function(type, groupTypes) {
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
        await Promise.all((groupTypes || [type]).map(fetchDashType));
        setRefreshTime(type);
    } catch (error) {
        console.error('새로고침 오류:', error);
        showToast('새로고침 중 오류가 발생했습니다.', 'error');
    } finally {
        if (iconEl) iconEl.classList.remove('fa-spin');
    }
};

const LAB_BASE_URL = 'https://enorangekid.github.io/energuard-lab/';

// 키워드 현황 카드 스토어 스위치 — 에너가드랩 rank-tracker.html의 BUILTIN_STORES와 동일한 값.
// product_rankings(관심 상품/상품명 마스터)엔 store 구분이 없어서(에너가드랩 원본도 마찬가지)
// 스토어를 바꿔도 그 부분은 두 스토어 상품이 섞여 보일 수 있다 — 원본과 동일한 한계.
//
// 2026-08-14: 당장은 한국단열만 쓰기로 하고 에너가드컴퍼니는 안 부르기로 함 — 나중에 다시 켤 수도
// 있어서 스위치 UI·로직은 그대로 두고 KEYWORD_STORE_SWITCH_ENABLED만 꺼둔다(index.html의
// #dash-keyword-store-select도 같이 숨겨져 있음). 다시 켜려면 이 값을 true로, select의
// style="display:none"만 지우면 됨.
const KEYWORD_STORE_SWITCH_ENABLED = false;
const KEYWORD_STORES = ['한국 단열', '에너가드컴퍼니'];
let selectedKeywordStore = (KEYWORD_STORE_SWITCH_ENABLED && localStorage.getItem('dashKeywordStore')) || KEYWORD_STORES[0];
if (!KEYWORD_STORES.includes(selectedKeywordStore)) selectedKeywordStore = KEYWORD_STORES[0];

window.switchKeywordStore = function(store) {
    if (!KEYWORD_STORE_SWITCH_ENABLED || !KEYWORD_STORES.includes(store) || store === selectedKeywordStore) return;
    selectedKeywordStore = store;
    localStorage.setItem('dashKeywordStore', store);
    setLabCardState('dash-keyword-metrics', '<div class="dash-lab-loading">키워드 데이터를 불러오고 있습니다.</div>');
    const wrap = document.getElementById('dash-keyword-movers-wrap');
    if (wrap) wrap.innerHTML = '';
    loadKeywordOverview();
};

window.openEnerguardLabPage = function(path) {
    window.open(`${LAB_BASE_URL}${path || ''}`, '_blank', 'noopener');
};

// 카드 섹션 접기/펼치기 공용 토글. 매출 성과는 민감정보라 기본 접힘, 나머지는 기본 펼침.
window.toggleDashCard = function(bodyId, iconId) {
    const el = document.getElementById(bodyId);
    const icon = document.getElementById(iconId);
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

const LAB_HELP_BASE_TEXT = {
    'dash-keyword-period': '내 스토어 상품이 등록 키워드에서 몇 위에 노출되는지 추적한 현황입니다.',
    'dash-blogrank-period': '내 블로그 포스팅이 등록 키워드에서 몇 위에 노출되는지 진단한 현황입니다.',
};

function setLabPeriod(targetId, text) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const base = LAB_HELP_BASE_TEXT[targetId];
    el.title = base ? `${base}\n${text}` : text;
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

// 판매 성과 채널 스위치 — 스마트스토어/쿠팡을 합산하지 않고 골라서 본다(2026-08-14).
const SALES_SOURCES = ['naver', 'coupang'];
let selectedSalesSource = localStorage.getItem('dashSalesSource') || SALES_SOURCES[0];
if (!SALES_SOURCES.includes(selectedSalesSource)) selectedSalesSource = SALES_SOURCES[0];

window.switchSalesSource = function(source) {
    if (!SALES_SOURCES.includes(source) || source === selectedSalesSource) return;
    selectedSalesSource = source;
    localStorage.setItem('dashSalesSource', source);
    setLabCardState('dash-sales-metrics', '<div class="dash-lab-loading">매출 데이터를 불러오고 있습니다.</div>');
    const extrasWrap = document.getElementById('dash-sales-extras-wrap');
    if (extrasWrap) extrasWrap.innerHTML = '';
    loadSalesOverview();
};

// 매출 데이터는 naver_product_daily 테이블에 anon/authenticated 읽기 정책이 없어서(네이버 API
// 인증정보가 서버 쪽에만 있는 구조) 클라이언트에서 테이블을 직접 읽을 수 없다 — 에너가드랩의
// sales-analysis.html이 쓰는 것과 동일한 naver-ad-report 엣지함수를 그대로 호출해서 받는다
// (2026-08-12, 직접 테이블 조회로는 데이터가 항상 비어있던 문제를 고침).
// naverStatSummary 액션은 daily(일별 합계)뿐 아니라 products/visitPaths/searchTerms(그 기간
// 집계)까지 한번에 돌려준다 — 요약리포트/유입경로 비율/전월전년 무버/핵심지표TOP3 전부 이
// 한 액션의 결과만으로 만들 수 있다.
async function fetchNaverStatSummaryFull(dateFrom, dateTo) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/naver-ad-report`, {
        method: 'POST',
        headers: await getAuthenticatedFunctionHeaders(),
        body: JSON.stringify({ action: 'naverStatSummary', dateFrom, dateTo }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) throw new Error(body.error || `매출 데이터 조회 실패 (${res.status})`);
    return body;
}

async function fetchCoupangSalesRows(dateFrom, dateTo) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/naver-ad-report`, {
        method: 'POST',
        headers: await getAuthenticatedFunctionHeaders(),
        body: JSON.stringify({ action: 'coupangSalesSummary', dateFrom, dateTo }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) throw new Error(body.error || `쿠팡 매출 조회 실패 (${res.status})`);
    return Array.isArray(body.items) ? body.items : [];
}

async function loadSalesOverview() {
    const sourceSelect = document.getElementById('dash-sales-source-select');
    if (sourceSelect && sourceSelect.value !== selectedSalesSource) sourceSelect.value = selectedSalesSource;
    if (selectedSalesSource === 'coupang') await loadCoupangSalesOverview();
    else await loadNaverSalesOverview();
}

function coupangSalesTotals(items) {
    return (items || []).reduce((acc, row) => {
        acc.sales += Number(row.sales) || 0;
        acc.orders += Number(row.orders) || 0;
        acc.visitors += Number(row.visitors) || 0;
        acc.views += Number(row.views) || 0;
        acc.qty += Number(row.qty) || 0;
        return acc;
    }, { sales: 0, orders: 0, visitors: 0, views: 0, qty: 0 });
}

// 요약리포트(일별 요약, coupangSalesSummary) — 네이버와 똑같이 날짜 범위로 이번달/전월/전년을
// 계산할 수 있다(coupang_sales_daily도 매일 쌓이는 일별 테이블이라).
// 데이터는 수동 업로드라 이번 달 자료가 아직 없을 수 있음 — 실제로 데이터가 있는 가장
// 최근 달을 "이번 기간"으로 잡는다.
async function loadCoupangSalesOverview() {
    const extrasWrap = document.getElementById('dash-sales-extras-wrap');
    if (extrasWrap) extrasWrap.innerHTML = '';

    const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const probeFrom = dateDaysBefore(today, 119);
    const probeItems = await fetchCoupangSalesRows(probeFrom, today).catch(() => []);

    const monthSet = new Set(probeItems.map(row => String(row.date || '').slice(0, 7)).filter(Boolean));
    if (!monthSet.size) {
        setLabCardState('dash-sales-metrics', '<div class="dash-lab-empty">매출분석에서 판매 자료를 먼저 수집해 주세요.</div>');
        renderCoupangSalesExtras(null);
        return;
    }
    const currentMonth = [...monthSet].sort().reverse()[0];
    const [cy, cm] = currentMonth.split('-').map(Number);
    const monthStart = `${currentMonth}-01`;
    const monthEndStr = new Date(Date.UTC(cy, cm, 0)).toISOString().slice(0, 10);
    const monthEnd = monthEndStr < today ? monthEndStr : today;

    const ranges = salesCompareRanges(monthStart, monthEnd);
    const [currentItems, prevItemsRaw, yearItemsRaw] = await Promise.all([
        fetchCoupangSalesRows(monthStart, monthEnd),
        fetchCoupangSalesRows(ranges.prev.from, ranges.prev.to).catch(() => []),
        fetchCoupangSalesRows(ranges.year.from, ranges.year.to).catch(() => []),
    ]);
    const prevTotals = prevItemsRaw.length ? coupangSalesTotals(prevItemsRaw) : null;
    const yearTotals = yearItemsRaw.length ? coupangSalesTotals(yearItemsRaw) : null;
    const curTotals = coupangSalesTotals(currentItems);

    const conv = curTotals.views ? curTotals.orders / curTotals.views * 100 : 0;
    const prevConv = prevTotals && prevTotals.views ? prevTotals.orders / prevTotals.views * 100 : null;
    const yearConv = yearTotals && yearTotals.views ? yearTotals.orders / yearTotals.views * 100 : null;
    const avgOrder = curTotals.orders ? curTotals.sales / curTotals.orders : 0;
    const prevAvgOrder = prevTotals && prevTotals.orders ? prevTotals.sales / prevTotals.orders : null;
    const yearAvgOrder = yearTotals && yearTotals.orders ? yearTotals.sales / yearTotals.orders : null;

    const tipLabel = (label, tip) => label;

    setLabCardState('dash-sales-metrics', [
        dashboardMetric(tipLabel('쿠팡 매출', '일별 요약 기준'), dashboardMoney(curTotals.sales), salesDualChip(curTotals.sales, prevTotals?.sales, yearTotals?.sales), 'accent'),
        dashboardMetric(tipLabel('주문', `판매량 ${curTotals.qty.toLocaleString('ko-KR')}개`), `${curTotals.orders.toLocaleString('ko-KR')}건`, salesDualChip(curTotals.orders, prevTotals?.orders, yearTotals?.orders)),
        dashboardMetric(tipLabel('방문자', `조회 ${curTotals.views.toLocaleString('ko-KR')}회`), `${curTotals.visitors.toLocaleString('ko-KR')}명`, salesDualChip(curTotals.visitors, prevTotals?.visitors, yearTotals?.visitors)),
        dashboardMetric(tipLabel('구매전환율', '주문 ÷ 조회'), dashboardPercent(conv), salesDualChip(conv, prevConv, yearConv, true)),
        dashboardMetric(tipLabel('객단가', '매출 ÷ 주문'), dashboardMoney(avgOrder), salesDualChip(avgOrder, prevAvgOrder, yearAvgOrder)),
    ].join(''));

    renderCoupangSalesExtras(await loadCoupangItemCompareData());
}

// ==== 광고 성과 — 판매 성과와 같은 스마트스토어/쿠팡 채널 전환 + 전월·전년 이중비교 구조를
// 그대로 재사용한다(2026-08-14). 네이버는 naver-ad-report의 campaignSummary(action:"summary")가
// 캠페인 합계를 서버에서 이미 집계해 주고(naver_ad_campaign_daily, 매일 새벽 cron이 자동 수집),
// 쿠팡은 coupangSummary가 일자×광고그룹 원본 행만 주므로 sales-analysis.html의
// groupCoupangAdRows/finalizeCoupangAdMetrics와 동일한 방식으로 클라이언트에서 합산한다.
const AD_SOURCES = ['naver', 'coupang'];
let selectedAdSource = localStorage.getItem('dashAdSource') || AD_SOURCES[0];
if (!AD_SOURCES.includes(selectedAdSource)) selectedAdSource = AD_SOURCES[0];

window.switchAdSource = function(source) {
    if (!AD_SOURCES.includes(source) || source === selectedAdSource) return;
    selectedAdSource = source;
    localStorage.setItem('dashAdSource', source);
    setLabCardState('dash-ads-metrics', '<div class="dash-lab-loading">광고 데이터를 불러오고 있습니다.</div>');
    lastAdTableSections = null;
    renderAdTableSection();
    loadAdsOverview();
};

async function fetchNaverAdSummary(dateFrom, dateTo) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/naver-ad-report`, {
        method: 'POST',
        headers: await getAuthenticatedFunctionHeaders(),
        body: JSON.stringify({ action: 'summary', store: '한국 단열', dateFrom, dateTo }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) throw new Error(body.error || `광고 데이터 조회 실패 (${res.status})`);
    return body;
}

async function fetchCoupangAdRows(dateFrom, dateTo) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/naver-ad-report`, {
        method: 'POST',
        headers: await getAuthenticatedFunctionHeaders(),
        body: JSON.stringify({ action: 'coupangSummary', dateFrom, dateTo }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) throw new Error(body.error || `쿠팡 광고 조회 실패 (${res.status})`);
    return Array.isArray(body.items) ? body.items : [];
}

function coupangAdTotals(items) {
    return (items || []).reduce((acc, row) => {
        acc.impressions += Number(row.impressions) || 0;
        acc.clicks += Number(row.clicks) || 0;
        acc.cost += Number(row.cost) || 0;
        acc.purchaseConversions += Number(row.orders) || 0;
        acc.purchaseSales += Number(row.sales) || 0;
        return acc;
    }, { impressions: 0, clicks: 0, cost: 0, purchaseConversions: 0, purchaseSales: 0 });
}

// 캠페인/광고그룹별 상세 표(sales-analysis.html의 adsTableHtml 이식) — 네이버 campaignSummary의
// items(캠페인별 합계)와 쿠팡을 광고그룹 단위로 합산한 결과를 같은 컬럼 모양으로 맞춘다.
const NAVER_AD_TYPE_LABELS = { WEB_SITE: '파워링크', SHOPPING: '쇼핑검색', POWER_CONTENTS: '파워컨텐츠', BRAND_SEARCH: '브랜드검색' };
function naverAdTypeLabel(type) { return NAVER_AD_TYPE_LABELS[type] || type || '-'; }

const AD_TABLE_COLUMNS = [
    { label: '유형', render: r => escapeAdminHtml(r.type) },
    { label: '이름', render: r => `<span title="${escapeAdminHtml(r.name)}">${escapeAdminHtml(r.name)}</span>` },
    { label: '노출', num: true, value: r => r.impressions || 0, fmt: v => v.toLocaleString('ko-KR') },
    { label: '클릭', num: true, value: r => r.clicks || 0, fmt: v => v.toLocaleString('ko-KR') },
    { label: '클릭률', num: true, rate: true, value: r => r.impressions ? r.clicks / r.impressions * 100 : 0, fmt: v => dashboardPercent(v) },
    { label: '평균 클릭비', num: true, value: r => r.clicks ? r.cost / r.clicks : 0, fmt: v => dashboardMoney(v) },
    { label: '전환수', num: true, value: r => r.purchaseConversions || 0, fmt: v => v.toLocaleString('ko-KR') },
    { label: '전환율', num: true, rate: true, value: r => r.clicks ? (r.purchaseConversions || 0) / r.clicks * 100 : 0, fmt: v => dashboardPercent(v) },
    { label: '광고비', num: true, strong: true, value: r => r.cost || 0, fmt: v => dashboardMoney(v) },
    { label: '전환 매출액', num: true, value: r => r.purchaseSales || 0, fmt: v => dashboardMoney(v) },
    { label: '광고수익률', num: true, strong: true, rate: true, value: r => r.cost ? (r.purchaseSales || 0) / r.cost * 100 : 0, fmt: v => dashboardPercent(v) },
];

// 광고성과 캠페인/광고그룹별 상세 표의 전월/전년 비교 토글 — 판매성과 movers에 이미 적용한
// salesMoverPeriod와 같은 개념(에너가드랩 광고분석 탭의 adCmpPeriodToggleHtml과 동일)이지만,
// 광고 요약 타일은 전월+전년을 한번에 다 보여주는 구조라 별도 상태로 둔다(2026-08-14).
let adTablePeriod = 'prev';
let lastAdTableSections = null; // { current, prev, year, matchKeyFn }

window.setAdTablePeriod = function(key) {
    if (adTablePeriod === key || !lastAdTableSections) return;
    adTablePeriod = key;
    renderAdTableSection();
};
function adTablePeriodToggleHtml() {
    const opt = (key, label) => `<button type="button" class="dash-period-toggle-btn${adTablePeriod === key ? ' on' : ''}" onclick="setAdTablePeriod('${key}')">${label}</button>`;
    return `<div class="dash-period-toggle">${opt('prev', '전월')}${opt('year', '전년')}</div>`;
}
function renderAdTableSection() {
    const titleEl = document.getElementById('dash-ads-table-title');
    if (titleEl) titleEl.innerHTML = `<span>캠페인·광고그룹별 상세</span>${lastAdTableSections ? adTablePeriodToggleHtml() : ''}`;
    const wrap = document.getElementById('dash-ads-table-wrap');
    if (!lastAdTableSections) {
        if (wrap) wrap.innerHTML = '';
        return;
    }
    const { current, prev, year, matchKeyFn } = lastAdTableSections;
    renderReportTable('dash-ads-table-wrap', AD_TABLE_COLUMNS, current, adTablePeriod === 'year' ? year : prev, matchKeyFn);
}

function groupCoupangAdRowsForTable(items) {
    const map = new Map();
    (items || []).forEach(row => {
        const key = row.adGroup || row.campaign || '(광고그룹 없음)';
        if (!map.has(key)) {
            map.set(key, { type: row.adType || '-', name: key, impressions: 0, clicks: 0, cost: 0, purchaseConversions: 0, purchaseSales: 0 });
        }
        const item = map.get(key);
        item.impressions += Number(row.impressions) || 0;
        item.clicks += Number(row.clicks) || 0;
        item.cost += Number(row.cost) || 0;
        item.purchaseConversions += Number(row.orders) || 0;
        item.purchaseSales += Number(row.sales) || 0;
    });
    return [...map.values()].sort((a, b) => b.cost - a.cost);
}

async function loadAdsOverview() {
    const sourceSelect = document.getElementById('dash-ads-source-select');
    if (sourceSelect && sourceSelect.value !== selectedAdSource) sourceSelect.value = selectedAdSource;
    if (selectedAdSource === 'coupang') await loadCoupangAdsOverview();
    else await loadNaverAdsOverview();
}

// 네이버 광고는 매일 새벽 cron이 자동 수집하므로(어제까지) 쿠팡처럼 "데이터 있는 달 찾기" 없이
// 바로 이번 달을 쓴다 — 수집 전이면 total이 전부 0으로 와서 아래 빈 상태 분기로 빠진다.
async function loadNaverAdsOverview() {
    const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const monthStart = `${today.slice(0, 7)}-01`;
    const monthEnd = today;
    const ranges = salesCompareRanges(monthStart, monthEnd);
    const [current, prevRaw, yearRaw] = await Promise.all([
        fetchNaverAdSummary(monthStart, monthEnd),
        fetchNaverAdSummary(ranges.prev.from, ranges.prev.to).catch(() => null),
        fetchNaverAdSummary(ranges.year.from, ranges.year.to).catch(() => null),
    ]);
    if (!current?.total || (!current.total.cost && !current.total.impressions && !current.count)) {
        setLabCardState('dash-ads-metrics', '<div class="dash-lab-empty">에너가드랩에서 광고 데이터를 먼저 수집해 주세요.</div>');
        lastAdTableSections = null;
        renderAdTableSection();
        return;
    }
    const prev = prevRaw?.total && prevRaw.count ? prevRaw.total : null;
    const year = yearRaw?.total && yearRaw.count ? yearRaw.total : null;
    renderAdMetrics(current.total, prev, year);
    const naverAdItems = (current.items || []).map(item => ({ ...item, type: naverAdTypeLabel(item.type) }));
    lastAdTableSections = {
        current: naverAdItems,
        prev: prevRaw?.items?.length ? prevRaw.items : null,
        year: yearRaw?.items?.length ? yearRaw.items : null,
        matchKeyFn: r => r.name,
    };
    renderAdTableSection();
}

// 쿠팡 광고는 Wing "광고 보고서" 수동 업로드라 이번 달 자료가 아직 없을 수 있음 — 쿠팡 매출
// 카드(loadCoupangSalesOverview)와 같은 방식으로 실제 데이터가 있는 가장 최근 달을 찾는다.
async function loadCoupangAdsOverview() {
    const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const probeFrom = dateDaysBefore(today, 119);
    const probeItems = await fetchCoupangAdRows(probeFrom, today).catch(() => []);
    const monthSet = new Set(probeItems.map(row => String(row.date || '').slice(0, 7)).filter(Boolean));
    if (!monthSet.size) {
        setLabCardState('dash-ads-metrics', '<div class="dash-lab-empty">매출분석에서 쿠팡 광고 자료를 먼저 업로드해 주세요.</div>');
        lastAdTableSections = null;
        renderAdTableSection();
        return;
    }
    const currentMonth = [...monthSet].sort().reverse()[0];
    const [cy, cm] = currentMonth.split('-').map(Number);
    const monthStart = `${currentMonth}-01`;
    const monthEndStr = new Date(Date.UTC(cy, cm, 0)).toISOString().slice(0, 10);
    const monthEnd = monthEndStr < today ? monthEndStr : today;
    const ranges = salesCompareRanges(monthStart, monthEnd);
    const [curItems, prevItems, yearItems] = await Promise.all([
        fetchCoupangAdRows(monthStart, monthEnd),
        fetchCoupangAdRows(ranges.prev.from, ranges.prev.to).catch(() => []),
        fetchCoupangAdRows(ranges.year.from, ranges.year.to).catch(() => []),
    ]);
    const cur = coupangAdTotals(curItems);
    const prev = prevItems.length ? coupangAdTotals(prevItems) : null;
    const year = yearItems.length ? coupangAdTotals(yearItems) : null;
    renderAdMetrics(cur, prev, year);
    lastAdTableSections = {
        current: groupCoupangAdRowsForTable(curItems),
        prev: prevItems.length ? groupCoupangAdRowsForTable(prevItems) : null,
        year: yearItems.length ? groupCoupangAdRowsForTable(yearItems) : null,
        matchKeyFn: r => r.name,
    };
    renderAdTableSection();
}

function renderAdMetrics(cur, prev, year) {
    const convRate = t => t && t.clicks ? (t.purchaseConversions || 0) / t.clicks * 100 : 0;
    const roas = t => t && t.cost ? (t.purchaseSales || 0) / t.cost * 100 : 0;
    const cpa = t => t && t.purchaseConversions ? t.cost / t.purchaseConversions : 0;
    const curConv = convRate(cur), prevConv = prev ? convRate(prev) : null, yearConv = year ? convRate(year) : null;
    const curRoas = roas(cur), prevRoas = prev ? roas(prev) : null, yearRoas = year ? roas(year) : null;
    const curCpa = cpa(cur), prevCpa = prev ? cpa(prev) : null, yearCpa = year ? cpa(year) : null;
    setLabCardState('dash-ads-metrics', [
        dashboardMetric('광고비', dashboardMoney(cur.cost), salesDualChip(cur.cost, prev?.cost, year?.cost), 'accent'),
        dashboardMetric('클릭수', `${(cur.clicks || 0).toLocaleString('ko-KR')}회`, salesDualChip(cur.clicks, prev?.clicks, year?.clicks)),
        dashboardMetric('전환율', dashboardPercent(curConv), salesDualChip(curConv, prevConv, yearConv, true)),
        dashboardMetric('광고수익률', dashboardPercent(curRoas), salesDualChip(curRoas, prevRoas, yearRoas, true)),
        dashboardMetric('전환당 비용', dashboardMoney(curCpa), salesDualChip(curCpa, prevCpa, yearCpa)),
    ].join(''));
}

// ---- 판매 성과(쿠팡) 상품별 확장 — 에너가드랩의 coupangItemSummary(수동 업로드 스냅샷) 구조를
// 그대로 옮긴다. 네이버(매일 자동 적재되는 일별 테이블)와 달리 쿠팡 상품별 실적은 Wing "셀러
// 인사이트 상품별" 엑셀을 수동 업로드한 스냅샷 단위로만 존재해서, 날짜 범위 계산이 아니라
// "가장 최근 스냅샷 / 그 이전 스냅샷 / 1년 전에 가장 가까운 스냅샷(45일 이내)"을 고르는 방식이다.
async function fetchCoupangItemPeriods() {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/naver-ad-report`, {
        method: 'POST',
        headers: await getAuthenticatedFunctionHeaders(),
        body: JSON.stringify({ action: 'coupangItemPeriods' }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) return [];
    return Array.isArray(body.periods) ? body.periods : [];
}
async function fetchCoupangItemSummary(periodFrom, periodTo) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/naver-ad-report`, {
        method: 'POST',
        headers: await getAuthenticatedFunctionHeaders(),
        body: JSON.stringify({ action: 'coupangItemSummary', periodFrom, periodTo }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) return [];
    return Array.isArray(body.items) ? body.items : [];
}
async function fetchCoupangProductMap() {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/naver-ad-report`, {
        method: 'POST',
        headers: await getAuthenticatedFunctionHeaders(),
        body: JSON.stringify({ action: 'coupangProductMapAll' }),
    });
    const body = await res.json().catch(() => ({}));
    const map = new Map();
    if (res.ok && Array.isArray(body.items)) body.items.forEach(row => { if (row.optionId) map.set(row.optionId, row); });
    return map;
}

async function loadCoupangItemCompareData() {
    const periods = await fetchCoupangItemPeriods();
    if (!periods.length) return null;
    const latestPeriod = periods[0];
    const prevPeriod = periods[1] || null;

    const yearTarget = new Date(latestPeriod.to);
    yearTarget.setFullYear(yearTarget.getFullYear() - 1);
    let yearPeriod = null;
    let yearDiffDays = Infinity;
    periods.forEach((p, i) => {
        if (i === 0) return;
        const diff = Math.abs(new Date(p.to) - yearTarget) / 86400000;
        if (diff < yearDiffDays) { yearDiffDays = diff; yearPeriod = p; }
    });
    if (yearDiffDays > 45) yearPeriod = null;

    const [latestItems, prevItems, yearItems, productMap] = await Promise.all([
        fetchCoupangItemSummary(latestPeriod.from, latestPeriod.to),
        prevPeriod ? fetchCoupangItemSummary(prevPeriod.from, prevPeriod.to) : Promise.resolve([]),
        yearPeriod ? fetchCoupangItemSummary(yearPeriod.from, yearPeriod.to) : Promise.resolve([]),
        fetchCoupangProductMap(),
    ]);
    return { latestPeriod, latestItems, prevPeriod, prevItems, yearPeriod, yearItems, productMap };
}

const coupangMoverName = item => item.optionName || item.productName || '-';
function coupangSearchUrl(name) {
    const q = String(name || '').trim();
    return q ? `https://www.coupang.com/np/search?q=${encodeURIComponent(q)}` : '';
}
function coupangProductUrl(row, map) {
    const vid = String(row?.optionId || '').trim();
    if (!/^\d+$/.test(vid)) return coupangSearchUrl(row?.productName || row?.optionName);
    const mapped = map.get(vid);
    const pid = mapped?.productId && /^\d+$/.test(mapped.productId) ? mapped.productId : '0';
    return `https://www.coupang.com/vp/products/${pid}?vendorItemId=${vid}`;
}
const fmtPeriodRange = p => (p ? `${p.from} ~ ${p.to}` : '');

function renderCoupangSalesExtras(data) {
    lastSalesExtrasData = data;
    const wrap = document.getElementById('dash-sales-extras-wrap');
    if (!wrap) return;
    if (!data || !data.latestPeriod) {
        wrap.innerHTML = '<div class="dash-lab-empty">쿠팡 Wing "셀러 인사이트 상품별" 스냅샷을 먼저 업로드해 주세요.</div>';
        return;
    }
    const { latestPeriod, latestItems, prevPeriod, prevItems, yearPeriod, yearItems, productMap } = data;
    const comparePeriod = salesMoverPeriod === 'year' ? yearPeriod : prevPeriod;
    const compareItems = salesMoverPeriod === 'year' ? yearItems : prevItems;
    const periodLabel = salesMoverPeriod === 'year' ? '전년' : '전월';
    const urlFn = item => coupangProductUrl(item, productMap);

    let moversHtml;
    if (!comparePeriod) {
        moversHtml = '<div class="dash-lab-empty">비교할 스냅샷이 없습니다.</div>';
    } else {
        const salesMoves = buildSalesMovers(latestItems, compareItems, r => r.optionId, 'sales', SALES_MOVER_MIN_SALES, KEYWORD_MOVER_LIMIT);
        const viewMoves = buildSalesMovers(latestItems, compareItems, r => r.optionId, 'views', SALES_MOVER_MIN_VISITS, KEYWORD_MOVER_LIMIT);
        const viewFmt = v => `${v.toLocaleString('ko-KR')}회`;
        const cards = [
            dashMoverCardHtml(`매출 상승 (${periodLabel})`, moverSlice('coupang-sales-up', salesMoves.rising).map((m, i) => dashSalesMoverRowHtml(m, i + 1, coupangMoverName, dashboardMoney, urlFn)).join('') + moverMoreBtnHtml('coupang-sales-up', salesMoves.rising.length, '옵션 더보기')),
            dashMoverCardHtml(`매출 하락 (${periodLabel})`, moverSlice('coupang-sales-down', salesMoves.falling).map((m, i) => dashSalesMoverRowHtml(m, i + 1, coupangMoverName, dashboardMoney, urlFn)).join('') + moverMoreBtnHtml('coupang-sales-down', salesMoves.falling.length, '옵션 더보기')),
            dashMoverCardHtml(`조회 상승 (${periodLabel})`, moverSlice('coupang-view-up', viewMoves.rising).map((m, i) => dashSalesMoverRowHtml(m, i + 1, coupangMoverName, viewFmt, urlFn)).join('') + moverMoreBtnHtml('coupang-view-up', viewMoves.rising.length, '옵션 더보기')),
            dashMoverCardHtml(`조회 하락 (${periodLabel})`, moverSlice('coupang-view-down', viewMoves.falling).map((m, i) => dashSalesMoverRowHtml(m, i + 1, coupangMoverName, viewFmt, urlFn)).join('') + moverMoreBtnHtml('coupang-view-down', viewMoves.falling.length, '옵션 더보기')),
        ].join('');
        moversHtml = `<div class="dash-mover-grid">${cards}</div>`;
    }

    const bySales = [...latestItems].sort((a, b) => b.sales - a.sales);
    const byOrders = [...latestItems].sort((a, b) => b.orders - a.orders);
    const top3Html = `<div class="dash-mover-grid dash-mover-grid-2">
        ${dashTop3CardHtml('coupang-top3-sales', '매출 TOP · 옵션', bySales, coupangMoverName, r => r.sales, dashboardMoney, urlFn)}
        ${dashTop3CardHtml('coupang-top3-orders', '주문 TOP · 옵션', byOrders, coupangMoverName, r => r.orders, v => `${v.toLocaleString('ko-KR')}건`, urlFn)}
    </div>`;

    wrap.innerHTML = `
        <div class="dash-sales-section-title">
            <span>매출·조회 상승·하락 (상품별 스냅샷)</span>
            ${salesMoverPeriodToggleHtml()}
        </div>
        <div class="dash-lab-metric-note" style="margin-bottom:10px;">최신 스냅샷 ${fmtPeriodRange(latestPeriod)} vs ${periodLabel} ${fmtPeriodRange(comparePeriod)}</div>
        ${moversHtml}
        <div class="dash-sales-section-title" style="margin-top:20px;">핵심 지표 TOP · 옵션</div>
        ${top3Html}
        <div class="dash-sales-section-title" style="margin-top:20px;">옵션별 상세</div>
        <div id="dash-sales-product-table-wrap"></div>
    `;
    renderReportTable('dash-sales-product-table-wrap', coupangSalesTableColumns(productMap), latestItems, compareItems, r => r.optionId);
}

// ---- 판매 성과(네이버) 확장 — 에너가드랩 sales-analysis.html "요약분석" 탭 포팅 ----
// 유입경로 비율만 네이버 전용이다(쿠팡 데이터엔 방문 경로/채널 구분이 아예 없음). 나머지
// (요약리포트 다중비교·상품별 상승하락·핵심지표TOP)는 쿠팡 쪽도 위에서 별도 구현했다 —
// 다만 쿠팡은 매일 자동 적재되는 일별 테이블이 아니라 수동 업로드 스냅샷 단위라 로직이 다르다.

// 에너가드랩 comparePeriodRanges()와 동일 — "이번 기간"과 같은 길이의 직전 기간(전월),
// 정확히 1년 전 같은 기간(전년)을 UTC 날짜 연산으로 구한다.
function salesCompareRanges(dateFrom, dateTo) {
    const from = new Date(`${dateFrom}T00:00:00Z`);
    const to = new Date(`${dateTo}T00:00:00Z`);
    const dayMs = 86400000;
    const lengthDays = Math.round((to - from) / dayMs) + 1;
    const fmt = d => d.toISOString().slice(0, 10);
    const prevTo = new Date(from.getTime() - dayMs);
    const prevFrom = new Date(prevTo.getTime() - (lengthDays - 1) * dayMs);
    const yearFrom = new Date(from.getTime());
    yearFrom.setUTCFullYear(yearFrom.getUTCFullYear() - 1);
    const yearTo = new Date(to.getTime());
    yearTo.setUTCFullYear(yearTo.getUTCFullYear() - 1);
    return { prev: { from: fmt(prevFrom), to: fmt(prevTo) }, year: { from: fmt(yearFrom), to: fmt(yearTo) } };
}

function salesDailyTotals(data) {
    return (data?.daily || []).reduce((acc, row) => {
        acc.visits += Number(row.visits) || 0;
        acc.payCount += Number(row.payCount) || 0;
        acc.qty += Number(row.qty) || 0;
        acc.salesTotal += Number(row.salesTotal) || 0;
        acc.salesNet += Number(row.salesNet) || 0;
        acc.refundAmount += Number(row.refundAmount) || 0;
        return acc;
    }, { visits: 0, payCount: 0, qty: 0, salesTotal: 0, salesNet: 0, refundAmount: 0 });
}

// 에너가드랩 pctChangeChip/ppChangeChip과 동일한 판정 기준(상대 변화율 / %p).
function salesPctChip(label, cur, prev) {
    if (prev == null) return `<span class="dash-lab-compare muted">${label} 데이터 없음</span>`;
    if (prev === 0) return cur === 0 ? `<span class="dash-lab-compare muted">${label} -</span>` : `<span class="dash-lab-compare up">${label} 신규</span>`;
    const pct = (cur - prev) / prev * 100;
    if (Math.abs(pct) <= 0.05) return `<span class="dash-lab-compare muted">${label} -</span>`;
    return `<span class="dash-lab-compare ${pct > 0 ? 'up' : 'down'}">${label} ${pct > 0 ? '▲' : '▼'}${Math.abs(pct).toFixed(1)}%</span>`;
}
function salesPpChip(label, cur, prev) {
    if (prev == null) return `<span class="dash-lab-compare muted">${label} 데이터 없음</span>`;
    const diff = cur - prev;
    if (Math.abs(diff) <= 0.05) return `<span class="dash-lab-compare muted">${label} -</span>`;
    return `<span class="dash-lab-compare ${diff > 0 ? 'up' : 'down'}">${label} ${diff > 0 ? '▲' : '▼'}${Math.abs(diff).toFixed(1)}%p</span>`;
}
function salesDualChip(cur, prevVal, yearVal, isRate) {
    const fn = isRate ? salesPpChip : salesPctChip;
    return `${fn('전월', cur, prevVal)} ${fn('전년', cur, yearVal)}`;
}

const SALES_MOVER_MIN_PCT = 30;    // 변화율이 이 이상이어야 "급"으로 인정(에너가드랩과 동일)
const SALES_MOVER_MIN_SALES = 10000; // 상품 매출 비교 노이즈 컷(원)
const SALES_MOVER_MIN_VISITS = 10;   // 유입경로 비교 노이즈 컷(회)

// 에너가드랩 buildMovers()와 동일 — 두 기간 다 minFloor 이상인 항목만 대상으로, 변화율
// SALES_MOVER_MIN_PCT 이상만 "상승/하락"으로 채택한다(신규·중단은 성격이 달라 제외).
function buildSalesMovers(curList, prevList, idFn, valueKey, minFloor, limit) {
    const curMap = new Map(curList.map(r => [idFn(r), r]));
    const prevMap = new Map(prevList.map(r => [idFn(r), r]));
    const ids = new Set([...curMap.keys(), ...prevMap.keys()]);
    const moves = [];
    ids.forEach(id => {
        const cur = curMap.get(id);
        const prev = prevMap.get(id);
        const curVal = cur ? Number(cur[valueKey]) || 0 : 0;
        const prevVal = prev ? Number(prev[valueKey]) || 0 : 0;
        if (curVal < minFloor || prevVal < minFloor) return;
        const pct = (curVal - prevVal) / prevVal * 100;
        if (Math.abs(pct) < SALES_MOVER_MIN_PCT) return;
        moves.push({ item: cur, curVal, prevVal, pct });
    });
    return {
        rising: moves.filter(m => m.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, limit),
        falling: moves.filter(m => m.pct < 0).sort((a, b) => a.pct - b.pct).slice(0, limit),
    };
}

const NAVER_STORE_SLUG = 'hkdy';
const salesProductName = item => item.productName || item.productId || '-';
const salesPathName = item => (item.path2 && item.path2 !== '-' ? `${item.path1} › ${item.path2}` : item.path1);
const salesProductUrl = item => (/^\d+$/.test(String(item.productId || '')) ? `https://smartstore.naver.com/${NAVER_STORE_SLUG}/products/${item.productId}` : '');
const salesSearchUrl = term => `${LAB_BASE_URL}naver-rank.html?keyword=${encodeURIComponent(term)}`;

// 상품별 상세 데이터 표(에너가드랩 naverProductDataTableHtml/coupang 옵션별 표 이식) 컬럼 정의.
// 네이버는 결제 기반(환불 추적 있음), 쿠팡은 조회·장바구니 퍼널(스냅샷이라 환불 없음)이라
// 서로 필드가 달라 컬럼 구성도 채널별로 따로 둔다.
function nameLinkCell(name, url) {
    return url ? `<a href="${url}" target="_blank" rel="noopener" title="${name}">${name}</a>` : `<span title="${name}">${name}</span>`;
}
// value/fmt로 나눠둔 컬럼은 비교행(comparRow)에도 같은 value()를 적용해 셀 아래에 전월/전년
// 비교 칩을 붙일 수 있다(dashReportTableHtml 참고) — 이름/링크처럼 비교가 의미없는 컬럼만 render 사용.
const NAVER_SALES_TABLE_COLUMNS = [
    { label: '상품명', render: r => nameLinkCell(salesProductName(r), salesProductUrl(r)) },
    { label: '결제건수', num: true, value: r => r.payCount || 0, fmt: v => `${v.toLocaleString('ko-KR')}건` },
    { label: '수량', num: true, value: r => r.qty || 0, fmt: v => `${v.toLocaleString('ko-KR')}개` },
    { label: '판매금액(총)', num: true, value: r => r.salesTotal || 0, fmt: v => dashboardMoney(v) },
    { label: '환불금액', num: true, value: r => r.refundAmount || 0, fmt: v => dashboardMoney(v) },
    { label: '판매금액(순)', num: true, strong: true, value: r => r.salesNet || 0, fmt: v => dashboardMoney(v) },
    { label: '방문수', num: true, value: r => r.visits || 0, fmt: v => `${v.toLocaleString('ko-KR')}회` },
    { label: '구매전환율', num: true, rate: true, value: r => r.conversion || 0, fmt: v => dashboardPercent(v) },
];
function coupangSalesTableColumns(productMap) {
    return [
        { label: '옵션명', render: r => nameLinkCell(coupangMoverName(r), coupangProductUrl(r, productMap)) },
        { label: '주문건수', num: true, value: r => r.orders || 0, fmt: v => `${v.toLocaleString('ko-KR')}건` },
        { label: '수량', num: true, value: r => r.qty || 0, fmt: v => `${v.toLocaleString('ko-KR')}개` },
        { label: '매출액', num: true, strong: true, value: r => r.sales || 0, fmt: v => dashboardMoney(v) },
        { label: '방문자', num: true, value: r => r.visitors || 0, fmt: v => `${v.toLocaleString('ko-KR')}명` },
        { label: '조회수', num: true, value: r => r.views || 0, fmt: v => `${v.toLocaleString('ko-KR')}회` },
        { label: '장바구니', num: true, value: r => r.carts || 0, fmt: v => `${v.toLocaleString('ko-KR')}건` },
        { label: '구매전환율', num: true, rate: true, value: r => r.views ? (r.orders || 0) / r.views * 100 : 0, fmt: v => dashboardPercent(v) },
    ];
}

function dashSalesMoverRowHtml(m, rank, nameFn, valueFmt, urlFn) {
    const name = nameFn(m.item);
    const url = urlFn ? urlFn(m.item) : '';
    const cls = m.pct > 0 ? 'up' : 'down';
    const deltaText = `${m.pct > 0 ? '▲' : '▼'}${Math.abs(m.pct).toFixed(0)}%`;
    return `<a href="${url || '#'}" target="_blank" rel="noopener" class="dash-mover-row">
        <div class="dash-mover-row-main">
            <span class="dash-mover-rank">${rank}</span>
            <span class="dash-mover-name" title="${name}">${name}</span>
            <span class="dash-mover-delta ${cls}">${deltaText}</span>
        </div>
        <div class="dash-mover-detail">${valueFmt(m.prevVal)} → ${valueFmt(m.curVal)}</div>
    </a>`;
}

function dashTop3RowHtml(item, rank, nameFn, valueFn, valueFmt, urlFn, showShare, total) {
    const name = nameFn(item);
    const url = urlFn ? urlFn(item) : '';
    const value = Number(valueFn(item)) || 0;
    const share = total ? (value / total * 100) : 0;
    return `<a href="${url || '#'}" target="_blank" rel="noopener" class="dash-mover-row">
        <div class="dash-mover-row-main">
            <span class="dash-mover-rank">${rank}</span>
            <span class="dash-mover-name" title="${name}">${name}</span>
            <span class="dash-mover-delta" style="color:var(--text-sub);">${valueFmt(value)}</span>
        </div>
        ${showShare ? `<div class="dash-mover-detail">비중 ${share.toFixed(1)}%</div>` : ''}
    </a>`;
}

function dashTop3CardHtml(key, title, items, nameFn, valueFn, valueFmt, urlFn, showShare = true) {
    const total = showShare ? items.reduce((sum, item) => sum + (Number(valueFn(item)) || 0), 0) : 0;
    const list = moverSlice(key, items);
    const rows = list.length
        ? list.map((item, i) => dashTop3RowHtml(item, i + 1, nameFn, valueFn, valueFmt, urlFn, showShare, total)).join('')
        : '';
    return dashMoverCardHtml(title, rows + moverMoreBtnHtml(key, items.length, '상품 더보기'));
}

// 유입경로(path1›path2) 채널별 방문수 비율 — 에너가드랩 CHANNEL_RULES/classifyChannel/
// naverVisitChannelBarHtml을 그대로 옮긴 것(색상까지 동일, dataviz 스킬로 검증된 팔레트).
const SALES_CHANNEL_RULES = [
    { name: '네이버 통합검색', path1: '네이버 검색', path2: '통합검색' },
    { name: '네이버 가격비교', path1: '네이버 검색', path2: '가격비교 검색' },
    { name: '플러스스토어 검색', path1: '네이버 검색', path2: '네이버플러스스토어 검색' },
    { name: '플러스스토어', path1: '네이버 서비스', path2: '네이버플러스스토어' },
    { name: '네이버광고', path1: '네이버 광고' },
    { name: '직유입', path1: '직유입' },
    { name: '네이버페이', path1: '네이버 서비스', path2: '네이버 페이' },
];
const SALES_CHANNEL_COLORS = ['#16803c', '#5fb87f', '#8f7fe0', '#4a3aa7', '#eda100', '#2a78d6', '#e34948'];
const SALES_CHANNEL_ETC_COLOR = '#c3c2b7';
const normChannelName = s => (s || '').replace(/\s+/g, '');
function classifySalesChannel(row) {
    const p1 = normChannelName(row.path1);
    const p2 = normChannelName(row.path2);
    const rule = SALES_CHANNEL_RULES.find(r => normChannelName(r.path1) === p1 && (!r.path2 || normChannelName(r.path2) === p2));
    return rule ? rule.name : '기타';
}
function dashChannelBarHtml(visitPaths) {
    const order = SALES_CHANNEL_RULES.map(r => r.name).concat(['기타']);
    const colors = SALES_CHANNEL_COLORS.concat([SALES_CHANNEL_ETC_COLOR]);
    const totals = new Map(order.map(name => [name, 0]));
    (visitPaths || []).forEach(row => {
        const visits = Number(row.visits) || 0;
        const name = classifySalesChannel(row);
        totals.set(name, totals.get(name) + visits);
    });
    const list = order.map((name, i) => ({ name, visits: totals.get(name), color: colors[i] }));
    const total = list.reduce((sum, c) => sum + c.visits, 0);
    if (!total) return '<div class="dash-lab-empty">이 기간에 저장된 유입경로 데이터가 없습니다.</div>';
    const pct = n => Math.round(n / total * 100);
    const segs = list.filter(c => c.visits > 0).sort((a, b) => b.visits - a.visits);
    return `
      <div class="dash-bar-wrap">
        <div class="dash-bar">${segs.map(c => `<span class="dash-bar-seg" style="flex:${c.visits};background:${c.color};" title="${escapeAdminHtml(c.name)} ${c.visits.toLocaleString('ko-KR')}회 (${pct(c.visits)}%)"></span>`).join('')}</div>
        <div class="dash-legend">${segs.map(c => `<span class="dash-legend-item"><span class="dash-legend-dot" style="background:${c.color};"></span>${escapeAdminHtml(c.name)} <b>${c.visits.toLocaleString('ko-KR')}회</b> · ${pct(c.visits)}%</span>`).join('')}</div>
      </div>`;
}

// 전월·전년 무버 카드가 어느 비교기간을 볼지 토글(에너가드랩 salesMoverPeriod와 동일 개념).
let salesMoverPeriod = 'prev';
window.setSalesMoverPeriod = function(key) {
    if (salesMoverPeriod === key || !lastSalesExtrasData) return;
    salesMoverPeriod = key;
    if (selectedSalesSource === 'coupang') renderCoupangSalesExtras(lastSalesExtrasData);
    else renderSalesExtras(lastSalesExtrasData);
};
function salesMoverPeriodToggleHtml() {
    const opt = (key, label) => `<button type="button" class="dash-period-toggle-btn${salesMoverPeriod === key ? ' on' : ''}" onclick="setSalesMoverPeriod('${key}')">${label}</button>`;
    return `<div class="dash-period-toggle">${opt('prev', '전월')}${opt('year', '전년')}</div>`;
}

let lastSalesExtrasData = null;
function renderSalesExtras(data) {
    lastSalesExtrasData = data;
    const wrap = document.getElementById('dash-sales-extras-wrap');
    if (!wrap) return;
    if (!data) { wrap.innerHTML = ''; return; }
    const { current, prevPeriod, yearPeriod } = data;

    const channelBar = dashChannelBarHtml(current.visitPaths);
    const visitFmt = v => `${v.toLocaleString('ko-KR')}회`;

    const comparePeriod = salesMoverPeriod === 'year' ? yearPeriod : prevPeriod;
    let moversHtml;
    if (!comparePeriod) {
        moversHtml = '<div class="dash-lab-empty">비교할 데이터가 없습니다.</div>';
    } else {
        const productMoves = buildSalesMovers(current.products || [], comparePeriod.products || [], r => r.productId, 'salesTotal', SALES_MOVER_MIN_SALES, KEYWORD_MOVER_LIMIT);
        const pathMoves = buildSalesMovers(current.visitPaths || [], comparePeriod.visitPaths || [], r => `${r.path1}|${r.path2}`, 'visits', SALES_MOVER_MIN_VISITS, KEYWORD_MOVER_LIMIT);
        const cards = [
            dashMoverCardHtml('매출 상승', moverSlice('sales-up', productMoves.rising).map((m, i) => dashSalesMoverRowHtml(m, i + 1, salesProductName, dashboardMoney, salesProductUrl)).join('') + moverMoreBtnHtml('sales-up', productMoves.rising.length, '상품 더보기')),
            dashMoverCardHtml('매출 하락', moverSlice('sales-down', productMoves.falling).map((m, i) => dashSalesMoverRowHtml(m, i + 1, salesProductName, dashboardMoney, salesProductUrl)).join('') + moverMoreBtnHtml('sales-down', productMoves.falling.length, '상품 더보기')),
            dashMoverCardHtml('유입 상승', moverSlice('sales-visit-up', pathMoves.rising).map((m, i) => dashSalesMoverRowHtml(m, i + 1, salesPathName, visitFmt)).join('') + moverMoreBtnHtml('sales-visit-up', pathMoves.rising.length, '순위 더보기')),
            dashMoverCardHtml('유입 하락', moverSlice('sales-visit-down', pathMoves.falling).map((m, i) => dashSalesMoverRowHtml(m, i + 1, salesPathName, visitFmt)).join('') + moverMoreBtnHtml('sales-visit-down', pathMoves.falling.length, '순위 더보기')),
        ].join('');
        moversHtml = `<div class="dash-mover-grid">${cards}</div>`;
    }

    const top3Html = `<div class="dash-mover-grid dash-mover-grid-3">
        ${dashTop3CardHtml('sales-top3-product', '매출 TOP · 상품', current.products || [], salesProductName, r => r.salesTotal, dashboardMoney, salesProductUrl)}
        ${dashTop3CardHtml('sales-top3-visit', '방문 TOP · 유입경로', current.visitPaths || [], salesPathName, r => r.visits, visitFmt)}
        ${dashTop3CardHtml('sales-top3-search', '방문 TOP · 검색어', current.searchTerms || [], r => r.term, r => r.visits, visitFmt, salesSearchUrl)}
    </div>`;

    const naverProducts = current.products || [];
    wrap.innerHTML = `
        <div class="dash-sales-section-title">유입경로 비율</div>
        ${channelBar}
        <div class="dash-sales-section-title" style="margin-top:20px;"><span>전월·전년 비교</span>${salesMoverPeriodToggleHtml()}</div>
        ${moversHtml}
        <div class="dash-sales-section-title" style="margin-top:20px;">핵심 지표 TOP3</div>
        ${top3Html}
        <div class="dash-sales-section-title" style="margin-top:20px;">상품별 상세</div>
        <div id="dash-sales-product-table-wrap"></div>
    `;
    renderReportTable('dash-sales-product-table-wrap', NAVER_SALES_TABLE_COLUMNS, naverProducts, comparePeriod?.products, r => r.productId);
}

async function loadNaverSalesOverview() {
    const extrasWrap = document.getElementById('dash-sales-extras-wrap');
    if (extrasWrap) extrasWrap.innerHTML = '';

    const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const probeFrom = dateDaysBefore(today, 119);
    const probe = await fetchNaverStatSummaryFull(probeFrom, today);

    const monthMap = new Map();
    (probe.daily || []).forEach(row => {
        const month = String(row.date || '').slice(0, 7);
        if (!month) return;
        monthMap.set(month, true);
    });
    if (!monthMap.size) {
        setLabCardState('dash-sales-metrics', '<div class="dash-lab-empty">매출분석에서 판매 자료를 먼저 수집해 주세요.</div>');
        renderSalesExtras(null);
        return;
    }
    const currentMonth = [...monthMap.keys()].sort().reverse()[0];
    const [cy, cm] = currentMonth.split('-').map(Number);
    const monthStart = `${currentMonth}-01`;
    const monthEndDate = new Date(Date.UTC(cy, cm, 0));
    const monthEndStr = monthEndDate.toISOString().slice(0, 10);
    const monthEnd = monthEndStr < today ? monthEndStr : today;

    const ranges = salesCompareRanges(monthStart, monthEnd);
    const [current, prevPeriodRaw, yearPeriodRaw] = await Promise.all([
        fetchNaverStatSummaryFull(monthStart, monthEnd),
        fetchNaverStatSummaryFull(ranges.prev.from, ranges.prev.to).catch(() => null),
        fetchNaverStatSummaryFull(ranges.year.from, ranges.year.to).catch(() => null),
    ]);
    const prevPeriod = prevPeriodRaw && prevPeriodRaw.daily && prevPeriodRaw.daily.length ? prevPeriodRaw : null;
    const yearPeriod = yearPeriodRaw && yearPeriodRaw.daily && yearPeriodRaw.daily.length ? yearPeriodRaw : null;

    const curTotals = salesDailyTotals(current);
    const prevTotals = prevPeriod ? salesDailyTotals(prevPeriod) : null;
    const yearTotals = yearPeriod ? salesDailyTotals(yearPeriod) : null;

    const conv = curTotals.visits ? curTotals.payCount / curTotals.visits * 100 : 0;
    const prevConv = prevTotals && prevTotals.visits ? prevTotals.payCount / prevTotals.visits * 100 : null;
    const yearConv = yearTotals && yearTotals.visits ? yearTotals.payCount / yearTotals.visits * 100 : null;
    const avgOrder = curTotals.payCount ? curTotals.salesTotal / curTotals.payCount : 0;
    const prevAvgOrder = prevTotals && prevTotals.payCount ? prevTotals.salesTotal / prevTotals.payCount : null;
    const yearAvgOrder = yearTotals && yearTotals.payCount ? yearTotals.salesTotal / yearTotals.payCount : null;

    const tipLabel = (label, tip) => label;

    setLabCardState('dash-sales-metrics', [
        dashboardMetric(
            tipLabel('네이버 매출(순)', `총 ${dashboardMoney(curTotals.salesTotal)} · 환불 ${dashboardMoney(curTotals.refundAmount)}`),
            dashboardMoney(curTotals.salesNet),
            salesDualChip(curTotals.salesNet, prevTotals?.salesNet, yearTotals?.salesNet),
            'accent'
        ),
        dashboardMetric(
            tipLabel('결제 건수', `수량 ${curTotals.qty.toLocaleString('ko-KR')}개`),
            `${curTotals.payCount.toLocaleString('ko-KR')}건`,
            salesDualChip(curTotals.payCount, prevTotals?.payCount, yearTotals?.payCount)
        ),
        dashboardMetric(
            tipLabel('방문수', '판매분석 기준'),
            `${curTotals.visits.toLocaleString('ko-KR')}회`,
            salesDualChip(curTotals.visits, prevTotals?.visits, yearTotals?.visits)
        ),
        dashboardMetric(
            tipLabel('구매전환율', '결제 ÷ 방문'),
            dashboardPercent(conv),
            salesDualChip(conv, prevConv, yearConv, true)
        ),
        dashboardMetric(
            tipLabel('객단가', '매출 ÷ 결제건수'),
            dashboardMoney(avgOrder),
            salesDualChip(avgOrder, prevAvgOrder, yearAvgOrder)
        ),
    ].join(''));

    renderSalesExtras({ current, prevPeriod, yearPeriod });
}

// 1페이지 판단 기준(rank<=40)은 에너가드랩 rank-tracker.html의 buildDashStats()와 동일하게 맞춘다.
function keywordSummary(rows) {
    const products = new Map();
    const keywordSet = new Set();
    const keywordVolumes = new Map();
    rows.forEach(row => {
        const code = String(row.product_code || '').trim();
        if (code) {
            const current = products.get(code) || { ranks: [] };
            if (row.rank != null) current.ranks.push(Number(row.rank));
            products.set(code, current);
        }
        if (row.keyword) {
            keywordSet.add(row.keyword);
            if (row.search_volume_total != null && !keywordVolumes.has(row.keyword)) {
                keywordVolumes.set(row.keyword, Number(row.search_volume_total) || 0);
            }
        }
    });
    const values = [...products.values()];
    const tracked = values.length;
    const page1 = values.filter(item => item.ranks.some(rank => rank <= 40)).length;
    return {
        tracked,
        top10: values.filter(item => item.ranks.some(rank => rank <= 10)).length,
        page1,
        page1Rate: tracked ? page1 / tracked * 100 : 0,
        left: values.filter(item => !item.ranks.length).length,
        keywordCount: keywordSet.size,
        volumeTotal: [...keywordVolumes.values()].reduce((sum, v) => sum + v, 0)
    };
}

async function fetchKeywordDateRows(date) {
    return fetchPagedRows((from, to) => supabaseClient
        .from('keyword_rank_history')
        .select('product_code,keyword,rank,product_name,product_image,product_link,search_volume_total')
        .eq('store_name', selectedKeywordStore)
        .eq('collected_date', date)
        .range(from, to));
}

// "이탈 상품" 전용 — 에너가드랩 rank-tracker.html처럼 store 전체 이력을 통째로 받는다.
// 최신/직전 2개 날짜만으로는 며칠 전에 이탈한 것까지 못 잡아서, 전체 이력에서
// "예전엔 있었는데 지금은 없는" 조합을 찾아야 한다.
async function fetchKeywordFullHistory() {
    return fetchPagedRows((from, to) => supabaseClient
        .from('keyword_rank_history')
        .select('product_code,keyword,rank,product_name,product_image,product_link,collected_date,max_rank')
        .eq('store_name', selectedKeywordStore)
        .range(from, to));
}

// "관심 상품" — 에너가드랩 rank-tracker.html 랭킹추적 > 상품목록에서 별표(중요체크,
// product_rankings.is_checked)해둔 상품. product_rankings엔 링크가 없어서(memo·is_checked만
// 관리) keyword_rank_history 최신 행에서 링크/이미지 폴백을 가져온다.
async function fetchInterestProducts() {
    const { data, error } = await supabaseClient.from('product_rankings').select('code,name,image_url,memo').eq('is_checked', true);
    if (error) throw error;
    return data || [];
}

function parseProductMemos(raw) {
    if (Array.isArray(raw)) return raw;
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        return [];
    }
}

function buildInterestProducts(checkedRows, historyRows) {
    const latestByCode = new Map();
    historyRows.forEach(row => {
        if (!row.product_code) return;
        const cur = latestByCode.get(row.product_code);
        if (!cur || row.collected_date > cur.collected_date) latestByCode.set(row.product_code, row);
    });
    return checkedRows.map(row => {
        const code = String(row.code || '').trim();
        const fallback = latestByCode.get(code) || {};
        const memos = parseProductMemos(row.memo);
        const latestMemo = memos.length ? memos[memos.length - 1] : null;
        return {
            code,
            name: row.name || fallback.product_name || code,
            image: row.image_url || fallback.product_image || '',
            link: fallback.product_link || '',
            memoDate: latestMemo?.date || '',
            memoText: latestMemo?.text || '',
        };
    }).sort((a, b) => b.memoDate.localeCompare(a.memoDate)).slice(0, KEYWORD_MOVER_LIMIT);
}

function dashInterestRowHtml(product, rank) {
    // 이탈 상품의 알약 칩(.dash-dropout-chip)과 같은 스타일 — 다만 붉은 부분(주 텍스트)엔
    // 날짜를, 흐린 부분(<b>)엔 메모 내용을 넣어 "날짜만 빨간 글씨"로 보이게 한다.
    const detail = product.memoText
        ? `<span class="dash-dropout-chip" title="${escapeAdminHtml(product.memoText)}">${escapeAdminHtml(product.memoDate || '메모')} <b>${escapeAdminHtml(product.memoText)}</b></span>`
        : '<span class="dash-lab-compare muted">메모 없음</span>';
    const safeLink = safeAdminUrl(product.link) || '#';
    return `<a href="${escapeAdminHtml(safeLink)}" target="_blank" rel="noopener" class="dash-mover-row">
        <div class="dash-mover-row-main">
            <span class="dash-mover-rank">${rank}</span>
            ${dashMoverThumbHtml(product.image)}
            <span class="dash-mover-name" title="${escapeAdminHtml(product.name)}">${escapeAdminHtml(product.name)}</span>
        </div>
        <div class="dash-dropout-detail">${detail}</div>
    </a>`;
}

// keyword_rank_history.product_name은 그날 수집 시점에 긁힌 원본 텍스트라 짧게 잘려 있을 때가
// 있다 — 에너가드랩 rank-tracker.html은 통합어드민이 관리하는 product_rankings(정식 상품명)를
// 우선 쓰고 원본은 폴백으로만 쓴다(findProductMaster). 여기서도 code→정식명 매핑을 만들어
// 같은 방식으로 덮어쓴다.
//
// alt_codes(그룹상품 대체 코드)도 같은 마스터로 묶는다 — 네이버 "그룹상품"은 대표 노출 코드가
// 며칠마다 A↔B로 로테이션되는데, 이걸 그대로 두면 "어제는 코드 A로 순위 있었는데 오늘은 코드
// B로 바뀜"이 "코드 A가 이탈했다"는 오탐으로 잡힌다(2026-08-14, 이탈 상품에서 그룹상품이 가짜로
// 뜨는 문제 확인). rank-tracker.html의 canonicalProductCode()처럼, 대체 코드로 잡힌 행도 전부
// 대표 코드로 통일해서 같은 상품으로 취급해야 한다.
//
// alt_codes에 등록 안 된 미등록 그룹상품도 있다 — 상품명이 완전히 똑같은데 코드만 다른
// 경우(product_rankings에 alt_codes로 안 묶여있지만, 한쪽 코드는 마스터로 등록돼 있고 다른
// 쪽 코드는 아예 등록조차 안 된 경우). findProductMaster()의 4단계 폴백(byCodeKeyword→byCode→
// byNameKeyword→byName) 중 이름 매칭(byName)까지 재현해야 이런 것도 같은 상품으로 합쳐진다
// (2026-08-14, "빌트론 열반사 단열재 13T..."가 이름은 같은데 코드 2개로 쪼개져 이탈이 중복/과다
// 집계되던 문제 확인).
async function fetchProductMasterMap() {
    const { data, error } = await supabaseClient.from('product_rankings').select('code,name,alt_codes');
    if (error) throw error;
    const byCode = new Map(); // 대표 코드든 대체 코드든 -> { code: 대표코드, name }
    const byName = new Map();
    (data || []).forEach(row => {
        const code = String(row.code || '').trim();
        if (!code) return;
        const master = { code, name: row.name || '' };
        if (!byCode.has(code)) byCode.set(code, master);
        (row.alt_codes || []).forEach(alt => {
            const altCode = String(alt || '').trim();
            if (altCode && !byCode.has(altCode)) byCode.set(altCode, master);
        });
        const name = String(row.name || '').trim();
        if (name && !byName.has(name)) byName.set(name, master);
    });
    return { byCode, byName };
}

function applyProductMaster(rows, masterMap) {
    if (!masterMap) return;
    const { byCode, byName } = masterMap;
    rows.forEach(row => {
        const code = String(row.product_code || '').trim();
        const name = String(row.product_name || '').trim();
        const master = byCode.get(code) || (name && byName.get(name));
        if (!master) return;
        row.product_code = master.code;
        if (master.name) row.product_name = master.name;
    });
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

// 순위 변동의 "체감 크기" — 에너가드랩 rank-tracker.html의 moveScore()와 동일한 로그 비율 점수.
// 상위권일수록 같은 칸수 이동도 크게 평가한다(+5 스무딩 없으면 1~3위권 출렁임이 과대평가됨).
function dashMoveScore(curRank, delta) {
    if (curRank == null || delta == null || delta === 0) return 0;
    const prevRank = curRank + delta;
    if (prevRank <= 0) return 0;
    return Math.log((prevRank + 5) / (curRank + 5));
}

const KEYWORD_NOTABLE_MIN_STEPS = 3;   // 급상승/급하락 상품 컷 ① 최소 3칸 이동
const KEYWORD_NOTABLE_MIN_SCORE = 0.4; // 급상승/급하락 상품 컷 ② 점수 0.4 이상 (rank-tracker.html과 동일 기준)
const KEYWORD_MOVER_LIMIT = 10;        // 실제로 계산해서 들고 있는 최대 개수(펼쳤을 때 상한) — rank-tracker.html의 MOVER_EXPANDED_LIMIT과 동일

// 무버 카드 "N개까지만 보이고 눌러야 펼쳐지는" 기능 — rank-tracker.html의
// moverExpandedCards/sliceFor/moverMoreBtnHtml을 그대로 옮긴 것. 기본 5개만 보여주고
// 누르면 KEYWORD_MOVER_LIMIT(10)개까지 펼쳐진다. 카드마다 고유 key로 펼침 상태를 따로 기억한다.
const MOVER_EXPANDED = new Set();
const MOVER_COLLAPSED_LIMIT = 5;
let lastKeywordRenderArgs = null;
let lastBlogRenderArgs = null;

function moverSlice(key, list) {
    return MOVER_EXPANDED.has(key) ? list : list.slice(0, MOVER_COLLAPSED_LIMIT);
}

function moverMoreBtnHtml(key, totalCount, label) {
    if (totalCount <= MOVER_COLLAPSED_LIMIT) return '';
    const expanded = MOVER_EXPANDED.has(key);
    return `<button type="button" class="dash-mover-more" onclick="toggleMoverExpand('${key}')">${expanded ? '간략히 보기' : label} <span>${expanded ? '−' : '+'}</span></button>`;
}

window.toggleMoverExpand = function(key) {
    if (MOVER_EXPANDED.has(key)) MOVER_EXPANDED.delete(key); else MOVER_EXPANDED.add(key);
    if (key.startsWith('kw-') && lastKeywordRenderArgs) renderKeywordRankLists(...lastKeywordRenderArgs);
    else if (key.startsWith('blog-') && lastBlogRenderArgs) renderBlogMovers(...lastBlogRenderArgs);
};

// 상세 데이터 표(판매성과 상품별, 광고성과 캠페인/광고그룹별) 공용 렌더러 — 데이터가 많지
// 않아 "더보기" 없이 전부 보여준다. sales-analysis.html의 ad-table처럼 행마다 전월/전년
// 비교 칩을 셀 아래 붙인다 — compareRows/matchKeyFn을 주면 같은 이름(또는 id)의 비교 행을
// 찾아 비교하고, 없으면 칩을 아예 안 그린다(source의 adCompareRowFor와 동일하게 빈 셀 대신
// 조용히 생략 — 표 전체에 "이전 데이터 없음" 문구가 반복되면 너무 시끄러워짐, 2026-08-14).
function dashboardComparisonPp(current, previous) {
    if (previous == null) return '';
    const diff = current - previous;
    if (Math.abs(diff) < 0.05) return '<span class="dash-lab-compare muted">-</span>';
    const up = diff > 0;
    return `<span class="dash-lab-compare ${up ? 'up' : 'down'}">${up ? '▲' : '▼'}${Math.abs(diff).toFixed(1)}%p</span>`;
}
function dashboardComparisonQuiet(current, previous) {
    if (previous == null) return '';
    if (previous === 0) return current === 0 ? '<span class="dash-lab-compare muted">-</span>' : '<span class="dash-lab-compare up">신규</span>';
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 0.05) return '<span class="dash-lab-compare muted">-</span>';
    const up = change > 0;
    return `<span class="dash-lab-compare ${up ? 'up' : 'down'}">${up ? '▲' : '▼'}${Math.abs(change).toFixed(1)}%</span>`;
}

function dashReportTableHtml(columns, rows, compareRows, matchKeyFn) {
    const compareMap = compareRows && matchKeyFn ? new Map(compareRows.map(r => [matchKeyFn(r), r])) : null;
    const theadHtml = columns.map(c => `<th class="${c.num ? 'num' : ''}">${c.label}</th>`).join('');
    const bodyHtml = rows.length
        ? rows.map(row => {
            const compareRow = compareMap ? compareMap.get(matchKeyFn(row)) : null;
            const cells = columns.map(c => {
                if (!c.value) return `<td class="${c.num ? 'num' : ''}${c.strong ? ' strong' : ''}">${c.render(row)}</td>`;
                const cur = c.value(row);
                const chip = compareRow ? (c.rate ? dashboardComparisonPp(cur, c.value(compareRow)) : dashboardComparisonQuiet(cur, c.value(compareRow))) : '';
                return `<td class="${c.num ? 'num' : ''}${c.strong ? ' strong' : ''}">${c.fmt(cur)}${chip ? `<div class="dash-report-table-cmp">${chip}</div>` : ''}</td>`;
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('')
        : `<tr><td colspan="${columns.length}" class="dash-mover-empty">데이터가 없습니다.</td></tr>`;
    return `<div class="dash-report-table-wrap"><table class="dash-report-table"><thead><tr>${theadHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
}

function renderReportTable(wrapId, columns, rows, compareRows, matchKeyFn) {
    const wrap = document.getElementById(wrapId);
    if (wrap) wrap.innerHTML = dashReportTableHtml(columns, rows, compareRows, matchKeyFn);
}

// 에너가드랩 rank-tracker.html의 renderCategoryDashboard() 구조를 그대로 옮긴다:
// 키워드 상승/하락 TOP(키워드 단위 중복 제거), 급상승/급하락 상품(상품당 대표 키워드 1개,
// 최소 이동폭+점수 컷 통과분만), 이탈 상품(전체 이력에서 "예전엔 있었는데 지금은 없는" 조합, 상품별로 묶음).
// 카테고리 탭 없이 한국단열 스토어 전체를 하나로 취급한다(1단계).
function buildKeywordMoverData(latestRows, previousRows, fullHistoryRows) {
    const prevMap = new Map();
    previousRows.forEach(row => {
        if (row.rank == null) return;
        prevMap.set(`${row.product_code}|${row.keyword}`, Number(row.rank));
    });

    const entries = [];
    latestRows.forEach(row => {
        if (row.rank == null) return;
        const key = `${row.product_code}|${row.keyword}`;
        const prevRank = prevMap.get(key);
        if (prevRank == null) return;
        const curRank = Number(row.rank);
        const delta = prevRank - curRank;
        if (delta === 0) return;
        entries.push({
            code: row.product_code,
            keyword: row.keyword || '',
            name: row.product_name || row.product_code,
            image: row.product_image || '',
            link: row.product_link || '',
            curRank,
            delta,
            score: dashMoveScore(curRank, delta),
        });
    });

    // 키워드 상승/하락 TOP — 같은 키워드를 여러 상품이 공유하면 순위가 가장 좋은 것만 남긴다.
    const byKeyword = new Map();
    entries.forEach(entry => {
        const cur = byKeyword.get(entry.keyword);
        if (!cur || entry.curRank < cur.curRank) byKeyword.set(entry.keyword, entry);
    });
    const uniqueByKeyword = [...byKeyword.values()];
    const upMovers = uniqueByKeyword.filter(e => e.score > 0).sort((a, b) => b.score - a.score).slice(0, KEYWORD_MOVER_LIMIT);
    const downMovers = uniqueByKeyword.filter(e => e.score < 0).sort((a, b) => a.score - b.score).slice(0, KEYWORD_MOVER_LIMIT);

    // 급상승/급하락 상품 — 상품별로 가장 크게 움직인 키워드 하나만 대표로 뽑되, 컷 미달이면 아예 뺀다.
    const byProduct = new Map();
    entries.forEach(entry => {
        if (Math.abs(entry.delta) < KEYWORD_NOTABLE_MIN_STEPS || Math.abs(entry.score) < KEYWORD_NOTABLE_MIN_SCORE) return;
        if (!byProduct.has(entry.code)) byProduct.set(entry.code, { best: null, worst: null });
        const slot = byProduct.get(entry.code);
        if (entry.score > 0 && (!slot.best || entry.score > slot.best.score)) slot.best = entry;
        if (entry.score < 0 && (!slot.worst || entry.score < slot.worst.score)) slot.worst = entry;
    });
    const productSlots = [...byProduct.values()];
    const risingProducts = productSlots.filter(p => p.best).map(p => p.best).sort((a, b) => b.score - a.score).slice(0, KEYWORD_MOVER_LIMIT);
    const fallingProducts = productSlots.filter(p => p.worst).map(p => p.worst).sort((a, b) => a.score - b.score).slice(0, KEYWORD_MOVER_LIMIT);

    // 이탈 상품은 다른 무버 리스트와 달리 10개 상한을 두지 않는다 — "더보기"를 누르면 전체가 다 나와야 한다.
    const droppedProducts = groupDroppedKeywordsByProduct(buildDroppedKeywordsFull(fullHistoryRows));

    return { upMovers, downMovers, risingProducts, fallingProducts, droppedProducts };
}

// 에너가드랩 rank-tracker.html의 buildDroppedKeywords()를 그대로 옮긴 것 — 최신/직전 2개
// 수집일만 비교하지 않고, 전체 이력에서 "예전엔 순위가 있었는데 지금은 없는" 조합을 전부 찾는다
// (며칠 전에 이탈한 것도 놓치지 않음). 오늘 아예 시도조차 안 된 키워드(크론 시간 예산 초과 등)는
// 진짜 이탈인지 알 수 없어 collectedKeywords로 걸러낸다.
function buildDroppedKeywordsFull(rows) {
    if (!rows.length) return [];
    const latestDate = rows.reduce((max, row) => (row.collected_date > max ? row.collected_date : max), rows[0].collected_date);
    const collectedKeywords = new Set(rows.filter(row => row.collected_date === latestDate).map(row => row.keyword));
    // 오늘 이 키워드가 실제로 몇 위까지 수집됐는지 — 수집 로직이 최근 바뀌어서(과거엔 1000위까지,
    // 지금은 200위까지) 예전엔 몇백 위로 잡혔던 게 오늘 기준으론 애초에 검색 범위 밖이라 "이탈"이
    // 아니라 "더 이상 확인 자체가 불가능한 데이터"다. 오늘 수집 범위(max_rank)보다 안쪽이었던
    // 것만 진짜 이탈로 본다(2026-08-14, 이탈 상품 과다 집계 문제 확인).
    const todayMaxRank = new Map();
    rows.forEach(row => {
        if (row.collected_date !== latestDate) return;
        const cur = todayMaxRank.get(row.keyword);
        if (row.max_rank != null && (cur == null || row.max_rank > cur)) todayMaxRank.set(row.keyword, row.max_rank);
    });
    const latestKeys = new Set();
    rows.forEach(row => {
        if (row.product_code && row.rank != null && row.collected_date === latestDate) {
            latestKeys.add(`${row.product_code}|${row.keyword}`);
        }
    });
    // 최신 날짜부터 훑어서, 같은 (상품,키워드)를 처음 만나는 시점이 "가장 최근에 순위가 있었던 날"이 되게 한다.
    const sorted = [...rows].sort((a, b) => String(b.collected_date).localeCompare(String(a.collected_date)));
    const seen = new Set();
    const dropped = [];
    sorted.forEach(row => {
        if (!row.product_code || row.rank == null) return;
        if (row.collected_date === latestDate) return;
        if (!collectedKeywords.has(row.keyword)) return;
        const key = `${row.product_code}|${row.keyword}`;
        if (seen.has(key) || latestKeys.has(key)) return;
        seen.add(key);
        const cap = todayMaxRank.get(row.keyword);
        if (cap != null && Number(row.rank) > cap) return;
        dropped.push({
            code: row.product_code,
            keyword: row.keyword || '',
            name: row.product_name || row.product_code,
            image: row.product_image || '',
            link: row.product_link || '',
            prevRank: Number(row.rank),
            prevDate: row.collected_date,
        });
    });
    return dropped;
}

// 상품 코드로 묶어서 "이 상품에서 어떤 키워드들이 언제 이탈했는지" 한 행에 모은다.
function groupDroppedKeywordsByProduct(dropped) {
    const byCode = new Map();
    dropped.forEach(entry => {
        if (!byCode.has(entry.code)) {
            byCode.set(entry.code, { code: entry.code, name: entry.name, image: entry.image, link: entry.link, keywords: [] });
        }
        byCode.get(entry.code).keywords.push(entry);
    });
    return [...byCode.values()]
        .map(product => { product.keywords.sort((a, b) => a.prevRank - b.prevRank); return product; })
        .sort((a, b) => a.keywords[0].prevRank - b.keywords[0].prevRank);
}

function dashMoverDeltaHtml(delta) {
    const up = delta > 0;
    return `<span class="dash-mover-delta ${up ? 'up' : 'down'}">${up ? '▲' : '▼'}${Math.abs(delta)}</span>`;
}

function dashMoverKeywordRowHtml(entry, rank) {
    const prevRank = entry.curRank + entry.delta;
    const href = `${LAB_BASE_URL}naver-rank.html?keyword=${encodeURIComponent(entry.keyword)}`;
    return `<a href="${href}" target="_blank" rel="noopener" class="dash-mover-row">
        <div class="dash-mover-row-main">
            <span class="dash-mover-rank">${rank}</span>
            <span class="dash-mover-name" title="${escapeAdminHtml(entry.keyword)}">${escapeAdminHtml(entry.keyword)}</span>
            ${dashMoverDeltaHtml(entry.delta)}
        </div>
        <div class="dash-mover-detail">${prevRank}위 → ${entry.curRank}위</div>
    </a>`;
}

// 네이버 CDN(blogfiles.pstatic.net, 스마트스토어 이미지 등)은 리퍼러가 찍히면 핫링크 방지로
// 403을 돌려준다 — CSS background-image는 페이지 URL을 리퍼러로 그대로 보내서 항상 깨졌다.
// <img referrerpolicy="no-referrer">로 리퍼러를 아예 안 보내야 로드된다(에너가드랩의
// chip-thumb/post-thumb와 동일한 방식).
function dashMoverThumbHtml(image) {
    const safeImage = safeAdminUrl(image);
    return safeImage
        ? `<img class="dash-mover-thumb" src="${escapeAdminHtml(safeImage)}" loading="lazy" alt="" referrerpolicy="no-referrer">`
        : `<div class="dash-mover-thumb"></div>`;
}

function dashMoverProductRowHtml(entry, rank) {
    const prevRank = entry.curRank + entry.delta;
    const safeLink = safeAdminUrl(entry.link) || '#';
    return `<a href="${escapeAdminHtml(safeLink)}" target="_blank" rel="noopener" class="dash-mover-row">
        <div class="dash-mover-row-main">
            <span class="dash-mover-rank">${rank}</span>
            ${dashMoverThumbHtml(entry.image)}
            <span class="dash-mover-name" title="${escapeAdminHtml(entry.name)}">${escapeAdminHtml(entry.name)}</span>
            ${dashMoverDeltaHtml(entry.delta)}
        </div>
        <div class="dash-mover-detail" title="${escapeAdminHtml(entry.keyword)}">${escapeAdminHtml(entry.keyword)} · ${prevRank}위 → ${entry.curRank}위</div>
    </a>`;
}

function dashDropoutRowHtml(product, rank) {
    const chips = product.keywords.map(k => `<span class="dash-dropout-chip">${escapeAdminHtml(k.keyword)} <b>최근 ${k.prevRank}위 · ${escapeAdminHtml(dashboardDate(k.prevDate))} 이후</b></span>`).join('');
    const safeLink = safeAdminUrl(product.link) || '#';
    return `<a href="${escapeAdminHtml(safeLink)}" target="_blank" rel="noopener" class="dash-mover-row">
        <div class="dash-mover-row-main">
            <span class="dash-mover-rank">${rank}</span>
            ${dashMoverThumbHtml(product.image)}
            <span class="dash-mover-name" title="${escapeAdminHtml(product.name)}">${escapeAdminHtml(product.name)}</span>
        </div>
        <div class="dash-dropout-detail">${chips}</div>
    </a>`;
}

// 블로그 "이탈 포스팅" — rank-tracker.html 쪽 "이탈 상품"과 데이터 모양이 달라(entry가 아니라
// {name,link,keywords}) 함수는 분리하되, 썸네일은 에너가드랩이 2026-08-13에 추가한 것과 동일하게 붙인다.
function dashBlogDropoutRowHtml(product, rank) {
    const chips = product.keywords.map(k => `<span class="dash-dropout-chip">${escapeAdminHtml(k.keyword)} <b>최근 ${k.prevRank}위</b></span>`).join('');
    const safeLink = safeAdminUrl(product.link) || '#';
    return `<a href="${escapeAdminHtml(safeLink)}" target="_blank" rel="noopener" class="dash-mover-row">
        <div class="dash-mover-row-main">
            <span class="dash-mover-rank">${rank}</span>
            ${dashMoverThumbHtml(product.image)}
            <span class="dash-mover-name" title="${escapeAdminHtml(product.name)}">${escapeAdminHtml(product.name)}</span>
            <span class="dash-mover-delta down">이탈 ${product.keywords.length}건</span>
        </div>
        <div class="dash-dropout-detail">${chips}</div>
    </a>`;
}

function dashMoverCardHtml(title, rowsHtml) {
    return `<div class="dash-mover-card"><div class="dash-mover-title">${title}</div>${rowsHtml || '<div class="dash-mover-empty">데이터가 없습니다.</div>'}</div>`;
}

function renderKeywordRankLists(latestRows, previousRows, fullHistoryRows, interestProducts) {
    lastKeywordRenderArgs = [latestRows, previousRows, fullHistoryRows, interestProducts];
    const wrap = document.getElementById('dash-keyword-movers-wrap');
    if (!wrap) return;
    const data = buildKeywordMoverData(latestRows, previousRows, fullHistoryRows);

    const grid = [
        dashMoverCardHtml('키워드 순위 상승 TOP', moverSlice('kw-up', data.upMovers).map((e, i) => dashMoverKeywordRowHtml(e, i + 1)).join('') + moverMoreBtnHtml('kw-up', data.upMovers.length, '순위 더보기')),
        dashMoverCardHtml('키워드 순위 하락 TOP', moverSlice('kw-down', data.downMovers).map((e, i) => dashMoverKeywordRowHtml(e, i + 1)).join('') + moverMoreBtnHtml('kw-down', data.downMovers.length, '순위 더보기')),
        dashMoverCardHtml('급상승 상품', moverSlice('kw-rise', data.risingProducts).map((e, i) => dashMoverProductRowHtml(e, i + 1)).join('') + moverMoreBtnHtml('kw-rise', data.risingProducts.length, '상품 더보기')),
        dashMoverCardHtml('급하락 상품', moverSlice('kw-fall', data.fallingProducts).map((e, i) => dashMoverProductRowHtml(e, i + 1)).join('') + moverMoreBtnHtml('kw-fall', data.fallingProducts.length, '상품 더보기')),
    ].join('');

    // "이탈 상품" 옆에 "관심 상품"(에너가드랩 랭킹추적 > 상품목록의 중요체크 상품)을 나란히 둔다.
    const dropoutCard = dashMoverCardHtml('이탈 상품', moverSlice('kw-drop', data.droppedProducts).map((p, i) => dashDropoutRowHtml(p, i + 1)).join('') + moverMoreBtnHtml('kw-drop', data.droppedProducts.length, '상품 더보기'));
    const interestCard = dashMoverCardHtml('관심 상품', moverSlice('kw-interest', interestProducts).map((p, i) => dashInterestRowHtml(p, i + 1)).join('') + moverMoreBtnHtml('kw-interest', interestProducts.length, '상품 더보기'));
    const bottomHtml = `<div class="dash-mover-grid dash-mover-grid-2" style="margin-top:16px;">${dropoutCard}${interestCard}</div>`;

    wrap.innerHTML = `<div class="dash-mover-grid">${grid}</div>${bottomHtml}`;
}

async function loadKeywordOverview() {
    const storeSelect = document.getElementById('dash-keyword-store-select');
    if (storeSelect && storeSelect.value !== selectedKeywordStore) storeSelect.value = selectedKeywordStore;
    const latest = await latestTableDate('keyword_rank_history', 'collected_date', query => query.eq('store_name', selectedKeywordStore));
    if (!latest) {
        setLabPeriod('dash-keyword-period', '저장 데이터 없음');
        setLabCardState('dash-keyword-metrics', '<div class="dash-lab-empty">에너가드랩에서 키워드 순위를 먼저 수집해 주세요.</div>');
        renderKeywordRankLists([], [], [], []);
        return;
    }
    const previous = await latestTableDate('keyword_rank_history', 'collected_date', query => query.eq('store_name', selectedKeywordStore).lt('collected_date', latest));
    const [latestRows, previousRows, masterMap, fullHistoryRows, interestRows] = await Promise.all([
        fetchKeywordDateRows(latest),
        previous ? fetchKeywordDateRows(previous) : Promise.resolve([]),
        fetchProductMasterMap().catch(() => ({ byCode: new Map(), byName: new Map() })),
        fetchKeywordFullHistory(),
        fetchInterestProducts()
    ]);
    applyProductMaster(latestRows, masterMap);
    applyProductMaster(previousRows, masterMap);
    applyProductMaster(fullHistoryRows, masterMap);
    const interestProducts = buildInterestProducts(interestRows, fullHistoryRows);
    const current = keywordSummary(latestRows);
    const before = previous ? keywordSummary(previousRows) : null;
    const deltas = rankDeltaList(latestRows, previousRows);
    const upTotal = deltas.filter(item => item.diff > 0).length;
    const downTotal = deltas.filter(item => item.diff < 0).length;
    const page1RateCompare = before
        ? (Math.abs(current.page1Rate - before.page1Rate) < 0.05
            ? '<span class="dash-lab-compare muted">이전과 동일</span>'
            : `<span class="dash-lab-compare ${current.page1Rate >= before.page1Rate ? 'up' : 'down'}">${current.page1Rate >= before.page1Rate ? '▲' : '▼'}${Math.abs(current.page1Rate - before.page1Rate).toFixed(1)}%p</span>`)
        : '<span class="dash-lab-compare muted">이전 데이터 없음</span>';

    setLabPeriod('dash-keyword-period', `${dashboardDate(latest)} 수집 · 키워드 ${current.keywordCount}개`);
    setLabCardState('dash-keyword-metrics', [
        dashboardMetric('1페이지 노출률', `${current.page1Rate.toFixed(1)}%`, page1RateCompare, 'accent'),
        dashboardMetric('TOP 10', `${current.top10.toLocaleString('ko-KR')}개`, before ? dashboardComparison(current.top10, before.top10) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>'),
        dashboardMetric('순위 변동', `<span style="color:#059669;">▲${upTotal}</span> · <span style="color:#ef4444;">▼${downTotal}</span>`, previous ? `<span class="dash-lab-compare muted">${dashboardDate(previous)} 수집 대비</span>` : '<span class="dash-lab-compare muted">이전 데이터 없음</span>'),
        dashboardMetric('이탈 상품', `${current.left.toLocaleString('ko-KR')}개`, before ? dashboardComparison(current.left, before.left) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>', current.left ? 'warning' : ''),
        dashboardMetric('키워드 검색량', current.volumeTotal.toLocaleString('ko-KR'), before ? dashboardComparison(current.volumeTotal, before.volumeTotal) : '<span class="dash-lab-compare muted">이전 데이터 없음</span>')
    ].join(''));
    renderKeywordRankLists(latestRows, previousRows, fullHistoryRows, interestProducts);
}

// ---- 블로그 순위 현황: 에너가드랩 blog-rank.html "노출 현황 진단"(renderExposureCard) 포팅 ----

async function fetchBlogTargetKeywords(blogIds) {
    return fetchPagedRows((from, to) => supabaseClient
        .from('blog_rank_target_keywords')
        .select('blog_id,keyword,category')
        .in('blog_id', blogIds)
        .range(from, to));
}

// 전주 비교까지 필요해서 14일치를 넉넉히 받아 클라이언트에서 키워드별 최신/직전을 가른다.
async function fetchBlogExposureHistory(blogIds) {
    const since = dateDaysBefore(new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10), 14);
    return fetchPagedRows((from, to) => supabaseClient
        .from('blog_rank_exposure_history')
        .select('blog_id,keyword,found,rank,page,checked_date,collected_at,result_title,result_url,result_log_no')
        .in('blog_id', blogIds)
        .eq('provider', 'naver_blog_screen')
        .gte('checked_date', since)
        .range(from, to));
}

async function fetchBlogPostTitleChecks(blogIds) {
    return fetchPagedRows((from, to) => supabaseClient
        .from('blog_rank_post_title_check')
        .select('blog_id,log_no,found,missing_since,checked_at')
        .in('blog_id', blogIds)
        .eq('found', false)
        .range(from, to));
}

async function fetchBlogPosts(blogIds) {
    return fetchPagedRows((from, to) => supabaseClient
        .from('blog_rank_posts')
        .select('blog_id,log_no,title,post_url')
        .in('blog_id', blogIds)
        .range(from, to));
}

// 무버 카드 썸네일 — "포스팅 내용 검사"(collectPostContentCheck)를 돌린 글만 채워지는 값이라
// 전부 있진 않지만(비어있으면 그냥 빈 자리로 뜬다), 있는 만큼은 반영한다.
async function fetchBlogPostThumbnails(blogIds) {
    return fetchPagedRows((from, to) => supabaseClient
        .from('blog_rank_post_content_check')
        .select('blog_id,log_no,thumbnail_url')
        .in('blog_id', blogIds)
        .range(from, to));
}

// (blog_id,keyword) -> 수집일 내림차순 정렬된 히스토리. [0]=최신, [1]=직전.
function buildBlogExposureIndex(historyRows) {
    const map = new Map();
    historyRows.forEach(row => {
        const key = `${row.blog_id}|${row.keyword}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(row);
    });
    map.forEach(list => list.sort((a, b) => String(b.collected_at).localeCompare(String(a.collected_at))));
    return map;
}

function buildBlogStats(targetKeywords, exposureIndex) {
    const results = targetKeywords.map(kw => ({ kw, result: (exposureIndex.get(`${kw.blog_id}|${kw.keyword}`) || [])[0] || null }));
    const checkedCount = results.filter(r => r.result).length;
    const exposedCount = results.filter(r => r.result?.found).length;
    let page1 = 0;
    results.forEach(r => { if (r.result?.found && r.result.page === 1) page1 += 1; });
    const checkedDate = results.map(r => r.result?.checked_date).filter(Boolean).sort().pop() || null;
    return {
        total: targetKeywords.length,
        checkedCount,
        exposedCount,
        notExposedCount: checkedCount - exposedCount,
        exposureRate: checkedCount ? Math.round(exposedCount / checkedCount * 100) : null,
        page1,
        checkedDate,
    };
}

function blogDateStats(targetKeywords, exposureIndex, date) {
    if (!date) return null;
    let checked = 0, found = 0, page1 = 0;
    targetKeywords.forEach(kw => {
        const rows = exposureIndex.get(`${kw.blog_id}|${kw.keyword}`) || [];
        const row = rows.find(r => r.checked_date === date);
        if (!row) return;
        checked += 1;
        if (row.found) {
            found += 1;
            if (row.page === 1) page1 += 1;
        }
    });
    if (!checked) return null;
    return { checked, found, missing: checked - found, rate: Math.round(found / checked * 100), page1 };
}

// good = "변화가 긍정적인가"(미노출처럼 줄어드는 게 좋은 지표는 inverse=true).
function blogCmpChip(label, current, previous, inverse = false, suffix = '') {
    if (current == null || previous == null) return `<span class="dash-lab-compare muted">${label} 데이터 없음</span>`;
    const diff = current - previous;
    if (!diff) return `<span class="dash-lab-compare muted">${label} -</span>`;
    const good = inverse ? diff < 0 : diff > 0;
    return `<span class="dash-lab-compare ${good ? 'up' : 'down'}">${label} ${diff > 0 ? '▲' : '▼'}${Math.abs(diff).toLocaleString('ko-KR')}${suffix}</span>`;
}

function blogTileLabel(label, tip) {
    return label;
}

// 메인/서브 키워드 상승·하락 — 같은 키워드의 최신/직전 수집 순위를 비교(둘 다 노출 상태일 때만).
function buildBlogMoverData(targetKeywords, exposureIndex) {
    const moves = targetKeywords.map(kw => {
        const rows = exposureIndex.get(`${kw.blog_id}|${kw.keyword}`) || [];
        const current = rows[0];
        const previous = rows[1];
        if (!current || !previous || !current.found || !previous.found || current.rank == null || previous.rank == null) return null;
        const delta = Number(previous.rank) - Number(current.rank);
        if (delta === 0) return null;
        return { kw, current, previous, delta };
    }).filter(Boolean);

    const byCategory = (category, dir) => moves
        .filter(m => m.kw.category === category && (dir === 'up' ? m.delta > 0 : m.delta < 0))
        .sort((a, b) => dir === 'up' ? b.delta - a.delta : a.delta - b.delta)
        .slice(0, KEYWORD_MOVER_LIMIT);

    // 이탈 포스팅 — 직전엔 노출됐는데 최신엔 미노출인 키워드를, 그 직전 노출을 냈던 포스팅 단위로 묶는다.
    const dropByPost = new Map();
    targetKeywords.forEach(kw => {
        const rows = exposureIndex.get(`${kw.blog_id}|${kw.keyword}`) || [];
        const current = rows[0];
        const previous = rows[1];
        if (!current || !previous || !previous.found || current.found) return;
        const postKey = previous.result_log_no || previous.result_title || previous.result_url || kw.keyword;
        if (!dropByPost.has(postKey)) dropByPost.set(postKey, { title: previous.result_title, url: previous.result_url, blogId: kw.blog_id, logNo: previous.result_log_no, keywords: [] });
        dropByPost.get(postKey).keywords.push({ keyword: kw.keyword, prevRank: Number(previous.rank) });
    });

    return {
        mainUp: byCategory('메인', 'up'),
        mainDown: byCategory('메인', 'down'),
        subUp: byCategory('서브', 'up'),
        subDown: byCategory('서브', 'down'),
        droppedPosts: [...dropByPost.values()].slice(0, KEYWORD_MOVER_LIMIT),
    };
}

// blog_rank_post_title_check(found:false) — 발행은 했지만 제목 검색 자가진단에서 색인조차 안 잡힌 포스팅.
function buildBlogMissingPosts(postTitleChecks, postsByKey) {
    return postTitleChecks
        .map(row => {
            const post = postsByKey.get(`${row.blog_id}|${row.log_no}`);
            return { title: post?.title, url: post?.post_url, blogId: row.blog_id, logNo: row.log_no, missingSince: row.missing_since, checkedAt: row.checked_at };
        })
        .sort((a, b) => String(b.missingSince || b.checkedAt || '').localeCompare(String(a.missingSince || a.checkedAt || '')))
        .slice(0, KEYWORD_MOVER_LIMIT);
}

function blogKstDateOnly(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// blog_rank_post_content_check(thumbMap, blog_id|log_no)에서 썸네일을 찾는다. 로그 번호가
// 없으면(포스팅 특정 불가) 조회할 것도 없다.
function blogThumbUrl(blogId, logNo, thumbMap) {
    return (blogId && logNo && thumbMap.get(`${blogId}|${logNo}`)) || '';
}

// dashMoverProductRowHtml(rank-tracker 이식분)이 기대하는 {name,link,keyword,curRank,delta,image} 모양으로 변환.
function dashBlogMoverEntry(m, thumbMap) {
    return {
        name: m.current.result_title || m.current.result_log_no || '포스팅 확인 필요',
        link: m.current.result_url || '#',
        keyword: m.kw.keyword,
        curRank: Number(m.current.rank),
        delta: m.delta,
        image: blogThumbUrl(m.current.blog_id, m.current.result_log_no, thumbMap),
    };
}

// dashBlogDropoutRowHtml이 기대하는 {name,link,keywords,image} 모양으로 변환.
function dashBlogDropoutEntry(p, thumbMap) {
    return { name: p.title || '포스팅 확인 필요', link: p.url || '#', keywords: p.keywords, image: blogThumbUrl(p.blogId, p.logNo, thumbMap) };
}

function dashMissingRowHtml(post, rank, thumbMap) {
    const dateLabel = post.missingSince ? `${blogKstDateOnly(post.missingSince)}부터` : (post.checkedAt ? `${blogKstDateOnly(post.checkedAt)} 확인` : '-');
    const image = blogThumbUrl(post.blogId, post.logNo, thumbMap);
    const safeUrl = safeAdminUrl(post.url) || '#';
    const safeTitle = escapeAdminHtml(post.title || post.logNo || '포스팅 확인 필요');
    return `<a href="${escapeAdminHtml(safeUrl)}" target="_blank" rel="noopener" class="dash-mover-row">
        <div class="dash-mover-row-main">
            <span class="dash-mover-rank">${rank}</span>
            ${dashMoverThumbHtml(image)}
            <span class="dash-mover-name" title="${safeTitle}">${safeTitle}</span>
            <span class="dash-mover-delta down">누락</span>
        </div>
        <div class="dash-dropout-detail"><span class="dash-dropout-chip">제목 검색 <b>${dateLabel}</b></span></div>
    </a>`;
}

function renderBlogMovers(targetKeywords, exposureIndex, postTitleChecks, postsByKey, thumbMap) {
    lastBlogRenderArgs = [targetKeywords, exposureIndex, postTitleChecks, postsByKey, thumbMap];
    const wrap = document.getElementById('dash-blogrank-movers-wrap');
    if (!wrap) return;
    const data = buildBlogMoverData(targetKeywords, exposureIndex);
    const missingPosts = buildBlogMissingPosts(postTitleChecks, postsByKey);

    const grid = [
        dashMoverCardHtml('메인 키워드 상승', moverSlice('blog-mainup', data.mainUp).map((m, i) => dashMoverProductRowHtml(dashBlogMoverEntry(m, thumbMap), i + 1)).join('') + moverMoreBtnHtml('blog-mainup', data.mainUp.length, '순위 더보기')),
        dashMoverCardHtml('메인 키워드 하락', moverSlice('blog-maindown', data.mainDown).map((m, i) => dashMoverProductRowHtml(dashBlogMoverEntry(m, thumbMap), i + 1)).join('') + moverMoreBtnHtml('blog-maindown', data.mainDown.length, '순위 더보기')),
        dashMoverCardHtml('보조 키워드 상승', moverSlice('blog-subup', data.subUp).map((m, i) => dashMoverProductRowHtml(dashBlogMoverEntry(m, thumbMap), i + 1)).join('') + moverMoreBtnHtml('blog-subup', data.subUp.length, '순위 더보기')),
        dashMoverCardHtml('보조 키워드 하락', moverSlice('blog-subdown', data.subDown).map((m, i) => dashMoverProductRowHtml(dashBlogMoverEntry(m, thumbMap), i + 1)).join('') + moverMoreBtnHtml('blog-subdown', data.subDown.length, '순위 더보기')),
    ].join('');

    const bottomGrid = [
        dashMoverCardHtml('이탈 포스팅', moverSlice('blog-drop', data.droppedPosts).map((p, i) => dashBlogDropoutRowHtml(dashBlogDropoutEntry(p, thumbMap), i + 1)).join('') + moverMoreBtnHtml('blog-drop', data.droppedPosts.length, '포스팅 더보기')),
        dashMoverCardHtml('누락 포스팅', moverSlice('blog-missing', missingPosts).map((p, i) => dashMissingRowHtml(p, i + 1, thumbMap)).join('') + moverMoreBtnHtml('blog-missing', missingPosts.length, '포스팅 더보기')),
    ].join('');

    wrap.innerHTML = `<div class="dash-mover-grid">${grid}</div><div class="dash-mover-grid dash-mover-grid-2" style="margin-top:16px;">${bottomGrid}</div>`;
}

async function loadBlogOverview() {
    const { data: blogs, error: blogError } = await supabaseClient.from('blog_rank_blogs').select('blog_id,blog_name').eq('is_mine', true).eq('active', true);
    if (blogError) throw blogError;
    const blogIds = (blogs || []).map(row => row.blog_id);
    if (!blogIds.length) {
        setLabPeriod('dash-blogrank-period', '내 블로그 없음');
        setLabCardState('dash-blogrank-metrics', '<div class="dash-lab-empty">에너가드랩에서 내 블로그를 등록해 주세요.</div>');
        renderBlogMovers([], new Map(), [], new Map(), new Map());
        return;
    }
    const [targetKeywords, historyRows, postTitleChecks, posts, thumbRows] = await Promise.all([
        fetchBlogTargetKeywords(blogIds),
        fetchBlogExposureHistory(blogIds),
        fetchBlogPostTitleChecks(blogIds),
        fetchBlogPosts(blogIds),
        fetchBlogPostThumbnails(blogIds),
    ]);
    const thumbMap = new Map(thumbRows.filter(row => row.thumbnail_url).map(row => [`${row.blog_id}|${row.log_no}`, row.thumbnail_url]));
    if (!targetKeywords.length) {
        setLabPeriod('dash-blogrank-period', '등록된 진단 키워드 없음');
        setLabCardState('dash-blogrank-metrics', '<div class="dash-lab-empty">에너가드랩 블로그분석에서 진단 키워드를 먼저 등록해 주세요.</div>');
        renderBlogMovers([], new Map(), [], new Map(), thumbMap);
        return;
    }
    const exposureIndex = buildBlogExposureIndex(historyRows);
    const stats = buildBlogStats(targetKeywords, exposureIndex);
    if (!stats.checkedDate) {
        setLabPeriod('dash-blogrank-period', '진단 데이터 없음');
        setLabCardState('dash-blogrank-metrics', '<div class="dash-lab-empty">블로그 노출 현황을 먼저 수집해 주세요.</div>');
        renderBlogMovers([], new Map(), [], new Map(), thumbMap);
        return;
    }
    const yesterday = blogDateStats(targetKeywords, exposureIndex, dateDaysBefore(stats.checkedDate, 1));
    const lastWeek = blogDateStats(targetKeywords, exposureIndex, dateDaysBefore(stats.checkedDate, 7));

    setLabPeriod('dash-blogrank-period', `${dashboardDate(stats.checkedDate)} 진단 · 키워드 ${stats.checkedCount}/${stats.total}개`);
    setLabCardState('dash-blogrank-metrics', [
        dashboardMetric(blogTileLabel('체크 키워드', '등록한 진단 키워드 수와, 그중 오늘까지 순위 수집을 완료한 개수입니다.'), `${stats.total.toLocaleString('ko-KR')}개`, `<span class="dash-lab-compare muted">수집 ${stats.checkedCount.toLocaleString('ko-KR')}개 · ${stats.total ? Math.round(stats.checkedCount / stats.total * 100) : 0}%</span>`),
        dashboardMetric(blogTileLabel('노출중', '검색 시 우리 블로그 포스팅이 결과에 걸린 키워드 수입니다.'), `${stats.exposedCount.toLocaleString('ko-KR')}개`, `${blogCmpChip('전일', stats.exposedCount, yesterday?.found)} ${blogCmpChip('전주', stats.exposedCount, lastWeek?.found)}`, 'accent'),
        dashboardMetric(blogTileLabel('미노출', '검색해봤지만 우리 블로그 포스팅이 안 걸린 키워드 수입니다.'), `${stats.notExposedCount.toLocaleString('ko-KR')}개`, `${blogCmpChip('전일', stats.notExposedCount, yesterday?.missing, true)} ${blogCmpChip('전주', stats.notExposedCount, lastWeek?.missing, true)}`, stats.notExposedCount ? 'warning' : ''),
        dashboardMetric(blogTileLabel('노출률', '진단 키워드 중 노출중 비율입니다.'), stats.exposureRate != null ? `${stats.exposureRate}%` : '-', `${blogCmpChip('전일', stats.exposureRate, yesterday?.rate, false, '%p')} ${blogCmpChip('전주', stats.exposureRate, lastWeek?.rate, false, '%p')}`),
        dashboardMetric(blogTileLabel('1페이지', '노출 중인 키워드 중 검색 결과 1페이지에 걸린 키워드 수입니다.'), `${stats.page1.toLocaleString('ko-KR')}개`, `${blogCmpChip('전일', stats.page1, yesterday?.page1)} ${blogCmpChip('전주', stats.page1, lastWeek?.page1)}`),
    ].join(''));

    const postsByKey = new Map(posts.map(p => [`${p.blog_id}|${p.log_no}`, p]));
    renderBlogMovers(targetKeywords, exposureIndex, postTitleChecks, postsByKey, thumbMap);
}

async function loadLabOverviewData(section = 'all') {
    const loaders = {
        sales: { run: loadSalesOverview, target: 'dash-sales-metrics', label: '매출' },
        ads: { run: loadAdsOverview, target: 'dash-ads-metrics', label: '광고' },
        keyword: { run: loadKeywordOverview, target: 'dash-keyword-metrics', label: '키워드' },
        blog: { run: loadBlogOverview, target: 'dash-blogrank-metrics', label: '블로그' }
    };
    const entries = section === 'all' ? Object.entries(loaders) : Object.entries(loaders).filter(([key]) => key === section);
    await Promise.all(entries.map(async ([key, item]) => {
        const icon = document.querySelector(`[onclick="refreshDashData('lab-${key}')"] .dash-refresh-icon`);
        if (icon) icon.classList.add('fa-spin');
        try {
            await item.run();
            const timeEl = document.getElementById(`time-lab-${key}`);
            if (timeEl) timeEl.textContent = `최근 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
        } catch (error) {
            console.error(`${item.label} 현황 로드 실패:`, error);
            const message = escapeAdminHtml(error?.message || String(error) || '알 수 없는 오류');
            setLabCardState(item.target, `<div class="dash-lab-empty error">${item.label} 데이터를 불러오지 못했습니다.<br><span class="dash-lab-error-detail">${message}</span></div>`);
        } finally {
            if (icon) icon.classList.remove('fa-spin');
        }
    }));
}

function setRefreshTime(type) {
    const el = document.getElementById(`time-${type}`);
    if (!el) return;
    const now = new Date();
    el.innerText = `최근 ${now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

window.navigateFromDash = function(pageId, tabId) {
    const menuEl = document.querySelector(`.menu-item[onclick*="${pageId}"]`);
    if (menuEl) showPage(pageId, menuEl);
    if (tabId) {
        const setTab = pageId === 'media' ? window.setMediaTab : window.setNoteTab;
        if (typeof setTab === 'function') setTimeout(() => setTab(tabId), 100);
    }
};

function getWeekIdForDate(year, month, targetDate) {
    if (typeof generateWeeksData === 'function') {
        const weeks = generateWeeksData(year, month);
        const targetDayStr = String(targetDate).padStart(2, '0');
        const targetFullStr = `${year}-${String(month).padStart(2, '0')}-${targetDayStr}`;
        for (let w of weeks) {
            if (w.days.some(d => d.date === targetFullStr)) {
                const weekLabelEl = document.getElementById('dash-week-label');
                if (weekLabelEl) weekLabelEl.title = `이번 주 목표 체크리스트입니다.\n${w.name}`;
                return w.id;
            }
        }
        return weeks.length > 0 ? weeks[0].id : "w1"; 
    }
    return "w1";
}

// 아래 3개 렌더 함수는 금주 주간목표/최근 상품수정/블로그·유튜브 최신글 4개 카드가 공유하는
// 목록 스타일 — 이탈 상품/무버 카드에서 쓰던 .dash-mover-row 행 디자인을 그대로 재사용해서
// 리뉴얼 이전(.dash-list li/.dot/.dash-note-title) 스타일과의 톤 차이를 없앤다(2026-08-14).
function renderDashTasks(wlData) {
    if (!wlData || wlData.status !== "success" || !wlData.tasks) {
        document.getElementById('dash-task-list').innerHTML = '<li class="dash-mover-empty">기록된 목표가 없습니다.</li>'; return;
    }
    const now = new Date(); const weekId = getWeekIdForDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
    let plans = wlData.tasks.filter(r => r[4] === 'Plan' && r[2] === weekId && r[7]);
    let listHTML = ''; let count = 0;

    for (let r of plans) {
        let isDone = (r[10] === true || r[10] === "TRUE");
        let dotColor = isDone ? '#94a3b8' : 'var(--primary)';
        let nameStyle = isDone ? 'text-decoration:line-through;color:#9ca3af;' : '';
        let badge = r[6] ? `<span class="dash-mover-delta" style="color:var(--text-sub);">${escapeAdminHtml(r[6])}</span>` : '';
        listHTML += `<li onclick="navigateFromDash('worklog')" class="dash-mover-row">
            <div class="dash-mover-row-main">
                <span class="dash-legend-dot" style="background:${dotColor};"></span>
                <span class="dash-mover-name" style="${nameStyle}">${escapeAdminHtml(r[7])}</span>
                ${badge}
            </div>
        </li>`;
        count++; if (count >= 10) break;
    }
    document.getElementById('dash-task-list').innerHTML = listHTML || '<li class="dash-mover-empty">금주 등록된 목표가 없습니다.</li>';
}

function renderDashProdLogs(data) {
    if (!data || data.length === 0) {
        document.getElementById('dash-prodlog-list').innerHTML = '<li class="dash-mover-empty">상품 수정 내역이 없습니다.</li>';
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
        document.getElementById('dash-prodlog-list').innerHTML = '<li class="dash-mover-empty">상품 수정 내역이 없습니다.</li>';
        return;
    }

    validData.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

    let listHTML = validData.slice(0, 10).map(item => `
    <li onclick="navigateFromDash('productlogs')" class="dash-mover-row">
        <div class="dash-mover-row-main">
            <span class="dash-legend-dot" style="background:#94a3b8;"></span>
            <span class="dash-mover-name">${escapeAdminHtml(item.content)}</span>
            <span class="dash-mover-delta" style="color:var(--text-sub);">${escapeAdminHtml(item.displayDate)}</span>
        </div>
    </li>`).join('');

    document.getElementById('dash-prodlog-list').innerHTML = listHTML;
}


function renderDashNotes(data, elementId, type) {
    if (!data || data.length === 0) {
        document.getElementById(elementId).innerHTML = `<li class="dash-mover-empty">등록된 원고가 없습니다.</li>`;
        return;
    }
    let listHTML = data.slice(0, 10).map(item => {
        let uploaded = item.status === 'uploaded';
        let statusTxt = uploaded ? '업로드' : '작성중';
        let dotColor = type === 'blog' ? '#10b981' : '#ef4444';
        let statusBadge = `<span class="dash-dropout-chip" style="background:${uploaded ? '#dcfce7' : '#f1f5f9'};color:${uploaded ? '#166534' : '#64748b'};">${statusTxt}</span>`;
        return `
        <li onclick="goMediaFromDash('${item.id}', '${type}')" class="dash-mover-row">
            <div class="dash-mover-row-main">
                <span class="dash-legend-dot" style="background:${dotColor};"></span>
                <span class="dash-mover-name">${escapeAdminHtml(item.title || '(제목 없음)')}</span>
                ${statusBadge}
            </div>
        </li>`;
    }).join('');
    document.getElementById(elementId).innerHTML = listHTML;
}

// 경쟁사 현황 — 상품추적 현황: tracked_items/tracked_item_history(is_mine=false)에서 최신·직전
// 수집일 사이 순위 변동이 가장 큰 경쟁사 상품을 뽑는다. 키워드 현황 카드의 무버 계산과 같은
// prevRank - curRank 부호 규칙(양수 = 순위 상승)을 그대로 쓴다(2026-08-14).
async function loadTrackedItemsOverview() {
    const listEl = document.getElementById('dash-trackeditems-list');
    if (!listEl) return;
    try {
        const { data: items, error: itemsErr } = await supabaseClient
            .from('tracked_items')
            .select('product_code,product_name,product_image,product_link,mall_name')
            .eq('is_mine', false);
        if (itemsErr) throw itemsErr;
        if (!items || !items.length) {
            listEl.innerHTML = '<li class="dash-mover-empty">등록된 경쟁사 상품이 없습니다.</li>';
            return;
        }
        const codes = items.map(i => i.product_code);
        const latest = await latestTableDate('tracked_item_history', 'collected_date', q => q.in('product_code', codes));
        if (!latest) {
            listEl.innerHTML = '<li class="dash-mover-empty">아직 수집된 이력이 없습니다.</li>';
            return;
        }
        const previous = await latestTableDate('tracked_item_history', 'collected_date', q => q.in('product_code', codes).lt('collected_date', latest));
        const [latestRows, previousRows] = await Promise.all([
            fetchTrackedItemHistoryRows(codes, latest),
            previous ? fetchTrackedItemHistoryRows(codes, previous) : Promise.resolve([])
        ]);
        renderTrackedItemsOverview(items, latestRows, previousRows);
    } catch (error) {
        console.error('상품추적 현황 로드 오류:', error);
        listEl.innerHTML = '<li class="dash-mover-empty">데이터를 불러오지 못했습니다.</li>';
    }
}

function fetchTrackedItemHistoryRows(codes, date) {
    return fetchPagedRows((from, to) => supabaseClient
        .from('tracked_item_history')
        .select('product_code,keyword,rank,collected_date')
        .in('product_code', codes)
        .eq('collected_date', date)
        .range(from, to));
}

// 키워드 현황 카드의 "급상승/급하락 상품"과 완전히 같은 행 모양(순위뱃지+썸네일+이름+델타,
// 하단 상세줄)을 쓴다 — 다만 경쟁사 상품은 어느 업체 상품인지가 중요해서 mall_name을
// 상세줄 맨 앞에 붙인다(2026-08-14, 사용자 피드백으로 통일).
function renderTrackedItemsOverview(items, latestRows, previousRows) {
    const listEl = document.getElementById('dash-trackeditems-list');
    const itemMap = new Map(items.map(i => [i.product_code, i]));
    const prevMap = new Map(previousRows.map(r => [`${r.product_code}|${r.keyword}`, r.rank]));
    const movers = [];
    latestRows.forEach(row => {
        if (row.rank == null) return;
        const prevRank = prevMap.get(`${row.product_code}|${row.keyword}`);
        if (prevRank == null) return;
        const delta = prevRank - row.rank;
        if (delta === 0) return;
        movers.push({ code: row.product_code, keyword: row.keyword, curRank: row.rank, delta });
    });
    // 상품당 가장 변동 폭이 큰 키워드 하나만 대표로 보여준다(작은 서브카드라 공간이 좁음).
    const byCode = new Map();
    movers.forEach(m => {
        const existing = byCode.get(m.code);
        if (!existing || Math.abs(m.delta) > Math.abs(existing.delta)) byCode.set(m.code, m);
    });
    const sorted = [...byCode.values()].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 8);
    if (!sorted.length) {
        listEl.innerHTML = '<li class="dash-mover-empty">순위 변동이 없습니다.</li>';
        return;
    }
    listEl.innerHTML = sorted.map((m, idx) => {
        const item = itemMap.get(m.code) || {};
        const name = item.product_name || m.code;
        const link = safeAdminUrl(item.product_link);
        const prevRank = m.curRank + m.delta;
        const detailPrefix = item.mall_name ? `${item.mall_name} · ` : '';
        return `<li class="dash-mover-row" ${link ? `data-url="${escapeAdminHtml(link)}" onclick="window.open(this.dataset.url,'_blank')"` : ''}>
            <div class="dash-mover-row-main">
                <span class="dash-mover-rank">${idx + 1}</span>
                ${dashMoverThumbHtml(item.product_image)}
                <span class="dash-mover-name" title="${escapeAdminHtml(name)}">${escapeAdminHtml(name)}</span>
                ${dashMoverDeltaHtml(m.delta)}
            </div>
            <div class="dash-mover-detail" title="${escapeAdminHtml(m.keyword)}">${escapeAdminHtml(detailPrefix)}${escapeAdminHtml(m.keyword)} · ${prevRank}위 → ${m.curRank}위</div>
        </li>`;
    }).join('');
}

// 경쟁사 현황 — 블로그 포스팅 현황: blog_rank_blogs/blog_rank_posts(is_mine=false)에서
// 경쟁사 블로그가 최근에 새로 올린 포스팅을 시간순으로 보여준다(순위 추적은 안 붙임 — 그건
// 내 콘텐츠 최적화용이라 blog-rank.html의 경쟁사 카드와 동일하게 "뭘 올렸는지"만 가볍게 확인).
async function loadCompetitorBlogOverview() {
    const listEl = document.getElementById('dash-competitorblog-list');
    if (!listEl) return;
    try {
        const { data: blogs, error: blogErr } = await supabaseClient
            .from('blog_rank_blogs')
            .select('blog_id,blog_name')
            .eq('is_mine', false)
            .eq('active', true);
        if (blogErr) throw blogErr;
        if (!blogs || !blogs.length) {
            listEl.innerHTML = '<li class="dash-mover-empty">등록된 경쟁사 블로그가 없습니다.</li>';
            return;
        }
        const blogMap = new Map(blogs.map(b => [b.blog_id, b]));
        // 업체별 안배 없이 그냥 전체 경쟁사 중 최신 포스팅 순으로 보여준다(2026-08-14, 사용자 요청).
        // first_seen_at(우리가 RSS로 수집한 시각)이 아니라 published_at(실제 발행일) 기준으로 정렬해야
        // 한다 — 전 경쟁사가 8/13 새벽 같은 배치로 한꺼번에 수집돼서 first_seen_at이 다 거의 같은 값이라
        // "최신 8개"가 사실상 임의 순서로 뽑히고 있었다(2026-08-14, 블루인슈텍만 계속 나오던 원인).
        const { data: posts, error: postErr } = await supabaseClient
            .from('blog_rank_posts')
            .select('blog_id,log_no,title,post_url,published_at,first_seen_at')
            .in('blog_id', blogs.map(b => b.blog_id))
            .order('published_at', { ascending: false, nullsFirst: false })
            .limit(8);
        if (postErr) throw postErr;
        renderCompetitorBlogList(posts || [], blogMap);
    } catch (error) {
        console.error('블로그 포스팅 현황 로드 오류:', error);
        listEl.innerHTML = '<li class="dash-mover-empty">데이터를 불러오지 못했습니다.</li>';
    }
}

// 한 줄짜리 행(블로그 최신글 카드와 동일한 밀도) — 업체명은 뱃지로, 날짜는 델타 자리에.
// 이전엔 하단 상세줄(.dash-mover-detail)을 썼는데 그 줄의 padding-left:24px가 썸네일+순위뱃지가
// 있는 다른 무버 행 기준이라, 점(dot)만 있는 이 행에서는 들여쓰기가 어긋나 보였다(2026-08-14).
function renderCompetitorBlogList(posts, blogMap) {
    const listEl = document.getElementById('dash-competitorblog-list');
    if (!posts.length) {
        listEl.innerHTML = '<li class="dash-mover-empty">최근 수집된 포스팅이 없습니다.</li>';
        return;
    }
    const sorted = [...posts].sort((a, b) => {
        const da = a.published_at || a.first_seen_at || '';
        const db = b.published_at || b.first_seen_at || '';
        return db.localeCompare(da);
    });
    listEl.innerHTML = sorted.map(p => {
        const blog = blogMap.get(p.blog_id);
        const blogName = blog ? (blog.blog_name || blog.blog_id) : p.blog_id;
        const dateTxt = dashboardDate(p.published_at || p.first_seen_at);
        const safePostUrl = safeAdminUrl(p.post_url) || '#';
        const safeTitle = escapeAdminHtml(p.title || '(제목 없음)');
        const safeBlogName = escapeAdminHtml(blogName);
        return `<li class="dash-mover-row" data-url="${escapeAdminHtml(safePostUrl)}" onclick="window.open(this.dataset.url,'_blank')">
            <div class="dash-mover-row-main">
                <span class="dash-legend-dot" style="background:#10b981;"></span>
                <span class="dash-mover-name" title="${safeTitle}">${safeTitle}</span>
                <span class="dash-dropout-chip" style="background:#eef2ff;color:#4338ca;" title="${safeBlogName}">${safeBlogName}</span>
                <span class="dash-mover-delta" style="color:var(--text-sub);">${escapeAdminHtml(dateTxt)}</span>
            </div>
        </li>`;
    }).join('');
}

window.goMediaFromDash = function(id, type) {
    showPage('media', document.querySelector('.menu-item[onclick*="media"]'));
    // common.js의 showPage()가 initMediaQuill()을 300ms 뒤에 예약해두지만, 아래
    // loadDraftContent가 그보다 먼저 실행되면 window.mediaQuill이 아직 없어 실패할 수
    // 있다 — 여기서 먼저 동기 호출해 둔다(idempotent라 중복 호출은 안전).
    if (typeof initMediaQuill === 'function') initMediaQuill();
    if (typeof setMediaTab === 'function') setMediaTab(type);
    setTimeout(() => { if (typeof loadDraftContent === 'function') loadDraftContent(id); }, 200);
}
