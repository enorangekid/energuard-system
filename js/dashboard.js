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
            supabaseClient.from('notes').select('id, title, status, saved_at').eq('type', 'youtube').order('saved_at', { ascending: false }).limit(10)
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
