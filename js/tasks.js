/* ================= [Timeline Logic - Supabase Version] ================= */
let collapsedDates = {};
let timeLogs = [];
let editingItemIndex = -1; 
let isTimelineFetched = false;

function formatTimeStr(str) {
  if(!str) return "";
  str = str.trim();
  return str.indexOf(':') === 1 ? "0" + str : str;
}
function getDayKor(dateStr) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(dateStr).getDay()];
}

window.updateDefaultStartTime = function() {
    if (editingItemIndex > -1) return; 
    const selectedDate = document.getElementById('tDate').value;
    if (!selectedDate) return;

    const dayLogs = timeLogs.filter(log => log.date === selectedDate && log.category !== '휴무');
    if (dayLogs.length > 0) {
        dayLogs.sort((a, b) => a.end.localeCompare(b.end));
        const lastLog = dayLogs[dayLogs.length - 1];
        if (lastLog && lastLog.end && lastLog.end !== "00:00") {
            const parts = lastLog.end.split(':');
            document.getElementById('tStartH').value = parts[0];
            document.getElementById('tStartM').value = parts[1];
        }
    } else {
        document.getElementById('tStartH').value = '';
        document.getElementById('tStartM').value = '';
    }
};

async function loadTimelineFromServer() {
  if(!supabaseClient) return; 
  
  const now = new Date();
  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  document.getElementById('tDate').value = todayStr;

  // Supabase 전환으로 인해 더 이상 '전체 저장' 버튼이 필요 없음 (UI 변경)
  const saveBtn = document.querySelector('#page-timeline .btn-server');
  if (saveBtn) {
      saveBtn.innerHTML = '<i class="fa-solid fa-cloud-bolt"></i> 실시간 연동중';
      saveBtn.style.background = '#3b82f6';
      saveBtn.onclick = () => showToast('Supabase 적용 완료: 타임라인은 추가/수정/삭제 시 실시간으로 자동 저장됩니다!', 'info');
  }

  if(isTimelineFetched) {
      document.getElementById('loader').style.display = 'none';
      renderTimeLog();
      updateDefaultStartTime();
      return;
  }

  const loader = document.getElementById('loader');
  if(loader) loader.style.display = 'flex';

  try {
      // ✅ Supabase에서 타임라인 데이터 직접 조회
      const { data, error } = await supabaseClient.from('time_logs')
          .select('*')
          .order('date', { ascending: false })
          .order('start_time', { ascending: true });
          
      if(error) throw error;
      
      timeLogs = data.map(r => ({
          id: r.id,
          date: r.date,
          category: r.category,
          task: r.task,
          start: r.start_time ? r.start_time.substring(0, 5) : "",
          end: r.end_time ? r.end_time.substring(0, 5) : "",
          duration: r.duration,
          min: r.min
      }));

      isTimelineFetched = true; 
      updateYearFilterOptions();
      renderTimeLog();
      updateDefaultStartTime();
      
  } catch (e) {
      console.error("타임라인 데이터 로드 오류:", e);
      showToast('타임라인 데이터를 불러오지 못했습니다.', 'error');
  } finally {
      if(loader) loader.style.display = 'none';
  }
}

function updateYearFilterOptions() {
  const yearSet = new Set();
  timeLogs.forEach(log => { if(log.date) yearSet.add(log.date.substring(0, 4)); });
  const thisYear = new Date().getFullYear().toString();
  yearSet.add(thisYear); // 데이터가 없어도 현재 연도는 항상 포함
  const select = document.getElementById('yearFilter');
  const cur = select.value; // 현재 선택값 보존 시도
  select.innerHTML = '';
  Array.from(yearSet).sort().reverse().forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.innerText = y + "년";
    select.appendChild(opt);
  });
  // 이전 선택값이 유효하면 유지, 아니면 현재 연도로 기본 설정
  select.value = Array.from(yearSet).includes(cur) ? cur : thisYear;
}

function renderTimeLog() {
  const tbody = document.getElementById('timelineList');
  // 렌더링을 다음 프레임으로 미뤄 메인 스레드 블로킹 방지
  requestAnimationFrame(() => {
  tbody.innerHTML = '';
  const selectedYear = document.getElementById('yearFilter').value;
  const searchQuery = document.getElementById('taskSearch').value.toLowerCase();
  let filteredLogs = timeLogs.filter(log => log.date.startsWith(selectedYear) && (log.task.toLowerCase().includes(searchQuery) || log.category.toLowerCase().includes(searchQuery)));
  filteredLogs.sort((a,b) => b.date.localeCompare(a.date) || a.start.localeCompare(b.start));

  // 인덱스 맵 미리 생성 (indexOf O(n) 반복 제거)
  const idxMap = new Map(timeLogs.map((log, i) => [log, i]));

  const grouped = {};
  filteredLogs.forEach(log => { if(!grouped[log.date]) grouped[log.date] = []; grouped[log.date].push(log); });

  // DocumentFragment로 DOM 조작 최소화
  const frag = document.createDocumentFragment();

  Object.keys(grouped).forEach(date => {
      const dayOfWeek = getDayKor(date);
      const groupLogs = grouped[date];
      const isHoliday = groupLogs.some(l => l.category === '휴무');
      const isCollapsed = collapsedDates[date] || false;
      let headerRow = document.createElement('tr');
      headerRow.className = 'date-header-row' + (isHoliday ? ' holiday-header' : '');
      headerRow.onclick = () => { collapsedDates[date] = !collapsedDates[date]; renderTimeLog(); };
      headerRow.innerHTML = `<td colspan="6"><div class="date-header-text" style="font-weight: 700; color: #334155; font-size: 15px; display: flex; align-items: center; gap: 10px; padding: 4px 8px;">
          <i class="fa-solid fa-chevron-down date-arrow" style="transition: transform 0.2s; ${isCollapsed ? 'transform: rotate(-90deg);' : ''}"></i>
          <span>${date} <span style="font-weight:400; opacity:0.8;">(${dayOfWeek})</span></span>
          ${isHoliday ? '<span class="badge badge-holiday">휴무</span>' : ''}</div></td>`;
      frag.appendChild(headerRow);

      if(!isCollapsed) {
          groupLogs.forEach(log => {
              const realIdx = idxMap.get(log) ?? timeLogs.indexOf(log);
              let row = document.createElement('tr');
              let durationHtml = log.duration;
              if (log.min >= 120) durationHtml = `<span style="color: #dc2626; font-weight: 700; background: #fef2f2; border-radius: 6px; padding: 4px 8px;">${log.duration}</span>`;
              else if (log.min >= 60) durationHtml = `<span style="color: #d97706; font-weight: 700; background: #fffbeb; border-radius: 6px; padding: 4px 8px;">${log.duration}</span>`;
              let catBadge = log.category === '휴무' ? 'badge badge-holiday' : 'badge';

              // ✅ XSS 방지: DB에서 온 사용자 데이터(category, task, start, end)는 textContent로 처리
              const tdCat = document.createElement('td');
              const catSpan = document.createElement('span');
              catSpan.className = catBadge;
              catSpan.textContent = log.category;
              tdCat.appendChild(catSpan);

              const tdTask = document.createElement('td');
              tdTask.textContent = log.task;

              const tdStart = document.createElement('td');
              tdStart.textContent = log.start;

              const tdEnd = document.createElement('td');
              tdEnd.textContent = log.end;

              const tdDuration = document.createElement('td');
              tdDuration.innerHTML = DOMPurify.sanitize(durationHtml);

              const tdBtns = document.createElement('td');
              tdBtns.innerHTML = `<button onclick="editTimeLog(${realIdx})" title="수정" style="border:none;background:none;cursor:pointer;color:#2563eb;margin-right:8px;"><i class="fa-solid fa-pen"></i></button><button onclick="deleteTimeLog(${realIdx})" title="삭제" style="border:none;background:none;cursor:pointer;color:#ef4444;"><i class="fa-solid fa-trash-can"></i></button>`;

              row.appendChild(tdCat);
              row.appendChild(tdTask);
              row.appendChild(tdStart);
              row.appendChild(tdEnd);
              row.appendChild(tdDuration);
              row.appendChild(tdBtns);
              frag.appendChild(row);
          });
      }
  });
  tbody.appendChild(frag);
  }); // rAF 끝
}


// ✅ Supabase 연동 타임라인 추가/수정 함수
async function addTimeLog() {
  const date = document.getElementById('tDate').value;
  const category = document.getElementById('tCategory').value;
  const task = document.getElementById('tTask').value;
  let sh = document.getElementById('tStartH').value;
  let sm = document.getElementById('tStartM').value;
  let eh = document.getElementById('tEndH').value;
  let em = document.getElementById('tEndM').value;
  
  if (!date) { showToast('날짜를 선택해주세요.', 'warning'); return; }
  if (!task) { showToast('업무 내용을 입력해주세요.', 'warning'); return; }
  
  let start = "00:00", end = "00:00", duration = "0:00", min = 0;
  function padTwo(num) { return num.toString().padStart(2, '0'); }
  
  if(category !== '휴무') {
      if (sh === "" || eh === "") { showToast('시간을 입력해주세요.', 'warning'); return; }
      start = padTwo(sh) + ":" + padTwo(sm || 0);
      end = padTwo(eh) + ":" + padTwo(em || 0);
      const s = new Date(`2000-01-01T${start}:00`), e = new Date(`2000-01-01T${end}:00`);
      let diff = Math.max(0, e - s);
      const mTotal = Math.floor(diff / 60000), h = Math.floor(mTotal / 60), m = mTotal % 60;
      duration = `${h}:${m.toString().padStart(2, '0')}`;
      min = mTotal;
  }
  
  const loader = document.getElementById('loader');
  loader.style.display = 'flex';

  try {
      if(editingItemIndex > -1) {
          // 수정 모드 (Update)
          const targetId = timeLogs[editingItemIndex].id;
          const { error } = await supabaseClient.from('time_logs').update({
              date: date, category: category, task: task,
              start_time: start + ":00", end_time: end + ":00",
              duration: duration, min: min
          }).eq('id', targetId);

          if(error) throw error;

          timeLogs[editingItemIndex] = { id: targetId, date, category, task, start, end, duration, min };
          showToast("수정 완료!", "success");
          cancelEditMode(); 
      } else {
          // 추가 모드 (Insert)
          const { data, error } = await supabaseClient.from('time_logs').insert([{
              date: date, category: category, task: task,
              start_time: start + ":00", end_time: end + ":00",
              duration: duration, min: min
          }]).select();

          if(error) throw error;
          
          if(data && data.length > 0) {
              timeLogs.push({ id: data[0].id, date, category, task, start, end, duration, min });
              document.getElementById('tTask').value = '';
              document.getElementById('tEndH').value = '';
              document.getElementById('tEndM').value = '';
              updateDefaultStartTime(); 
          }
      }
      renderTimeLog();
  } catch (err) {
      console.error(err); showToast('저장 오류: ' + (err.message || err.code || '알 수 없는 오류'), 'error');
  } finally {
      loader.style.display = 'none';
  }
}

// ✅ Supabase 연동 타임라인 삭제 함수
window.deleteTimeLog = async function(index) {
    if(!confirm('정말 이 기록을 삭제하시겠습니까?')) return;
    const targetId = timeLogs[index].id;
    if(!targetId) return;

    document.getElementById('loader').style.display = 'flex';
    try {
        const { error } = await supabaseClient.from('time_logs').delete().eq('id', targetId);
        if(error) throw error;
        
        timeLogs.splice(index, 1);
        updateDefaultStartTime(); 
        renderTimeLog();
    } catch(err) {
        console.error(err); showToast('삭제 중 오류가 발생했습니다.', 'error');
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
}

let isAllCollapsed = false;
window.toggleAllDates = function() {
    isAllCollapsed = !isAllCollapsed; 
    const icon = document.getElementById('globalCollapseIcon');
    if (icon) icon.style.transform = isAllCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';

    const selectedYear = document.getElementById('yearFilter').value;
    const searchQuery = document.getElementById('taskSearch').value.toLowerCase();
    let filteredLogs = timeLogs.filter(log => log.date.startsWith(selectedYear) && (log.task.toLowerCase().includes(searchQuery) || log.category.toLowerCase().includes(searchQuery)));

    const grouped = {};
    filteredLogs.forEach(log => { if(!grouped[log.date]) grouped[log.date] = []; grouped[log.date].push(log); });
    const sortedDates = Object.keys(grouped).sort((a,b) => b.localeCompare(a));

    if(sortedDates.length > 0) {
        const latestDate = sortedDates[0];
        sortedDates.forEach(date => {
            if (isAllCollapsed) collapsedDates[date] = (date !== latestDate); 
            else collapsedDates[date] = false;
        });
    }
    renderTimeLog();
};

function editTimeLog(index) {
    const log = timeLogs[index];
    if(!log) return;
    editingItemIndex = index;
    document.getElementById('tDate').value = log.date;
    document.getElementById('tCategory').value = log.category;
    document.getElementById('tTask').value = log.task;
    
    if(log.category !== '휴무' && log.start) {
        const startParts = log.start.split(':');
        const endParts = log.end.split(':');
        document.getElementById('tStartH').value = startParts[0];
        document.getElementById('tStartM').value = startParts[1];
        document.getElementById('tEndH').value = endParts[0];
        document.getElementById('tEndM').value = endParts[1];
    } else {
         ['tStartH','tStartM','tEndH','tEndM'].forEach(id => document.getElementById(id).value = '');
    }

    document.getElementById('editModeMsg').style.display = 'block';
    const btn = document.getElementById('addLogBtn');
    btn.innerHTML = '<i class="fa-solid fa-check"></i> 수정';
    btn.classList.add('update-mode');
    document.querySelector('.input-panel').scrollIntoView({ behavior: 'smooth' });
}

function cancelEditMode() {
    editingItemIndex = -1;
    document.getElementById('editModeMsg').style.display = 'none';
    const btn = document.getElementById('addLogBtn');
    btn.innerHTML = '<i class="fa-solid fa-plus"></i> 등록';
    btn.classList.remove('update-mode');
    document.getElementById('tTask').value = '';
    document.getElementById('tEndH').value = '';
    document.getElementById('tEndM').value = '';
    updateDefaultStartTime(); 
}

/* ================= [Worklog Logic - Supabase Version] ================= */
let currentWorkYear = new Date().getFullYear();
let currentWorkMonth = new Date().getMonth() + 1; 
let activeMemoBox = null;
let worklogCache = {};

window.addEventListener('DOMContentLoaded', () => {
   updateDateDisplay();
   setupDragSelection(); 
   initMonthlyLog(); 
});

async function handleMonthChange(input) {
  if(!input.value) return;
  const parts = input.value.split('-');
  currentWorkYear = parseInt(parts[0]);
  currentWorkMonth = parseInt(parts[1]);
  updateDateDisplay();
  initMonthlyLog();

  // ✅ [안전장치 A] 로드 완료 전까지 저장 버튼 비활성화 (로드 중 저장으로 인한 데이터 소실 방지)
  const saveBtn = document.querySelector('.worklog-save-btn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = '0.4'; saveBtn.title = '데이터 로딩 중...'; }

  await loadWorklogFromServer();

  if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = ''; saveBtn.title = ''; }
}

function updateDateDisplay() {
  const val = `${currentWorkYear}-${String(currentWorkMonth).padStart(2, '0')}`;
  const picker = document.getElementById('worklogPicker');
  if(picker) picker.value = val;
}

function generateWeeksData(year, month) {
  const weeks = [];
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0); 
  const lastDate = lastDayOfMonth.getDate(); 
  let startDayOfWeek = firstDayOfMonth.getDay(); 
  let currentPointer = new Date(year, month - 1, 1);
  if (startDayOfWeek === 0) currentPointer.setDate(currentPointer.getDate() - 6);
  else currentPointer.setDate(currentPointer.getDate() - (startDayOfWeek - 1));
  let weekCount = 1;
  let done = false;
  while (!done && weekCount <= 6) {
      let weekData = { id: `w${weekCount}`, name: `${weekCount}주차`, range: '', days: [] };
      let weekFirstNum = null; let weekLastNum = null;
      for (let i = 0; i < 5; i++) {
          const isTargetMonth = (currentPointer.getMonth() === month - 1) && (currentPointer.getFullYear() === year);
          if (isTargetMonth) {
              const mm = String(month).padStart(2, '0');
              const dd = String(currentPointer.getDate()).padStart(2, '0');
              const dayNames = ['일','월','화','수','목','금','토'];
              weekData.days.push({ date: `${year}-${mm}-${dd}`, day: dayNames[currentPointer.getDay()], num: dd, isBlank: false });
              if(!weekFirstNum) weekFirstNum = dd;
              weekLastNum = dd;
          } else {
              weekData.days.push({ date: '', day: ['일','월','화','수','목','금','토'][currentPointer.getDay()], num: '', isBlank: true });
          }
          currentPointer.setDate(currentPointer.getDate() + 1);
      }
      currentPointer.setDate(currentPointer.getDate() + 2); 
      if (weekFirstNum) {
           const mm = String(month).padStart(2, '0');
           weekData.range = `${mm}.${weekFirstNum} ~ ${mm}.${weekLastNum}`;
           weeks.push(weekData); weekCount++;
      }
      if (weekLastNum == lastDate) done = true;
      if (currentPointer.getMonth() !== month - 1 || currentPointer.getFullYear() !== year) done = true;
  }
  return weeks;
}

function initMonthlyLog() {
  const container = document.getElementById('monthlyContainer');
  if(!container) return;
  container.innerHTML = ''; 
  const weeksData = generateWeeksData(currentWorkYear, currentWorkMonth);
  weeksData.forEach((week) => {
    const weekDiv = document.createElement('div');
    weekDiv.className = 'week-row';
    weekDiv.dataset.weekId = week.id;
    let planRows = '';
    for(let i=0; i<20; i++) { 
      planRows += `
        <div class="task-strip" data-row="${i}">
          <div class="b-cell c-no"></div> 
          <div class="b-cell c-cat"><input type="text" class="clean-input text-center" name="category" oninput="updateRow(this)"></div>
          <div class="b-cell c-task"><input type="text" class="clean-input" name="task" oninput="updateRow(this)"></div>
          <div class="b-cell c-prio"><select class="clean-input prio-select" name="priority"><option value="">-</option><option value="4">■■■■</option><option value="3">■■■</option><option value="2">■■</option><option value="1">■</option></select></div>
          <div class="b-cell c-date"><input type="text" class="clean-input text-center" name="deadline"></div>
          <div class="b-cell c-chk"><input type="checkbox" name="done" onchange="toggleDone(this)"></div>
        </div>`;
    }
    const planHtml = `
      <div class="week-plan-section">
        <div class="section-header"><span class="section-title">${week.name} 목표</span><span class="section-date">${week.range}</span></div>
        <div class="header-row"><div class="h-cell c-no">NO</div><div class="h-cell c-cat">구분</div><div class="h-cell c-task">업무내용</div><div class="h-cell c-prio">우선순위</div><div class="h-cell c-date">마감</div><div class="h-cell c-chk">완료</div></div>
        <div class="wp-list">${planRows}</div>
        <div class="bottom-area">
          <div class="btm-title">진행 필요한 후속 업무</div><div class="btm-input-box"><input type="text" class="btm-full-input" name="nextPlan"></div>
          <div class="btm-title">회고 (잘한 점 / 보완할 점)</div><div class="btm-input-box"><input type="text" class="btm-full-input" name="retrospective"></div>
          <div class="btm-title">달성률</div><div class="btm-input-box"><div class="progress-wrapper"><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:0%"></div></div><div class="progress-text">0%</div></div></div>
        </div>
      </div>`;
    let dailyHtml = `<div class="week-daily-section">`;
    week.days.forEach(d => {
      const blankClass = d.isBlank ? ' blank' : '';
      const dayDisplay = d.isBlank ? '' : `${d.day} <span style="font-weight:700; color:#a5b4fc; margin-left:4px;">${d.num}</span>`;
      let dayRows = '';
      for(let j=0; j<20; j++) { 
        dayRows += `
          <div class="task-strip" data-row="${j}">
            <div class="b-cell c-no"></div>
            <div class="b-cell c-cat"><input type="text" class="clean-input text-center" name="category" oninput="updateRow(this)"></div>
            <div class="b-cell c-task"><input type="text" class="clean-input" name="task" oninput="updateRow(this)"></div>
            <div class="b-cell c-prio"><select class="clean-input prio-select" name="priority"><option value="">-</option><option value="4">■■■■</option><option value="3">■■■</option><option value="2">■■</option><option value="1">■</option></select></div>
            <div class="b-cell c-chk"><input type="checkbox" name="done" onchange="toggleDone(this)"></div>
            <div class="b-cell c-note"><div class="memo-box" onclick="openMemo(this)" title="메모 없음"><i class="fa-solid fa-pen"></i></div><input type="hidden" name="note" value=""></div>
          </div>`;
      }
      dailyHtml += `
        <div class="day-column${blankClass}" data-date="${d.date}">
          <div class="day-header">${dayDisplay}</div>
          <div class="header-row"><div class="h-cell c-no">NO</div><div class="h-cell c-cat">구분</div><div class="h-cell c-task">업무</div><div class="h-cell c-prio">우선순위</div><div class="h-cell c-chk">완료</div><div class="h-cell c-note">비고</div></div>
          <div class="wp-list">${dayRows}</div>
          <div class="bottom-area">
            <div class="btm-title">메모</div><div class="btm-input-box"><input type="text" class="btm-full-input" name="dayMemo"></div>
            <div class="btm-title">상품 수정 내역</div><div class="btm-input-box"><input type="text" class="btm-full-input" name="productLog"></div>
            <div class="btm-title">달성률</div><div class="btm-input-box"><div class="progress-wrapper"><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:0%"></div></div><div class="progress-text">0%</div></div></div>
          </div>
        </div>`;
    });
    dailyHtml += `</div>`;
    weekDiv.innerHTML = planHtml + dailyHtml;
    container.appendChild(weekDiv);
  });
}

function setupDragSelection() {
  let isSelecting = false; let startInput = null; let selectedInputs = []; let undoStack = []; let cellFocusVal = null; 
  document.addEventListener('focusin', (e) => { if (e.target.classList && e.target.classList.contains('clean-input')) cellFocusVal = e.target.type === 'checkbox' ? e.target.checked : e.target.value; });
  document.addEventListener('focusout', (e) => { if (e.target.classList && e.target.classList.contains('clean-input')) { let currentVal = e.target.type === 'checkbox' ? e.target.checked : e.target.value; if (cellFocusVal !== null && cellFocusVal !== currentVal) { undoStack.push([{ el: e.target, oldVal: cellFocusVal }]); } cellFocusVal = null; } });
  document.addEventListener('change', (e) => { if (e.target.type === 'checkbox' && e.target.classList && e.target.classList.contains('clean-input') && e.isTrusted) undoStack.push([{ el: e.target, oldVal: !e.target.checked }]); });

  document.addEventListener('mousedown', (e) => {
    if (!e.target.classList.contains('clean-input')) { if (!e.target.closest('.wp-list')) clearSelection(); return; }
    if (e.target.classList.contains('cell-selected') && e.button !== 0) return;
    isSelecting = true; startInput = e.target;
    if (!e.shiftKey) { clearSelection(); selectInput(startInput); }
  });
  document.addEventListener('mouseover', (e) => {
    if (!isSelecting || !startInput) return; if (!e.target.classList.contains('clean-input')) return; if (e.target === startInput) return;
    if (startInput.closest('.wp-list') !== e.target.closest('.wp-list')) return;
    updateSelection(startInput, e.target);
  });
  document.addEventListener('mouseup', () => { isSelecting = false; });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (document.activeElement && document.activeElement.classList.contains('clean-input')) return; 
        if (undoStack.length > 0) { e.preventDefault(); const lastChanges = undoStack.pop(); lastChanges.forEach(change => { if (change.el.type === 'checkbox') change.el.checked = change.oldVal; else change.el.value = change.oldVal; triggerInputEvent(change.el); if (change.el.name === 'done') toggleDone(change.el); }); }
        return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedInputs.length > 0) {
        if (selectedInputs.length === 1 && document.activeElement === selectedInputs[0]) return; 
        e.preventDefault(); if (document.activeElement) document.activeElement.blur(); 
        let currentChanges = []; 
        selectedInputs.forEach(input => {
            currentChanges.push({ el: input, oldVal: input.type === 'checkbox' ? input.checked : input.value });
            if(input.type === 'checkbox') input.checked = false; else input.value = '';
            triggerInputEvent(input); if (input.name === 'done') toggleDone(input);
        });
        if (currentChanges.length > 0) undoStack.push(currentChanges);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedInputs.length > 0) handleCopy(e);
  });

  document.addEventListener('paste', (e) => {
      const active = document.activeElement; if (!active || !active.classList.contains('clean-input')) return;
      e.preventDefault(); active.blur(); handlePaste(e, active);
  });

  function clearSelection() { document.querySelectorAll('.clean-input.cell-selected').forEach(el => el.classList.remove('cell-selected')); selectedInputs = []; }
  function selectInput(el) { if(!el.classList.contains('cell-selected')) { el.classList.add('cell-selected'); selectedInputs.push(el); } }
  function updateSelection(start, end) {
    clearSelection();
    const allRows = Array.from(start.closest('.wp-list').querySelectorAll('.task-strip'));
    const startRow = start.closest('.task-strip'); const endRow = end.closest('.task-strip');
    const startRowIdx = allRows.indexOf(startRow); const endRowIdx = allRows.indexOf(endRow);
    const startInputs = Array.from(startRow.querySelectorAll('.clean-input')); const endInputs = Array.from(endRow.querySelectorAll('.clean-input'));
    const startColIdx = startInputs.indexOf(start); const endColIdx = endInputs.indexOf(end);
    const minRow = Math.min(startRowIdx, endRowIdx); const maxRow = Math.max(startRowIdx, endRowIdx);
    const minCol = Math.min(startColIdx, endColIdx); const maxCol = Math.max(startColIdx, endColIdx);
    for (let r = minRow; r <= maxRow; r++) { const inputs = allRows[r].querySelectorAll('.clean-input'); for (let c = minCol; c <= maxCol; c++) { if (inputs[c]) selectInput(inputs[c]); } }
  }
  function triggerInputEvent(input) {
      if (input.name === 'category' || input.name === 'task') updateRow(input);
      if(input.type === 'checkbox') input.dispatchEvent(new Event('change', { bubbles: true })); else input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function handleCopy(e) {
      e.preventDefault(); let rowsMap = new Map();
      selectedInputs.forEach(input => { const row = input.closest('.task-strip'); if(!rowsMap.has(row)) rowsMap.set(row, []); rowsMap.get(row).push(input); });
      let textToCopy = ""; let isFirstRow = true;
      rowsMap.forEach((inputs) => {
          if(!isFirstRow) textToCopy += "\n";
          textToCopy += inputs.map(input => input.type === 'checkbox' ? (input.checked ? "TRUE" : "FALSE") : input.value).join("\t"); isFirstRow = false;
      });
      if (navigator.clipboard) navigator.clipboard.writeText(textToCopy);
  }
  function handlePaste(e, startCellInput) {
      const clipboardData = (e.clipboardData || window.clipboardData).getData('text'); if (!clipboardData) return;
      let startCell = selectedInputs.length > 0 ? selectedInputs[0] : startCellInput; if (!startCell || !startCell.classList.contains('clean-input')) return;
      const startRow = startCell.closest('.task-strip'); const container = startRow.closest('.wp-list');
      const allStripRows = Array.from(container.querySelectorAll('.task-strip'));
      const startRowIdx = allStripRows.indexOf(startRow); const startInputs = Array.from(startRow.querySelectorAll('.clean-input')); const startColIdx = startInputs.indexOf(startCell);
      const rows = clipboardData.split(/\r\n|\n|\r/); let currentChanges = [];
      rows.forEach((rowText, rIdx) => {
          if (rowText.trim() === "" && rIdx === rows.length - 1) return;
          const targetRow = allStripRows[startRowIdx + rIdx]; if (!targetRow) return;
          const targetInputs = Array.from(targetRow.querySelectorAll('.clean-input')); const cols = rowText.split('\t');
          cols.forEach((val, cIdx) => {
              const input = targetInputs[startColIdx + cIdx];
              if (input) {
                  currentChanges.push({ el: input, oldVal: input.type === 'checkbox' ? input.checked : input.value });
                  if(input.type === 'checkbox') input.checked = (val.trim().toUpperCase() === 'TRUE' || val.trim() === '1');
                  else input.value = val.trim(); 
                  triggerInputEvent(input);
              }
          });
      });
      if(currentChanges.length > 0) undoStack.push(currentChanges);
  }
}

// ✅ Supabase 연동 월간 업무일지 로드
// sticky 헤더 스크롤 감지 — 그림자 토글
function initStickyHeader() {
  const contentBody = document.querySelector('.content-body');
  const header = document.querySelector('.worklog-sticky-header');
  if (!contentBody || !header) return;
  contentBody.addEventListener('scroll', function onScroll() {
    // page-worklog가 비활성화되면 리스너 제거
    if (!document.getElementById('page-worklog').classList.contains('active')) {
      contentBody.removeEventListener('scroll', onScroll);
      return;
    }
    header.classList.toggle('is-stuck', contentBody.scrollTop > 10);
  }, { passive: true });
}

async function loadWorklogFromServer() {
  if(!supabaseClient) return;
  const monthKey = `${currentWorkYear}-${currentWorkMonth}`;
  
  if(worklogCache[monthKey]) {
      // ✅ [캐시 버그 수정] tasks가 0건인 캐시는 신뢰하지 않고 서버에서 강제 재조회
      if ((worklogCache[monthKey]?.tasks?.length || 0) > 0) {
          applyWorklogData(worklogCache[monthKey]);
          return;
      }
      delete worklogCache[monthKey];
  }

  const loader = document.getElementById('loader'); loader.style.display = 'flex';
  
  try {
      const [taskRes, memoRes] = await Promise.all([
          supabaseClient.from('monthly_tasks').select('*').eq('year', currentWorkYear).eq('month', currentWorkMonth),
          supabaseClient.from('monthly_memos').select('*').eq('year', currentWorkYear).eq('month', currentWorkMonth)
      ]);

      if(taskRes.error) throw taskRes.error;
      if(memoRes.error) throw memoRes.error;

      // 구글시트 구조를 따르던 프론트엔드 렌더링 로직 호환을 위한 매핑
      const tasks = taskRes.data.map(t => [
          t.year, t.month, t.week_id, t.date, t.type, t.row_index, t.category, t.task, t.priority, t.note_deadline, t.is_done
      ]);
      const memos = memoRes.data.map(m => [
          m.year, m.month, m.key, m.type, m.content
      ]);

      const json = { status: "success", tasks, memos };
      worklogCache[monthKey] = json; 
      applyWorklogData(json);       
      
  } catch(e) {
      console.error("업무 일지 로드 오류:", e);
      showToast('업무 일지를 불러오지 못했습니다.', 'error');
  } finally {
      loader.style.display = 'none';
  }
}

// ✅ Supabase 연동 월간 업무일지 일괄 저장
async function collectAndSaveWorklog() {
  const targetYear = currentWorkYear;
  const targetMonth = currentWorkMonth;

  // ✅ [안전장치 B] 화면에 입력된 task/category가 하나도 없으면 저장 차단
  const allTaskInputs = document.querySelectorAll('#monthlyContainer .week-row [name="task"], #monthlyContainer .week-row [name="category"]');
  const hasAnyContent = Array.from(allTaskInputs).some(el => el.value.trim() !== '');

  if (!hasAnyContent) {
    try {
      const { data: chkExist } = await supabaseClient
        .from('monthly_tasks').select('id').eq('year', targetYear).eq('month', targetMonth).limit(1);
      if (chkExist && chkExist.length > 0) {
        showToast(`⚠️ 화면에 내용이 없습니다. DB의 ${targetYear}년 ${targetMonth}월 데이터를 보호하기 위해 저장을 취소했습니다.`, 'warning');
        return;
      }
    } catch(e) {
      showToast('⚠️ 화면에 입력된 내용이 없습니다. 데이터 보호를 위해 저장을 취소했습니다.', 'warning');
      return;
    }
  }

  // ✅ [안전장치 C] 저장 전 DB 기존 건수 확인 후 화면에 노출
  let existingTaskCount = 0;
  try {
    const { data: chk } = await supabaseClient
      .from('monthly_tasks').select('id').eq('year', targetYear).eq('month', targetMonth);
    existingTaskCount = chk ? chk.length : 0;
  } catch(e) { /* 무시 */ }

  const confirmMsg = existingTaskCount > 0
    ? `${targetYear}년 ${targetMonth}월 업무일지를 저장하시겠습니까?\n⚠️ DB에 기존 데이터 ${existingTaskCount}건이 있습니다. 현재 화면 내용으로 덮어씨워집니다.`
    : `${targetYear}년 ${targetMonth}월 업무일지를 저장하시겠습니까?`;

  if(!confirm(confirmMsg)) return;

  const loader = document.getElementById('loader'); loader.style.display = 'flex';

  let taskRows = []; let memoRows = [];
  
  document.querySelectorAll('.week-row').forEach(weekEl => {
    const weekId = weekEl.dataset.weekId;
    const planSec = weekEl.querySelector('.week-plan-section');
    planSec.querySelectorAll('.wp-list .task-strip').forEach((row, idx) => {
      const task = row.querySelector('[name="task"]').value; const cat = row.querySelector('[name="category"]').value;
      if(task || cat) taskRows.push({ year: targetYear, month: targetMonth, week_id: weekId, date: null, type: "Plan", row_index: idx, category: cat, task: task, priority: row.querySelector('[name="priority"]').value, note_deadline: row.querySelector('[name="deadline"]').value, is_done: row.querySelector('[name="done"]').checked });
    });
    memoRows.push({ year: targetYear, month: targetMonth, key: weekId, type: "NextPlan", content: planSec.querySelector('[name="nextPlan"]').value });
    memoRows.push({ year: targetYear, month: targetMonth, key: weekId, type: "Retro", content: planSec.querySelector('[name="retrospective"]').value });
    memoRows.push({ year: targetYear, month: targetMonth, key: weekId, type: "Rate", content: planSec.querySelector('.progress-text').innerText });
    
    weekEl.querySelectorAll('.day-column').forEach(dayEl => {
      if(dayEl.classList.contains('blank')) return;
      const dateKey = dayEl.dataset.date;
      if(!dateKey) return;
      dayEl.querySelectorAll('.wp-list .task-strip').forEach((row, idx) => {
        const task = row.querySelector('[name="task"]').value; const cat = row.querySelector('[name="category"]').value;
        if(task || cat) taskRows.push({ year: targetYear, month: targetMonth, week_id: weekId, date: dateKey, type: "Daily", row_index: idx, category: cat, task: task, priority: row.querySelector('[name="priority"]').value, note_deadline: row.querySelector('[name="note"]').value, is_done: row.querySelector('[name="done"]').checked });
      });
      memoRows.push({ year: targetYear, month: targetMonth, key: dateKey, type: "Memo", content: dayEl.querySelector('[name="dayMemo"]').value });
      memoRows.push({ year: targetYear, month: targetMonth, key: dateKey, type: "ProductLog", content: dayEl.querySelector('[name="productLog"]').value });
      memoRows.push({ year: targetYear, month: targetMonth, key: dateKey, type: "Rate", content: dayEl.querySelector('.progress-text').innerText });
    });
  });
  
  try {
      // ✅ [안전장치 D] 삭제 전 기존 데이터 백업
      let backupTasks = [], backupMemos = [];
      try {
        const [bt, bm] = await Promise.all([
          supabaseClient.from('monthly_tasks').select('*').eq('year', targetYear).eq('month', targetMonth),
          supabaseClient.from('monthly_memos').select('*').eq('year', targetYear).eq('month', targetMonth)
        ]);
        backupTasks = bt.data || [];
        backupMemos = bm.data || [];
      } catch(backupErr) { console.warn('백업 조회 실패 (저장은 계속 진행):', backupErr); }

      // 1. 해당 월 데이터 일괄 삭제
      const delTask = await supabaseClient.from('monthly_tasks').delete().eq('year', targetYear).eq('month', targetMonth);
      const delMemo = await supabaseClient.from('monthly_memos').delete().eq('year', targetYear).eq('month', targetMonth);
      if(delTask.error) throw delTask.error;
      if(delMemo.error) throw delMemo.error;

      // 2. 새 데이터 일괄 삽입
      let insertError = null;
      if (taskRows.length > 0) {
        const res = await supabaseClient.from('monthly_tasks').insert(taskRows);
        if(res.error) insertError = res.error;
      }
      if (!insertError && memoRows.length > 0) {
        const res = await supabaseClient.from('monthly_memos').insert(memoRows);
        if(res.error) insertError = res.error;
      }

      // ✅ [안전장치 E] 삽입 실패 시 백업 데이터 자동 복원
      if (insertError) {
        showToast('⚠️ 저장 중 오류! 기존 데이터 복원을 시도합니다...', 'error');
        try {
          if(backupTasks.length > 0) {
            const restoreTasks = backupTasks.map(({id, created_at, ...rest}) => rest);
            await supabaseClient.from('monthly_tasks').insert(restoreTasks);
          }
          if(backupMemos.length > 0) {
            const restoreMemos = backupMemos.map(({id, created_at, ...rest}) => rest);
            await supabaseClient.from('monthly_memos').insert(restoreMemos);
          }
          showToast('기존 데이터가 복원되었습니다. 다시 시도해주세요.', 'warning');
        } catch(restoreErr) {
          showToast('복원 실패. 관리자에게 문의하세요.', 'error');
        }
        return;
      }

      showToast(`저장 완료! (업무 ${taskRows.length}건 저장됨)`, 'success');
      delete worklogCache[`${targetYear}-${targetMonth}`];
      cachedProductLogs = null;
  } catch (err) {
      console.error(err); showToast('저장 중 오류가 발생했습니다: ' + (err.message || ''), 'error');
  } finally {
      loader.style.display = 'none';
  }
}


// 상품수정내역 페이지에서 해당 날짜 업무일지로 이동
window.jumpToWorkLog = function(dateStr) {
    if (!dateStr) return;
    let clean = String(dateStr).trim().replace(/\./g, '-').replace(/\//g, '-');
    const parts = clean.split('-');
    if (parts.length >= 3) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        currentWorkYear = y;
        currentWorkMonth = m;
        updateDateDisplay();
        showPage('worklog', document.querySelector('.menu-item[onclick*="worklog"]'));
        setTimeout(() => {
            initMonthlyLog();
            loadWorklogFromServer().then(() => {
                const fullDate = `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
                const dayCol = document.querySelector(`.day-column[data-date="${fullDate}"]`);
                if (dayCol) dayCol.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }, 100);
    }
};
function normalizeDate(dateStr) {
   if(!dateStr) return "";
   const date = new Date(dateStr);
   if(isNaN(date.getTime())) return dateStr; 
   const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
   return `${y}-${m}-${d}`;
}

function applyWorklogData(json) {
    if(!json || json.status !== "success") return;
    
    json.tasks.forEach(row => {
        const type = row[4]; const weekId = row[2]; const date = normalizeDate(row[3]); const rowIdx = row[5];
        let container = (type === 'Plan') ? document.querySelector(`.week-row[data-week-id="${weekId}"] .week-plan-section`) : document.querySelector(`.day-column[data-date="${date}"]`);
        if(container && !container.classList.contains('blank')) {
           const strip = container.querySelectorAll('.task-strip')[rowIdx];
           if(strip) {
             strip.querySelector('[name="category"]').value = row[6]; strip.querySelector('[name="task"]').value = row[7];
             strip.querySelector('[name="priority"]').value = row[8]; strip.querySelector('[name="done"]').checked = (row[10] === true || row[10] === "TRUE");
             if(type === 'Plan') strip.querySelector('[name="deadline"]').value = row[9] || '';
             else { strip.querySelector('[name="note"]').value = row[9] || ''; const memoBox = strip.querySelector('.memo-box'); if(row[9]) { memoBox.classList.add('has-content'); memoBox.title = row[9]; } }
             updateRow(strip.querySelector('[name="task"]')); toggleDone(strip.querySelector('[name="done"]'));
           }
        }
    });
    json.memos.forEach(row => {
        const key = row[2]; const type = row[3]; const content = row[4] || ''; let inputs = [];
        if(type === 'NextPlan' || type === 'Retro') {
            inputs = document.querySelectorAll(`.week-row[data-week-id="${key}"] [name="${type === 'NextPlan' ? 'nextPlan' : 'retrospective'}"]`);
            if(inputs.length > 0) inputs[0].value = content;
        } else if (type === 'Memo' || type === 'ProductLog') {
            if(type === 'ProductLog') {
                if(!isNaN(Number(content))) return;
            }
            inputs = document.querySelectorAll(`.day-column[data-date="${normalizeDate(key)}"] [name="${type === 'Memo' ? 'dayMemo' : 'productLog'}"]`);
            if(inputs.length > 0) inputs[0].value = content;
        } else if (type === 'Rate') {
            // 버그3 수정: 달성률 복원
            const pct = parseInt(content) || 0;
            // 주차 목표 달성률
            const planFill = document.querySelector(`.week-row[data-week-id="${key}"] .week-plan-section .progress-bar-fill`);
            const planText = document.querySelector(`.week-row[data-week-id="${key}"] .week-plan-section .progress-text`);
            if (planFill && planText) { planFill.style.width = pct + '%'; planText.innerText = pct + '%'; }
            // 일별 달성률
            const dayFill = document.querySelector(`.day-column[data-date="${normalizeDate(key)}"] .progress-bar-fill`);
            const dayText = document.querySelector(`.day-column[data-date="${normalizeDate(key)}"] .progress-text`);
            if (dayFill && dayText) { dayFill.style.width = pct + '%'; dayText.innerText = pct + '%'; }
        }
    });
}

function updateRow(input) {
  const row = input.closest('.task-strip');
  const cat = row.querySelector('input[name="category"]').value.trim();
  const task = row.querySelector('input[name="task"]').value.trim();
  const noCell = row.querySelector('.c-no');
  const memoBox = row.querySelector('.memo-box');
  if(cat || task) { noCell.innerText = Array.from(row.parentNode.children).indexOf(row) + 1; if(memoBox) memoBox.style.display = 'flex'; } 
  else { noCell.innerText = ''; if(memoBox) memoBox.style.display = 'none'; }
  calculateRate(row.closest('.week-plan-section, .day-column'));
}
function toggleDone(chk) {
  const row = chk.closest('.task-strip');
  if(chk.checked) row.classList.add('completed'); else row.classList.remove('completed');
  calculateRate(row.closest('.week-plan-section, .day-column'));
}
function calculateRate(container) {
  if(!container) return;
  const allRows = Array.from(container.querySelectorAll('.task-strip'));
  const validRows = allRows.filter(row => row.querySelector('input[name="category"]').value.trim() !== "" || row.querySelector('input[name="task"]').value.trim() !== "");
  let checked = 0; validRows.forEach(row => { if(row.querySelector('input[name="done"]').checked) checked++; });
  let percent = (validRows.length > 0) ? Math.round((checked / validRows.length) * 100) : 0;
  const fill = container.querySelector('.progress-bar-fill'); const text = container.querySelector('.progress-text');
  if(fill && text) { fill.style.width = percent + "%"; text.innerText = percent + "%"; }
}
function openMemo(box) { activeMemoBox = box; const hiddenInput = box.nextElementSibling; const modal = document.getElementById('memoModal'); const input = document.getElementById('modalInput'); input.value = hiddenInput.value; modal.style.display = 'flex'; input.focus(); }
function closeModal() { document.getElementById('memoModal').style.display = 'none'; activeMemoBox = null; }
function saveMemoFromModal() { if(!activeMemoBox) return; const input = document.getElementById('modalInput'); const newVal = input.value.trim(); const hiddenInput = activeMemoBox.nextElementSibling; hiddenInput.value = newVal; if(newVal !== "") { activeMemoBox.classList.add('has-content'); activeMemoBox.title = newVal; } else { activeMemoBox.classList.remove('has-content'); activeMemoBox.title = "메모 없음"; } closeModal(); }
function handleEnter(e) { if(e.key === 'Enter') saveMemoFromModal(); }

/* ================= [Product Log Logic - Supabase Version] ================= */
let cachedProductLogs = null;
let isFetchingProductLogs = false;

// ✅ 상품 수정 내역(ProductLog) Supabase 직결 (날짜 정렬 및 필터링 강화)
async function fetchProductLogsIfNeeded() {
    if (cachedProductLogs !== null) {
        document.getElementById('loader').style.display = 'none';
        return true;
    }
    if (isFetchingProductLogs) return false;

    isFetchingProductLogs = true;
    document.getElementById('loader').style.display = 'flex';

    try {
        const { data, error } = await supabaseClient.from('monthly_memos')
            .select('key, content')
            .eq('type', 'ProductLog')
            .neq('content', '');
            
        if(error) throw error;
        
        if (data) {
            let validLogs = data.map(d => {
                let rawDate = String(d.key).trim();
                let cleanDate = rawDate.replace(/\s+/g, '').replace(/\./g, '-').replace(/\//g, '-');
                if(cleanDate.endsWith('-')) cleanDate = cleanDate.slice(0, -1);
                
                let parts = cleanDate.split('-');
                if(parts.length >= 3) {
                    cleanDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
                return { date: rawDate, cleanDate: cleanDate, content: d.content };
            }).filter(log => log.content && String(log.content).trim() !== "" && isNaN(Number(String(log.content).trim())));
            
            // 깔끔하게 변환된 날짜(cleanDate)를 기준으로 완벽하게 최신순 정렬
            validLogs.sort((a,b) => b.cleanDate.localeCompare(a.cleanDate));
            cachedProductLogs = validLogs; 
            return true;
        }
    } catch (e) {
        console.error("상품 로그 로드 오류:", e);
        showToast('상품 수정 내역을 불러오지 못했습니다.', 'error');
    } finally {
        document.getElementById('loader').style.display = 'none';
        isFetchingProductLogs = false;
    }
    return false;
}

async function renderProductLogPage() {
    if (!document.getElementById('prodlog-custom-style')) {
        const style = document.createElement('style');
        style.id = 'prodlog-custom-style';
        style.innerHTML = `
            .prodlog-month-divider { background-color: #f1f5f9 !important; font-size: 14px; font-weight: 800; color: #334155; text-align: left !important; padding: 12px 20px !important; border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0; }
            .prodlog-row { transition: all 0.2s ease; cursor: pointer; }
            .prodlog-row td { transition: all 0.2s ease; }
            .prodlog-row:hover { background-color: #f0f9ff !important; }
            .prodlog-row:hover td { color: #2563eb !important; text-decoration: underline; font-weight: 700; }
        `;
        document.head.appendChild(style);
    }

    const tbody = document.getElementById('productLogList');
    await fetchProductLogsIfNeeded();
    
    tbody.innerHTML = '';
    
    if(cachedProductLogs && cachedProductLogs.length > 0) {
        let currentMonth = "";
        
        cachedProductLogs.forEach(log => { 
            // 정렬된 cleanDate 기준으로 월별 구분선 생성
            let logMonth = log.cleanDate.substring(0, 7); 
            if (logMonth !== currentMonth) {
                currentMonth = logMonth;
                const [yyyy, mm] = logMonth.split('-');
                const divider = document.createElement('tr');
                divider.innerHTML = `<td colspan="2" class="prodlog-month-divider">${yyyy}년 ${mm}월 수정 내역</td>`;
                tbody.appendChild(divider);
            }

            const tr = document.createElement('tr'); 
            tr.className = "prodlog-row"; 
            tr.onclick = function() { jumpToWorkLog(log.date); };
            tr.title = "클릭하면 해당 일자의 업무일지로 이동합니다.";
            
            // ✅ XSS 방지: DB에서 온 날짜/내용은 textContent로 처리
            const tdDate = document.createElement('td');
            tdDate.style.cssText = 'font-weight:700; color:#4f46e5;';
            tdDate.textContent = log.cleanDate;
            const tdContent = document.createElement('td');
            tdContent.textContent = log.content;
            tr.appendChild(tdDate);
            tr.appendChild(tdContent);
            tbody.appendChild(tr); 
        });
    } else { 
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:40px; color:#999;">저장된 상품 수정 내역이 없습니다.</td></tr>'; 
    }
}

/* ================= [AI Chat Panel Logic] ================= */
let chatHistory = []; 

document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById('aiChatInput');
    if(chatInput) {
        chatInput.addEventListener('keydown', function(e) {
            if(e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); 
                sendChatMessage();
            }
        });
        chatInput.addEventListener('input', function() {
            this.style.height = '48px';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }
});

function toggleAIChat() {
    openPanel('aiChatPanel', () => {
        setTimeout(() => document.getElementById('aiChatInput').focus(), 300);
    });
}

async function sendChatMessage() {
    const inputEl = document.getElementById('aiChatInput');
    const text = inputEl.value.trim();
    if(!text) return;

    inputEl.value = '';
    inputEl.style.height = '48px';
    
    appendChatMessage('user', text);
    chatHistory.push({ role: 'user', parts: [{ text: text }] });
    showTypingIndicator();

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}` 
            },
            body: JSON.stringify({ chatHistory: chatHistory }) 
        });
        
        const data = await response.json();
        hideTypingIndicator();
        
        if (response.ok && data.candidates && data.candidates.length > 0) {
            const aiText = data.candidates[0].content.parts[0].text;
            appendChatMessage('model', aiText);
            chatHistory.push({ role: 'model', parts: [{ text: aiText }] });
        } 
        else if (data.error) {
            console.error("Gemini API Error:", data.error);
            appendChatMessage('model', `🚨 API 오류: ${data.error.message || '서버 응답 오류'}`);
            chatHistory.pop(); 
        } 
        else {
            appendChatMessage('model', `🛠️ 디버그 모드 (서버 응답): ${JSON.stringify(data)}`);
            chatHistory.pop();
        }
    } catch(error) {
        console.error("Fetch Error:", error);
        hideTypingIndicator();
        appendChatMessage('model', '⚠️ 백엔드 통신 오류가 발생했습니다. 서버 상태를 확인해주세요.');
        chatHistory.pop();
    }
}

function appendChatMessage(role, text) {
    const container = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role === 'user' ? 'user' : 'ai'}`;
    
    // ✅ XSS 방지: 사용자 입력 및 AI 응답 모두 DOMPurify로 sanitize 후 삽입
    const rawHtml = text.replace(/\n/g, '<br>').replace(/\*\*/g, '');
    const formattedText = DOMPurify.sanitize(rawHtml, { ALLOWED_TAGS: ['br', 'b', 'i', 'strong', 'em'] });
    const avatarIcon = role === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';
    
    msgDiv.innerHTML = `<div class="chat-avatar">${avatarIcon}</div><div class="chat-bubble">${formattedText}</div>`;
    container.appendChild(msgDiv);
    scrollToBottom(container);
}

function showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message ai typing-indicator-msg';
    typingDiv.innerHTML = `<div class="chat-avatar"><i class="fa-solid fa-robot"></i></div><div class="chat-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
    container.appendChild(typingDiv);
    scrollToBottom(container);
}

function hideTypingIndicator() {
    const indicator = document.querySelector('.typing-indicator-msg');
    if(indicator) indicator.remove();
}

function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}