/* ================= [Dashboard Logic] ================= */

let isDashboardLoaded = false; 

async function loadDashboardData() {
    if (!authPassword) return;
    if (isDashboardLoaded) return; 
    
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';

    try {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;

        const [salesRes, rankRes, wlRes, prodLogRes, blogRes, ytRes] = await Promise.all([
            fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "read", sheetName: "SalesData", password: authPassword }) }).then(r => r.json()),
            fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "read", sheetName: "Sheet1", password: authPassword }) }).then(r => r.json()),
            fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "load_worklog", password: authPassword, year: y, month: m }) }).then(r => r.json()),
            fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "get_all_product_logs", password: authPassword }) }).then(r => r.json()),
            fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "load_draft_list", type: "blog", password: authPassword }) }).then(r => r.json()),
            fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "load_draft_list", type: "youtube", password: authPassword }) }).then(r => r.json())
        ]);

        renderDashSales(salesRes.data || []);
        renderDashRanking(rankRes.data || []);
        renderDashTasks(wlRes); 
        renderDashProdLogs(prodLogRes.data || []);
        renderDashNotes(blogRes.list || [], 'dash-blog-list', 'blog');
        renderDashNotes(ytRes.list || [], 'dash-yt-list', 'youtube');

        // 새로고침 시간 초기 세팅
        ['sales', 'ranking', 'tasks', 'prodlogs', 'blog', 'youtube'].forEach(setRefreshTime);
        
        isDashboardLoaded = true; 
    } catch (e) {
        console.error("대시보드 데이터 로드 오류:", e);
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

// 개별 카드 새로고침 로직
async function refreshDashData(type) {
    if(!authPassword) return;
    
    const timeEl = document.getElementById(`time-${type}`);
    const iconEl = timeEl.nextElementSibling;
    iconEl.classList.add('fa-spin'); // 회전 애니메이션
    
    try {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        
        if (type === 'sales') {
            const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "read", sheetName: "SalesData", password: authPassword }) }).then(r => r.json());
            renderDashSales(res.data || []);
        } else if (type === 'ranking') {
            const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "read", sheetName: "Sheet1", password: authPassword }) }).then(r => r.json());
            renderDashRanking(res.data || []);
        } else if (type === 'tasks') {
            const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "load_worklog", password: authPassword, year: y, month: m }) }).then(r => r.json());
            renderDashTasks(res);
        } else if (type === 'prodlogs') {
            const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "get_all_product_logs", password: authPassword }) }).then(r => r.json());
            renderDashProdLogs(res.data || []);
        } else if (type === 'blog') {
            const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "load_draft_list", type: "blog", password: authPassword }) }).then(r => r.json());
            renderDashNotes(res.list || [], 'dash-blog-list', 'blog');
        } else if (type === 'youtube') {
            const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "load_draft_list", type: "youtube", password: authPassword }) }).then(r => r.json());
            renderDashNotes(res.list || [], 'dash-yt-list', 'youtube');
        }
        setRefreshTime(type);
    } catch(e) {
        console.error("새로고침 오류:", e);
    } finally {
        iconEl.classList.remove('fa-spin'); // 회전 애니메이션 종료
    }
}

function setRefreshTime(type) {
    const el = document.getElementById(`time-${type}`);
    if(el) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        el.innerText = `최근 ${hh}:${mm}`;
    }
}

window.navigateFromDash = function(pageId, tabId) {
    const menuEl = document.querySelector(`.menu-item[onclick*="${pageId}"]`);
    if (menuEl) showPage(pageId, menuEl);
    if (tabId && typeof setNoteTab === 'function') {
        setTimeout(() => setNoteTab(tabId), 100);
    }
}

function renderDashSales(data) {
    if (data.length <= 1) return; 
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
    let latest = sortedMonths[0];
    let prev = sortedMonths[1];

    let curData = monthMap[latest] || { rev: 0, traffic: 0, pay: 0 };
    let prevData = prev ? monthMap[prev] : { rev: 0, traffic: 0, pay: 0 };

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
    const el = document.getElementById(id);
    const num = Number(diff);
    if (num > 0) {
        el.innerHTML = `▲ ${num}% <span style="color:#94a3b8; font-weight:500;">(전월)</span>`;
        el.className = 'dash-stat-diff up';
    } else if (num < 0) {
        el.innerHTML = `▼ ${Math.abs(num)}% <span style="color:#94a3b8; font-weight:500;">(전월)</span>`;
        el.className = 'dash-stat-diff down';
    } else {
        el.innerHTML = `- <span style="color:#94a3b8; font-weight:500;">(전월)</span>`;
        el.className = 'dash-stat-diff';
    }
}

function renderDashRanking(data) {
    if (data.length <= 1) return;
    let rows = data.slice(1);
    let upList = [], downList = [];

    rows.forEach(r => {
        let ranks = [r[5], r[6], r[7], r[8], r[9]];
        let lastIdx = -1;
        for (let i = 4; i >= 0; i--) { if (ranks[i] !== "" && ranks[i] != null) { lastIdx = i; break; } }

        if (lastIdx > 0 && ranks[lastIdx - 1] !== "" && ranks[lastIdx - 1] != null) {
            let prevRank = Number(ranks[lastIdx - 1]);
            let curRank = Number(ranks[lastIdx]);
            let diff = prevRank - curRank; 
            let thumb = r[12] || '';
            let name = r[1];
            let link = `https://smartstore.naver.com/hkdy/products/${r[0]}`;

            if (diff >= 10) upList.push({ diff, name, thumb, link });
            else if (diff <= -10) downList.push({ diff, name, thumb, link });
        }
    });

    upList.sort((a, b) => b.diff - a.diff);
    downList.sort((a, b) => a.diff - b.diff);

    upList = upList.slice(0, 15);
    downList = downList.slice(0, 15);

    document.getElementById('dash-rank-up-count').innerText = upList.length + '건';
    document.getElementById('dash-rank-down-count').innerText = downList.length + '건';

    const buildItemHTML = (item, isUp) => `
        <a href="${item.link}" target="_blank" class="dash-rank-item">
            <span class="dash-rank-diff ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'}${Math.abs(item.diff)}</span>
            <div class="dash-rank-thumb" ${item.thumb ? `style="background-image:url(${item.thumb})"` : ''}></div>
            <span class="dash-rank-name" title="${item.name}">${item.name}</span>
        </a>
    `;

    document.getElementById('dash-rank-up-list').innerHTML = upList.length ? upList.map(item => buildItemHTML(item, true)).join('') : '<div style="padding:15px; text-align:center; color:#999; font-size:13px;">급상승 내역이 없습니다.</div>';
    document.getElementById('dash-rank-down-list').innerHTML = downList.length ? downList.map(item => buildItemHTML(item, false)).join('') : '<div style="padding:15px; text-align:center; color:#999; font-size:13px;">급하락 내역이 없습니다.</div>';
}

function getWeekIdForDate(year, month, targetDate) {
    if (typeof generateWeeksData === 'function') {
        const weeks = generateWeeksData(year, month);
        const targetDayStr = String(targetDate).padStart(2, '0');
        const targetFullStr = `${year}-${String(month).padStart(2, '0')}-${targetDayStr}`;
        
        for (let w of weeks) {
            if (w.days.some(d => d.date === targetFullStr)) {
                document.getElementById('dash-week-label').innerText = `(${w.name})`;
                return w.id;
            }
        }
        return weeks.length > 0 ? weeks[0].id : "w1"; 
    }
    return "w1";
}

function renderDashTasks(wlData) {
    if (!wlData || wlData.status !== "success" || !wlData.tasks) {
        document.getElementById('dash-task-list').innerHTML = '<li><span class="dash-empty">기록된 목표가 없습니다.</span></li>';
        return;
    }
    
    const now = new Date();
    const weekId = getWeekIdForDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
    
    let plans = wlData.tasks.filter(r => r[4] === 'Plan' && r[2] === weekId && r[7]); 
    
    let listHTML = '';
    let count = 0;
    
    for (let r of plans) {
        let isDone = (r[10] === true || r[10] === "TRUE");
        let doneStyle = isDone ? 'text-decoration: line-through; color: #9ca3af;' : '';
        let badge = r[6] ? `<span class="badge" style="font-size:10px; padding:2px 6px; margin-right:6px;">${r[6]}</span>` : '';
        
        listHTML += `<li onclick="navigateFromDash('worklog')" class="dash-hover-bg">
            <span class="dot ${isDone ? 'secondary' : 'primary'}"></span>
            <span class="dash-note-title" style="${doneStyle}">${badge}${r[7]}</span>
        </li>`;
        
        count++;
        if (count >= 10) break;
    }
    
    document.getElementById('dash-task-list').innerHTML = listHTML || '<li><span class="dash-empty">금주 등록된 목표가 없습니다.</span></li>';
}

function renderDashProdLogs(data) {
    data.sort((a, b) => b.date.localeCompare(a.date));
    let listHTML = data.slice(0, 10).map(item => `
        <li onclick="navigateFromDash('productlogs')" class="dash-hover-bg">
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                <div style="display:flex; align-items:center; flex:1; min-width:0; margin-right:15px;">
                    <span class="dot secondary"></span>
                    <span class="dash-note-title dash-hover-underline">${item.content}</span>
                </div>
                <span class="dash-date">${item.date.substring(5)}</span>
            </div>
        </li>
    `).join('');
    
    document.getElementById('dash-prodlog-list').innerHTML = listHTML || '<li><span class="dash-empty">상품 수정 내역이 없습니다.</span></li>';
}

function renderDashNotes(data, elementId, type) {
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
    
    document.getElementById(elementId).innerHTML = listHTML || `<li><span class="dash-empty">등록된 원고가 없습니다.</span></li>`;
}

window.goNoteFromDash = function(id, type) {
    showPage('notes', document.querySelector('.menu-item[onclick*="notes"]'));
    setNoteTab(type);
    setTimeout(() => loadDraftContent(id), 200);
}