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

        const [salesRes, masterRes, currRankRes, prevRankRes, taskRes, memoRes, blogRes, ytRes] = await Promise.all([
            supabaseClient.from('sales_data').select('*').order('month_str', { ascending: false }),
            supabaseClient.from('product_rankings').select('*'), // 상품 마스터
            supabaseClient.from('ranking_history').select('*').eq('year', y).eq('month', m), // 이번달 순위
            supabaseClient.from('ranking_history').select('product_code, keyword, rank_w1, rank_w2, rank_w3, rank_w4, rank_w5').eq('year', py).eq('month', pm), // 지난달 순위
            supabaseClient.from('monthly_tasks').select('*').eq('year', y).eq('month', m),
            supabaseClient.from('monthly_memos').select('key, content').eq('type', 'ProductLog').neq('content', ''),
            supabaseClient.from('notes').select('id, title, status, saved_at').eq('type', 'blog').order('saved_at', { ascending: false }).limit(10),
            supabaseClient.from('notes').select('id, title, status, saved_at').eq('type', 'youtube').order('saved_at', { ascending: false }).limit(10)
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

                let row = new Array(15).fill("");
                row[0] = item.code; row[1] = item.name; row[3] = item.category_tab; 
                row[5] = history.rank_w1 || ""; 
                row[6] = history.rank_w2 || ""; 
                row[7] = history.rank_w3 || ""; 
                row[8] = history.rank_w4 || ""; 
                row[9] = history.rank_w5 || ""; 
                row[11] = item.is_checked ? "TRUE" : "FALSE"; 
                row[12] = item.image_url;
                row[14] = lastMonthRank;
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

        ['sales', 'ranking', 'tasks', 'prodlogs', 'blog', 'youtube'].forEach(setRefreshTime);
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
                    let row = new Array(15).fill("");
                    row[0] = item.code; row[1] = item.name; 
                    row[5] = history.rank_w1 || ""; row[6] = history.rank_w2 || ""; 
                    row[7] = history.rank_w3 || ""; row[8] = history.rank_w4 || ""; 
                    row[9] = history.rank_w5 || ""; 
                    row[12] = item.image_url;
                    row[14] = lastMonthRank;
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
    let upList = [], downList = [];

    rows.forEach(r => {
        let ranks = [r[5], r[6], r[7], r[8], r[9]];
        let lastIdx = -1;
        for (let i = 4; i >= 0; i--) { if (ranks[i] !== "" && ranks[i] != null) { lastIdx = i; break; } }

        if (lastIdx >= 0) {
            let curRank = Number(ranks[lastIdx]);
            let prevRank = null;

            if (lastIdx > 0 && ranks[lastIdx - 1] !== "" && ranks[lastIdx - 1] != null) {
                prevRank = Number(ranks[lastIdx - 1]);
            } else if (lastIdx === 0 && r[14] !== "" && r[14] != null) {
                prevRank = Number(r[14]);
            }

            if (prevRank !== null && prevRank > 0 && curRank > 0) {
                let diff = prevRank - curRank; 
                let thumb = r[12] || ''; 
                let name = r[1]; 
                let link = `https://smartstore.naver.com/hkdy/products/${r[0]}`;
                
                if (diff >= 10) upList.push({ diff, curRank, name, thumb, link }); 
                else if (diff <= -10) downList.push({ diff, curRank, name, thumb, link });
            }
        }
    });

    upList.sort((a, b) => b.diff - a.diff).slice(0, 15);
    downList.sort((a, b) => a.diff - b.diff).slice(0, 15);
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

    document.getElementById('dash-rank-up-list').innerHTML = upList.length ? upList.map(item => buildItemHTML(item, true)).join('') : '<div style="padding:15px; text-align:center; color:#999; font-size:13px;">급상승 내역이 없습니다.</div>';
    document.getElementById('dash-rank-down-list').innerHTML = downList.length ? downList.map(item => buildItemHTML(item, false)).join('') : '<div style="padding:15px; text-align:center; color:#999; font-size:13px;">급하락 내역이 없습니다.</div>';
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

/* ================= [Note Logic: Real-time Save & Undo (Updated)] ================= */

let currentNoteTab = 'general';
let currentNoteId = null;
let currentNoteMonth = ''; // 현재 로드된 월 (YYYY-MM)
let noteOriginalContent = ''; // ✅ 롤백(취소) 기준점
let noteAutoSaveTimer = null; // 자동 저장 타이머

window.setNoteTab = function(tab) {
    currentNoteTab = tab;
    document.querySelectorAll('.tab-btn, .nt-tab').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[onclick*="${tab}"], .nt-tab[onclick*="${tab}"]`);
    if(activeBtn) activeBtn.classList.add('active');

    const metaArea = document.getElementById('draftMetadataArea');
    const listContainer = document.getElementById('draftListContainer');
    const editorWrapper = document.getElementById('editor-wrapper');
    const titleInput = document.getElementById('draftTitle');

    if (tab === 'general') {
        if(metaArea) metaArea.style.display = 'none'; 
        if(listContainer) listContainer.style.display = 'none'; 
        if(editorWrapper) editorWrapper.style.display = 'flex';
        handleNoteMonthChange();
    } else {
        if(metaArea) metaArea.style.display = 'none'; 
        if(listContainer) listContainer.style.display = 'block'; 
        if(editorWrapper) editorWrapper.style.display = 'none';
        if(titleInput) titleInput.placeholder = tab === 'blog' ? "블로그 원고 제목을 입력하세요" : "유튜브 기획/대본 제목을 입력하세요";
        loadDraftList(tab);
    }
}

window.backToList = function() {
    document.getElementById('draftMetadataArea').style.display = 'none'; 
    document.getElementById('editor-wrapper').style.display = 'none';
    document.getElementById('draftListContainer').style.display = 'block';
    loadDraftList(currentNoteTab);
}

// 📌 노트 데이터 불러오기 (월 변경 시)
window.handleNoteDateChange = async function() {
    // 하위호환용 - handleNoteMonthChange 호출
    handleNoteMonthChange();
}

window.handleNoteMonthChange = async function() {
    if (!supabaseClient || currentNoteTab !== 'general') return;
    const monthStr = document.getElementById('noteMonthPicker').value; // YYYY-MM
    if (!monthStr) return;
    currentNoteMonth = monthStr;
    const monthDate = monthStr + '-01'; // DB 저장 형식: YYYY-MM-01

    try {
        const { data, error } = await supabaseClient.from('notes')
            .select('*')
            .eq('date', monthDate)
            .eq('type', 'general')
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) { 
            currentNoteId = data[0].id; 
            const noteContent = data[0].content || '';
            if (window.quill) window.quill.root.innerHTML = noteContent;
            noteOriginalContent = noteContent;
        } else { 
            currentNoteId = null; 
            if (window.quill) window.quill.root.innerHTML = '';
            noteOriginalContent = ''; 
        }
        
        const statusLabel = document.getElementById('noteSaveStatus');
        if(statusLabel) statusLabel.innerHTML = '최신 상태';

    } catch (e) { 
        console.error("노트 로드 실패:", e);
        showToast("원고 데이터를 불러오지 못했습니다.", "error"); 
    } finally { 
        document.getElementById('loader').style.display = 'none'; 
    }
}

// 📌 오늘 날짜 헤더를 에디터에 삽입
window.insertTodayHeader = function() {
    if (!window.quill) return;
    const now = new Date();
    const days = ['일','월','화','수','목','금','토'];
    const label = now.getFullYear() + '년 ' + (now.getMonth()+1) + '월 ' + now.getDate() + '일 (' + days[now.getDay()] + ')';
    const range = window.quill.getSelection(true);
    const index = range ? range.index : window.quill.getLength();
    // 앞에 줄바꿈 하나 추가 (내용이 있을 때만)
    if (window.quill.getLength() > 1) {
        window.quill.insertText(index, '\n', 'user');
    }
    window.quill.insertEmbed(index + (window.quill.getLength() > 1 ? 1 : 0), 'divider', true, 'user');
    const afterHr = index + (window.quill.getLength() > 1 ? 2 : 1);
    window.quill.insertText(afterHr, label + '\n', { 'bold': true, 'color': '#4f46e5' }, 'user');
    window.quill.setSelection(afterHr + label.length + 1, 'silent');
}

// 📌 Quill 에디터 초기화
window.initQuill = function() {
    if (window.quill) return;

    // ── 구분선(HR) Blot 등록 (Quill 인스턴스 생성 직전에 등록해야 안전) ──
    if (!Quill.imports['formats/divider']) {
        const BlockEmbed = Quill.import('blots/block/embed');
        class DividerBlot extends BlockEmbed {}
        DividerBlot.blotName = 'divider';
        DividerBlot.tagName  = 'hr';
        Quill.register(DividerBlot);
    }

    window.quill = new Quill('#editor', {
        theme: 'snow', 
        placeholder: '만능 비서와 함께 업무 내용을 자유롭게 기록하세요...',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['image', 'link', 'divider', 'clean']
                ],
                handlers: {
                    'image': imageUploadHandler,
                    'divider': function() {
                        const range = this.quill.getSelection(true);
                        this.quill.insertText(range.index, '\n', Quill.sources.USER);
                        this.quill.insertEmbed(range.index + 1, 'divider', true, Quill.sources.USER);
                        this.quill.setSelection(range.index + 2, Quill.sources.SILENT);
                    }
                }
            }
        }
    });

    // 🚀 실시간 자동 저장 (Debounce: 2초)
    window.quill.on('text-change', function(delta, oldDelta, source) {
        if (source === 'user') {
            const statusLabel = document.getElementById('noteSaveStatus');
            if (statusLabel) statusLabel.innerHTML = '작성 중...';
            
            clearTimeout(noteAutoSaveTimer);
            noteAutoSaveTimer = setTimeout(function() {
                autoSaveNote(); // 자동 저장 실행
            }, 2000);
        }
    });

    // 이미지/파일 드래그 앤 드롭 핸들러 등 생략...
    window.quill.root.addEventListener('paste', handleImagePaste);
    window.quill.root.addEventListener('drop', handleImageDrop);
}

// 📌 [자동 저장] - 원본(noteOriginalContent)은 갱신하지 않음!
async function autoSaveNote() {
    if (!supabaseClient || currentNoteTab !== 'general') return;
    const monthStr = currentNoteMonth || document.getElementById('noteMonthPicker').value;
    const noteContent = window.quill.root.innerHTML;
    if (!monthStr || !noteContent || noteContent === '<p><br></p>') return;

    const statusLabel = document.getElementById('noteSaveStatus');
    
    try {
        if (currentNoteId) {
            await supabaseClient.from('notes').update({ content: noteContent, saved_at: new Date() }).eq('id', currentNoteId);
        } else {
            const { data } = await supabaseClient.from('notes').insert([{ date: monthStr + '-01', type: 'general', title: '일반 노트', content: noteContent, status: 'saving' }]).select();
            if (data && data.length > 0) currentNoteId = data[0].id;
        }
        
        if (statusLabel) {
            const now = new Date();
            statusLabel.innerHTML = '<span style="color:#10b981;">자동 저장됨 (' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ')</span>';
        }
    } catch(e) {
        console.error('자동저장 실패:', e);
        showToast('자동저장에 실패했습니다.', 'error');
        if (statusLabel) statusLabel.innerHTML = '자동저장 실패';
    }
}

// 📌 [수동 저장] - 이때 비로소 원본(noteOriginalContent)을 갱신
window.saveNoteManual = async function() {
    clearTimeout(noteAutoSaveTimer); // 대기 중인 자동저장 취소
    await saveNoteToServer(true); // true = 매뉴얼 저장 플래그
}

window.saveNoteToServer = async function(isManual = false) {
    if (!supabaseClient) return;
    const date = currentNoteTab === 'general'
        ? (currentNoteMonth ? currentNoteMonth + '-01' : document.getElementById('noteMonthPicker').value + '-01')
        : document.getElementById('noteDate').value;
    const title = currentNoteTab === 'general' ? '일반 노트' : document.getElementById('draftTitle').value.trim();
    const status = currentNoteTab === 'general' ? 'saving' : document.getElementById('draftStatus').value;
    const content = window.quill.root.innerHTML;

    if (!date) { showToast('월을 선택해주세요.', 'warning'); return; }
    if (content === "<p><br></p>" || !content) { showToast('내용을 입력해주세요.', 'warning'); return; }

    const saveBtn = document.querySelector('.note-controls .btn-primary');
    const originalText = saveBtn.innerHTML; 
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장중...'; 
    saveBtn.disabled = true;

    try {
        if (currentNoteId) {
            const { error } = await supabaseClient.from('notes').update({ title: title, content: content, status: status, saved_at: new Date() }).eq('id', currentNoteId);
            if (error) throw error;
        } else {
            const { data, error } = await supabaseClient.from('notes').insert([{ date: date, type: currentNoteTab, title: title, content: content, status: status }]).select();
            if (error) throw error; 
            if (data && data.length > 0) currentNoteId = data[0].id; 
        }

        // ✅ 수동 저장 성공 시에만 원본 갱신
        if(isManual) {
            noteOriginalContent = content; 
            showToast('저장되었습니다.', 'success');
        }
        
        const statusLabel = document.getElementById('noteSaveStatus');
        if(statusLabel) statusLabel.innerHTML = '저장 완료';
        
        if (currentNoteTab !== 'general') loadDraftList(currentNoteTab);

    } catch (e) { 
        console.error("저장 오류:", e);
        showToast("저장 중 오류가 발생했습니다.", "error"); 
        showToast('저장 중 오류가 발생했습니다.', 'error'); 
    } finally { 
        saveBtn.innerHTML = originalText; 
        saveBtn.disabled = false; 
    }
}

// 📌 [취소/롤백] - 자동 저장된 내용까지 모두 날리고 원본으로 복구
window.cancelNoteChanges = async function() {
    if(!confirm("작성 중인 내용을 취소하고, 마지막 저장 상태로 되돌리겠습니까?\n(자동 저장된 내용도 초기화됩니다.)")) return;

    clearTimeout(noteAutoSaveTimer); // 자동저장 타이머 Kill

    // 1. 에디터 내용을 원본으로 롤백
    if (window.quill) window.quill.root.innerHTML = noteOriginalContent;
    
    const statusLabel = document.getElementById('noteSaveStatus');
    if(statusLabel) statusLabel.innerHTML = '복구 중...';

    // 2. 서버 데이터도 원본으로 덮어씌우기 (자동 저장된 내용 무효화)
    if(currentNoteId) {
        try {
            await supabaseClient.from('notes').update({ content: noteOriginalContent, saved_at: new Date() }).eq('id', currentNoteId);
            if(statusLabel) statusLabel.innerHTML = '복구 완료';
        } catch(e) {
            console.error("롤백 실패:", e);
            showToast("서버 데이터 복구 중 오류가 발생했습니다.", "error");
            showToast('서버 데이터 복구 중 오류가 발생했습니다.', 'error');
        }
    } else {
        if(statusLabel) statusLabel.innerHTML = '초기화됨';
    }
}

// 📌 [인쇄 기능]
window.printNote = function() {
    window.print();
}

// (이하 이미지 핸들러 등 보조 함수는 그대로 유지)
function handleImagePaste(e) {
    if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                e.preventDefault(); const file = items[i].getAsFile(); uploadFileToSupabase(file); return;
            }
        }
    }
}
function handleImageDrop(e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) { e.preventDefault(); uploadFileToSupabase(file); }
    }
}
function imageUploadHandler() {
    const input = document.createElement('input'); input.setAttribute('type', 'file'); input.setAttribute('accept', 'image/*'); input.click();
    input.onchange = () => { const file = input.files[0]; if (file) uploadFileToSupabase(file); };
}
async function uploadFileToSupabase(file) {
    if (!supabaseClient) return;
    document.getElementById('loader').style.display = 'flex';
    try {
        const fileExt = file.name.split('.').pop() || 'png'; const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`; const filePath = `editor/${fileName}`;
        const { error: uploadError } = await supabaseClient.storage.from('images').upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabaseClient.storage.from('images').getPublicUrl(filePath);
        let range = window.quill.getSelection(); let index = range ? range.index : window.quill.getLength();
        window.quill.insertEmbed(index, 'image', data.publicUrl); window.quill.setSelection(index + 1);
    } catch (error) { console.error('이미지 업로드 오류:', error); showToast('이미지 업로드 실패.', 'error'); } 
    finally { document.getElementById('loader').style.display = 'none'; }
}
async function loadDraftList(type) {
    if (!supabaseClient) return;
    const listEl = document.getElementById('draftListBody'); if (!listEl) return;
    listEl.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> 로딩중...</td></tr>';
    try {
        const { data, error } = await supabaseClient.from('notes').select('id, date, title, status, saved_at').eq('type', type).order('saved_at', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
            listEl.innerHTML = data.map(item => {
                let statusTxt = item.status === 'uploaded' ? '업로드 완료' : '작성중'; 
                let statusColor = item.status === 'uploaded' ? '#166534' : '#64748b'; 
                let statusBg = item.status === 'uploaded' ? '#dcfce7' : '#f1f5f9';
                let statusBadge = `<span style="background:${statusBg}; color:${statusColor}; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:700;">${statusTxt}</span>`;
                let savedTime = new Date(item.saved_at); 
                let timeStr = `${savedTime.getMonth()+1}/${savedTime.getDate()} ${String(savedTime.getHours()).padStart(2,'0')}:${String(savedTime.getMinutes()).padStart(2,'0')}`;
                return `<tr onclick="loadDraftContent('${item.id}')"><td class="text-sub">${item.date}</td><td class="text-left font-bold">${item.title || '(제목 없음)'}</td><td>${statusBadge}</td><td class="text-sub">${timeStr}</td></tr>`;
            }).join('');
        } else { listEl.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#94a3b8; font-size:13px;">등록된 원고가 없습니다.</td></tr>'; }
    } catch (e) { console.error("리스트 오류:", e); listEl.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444;">리스트 로드 실패</td></tr>'; }
}
window.loadDraftContent = async function(noteId) {
    if (!supabaseClient) return;
    document.getElementById('loader').style.display = 'flex';
    try {
        const { data, error } = await supabaseClient.from('notes').select('*').eq('id', noteId).single();
        if (error) throw error;
        if (data) {
            currentNoteId = data.id; document.getElementById('noteDate').value = data.date;
            document.getElementById('draftTitle').value = data.title || ''; document.getElementById('draftStatus').value = data.status || 'saving';
            if (window.quill) window.quill.root.innerHTML = data.content || '';
            noteOriginalContent = data.content || ''; // 원고 로드 시에도 백업
            document.getElementById('draftListContainer').style.display = 'none'; document.getElementById('draftMetadataArea').style.display = 'flex'; document.getElementById('editor-wrapper').style.display = 'flex';
        }
    } catch (e) { console.error("원고 불러오기 오류:", e); showToast('원고를 불러오지 못했습니다.', 'error'); } finally { document.getElementById('loader').style.display = 'none'; }
}
window.createNewDraft = function() {
    currentNoteId = null; document.getElementById('draftTitle').value = ''; document.getElementById('draftStatus').value = 'saving'; 
    if (window.quill) window.quill.root.innerHTML = '';
    noteOriginalContent = '';
    // 신규 작성 시 날짜를 오늘로 자동 설정
    const todayStr = new Date().toISOString().slice(0, 10);
    const noteDateEl = document.getElementById('noteDate');
    if (noteDateEl) noteDateEl.value = todayStr;
    document.getElementById('draftListContainer').style.display = 'none'; document.getElementById('draftMetadataArea').style.display = 'flex'; document.getElementById('editor-wrapper').style.display = 'flex';
}

window.resetNoteToOriginal = window.cancelNoteChanges; // 기존 함수명 호환
window.searchNotes = function() { /* 추후 구현 */ }


/* ================= [🚀 NEW: 퀵 메모 (Quick Memo) 연동 로직] ================= */
let quickQuill = null;
let currentQuickNoteId = null;
let currentQuickNoteMonth = '';

window.toggleQuickMemo = function() {
    openPanel('quickMemoPanel', () => {
        initQuickEditor();
        loadQuickMemo();
    });
}

window.initQuickEditor = function() {
    if (quickQuill) return;
    quickQuill = new Quill('#quickEditor', {
        theme: 'snow',
        placeholder: '오늘의 번뜩이는 아이디어나 업무를 빠르게 메모하세요...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }]
            ]
        }
    });
}

// 🚀 이번 달 일반 노트를 찾아서 퀵 메모에 띄우기
window.loadQuickMemo = async function() {
    if(!supabaseClient) return;
    const now = new Date();
    const monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const todayLabel = now.getFullYear() + '년 ' + (now.getMonth()+1) + '월';
    document.getElementById('quickMemoDate').innerText = todayLabel;
    document.getElementById('quickMemoStatus').innerText = '';
    
    try {
        const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .eq('date', monthStr + '-01')
            .eq('type', 'general')
            .limit(1);
            
        if (error) throw error;
        
        if (data && data.length > 0) {
            currentQuickNoteId = data[0].id;
            currentQuickNoteMonth = monthStr;
            // 이번 달 노트 내용을 그대로 표시 (수정 가능)
            if (quickQuill) quickQuill.root.innerHTML = data[0].content || '';
        } else {
            currentQuickNoteId = null;
            currentQuickNoteMonth = monthStr;
            if (quickQuill) quickQuill.root.innerHTML = '';
        }
    } catch(e) {
        console.error('퀵 메모 로드 실패:', e);
        showToast('퀵 메모를 불러오지 못했습니다.', 'error');
    }
}

// 🚀 퀵 메모 저장 (월 노트 전체를 그대로 update)
window.saveQuickMemo = async function() {
    if(!supabaseClient) return;
    const quickContent = quickQuill.root.innerHTML;
    const statusMsg = document.getElementById('quickMemoStatus');
    
    if (quickContent === '<p><br></p>' || !quickContent) return;
    
    statusMsg.innerText = '저장 중...';
    statusMsg.style.color = '#f59e0b';

    const now = new Date();
    const monthStr = currentQuickNoteMonth || (now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0'));

    try {
        if (currentQuickNoteId) {
            // 퀵에디터 내용 그대로 월 노트 업데이트
            const { error } = await supabaseClient.from('notes')
                .update({ content: quickContent, saved_at: new Date() })
                .eq('id', currentQuickNoteId);
            if(error) throw error;
        } else {
            // 이번 달 노트 없으면 새로 생성
            const { data, error } = await supabaseClient.from('notes')
                .insert([{ date: monthStr + '-01', type: 'general', title: '일반 노트', content: quickContent, status: 'saving' }])
                .select();
            if(error) throw error;
            if (data && data.length > 0) currentQuickNoteId = data[0].id;
        }
        
        statusMsg.innerText = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ' 저장됨!';
        statusMsg.style.color = '#10b981';

        // 업무 노트 페이지가 열려있고 같은 달이면 리렌더
        if (document.getElementById('page-notes').classList.contains('active') && currentNoteMonth === monthStr) {
            handleNoteMonthChange();
        }
    } catch(e) {
        console.error('퀵 메모 저장 실패:', e);
        showToast('퀵 메모 저장에 실패했습니다.', 'error');
        statusMsg.innerText = '저장 실패';
        statusMsg.style.color = '#ef4444';
    }
}