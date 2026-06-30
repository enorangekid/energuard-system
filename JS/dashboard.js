/* js/dashboard.js */

/* ================= [Dashboard Logic - Supabase Version] ================= */
let isDashboardLoaded = false; 

// ✅ KEYWORD_ORDER, KEYWORD_PRIORITY_MAP 는 config.js에서 전역 선언됨
// (DASH_KEYWORD_ORDER / DASH_PRIORITY_MAP 중복 선언 제거 — config.js 참고)

// 같은 상품 코드 내에서 '대표 키워드' 행을 찾는 함수 (우선순위 로직 적용)
function getBestItemForGroup(items) {
    if (!items || items.length === 0) return null;
    if (items.length === 1) return items[0];

    // 1. 카테고리명과 키워드가 정확히 일치하는 경우 최우선
    const categoryMatch = items.find(item => item.keyword === item.category_tab);
    if (categoryMatch) return categoryMatch;

    // 2. 우선순위 맵(KEYWORD_PRIORITY_MAP, config.js)에 따라 정렬
    items.sort((a, b) => {
        let pA = KEYWORD_PRIORITY_MAP[a.keyword];
        let pB = KEYWORD_PRIORITY_MAP[b.keyword];
        if (pA === undefined) pA = 9999;
        if (pB === undefined) pB = 9999;
        if (pA !== pB) return pA - pB;
        return String(a.name).localeCompare(String(b.name));
    });

    return items[0]; // 정렬 후 가장 첫 번째(Best) 아이템 반환
}

// 🚀 1. 대시보드 요약 데이터 (대표 키워드 로직 적용)
window.loadDashboardData = async function() {
    if (!supabaseClient || isDashboardLoaded) return; 
    
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';

    try {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;

        // 지난달 계산
        let py = y, pm = m - 1;
        if(pm === 0) { pm = 12; py--; }

        const [salesRes, masterRes, currRankRes, prevRankRes, taskRes, memoRes, blogRes, ytRes, blogRankRes] = await Promise.all([
            supabaseClient.from('sales_data').select('*').order('month_str', { ascending: false }),
            supabaseClient.from('product_rankings').select('*'), // 상품 마스터
            supabaseClient.from('ranking_history').select('*').eq('year', y).eq('month', m), // 이번달 순위
            supabaseClient.from('ranking_history').select('product_code, keyword, rank_w1, rank_w2, rank_w3, rank_w4, rank_w5').eq('year', py).eq('month', pm), // 지난달 순위
            supabaseClient.from('monthly_tasks').select('*').eq('year', y).eq('month', m),
            supabaseClient.from('monthly_memos').select('key, content').eq('type', 'ProductLog').neq('content', ''),
            supabaseClient.from('notes').select('id, title, status, saved_at').eq('type', 'blog').order('saved_at', { ascending: false }).limit(10),
            supabaseClient.from('notes').select('id, title, status, saved_at').eq('type', 'youtube').order('saved_at', { ascending: false }).limit(10),
            supabaseClient.from('blog_rank_results').select('results, checked_at').order('checked_at', { ascending: false }).limit(1).single()
        ]);

        // 지난달 마지막 순위 맵핑
        const prevMap = {};
        if (prevRankRes.data) {
            prevRankRes.data.forEach(p => {
                let last = p.rank_w5 || p.rank_w4 || p.rank_w3 || p.rank_w2 || p.rank_w1 || null;
                prevMap[p.product_code + '_' + (p.keyword || '')] = last;
            });
        }

        let mappedSales = salesRes.data ? [["Header"]].concat(salesRes.data.map(r => ["", r.month_str, r.revenue, r.ad_spend, r.roas, r.traffic, r.pay_count, r.mobile_ratio, r.refund_ratio, r.winner_ratio])) : [];
        
        let mappedRanks = [];
        if (masterRes.data) {
            // 1. product_code 별로 그룹핑
            const groups = {};
            masterRes.data.forEach(item => {
                if (!groups[item.code]) groups[item.code] = [];
                groups[item.code].push(item);
            });

            // 2. 각 그룹에서 '대표 아이템' 하나만 선정
            const representativeItems = [];
            Object.keys(groups).forEach(code => {
                const bestItem = getBestItemForGroup(groups[code]);
                if (bestItem) representativeItems.push(bestItem);
            });

            // 3. 대표 아이템만 데이터 매핑
            mappedRanks = [["Header"]].concat(representativeItems.map(item => {
                const history = (currRankRes.data || []).find(h => h.product_code === item.code && h.keyword === item.keyword) || {};
                const lastMonthRank = prevMap[item.code + '_' + (item.keyword || '')];

                let row = new Array(16).fill("");
                row[0] = item.code; row[1] = item.name; row[3] = item.category_tab; 
                row[5] = history.rank_w1 || ""; 
                row[6] = history.rank_w2 || ""; 
                row[7] = history.rank_w3 || ""; 
                row[8] = history.rank_w4 || ""; 
                row[9] = history.rank_w5 || ""; 
                row[11] = item.is_checked ? "TRUE" : "FALSE"; 
                row[12] = item.image_url;
                row[14] = lastMonthRank;
                row[15] = item.product_type || 'mine';
                return row;
            }));
        }

        let mappedTasks = taskRes.data ? { status: "success", tasks: taskRes.data.map(t => [t.year, t.month, t.week_id, t.date, t.type, t.row_index, t.category, t.task, t.priority, t.note_deadline, t.is_done]) } : null;
        let mappedMemos = memoRes.data ? memoRes.data.map(m => ({ date: m.key, content: m.content })) : [];

        if (typeof renderDashSales === 'function') renderDashSales(mappedSales);
        if (typeof renderDashRanking === 'function') renderDashRanking(mappedRanks);
        if (typeof renderDashTasks === 'function') renderDashTasks(mappedTasks);
        if (typeof renderDashProdLogs === 'function') renderDashProdLogs(mappedMemos);
        if (typeof renderDashNotes === 'function') {
            renderDashNotes(blogRes.data || [], 'dash-blog-list', 'blog');
            renderDashNotes(ytRes.data || [], 'dash-yt-list', 'youtube');
        }

        if (typeof renderDashBlogRank === 'function') {
            renderDashBlogRank(blogRankRes.data || null);
        }

        ['sales', 'ranking', 'tasks', 'prodlogs', 'blog', 'youtube', 'blogrank'].forEach(setRefreshTime);
        isDashboardLoaded = true; 
    } catch (e) {
        console.error("대시보드 데이터 로드 오류:", e);
        showToast("대시보드 데이터를 불러오지 못했습니다.", "error");
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

window.refreshDashData = async function(type) {
    if(!supabaseClient) return;
    const timeEl = document.getElementById(`time-${type}`);
    const iconEl = timeEl.nextElementSibling;
    iconEl.classList.add('fa-spin'); 
    
    try {
        const now = new Date(); const y = now.getFullYear(); const m = now.getMonth() + 1;
        
        if (type === 'sales') {
            const { data } = await supabaseClient.from('sales_data').select('*').order('month_str', { ascending: false });
            if(data) renderDashSales([["Header"]].concat(data.map(r => ["", r.month_str, r.revenue, r.ad_spend, r.roas, r.traffic, r.pay_count, r.mobile_ratio, r.refund_ratio, r.winner_ratio])));
        } else if (type === 'ranking') {
            let py = y, pm = m - 1; if(pm === 0) { pm = 12; py--; }

            const [masterRes, currRankRes, prevRankRes] = await Promise.all([
                supabaseClient.from('product_rankings').select('*'),
                supabaseClient.from('ranking_history').select('*').eq('year', y).eq('month', m),
                supabaseClient.from('ranking_history').select('product_code, keyword, rank_w1, rank_w2, rank_w3, rank_w4, rank_w5').eq('year', py).eq('month', pm)
            ]);

            const prevMap = {};
            if (prevRankRes.data) {
                prevRankRes.data.forEach(p => {
                    let last = p.rank_w5 || p.rank_w4 || p.rank_w3 || p.rank_w2 || p.rank_w1 || null;
                    prevMap[p.product_code + '_' + (p.keyword || '')] = last;
                });
            }

            if(masterRes.data) {
                const groups = {};
                masterRes.data.forEach(item => {
                    if (!groups[item.code]) groups[item.code] = [];
                    groups[item.code].push(item);
                });

                const representativeItems = [];
                Object.keys(groups).forEach(code => {
                    const bestItem = getBestItemForGroup(groups[code]);
                    if (bestItem) representativeItems.push(bestItem);
                });

                renderDashRanking([["Header"]].concat(representativeItems.map(item => {
                    const history = (currRankRes.data || []).find(h => h.product_code === item.code && h.keyword === item.keyword) || {};
                    const lastMonthRank = prevMap[item.code + '_' + (item.keyword || '')];
                    let row = new Array(16).fill("");
                    row[0] = item.code; row[1] = item.name; 
                    row[5] = history.rank_w1 || ""; row[6] = history.rank_w2 || ""; 
                    row[7] = history.rank_w3 || ""; row[8] = history.rank_w4 || ""; 
                    row[9] = history.rank_w5 || ""; 
                    row[12] = item.image_url;
                    row[14] = lastMonthRank;
                    row[15] = item.product_type || 'mine';
                    return row;
                })));
            }
        } else if (type === 'tasks') {
            const { data } = await supabaseClient.from('monthly_tasks').select('*').eq('year', y).eq('month', m);
            if(data) renderDashTasks({ status: "success", tasks: data.map(t => [t.year, t.month, t.week_id, t.date, t.type, t.row_index, t.category, t.task, t.priority, t.note_deadline, t.is_done]) });
        } else if (type === 'prodlogs') {
            const { data } = await supabaseClient.from('monthly_memos').select('key, content').eq('type', 'ProductLog').neq('content', '');
            if(data) renderDashProdLogs(data.map(m => ({ date: m.key, content: m.content })));
        } else if (type === 'blog') {
            const { data } = await supabaseClient.from('notes').select('id, title, status, saved_at').eq('type', 'blog').order('saved_at', { ascending: false }).limit(10);
            if(data) renderDashNotes(data, 'dash-blog-list', 'blog');
        } else if (type === 'youtube') {
            const { data } = await supabaseClient.from('notes').select('id, title, status, saved_at').eq('type', 'youtube').order('saved_at', { ascending: false }).limit(10);
            if(data) renderDashNotes(data, 'dash-yt-list', 'youtube');
        } else if (type === 'blogrank') {
            const { data } = await supabaseClient.from('blog_rank_results').select('results, checked_at').order('checked_at', { ascending: false }).limit(1).single();
            renderDashBlogRank(data || null);
        }
        setRefreshTime(type);
    } catch(e) { console.error("새로고침 오류:", e); showToast('새로고침 중 오류가 발생했습니다.', 'error'); } 
    finally { iconEl.classList.remove('fa-spin'); }
}

function setRefreshTime(type) {
    const el = document.getElementById(`time-${type}`);
    if(el) {
        const now = new Date();
        el.innerText = `최근 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
}

window.navigateFromDash = function(pageId, tabId) {
    const menuEl = document.querySelector(`.menu-item[onclick*="${pageId}"]`);
    if (menuEl) showPage(pageId, menuEl);
    if (tabId && typeof setNoteTab === 'function') setTimeout(() => setNoteTab(tabId), 100);
}

// 판매성과 렌더링
function renderDashSales(data) {
    if (!data || data.length <= 1) return; 
    let rows = data.slice(1);
    
    let monthMap = {};
    rows.forEach(r => {
        if (!r[1]) return;
        let m = formatDate(r[1]).substring(0, 7); 
        if (!monthMap[m]) monthMap[m] = { rev: 0, traffic: 0, pay: 0 };
        monthMap[m].rev += Number(String(r[2]).replace(/,/g, '')) || 0;
        monthMap[m].traffic += Number(String(r[5]).replace(/,/g, '')) || 0;
        monthMap[m].pay += Number(String(r[6]).replace(/,/g, '')) || 0;
    });

    let sortedMonths = Object.keys(monthMap).sort().reverse();
    let curData = monthMap[sortedMonths[0]] || { rev: 0, traffic: 0, pay: 0 };
    let prevData = sortedMonths[1] ? monthMap[sortedMonths[1]] : { rev: 0, traffic: 0, pay: 0 };

    let curConv = curData.traffic > 0 ? (curData.pay / curData.traffic * 100) : 0;
    let prevConv = prevData.traffic > 0 ? (prevData.pay / prevData.traffic * 100) : 0;
    const calcDiff = (c, p) => p > 0 ? ((c - p) / p * 100).toFixed(1) : 0;

    document.getElementById('dash-traffic').innerText = curData.traffic.toLocaleString() + "명";
    document.getElementById('dash-pay').innerText = curData.pay.toLocaleString() + "건";
    document.getElementById('dash-conv').innerText = curConv.toFixed(1) + "%";
    document.getElementById('dash-rev').innerText = curData.rev.toLocaleString() + "원";

    setDiffUI('dash-traffic-diff', calcDiff(curData.traffic, prevData.traffic));
    setDiffUI('dash-pay-diff', calcDiff(curData.pay, prevData.pay));
    setDiffUI('dash-conv-diff', calcDiff(curConv, prevConv)); 
    setDiffUI('dash-rev-diff', calcDiff(curData.rev, prevData.rev));
}

function setDiffUI(id, diff) {
    const el = document.getElementById(id); const num = Number(diff);
    if (num > 0) { el.innerHTML = `▲ ${num}% <span style="color:#94a3b8; font-weight:500;">(전월)</span>`; el.className = 'dash-stat-diff up'; } 
    else if (num < 0) { el.innerHTML = `▼ ${Math.abs(num)}% <span style="color:#94a3b8; font-weight:500;">(전월)</span>`; el.className = 'dash-stat-diff down'; } 
    else { el.innerHTML = `- <span style="color:#94a3b8; font-weight:500;">(전월)</span>`; el.className = 'dash-stat-diff'; }
}

function renderDashRanking(data) {
    if (!data || data.length <= 1) return;
    let rows = data.slice(1);
    let upList = [], downList = [], outList = [];

    // 전체 데이터 기준 마지막 수집 주차 인덱스 계산 (globalLastWIdx 역할)
    let globalLastWIdx = -1;
    rows.forEach(r => {
        let ranks = [r[5], r[6], r[7], r[8], r[9]];
        for (let i = 4; i >= 0; i--) {
            if (ranks[i] !== '' && ranks[i] != null) {
                if (i > globalLastWIdx) globalLastWIdx = i;
                break;
            }
        }
    });

    rows.forEach(r => {
        let ranks = [r[5], r[6], r[7], r[8], r[9]];
        let thumb = r[12] || '';
        let name = r[1];
        let link = `https://smartstore.naver.com/hkdy/products/${r[0]}`;

        // 이탈 판단: 마지막 수집 주차 기준으로 현재 값이 없으면 이탈
        // (이번 달 내내 순위 없는 상품 = 계속 이탈 중인 상품도 포함)
        let lastHasIdx = -1;
        for (let i = 4; i >= 0; i--) {
            if (ranks[i] !== '' && ranks[i] != null) { lastHasIdx = i; break; }
        }

        // lastHasIdx < globalLastWIdx: 이번 달 중간에 이탈
        // lastHasIdx === -1: 이번 달 내내 순위 없음 (계속 이탈 중)
        const isOut = (globalLastWIdx !== -1) && (lastHasIdx < globalLastWIdx);
        const isMine = (r[15] || 'mine') === 'mine';

        if (isOut && isMine) {
            // 이전 순위: 이번 달 마지막 순위 or 없으면 "-"로 표시
            let prevRank = lastHasIdx >= 0 ? Number(ranks[lastHasIdx]) : 0;
            outList.push({ prevRank, name, thumb, link });
            return;
        }

        // 급상승/급하락 판단
        if (lastHasIdx >= 0) {
            let curRank = Number(ranks[lastHasIdx]);
            let prevRank = null;
            if (lastHasIdx > 0 && ranks[lastHasIdx - 1] !== '' && ranks[lastHasIdx - 1] != null) {
                prevRank = Number(ranks[lastHasIdx - 1]);
            } else if (lastHasIdx === 0 && r[14] !== '' && r[14] != null) {
                prevRank = Number(r[14]);
            }
            if (prevRank !== null && prevRank > 0 && curRank > 0) {
                let diff = prevRank - curRank;
                if (diff >= 10) upList.push({ diff, curRank, name, thumb, link });
                else if (diff <= -10) downList.push({ diff, curRank, name, thumb, link });
            }
        }
    });

    upList.sort((a, b) => b.diff - a.diff);
    downList.sort((a, b) => a.diff - b.diff);
    document.getElementById('dash-rank-up-count').innerText = upList.length + '건';
    document.getElementById('dash-rank-down-count').innerText = downList.length + '건';

    const buildItemHTML = (item, isUp) => `
        <a href="${item.link}" target="_blank" class="dash-rank-item">
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width: 48px; flex-shrink: 0; gap: 4px; background: ${isUp ? '#fef2f2' : '#eff6ff'}; padding: 6px 0; border-radius: 8px;">
                <span style="font-size:14px; font-weight:800; color:#1e293b; line-height:1;">${item.curRank}위</span>
                <span class="dash-rank-diff ${isUp ? 'up' : 'down'}" style="font-size:11px; font-weight:700; width:auto; line-height:1;">
                    ${isUp ? '<i class="fa-solid fa-caret-up"></i>' : '<i class="fa-solid fa-caret-down"></i>'} ${Math.abs(item.diff)}
                </span>
            </div>
            <div class="dash-rank-thumb" ${item.thumb ? `style="background-image:url(${item.thumb})"` : ''} style="margin-left: 4px;"></div>
            <span class="dash-rank-name" title="${item.name}">${item.name}</span>
        </a>`;

    const buildOutHTML = (item) => `
        <a href="${item.link}" target="_blank" class="dash-rank-item">
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width: 48px; flex-shrink: 0; gap: 4px; background: #fef2f2; padding: 6px 0; border-radius: 8px;">
                <span style="font-size:11px; font-weight:800; color:#ef4444; line-height:1;">이탈</span>
                <span style="font-size:10px; font-weight:600; color:#ef4444; line-height:1;">${item.prevRank > 0 ? item.prevRank + "위▼" : "계속"}</span>
            </div>
            <div class="dash-rank-thumb" ${item.thumb ? `style="background-image:url(${item.thumb})"` : ''} style="margin-left: 4px;"></div>
            <span class="dash-rank-name" title="${item.name}">${item.name}</span>
        </a>`;

    document.getElementById('dash-rank-up-list').innerHTML = upList.length ? upList.map(item => buildItemHTML(item, true)).join('') : '<div style="padding:15px; text-align:center; color:#999; font-size:13px;">급상승 내역이 없습니다.</div>';

    // 이탈 먼저, 급하락 이후
    const downHtml = [
        ...outList.map(item => buildOutHTML(item)),
        ...downList.map(item => buildItemHTML(item, false))
    ].join('');
    document.getElementById('dash-rank-down-list').innerHTML = downHtml || '<div style="padding:15px; text-align:center; color:#999; font-size:13px;">급하락 내역이 없습니다.</div>';
}

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


/* ── 블로그 키워드 순위 대시보드 렌더링 ── */
function renderDashBlogRank(data) {
    const exposedEl  = document.getElementById('dash-blogrank-exposed');
    const hiddenEl   = document.getElementById('dash-blogrank-hidden');
    const checkedEl  = document.getElementById('dash-blogrank-checked-at');
    if (!exposedEl || !hiddenEl) return;

    if (!data || !data.results || !data.results.length) {
        exposedEl.innerHTML  = '<li class="dash-list-empty">데이터 없음</li>';
        hiddenEl.innerHTML   = '<li class="dash-list-empty">데이터 없음</li>';
        return;
    }

    const results = data.results;
    if (checkedEl) {
        checkedEl.textContent = new Date(data.checked_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    // 노출(rank 있음) — 순위 낮은 순 정렬
    const exposed = results
        .filter(r => r.rank)
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 10);

    // 미노출
    const hidden = results
        .filter(r => !r.rank)
        .slice(0, 10);

    const navToBlogRank = "showPage('blogranking', document.querySelector('.menu-item[onclick*=\'blogranking\']'))";

    exposedEl.innerHTML = exposed.length ? exposed.map(r => `
        <li class="dash-hover-bg" onclick="${navToBlogRank}">
            <span class="dot success"></span>
            <span class="dash-blogrank-kw">${r.keyword}</span>
            ${r.url && r.title
                ? `<a href="${r.url}" target="_blank" rel="noopener"
                      onclick="event.stopPropagation()"
                      class="dash-blogrank-title"
                      title="${(r.title||'').replace(/"/g,'&quot;')}">${r.title}</a>`
                : ''}
        </li>`).join('')
    : '<li><span class="dash-empty">노출 키워드 없음</span></li>';

    hiddenEl.innerHTML = hidden.length ? hidden.map(r => `
        <li class="dash-hover-bg" onclick="${navToBlogRank}">
            <span class="dot danger"></span>
            <span class="dash-note-title dash-hover-underline">${r.keyword}</span>
        </li>`).join('')
    : '<li><span class="dash-empty">미노출 키워드 없음</span></li>';
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

window.toggleDashSales = function() {
    const content = document.getElementById('dash-sales-content');
    const icon = document.getElementById('dash-sales-toggle-icon');
    if (content.style.display === 'none') {
        content.style.display = 'grid'; icon.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none'; icon.style.transform = 'rotate(0deg)';
    }
};