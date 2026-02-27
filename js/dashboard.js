/* ================= [Dashboard Logic - Supabase Version] ================= */
let isDashboardLoaded = false; 

// 🚀 1. 대시보드 요약 데이터 (월 제한 해제 및 정렬 완벽 수정)
window.loadDashboardData = async function() {
    if (!supabaseClient || isDashboardLoaded) return; 
    
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';

    try {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;

        // 🚀 상품 수정내역(ProductLog)은 이번 달 제한을 풀고, 전체에서 내용이 있는 최신 데이터를 가져오도록 수정
        const [salesRes, rankRes, taskRes, memoRes, blogRes, ytRes] = await Promise.all([
            supabaseClient.from('sales_data').select('*').order('month_str', { ascending: false }),
            supabaseClient.from('product_rankings').select('*'),
            supabaseClient.from('monthly_tasks').select('*').eq('year', y).eq('month', m),
            supabaseClient.from('monthly_memos').select('key, content').eq('type', 'ProductLog').neq('content', ''),
            supabaseClient.from('notes').select('id, title, status, saved_at').eq('type', 'blog').order('saved_at', { ascending: false }).limit(10),
            supabaseClient.from('notes').select('id, title, status, saved_at').eq('type', 'youtube').order('saved_at', { ascending: false }).limit(10)
        ]);

        let mappedSales = salesRes.data ? [["Header"]].concat(salesRes.data.map(r => ["", r.month_str, r.revenue, r.ad_spend, r.roas, r.traffic, r.pay_count, r.mobile_ratio, r.refund_ratio, r.winner_ratio])) : [];
        let mappedRanks = rankRes.data ? [["Header"]].concat(rankRes.data.map(item => {
            let row = new Array(14).fill("");
            row[0] = item.code; row[1] = item.name; row[3] = item.category_tab; 
            row[5] = item.rank_w1; row[6] = item.rank_w2; row[7] = item.rank_w3; row[8] = item.rank_w4; row[9] = item.rank_w5; 
            row[11] = item.is_checked ? "TRUE" : "FALSE"; row[12] = item.image_url;
            return row;
        })) : [];
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
            const { data } = await supabaseClient.from('product_rankings').select('*');
            if(data) renderDashRanking([["Header"]].concat(data.map(item => {
                let row = new Array(14).fill("");
                row[0] = item.code; row[1] = item.name; row[5] = item.rank_w1; row[6] = item.rank_w2; row[7] = item.rank_w3; row[8] = item.rank_w4; row[9] = item.rank_w5; row[12] = item.image_url;
                return row;
            })));
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
    } catch(e) { console.error("새로고침 오류:", e); } 
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

        if (lastIdx > 0 && ranks[lastIdx - 1] !== "" && ranks[lastIdx - 1] != null) {
            let prevRank = Number(ranks[lastIdx - 1]); let curRank = Number(ranks[lastIdx]);
            let diff = prevRank - curRank; let thumb = r[12] || ''; let name = r[1]; let link = `https://smartstore.naver.com/hkdy/products/${r[0]}`;
            if (diff >= 10) upList.push({ diff, curRank, name, thumb, link });
            else if (diff <= -10) downList.push({ diff, curRank, name, thumb, link });
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

// 🚀 2. 상품 수정 내역 렌더링 (날짜 규격화 및 완벽 정렬)
function renderDashProdLogs(data) {
    if (!data || data.length === 0) {
        document.getElementById('dash-prodlog-list').innerHTML = '<li><span class="dash-empty">상품 수정 내역이 없습니다.</span></li>';
        return;
    }

    let validData = data.map(item => {
        let rawDate = item.date || "";
        // 점과 띄어쓰기를 모두 대시(-)로 통일하여 컴퓨터가 똑바로 인식하게 만듦
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

    // 통일된 날짜(sortDate)를 기준으로 최신순 정렬
    validData.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

    // 화면엔 예쁘게 월-일만 표시 (예: 02-27)
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
        content.style.display = 'grid'; 
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
};

/* ================= [Note Logic - Supabase Version] ================= */
let currentNoteTab = 'general';
let currentNoteId = null;

window.setNoteTab = function(tab) {
    currentNoteTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[onclick*="${tab}"]`);
    if(activeBtn) activeBtn.classList.add('active');

    const metaArea = document.getElementById('draftMetadataArea');
    const listContainer = document.getElementById('draftListContainer');
    const editorWrapper = document.getElementById('editor-wrapper');
    const titleInput = document.getElementById('draftTitle');

    if (tab === 'general') {
        if(metaArea) metaArea.style.display = 'none'; 
        if(listContainer) listContainer.style.display = 'none'; 
        if(editorWrapper) editorWrapper.style.display = 'flex';
        handleNoteDateChange();
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

window.handleNoteDateChange = async function() {
    if (!supabaseClient || currentNoteTab !== 'general') return;
    const dateStr = document.getElementById('noteDate').value;
    if (!dateStr) return;

    document.getElementById('loader').style.display = 'flex';
    try {
        const { data, error } = await supabaseClient.from('notes').select('*').eq('date', dateStr).eq('type', 'general').order('saved_at', { ascending: false }).limit(1);
        if (error) throw error;
        if (data && data.length > 0) { 
            currentNoteId = data[0].id; 
            if (window.quill) window.quill.root.innerHTML = data[0].content || ''; 
        } 
        else { 
            currentNoteId = null; 
            if (window.quill) window.quill.root.innerHTML = ''; 
        }
    } catch (e) { console.error("노트 로드 실패:", e); } 
    finally { document.getElementById('loader').style.display = 'none'; }
}

window.initQuill = function() {
    if (window.quill) return; 
    window.quill = new Quill('#editor', {
        theme: 'snow', placeholder: '만능 비서와 함께 업무 내용을 자유롭게 기록하세요...',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['image', 'link', 'clean']
                ],
                handlers: { 'image': imageUploadHandler }
            }
        }
    });

    window.quill.root.addEventListener('paste', function(e) {
        if (e.clipboardData && e.clipboardData.items) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    e.preventDefault(); const file = items[i].getAsFile(); uploadFileToSupabase(file); return;
                }
            }
        }
    }, false);

    window.quill.root.addEventListener('drop', function(e) {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) { e.preventDefault(); uploadFileToSupabase(file); }
        }
    }, false);
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
    } catch (error) { console.error('이미지 업로드 오류:', error); alert('이미지 업로드 실패. (Storage 권한 확인)'); } 
    finally { document.getElementById('loader').style.display = 'none'; }
}

window.saveNoteToServer = async function() {
    if (!supabaseClient) return;
    const date = document.getElementById('noteDate').value;
    const title = currentNoteTab === 'general' ? '일반 노트' : document.getElementById('draftTitle').value.trim();
    const status = currentNoteTab === 'general' ? 'saving' : document.getElementById('draftStatus').value;
    const content = window.quill.root.innerHTML;

    if (!date) { alert("날짜를 선택해주세요."); return; }
    if (content === "<p><br></p>" || !content) { alert("내용을 입력해주세요!"); return; }

    const saveBtn = document.querySelector('.note-controls .btn-primary');
    const originalText = saveBtn.innerHTML; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장중...'; saveBtn.disabled = true;

    try {
        if (currentNoteId) {
            const { error } = await supabaseClient.from('notes').update({ title: title, content: content, status: status, saved_at: new Date() }).eq('id', currentNoteId);
            if (error) throw error;
        } else {
            const { data, error } = await supabaseClient.from('notes').insert([{ date: date, type: currentNoteTab, title: title, content: content, status: status }]).select();
            if (error) throw error; if (data && data.length > 0) currentNoteId = data[0].id; 
        }

        const statusLabel = document.getElementById('noteSaveStatus');
        if(statusLabel) { const now = new Date(); statusLabel.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} 저장됨`; }
        if (currentNoteTab !== 'general') loadDraftList(currentNoteTab);
    } catch (e) { console.error("원고 저장 오류:", e); alert("저장 오류 발생"); } 
    finally { saveBtn.innerHTML = originalText; saveBtn.disabled = false; }
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
            document.getElementById('draftListContainer').style.display = 'none'; document.getElementById('draftMetadataArea').style.display = 'flex'; document.getElementById('editor-wrapper').style.display = 'flex';
        }
    } catch (e) { console.error("원고 불러오기 오류:", e); } finally { document.getElementById('loader').style.display = 'none'; }
}

window.createNewDraft = function() {
    currentNoteId = null; document.getElementById('draftTitle').value = ''; document.getElementById('draftStatus').value = 'saving'; if (window.quill) window.quill.root.innerHTML = '';
    document.getElementById('draftListContainer').style.display = 'none'; document.getElementById('draftMetadataArea').style.display = 'flex'; document.getElementById('editor-wrapper').style.display = 'flex';
}

window.resetNoteToOriginal = function() {
    if(confirm("수정된 내용을 모두 취소하시겠습니까?")) {
        if(currentNoteTab === 'general') handleNoteDateChange();
        else if(currentNoteId) loadDraftContent(currentNoteId);
        else createNewDraft();
    }
}
window.searchNotes = function() { /* 나중에 검색 기능 고도화 시 사용 */ }


/* ================= [🚀 NEW: 퀵 메모 (Quick Memo) 연동 로직] ================= */
let quickQuill = null;
let currentQuickNoteId = null;

window.toggleQuickMemo = function() {
    const panel = document.getElementById('quickMemoPanel');
    const panels = ['aiChatPanel', 'calcPanel', 'widgetPanel', 'estimatePanel'];
    panels.forEach(id => { const el = document.getElementById(id); if(el && el.classList.contains('open')) el.classList.remove('open'); });
    
    if (!panel.classList.contains('open')) {
        panel.classList.add('open');
        initQuickEditor();
        loadQuickMemo(); // 패널을 열 때마다 오늘 날짜 메모를 자동으로 불러옴
    } else { 
        panel.classList.remove('open'); 
    }
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

// 🚀 오늘 날짜의 일반 노트를 찾아서 퀵 메모에 띄우기
window.loadQuickMemo = async function() {
    if(!supabaseClient) return;
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    document.getElementById('quickMemoDate').innerText = dateStr;
    document.getElementById('quickMemoStatus').innerText = '';
    
    try {
        const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .eq('date', dateStr)
            .eq('type', 'general')
            .limit(1);
            
        if (error) throw error;
        
        if (data && data.length > 0) {
            currentQuickNoteId = data[0].id;
            if (quickQuill) quickQuill.root.innerHTML = data[0].content || '';
        } else {
            currentQuickNoteId = null;
            if (quickQuill) quickQuill.root.innerHTML = '';
        }
    } catch(e) {
        console.error('퀵 메모 로드 실패:', e);
    }
}

// 🚀 퀵 메모에 적은 내용을 '업무 노트(general)'에 자동 저장하기
window.saveQuickMemo = async function() {
    if(!supabaseClient) return;
    const dateStr = document.getElementById('quickMemoDate').innerText;
    const content = quickQuill.root.innerHTML;
    const statusMsg = document.getElementById('quickMemoStatus');
    
    if (content === "<p><br></p>" || !content) return;
    
    statusMsg.innerText = "저장 중...";
    statusMsg.style.color = "#f59e0b";

    try {
        if (currentQuickNoteId) {
            // 기존 메모 업데이트
            const { error } = await supabaseClient.from('notes')
                .update({ content: content, saved_at: new Date() })
                .eq('id', currentQuickNoteId);
            if(error) throw error;
        } else {
            // 오늘 날짜 메모가 없으면 새로 생성
            const { data, error } = await supabaseClient.from('notes')
                .insert([{ date: dateStr, type: 'general', title: '일반 노트', content: content, status: 'saving' }])
                .select();
            if(error) throw error;
            if (data && data.length > 0) currentQuickNoteId = data[0].id;
        }
        
        const now = new Date();
        statusMsg.innerText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} 일반 노트에 저장됨!`;
        statusMsg.style.color = "#10b981";
        
        // 만약 사용자가 현재 '업무 노트' 화면을 보고 있다면 그쪽 화면도 새로고침해서 연동시킴
        const mainNoteDateInput = document.getElementById('noteDate');
        if (typeof handleNoteDateChange === 'function' && mainNoteDateInput && mainNoteDateInput.value === dateStr) {
            if(document.getElementById('page-notes').classList.contains('active')) {
                handleNoteDateChange();
            }
        }
    } catch(e) {
        console.error('퀵 메모 저장 실패:', e);
        statusMsg.innerText = "저장 실패";
        statusMsg.style.color = "#ef4444";
    }
}