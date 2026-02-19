/* ================= [Timeline Logic] ================= */
// (타임라인 관련 코드는 변경 없음, 그대로 유지)
let collapsedDates = {};
let timeLogs = [];
let editingItemIndex = -1; 

function formatTimeStr(str) {
  if(!str) return "";
  str = str.trim();
  return str.indexOf(':') === 1 ? "0" + str : str;
}
function getDayKor(dateStr) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(dateStr).getDay()];
}

function loadTimelineFromServer() {
  if(!authPassword) return; 
  const loader = document.getElementById('loader');
  if(loader) loader.style.display = 'flex';
  fetch(SCRIPT_URL, {
    method: 'POST', body: JSON.stringify({ action: "read", sheetName: "TimeTracker", password: authPassword })
  }).then(res => res.json()).then(json => {
    if(json.status === "success") {
      const rows = json.data;
      timeLogs = []; 
      if(rows.length > 1) {
        let lastValidDate = ""; 
        for(let i=1; i<rows.length; i++) {
          let r = rows[i];
          let dateStr = r[0] === "" && lastValidDate !== "" ? lastValidDate : r[0];
          lastValidDate = dateStr;
          let startStr = formatTimeStr(r[3]);
          let endStr = formatTimeStr(r[4]);
          let durationStr = formatTimeStr(r[5]);
          let min = 0;
          if(durationStr) {
            let parts = durationStr.split(':');
            if(parts.length === 2) min = (Number(parts[0]) * 60) + Number(parts[1]);
          }
          timeLogs.push({ date: dateStr, category: r[1], task: r[2], start: startStr, end: endStr, duration: durationStr, min: min });
        }
      }
      updateYearFilterOptions();
      renderTimeLog();
    }
  }).finally(() => { if(loader) loader.style.display = 'none'; });
}

function saveToServer() {
  if(!confirm("서버에 저장하시겠습니까?")) return;
  const loader = document.getElementById('loader');
  loader.style.display = 'flex';
  let dataToSave = [["날짜", "구분", "업무", "시작", "끝", "소요시간", "입력일시"]];
  let nowStr = new Date().toLocaleString();
  timeLogs.forEach(log => { dataToSave.push([log.date, log.category, log.task, log.start, log.end, log.duration, nowStr]); });
  fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "save", sheetName: "TimeTracker", password: authPassword, data: dataToSave })})
  .then(res => res.json()).then(json => { if(json.status === "success") alert("✅ 저장 완료!"); })
  .finally(() => { loader.style.display = 'none'; });
}

function updateYearFilterOptions() {
  const yearSet = new Set();
  timeLogs.forEach(log => { if(log.date) yearSet.add(log.date.substring(0, 4)); });
  yearSet.add(new Date().getFullYear().toString());
  const select = document.getElementById('yearFilter');
  const cur = select.value;
  select.innerHTML = '';
  Array.from(yearSet).sort().reverse().forEach(y => {
    let opt = document.createElement('option'); opt.value = y; opt.innerText = y + "년"; select.appendChild(opt);
  });
  if(Array.from(yearSet).includes(cur)) select.value = cur;
}

function renderTimeLog() {
  const tbody = document.getElementById('timelineList');
  tbody.innerHTML = '';
  const selectedYear = document.getElementById('yearFilter').value;
  const searchQuery = document.getElementById('taskSearch').value.toLowerCase();
  let filteredLogs = timeLogs.filter(log => log.date.startsWith(selectedYear) && (log.task.toLowerCase().includes(searchQuery) || log.category.toLowerCase().includes(searchQuery)));
  filteredLogs.sort((a,b) => b.date.localeCompare(a.date) || a.start.localeCompare(b.start));
  const grouped = {};
  filteredLogs.forEach(log => { if(!grouped[log.date]) grouped[log.date] = []; grouped[log.date].push(log); });
  
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
      tbody.appendChild(headerRow);
      
      if(!isCollapsed) {
          groupLogs.forEach(log => {
              const realIdx = timeLogs.indexOf(log); 
              let row = document.createElement('tr');
              let durationHtml = log.duration;
              if (log.min >= 120) durationHtml = `<span style="color: #dc2626; font-weight: 700; background: #fef2f2; border-radius: 6px; padding: 4px 8px;">${log.duration}</span>`;
              else if (log.min >= 60) durationHtml = `<span style="color: #d97706; font-weight: 700; background: #fffbeb; border-radius: 6px; padding: 4px 8px;">${log.duration}</span>`;
              let catBadge = log.category === '휴무' ? 'badge badge-holiday' : 'badge';
              
              row.innerHTML = `<td><span class="${catBadge}">${log.category}</span></td><td>${log.task}</td><td>${log.start}</td><td>${log.end}</td><td>${durationHtml}</td>
                  <td>
                    <button onclick="editTimeLog(${realIdx})" title="수정" style="border:none;background:none;cursor:pointer;color:#2563eb;margin-right:8px;"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="if(confirm('삭제하시겠습니까?')) { timeLogs.splice(${realIdx}, 1); renderTimeLog(); }" title="삭제" style="border:none;background:none;cursor:pointer;color:#ef4444;"><i class="fa-solid fa-trash-can"></i></button>
                  </td>`;
              tbody.appendChild(row);
          });
      }
  });
}

function addTimeLog() { /* 기존과 동일 */
  const date = document.getElementById('tDate').value;
  const category = document.getElementById('tCategory').value;
  const task = document.getElementById('tTask').value;
  let sh = document.getElementById('tStartH').value;
  let sm = document.getElementById('tStartM').value;
  let eh = document.getElementById('tEndH').value;
  let em = document.getElementById('tEndM').value;
  
  if (!date) { alert("날짜를 선택해주세요."); return; }
  if (!task) { alert("업무 내용을 입력해주세요."); return; }
  
  let start = "00:00", end = "00:00", duration = "0:00", min = 0;
  function padTwo(num) { return num.toString().padStart(2, '0'); }
  
  if(category !== '휴무') {
      if (sh === "" || eh === "") { alert("시간을 입력해주세요."); return; }
      start = padTwo(sh) + ":" + padTwo(sm || 0);
      end = padTwo(eh) + ":" + padTwo(em || 0);
      const s = new Date(`2000-01-01T${start}:00`), e = new Date(`2000-01-01T${end}:00`);
      let diff = Math.max(0, e - s);
      const mTotal = Math.floor(diff / 60000), h = Math.floor(mTotal / 60), m = mTotal % 60;
      duration = `${h}:${m.toString().padStart(2, '0')}`;
      min = mTotal;
  }
  
  const newItem = { date, category, task, start, end, duration, min };

  if(editingItemIndex > -1) {
      timeLogs[editingItemIndex] = newItem;
      alert("수정되었습니다.");
      cancelEditMode(); 
  } else {
      timeLogs.push(newItem);
  }
  
  document.getElementById('tTask').value = '';
  ['tStartH','tStartM','tEndH','tEndM'].forEach(id => document.getElementById(id).value = '');
  renderTimeLog();
}

function editTimeLog(index) { /* 기존과 동일 */
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

function cancelEditMode() { /* 기존과 동일 */
    editingItemIndex = -1;
    document.getElementById('editModeMsg').style.display = 'none';
    const btn = document.getElementById('addLogBtn');
    btn.innerHTML = '<i class="fa-solid fa-plus"></i> 등록';
    btn.classList.remove('update-mode');
    document.getElementById('tTask').value = '';
    ['tStartH','tStartM','tEndH','tEndM'].forEach(id => document.getElementById(id).value = '');
}

/* ================= [Worklog Logic (유지)] ================= */
let currentWorkYear = new Date().getFullYear();
let currentWorkMonth = new Date().getMonth() + 1; 
let activeMemoBox = null;

window.addEventListener('DOMContentLoaded', () => {
   updateDateDisplay();
   setupDragSelection(); 
   initMonthlyLog(); 
});

function handleMonthChange(input) { /* 유지 */
  if(!input.value) return;
  const parts = input.value.split('-');
  currentWorkYear = parseInt(parts[0]);
  currentWorkMonth = parseInt(parts[1]);
  updateDateDisplay();
  initMonthlyLog(); 
  loadWorklogFromServer(); 
}

function updateDateDisplay() {
  const picker = document.getElementById('worklogPicker');
  if(picker) {
      const val = `${currentWorkYear}-${String(currentWorkMonth).padStart(2, '0')}`;
      picker.value = val;
  }
}

function generateWeeksData(year, month) { /* 유지 */
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
      let weekFirstNum = null;
      let weekLastNum = null;
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
           weeks.push(weekData);
           weekCount++;
      }
      if (weekLastNum == lastDate) done = true;
      if (currentPointer.getMonth() !== month - 1 || currentPointer.getFullYear() !== year) done = true;
  }
  return weeks;
}

function initMonthlyLog() { /* 유지 */
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
        <div class="section-header"><span class="section-title">🚀 ${week.name} 목표</span><span class="section-date">${week.range}</span></div>
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
      const dayDisplay = d.isBlank ? '' : `${d.day} <span style="font-weight:400; color:#555; margin-left:4px;">${d.num}</span>`;
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

/* (나머지 Worklog 헬퍼 함수들 유지 - DragSelection 등) */
function setupDragSelection() { /* 유지 */
  let isSelecting = false;
  let startInput = null;
  let selectedInputs = [];

  document.addEventListener('mousedown', (e) => {
    if (!e.target.classList.contains('clean-input')) {
      if (!e.target.closest('.wp-list')) clearSelection();
      return;
    }
    
    if (e.target.classList.contains('cell-selected') && e.button !== 0) return;

    isSelecting = true;
    startInput = e.target;
    
    if (!e.shiftKey) {
        clearSelection();
        selectInput(startInput);
    }
  });

  document.addEventListener('mouseover', (e) => {
    if (!isSelecting || !startInput) return;
    if (!e.target.classList.contains('clean-input')) return;
    if (e.target === startInput) return;
    if (startInput.closest('.wp-list') !== e.target.closest('.wp-list')) return;

    updateSelection(startInput, e.target);
  });

  document.addEventListener('mouseup', () => {
    isSelecting = false;
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedInputs.length > 0) {
      if(document.activeElement.value === "" || !isEditingText()) {
          selectedInputs.forEach(input => {
            if(input.type === 'checkbox') input.checked = false;
            else input.value = '';
            
            triggerInputEvent(input);
            if (input.name === 'done') toggleDone(input);
          });
          e.preventDefault();
      }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedInputs.length > 0) {
       handleCopy(e);
    }
  });

  document.addEventListener('paste', (e) => {
      const active = document.activeElement;
      if (!active || !active.classList.contains('clean-input')) return;
      e.preventDefault();
      handlePaste(e);
  });

  function isEditingText() {
      const active = document.activeElement;
      return active && active.selectionStart !== active.selectionEnd;
  }

  function clearSelection() {
    document.querySelectorAll('.clean-input.cell-selected').forEach(el => el.classList.remove('cell-selected'));
    selectedInputs = [];
  }

  function selectInput(el) {
    if(!el.classList.contains('cell-selected')) {
        el.classList.add('cell-selected');
        selectedInputs.push(el);
    }
  }

  function updateSelection(start, end) {
    clearSelection();
    const allRows = Array.from(start.closest('.wp-list').querySelectorAll('.task-strip'));
    const startRow = start.closest('.task-strip');
    const endRow = end.closest('.task-strip');
    const startRowIdx = allRows.indexOf(startRow);
    const endRowIdx = allRows.indexOf(endRow);

    const startInputs = Array.from(startRow.querySelectorAll('.clean-input'));
    const endInputs = Array.from(endRow.querySelectorAll('.clean-input'));
    const startColIdx = startInputs.indexOf(start);
    const endColIdx = endInputs.indexOf(end);

    const minRow = Math.min(startRowIdx, endRowIdx);
    const maxRow = Math.max(startRowIdx, endRowIdx);
    const minCol = Math.min(startColIdx, endColIdx);
    const maxCol = Math.max(startColIdx, endColIdx);

    for (let r = minRow; r <= maxRow; r++) {
      const inputs = allRows[r].querySelectorAll('.clean-input');
      for (let c = minCol; c <= maxCol; c++) {
        if (inputs[c]) selectInput(inputs[c]);
      }
    }
  }

  function triggerInputEvent(input) {
      if (input.name === 'category' || input.name === 'task') {
          updateRow(input);
      }
      if(input.type === 'checkbox') {
          const event = new Event('change', { bubbles: true });
          input.dispatchEvent(event);
      } else {
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
      }
  }

  function handleCopy(e) {
      e.preventDefault();
      let rowsMap = new Map();
      selectedInputs.forEach(input => {
          const row = input.closest('.task-strip');
          if(!rowsMap.has(row)) rowsMap.set(row, []);
          rowsMap.get(row).push(input);
      });

      let textToCopy = "";
      let isFirstRow = true;
      rowsMap.forEach((inputs) => {
          if(!isFirstRow) textToCopy += "\n";
          let rowText = inputs.map(input => {
              if(input.type === 'checkbox') return input.checked ? "TRUE" : "FALSE";
              return input.value;
          }).join("\t");
          textToCopy += rowText;
          isFirstRow = false;
      });

      if (navigator.clipboard) {
          navigator.clipboard.writeText(textToCopy).then(() => {
              console.log('Copied to clipboard');
          });
      }
  }

  function handlePaste(e) {
      const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
      if (!clipboardData) return;

      let startCell = selectedInputs.length > 0 ? selectedInputs[0] : document.activeElement;
      if (!startCell || !startCell.classList.contains('clean-input')) return;

      const startRow = startCell.closest('.task-strip');
      const container = startRow.closest('.wp-list');
      const allStripRows = Array.from(container.querySelectorAll('.task-strip'));
      
      const startRowIdx = allStripRows.indexOf(startRow);
      const startInputs = Array.from(startRow.querySelectorAll('.clean-input'));
      const startColIdx = startInputs.indexOf(startCell);

      const rows = clipboardData.split(/\r\n|\n|\r/);

      rows.forEach((rowText, rIdx) => {
          if (rowText.trim() === "" && rIdx === rows.length - 1) return;
          
          const targetRow = allStripRows[startRowIdx + rIdx];
          if (!targetRow) return;

          const targetInputs = Array.from(targetRow.querySelectorAll('.clean-input'));
          const cols = rowText.split('\t');

          cols.forEach((val, cIdx) => {
              const input = targetInputs[startColIdx + cIdx];
              if (input) {
                  if(input.type === 'checkbox') {
                      const v = val.trim().toUpperCase();
                      input.checked = (v === 'TRUE' || v === '1' || v === 'YES');
                  } else if (input.tagName === 'SELECT') {
                      input.value = val.trim();
                  } else {
                      input.value = val.trim(); 
                  }
                  triggerInputEvent(input);
              }
          });
      });
  }
}

function collectAndSaveWorklog() { /* 유지 */
  if(!confirm(`${currentWorkYear}년 ${currentWorkMonth}월 업무일지를 저장하시겠습니까?\n(해당 월의 기존 데이터는 덮어씌워집니다)`)) return;
  const loader = document.getElementById('loader'); loader.style.display = 'flex';
  const targetYear = currentWorkYear; const targetMonth = currentWorkMonth;
  let taskRows = []; let memoRows = [];
  document.querySelectorAll('.week-row').forEach(weekEl => {
    const weekId = weekEl.dataset.weekId;
    const planSec = weekEl.querySelector('.week-plan-section');
    planSec.querySelectorAll('.wp-list .task-strip').forEach((row, idx) => {
      const task = row.querySelector('[name="task"]').value; const cat = row.querySelector('[name="category"]').value;
      if(task || cat) taskRows.push([targetYear, targetMonth, weekId, "", "Plan", idx, cat, task, row.querySelector('[name="priority"]').value, row.querySelector('[name="deadline"]').value, row.querySelector('[name="done"]').checked]);
    });
    memoRows.push([targetYear, targetMonth, weekId, "NextPlan", planSec.querySelector('[name="nextPlan"]').value]);
    memoRows.push([targetYear, targetMonth, weekId, "Retro", planSec.querySelector('[name="retrospective"]').value]);
    memoRows.push([targetYear, targetMonth, weekId, "Rate", planSec.querySelector('.progress-text').innerText]);
    weekEl.querySelectorAll('.day-column').forEach(dayEl => {
      if(dayEl.classList.contains('blank')) return;
      const dateKey = dayEl.dataset.date;
      if(!dateKey) return;
      dayEl.querySelectorAll('.wp-list .task-strip').forEach((row, idx) => {
        const task = row.querySelector('[name="task"]').value; const cat = row.querySelector('[name="category"]').value;
        if(task || cat) taskRows.push([targetYear, targetMonth, weekId, dateKey, "Daily", idx, cat, task, row.querySelector('[name="priority"]').value, row.querySelector('[name="note"]').value, row.querySelector('[name="done"]').checked]);
      });
      memoRows.push([targetYear, targetMonth, dateKey, "Memo", dayEl.querySelector('[name="dayMemo"]').value]);
      memoRows.push([targetYear, targetMonth, dateKey, "ProductLog", dayEl.querySelector('[name="productLog"]').value]);
      memoRows.push([targetYear, targetMonth, dateKey, "Rate", dayEl.querySelector('.progress-text').innerText]);
    });
  });
  fetch(SCRIPT_URL, {
    method: 'POST', body: JSON.stringify({ action: "save_worklog", password: authPassword, year: targetYear, month: targetMonth, taskRows: taskRows, memoRows: memoRows })
  }).then(res => res.json()).then(json => {
     if(json.status === "success") alert("✅ 저장 완료!"); else alert("오류: " + json.message);
  }).finally(() => { loader.style.display = 'none'; });
}

function normalizeDate(dateStr) {
   if(!dateStr) return "";
   const date = new Date(dateStr);
   if(isNaN(date.getTime())) return dateStr; 
   const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
   return `${y}-${m}-${d}`;
}

function loadWorklogFromServer() { /* 유지 */
  if(!authPassword) return;
  const loader = document.getElementById('loader'); loader.style.display = 'flex';
  fetch(SCRIPT_URL, {
    method: 'POST', body: JSON.stringify({ action: "load_worklog", password: authPassword, year: currentWorkYear, month: currentWorkMonth })
  }).then(res => res.json()).then(json => {
    if(json.status === "success") {
      json.tasks.forEach(row => {
        const type = row[4]; const weekId = row[2]; const date = normalizeDate(row[3]); const rowIdx = row[5];
        let container = (type === 'Plan') ? document.querySelector(`.week-row[data-week-id="${weekId}"] .week-plan-section`) : document.querySelector(`.day-column[data-date="${date}"]`);
        if(container && !container.classList.contains('blank')) {
           const strip = container.querySelectorAll('.task-strip')[rowIdx];
           if(strip) {
             strip.querySelector('[name="category"]').value = row[6]; strip.querySelector('[name="task"]').value = row[7];
             strip.querySelector('[name="priority"]').value = row[8]; strip.querySelector('[name="done"]').checked = (row[10] === true || row[10] === "TRUE");
             if(type === 'Plan') strip.querySelector('[name="deadline"]').value = row[9];
             else { strip.querySelector('[name="note"]').value = row[9]; const memoBox = strip.querySelector('.memo-box'); if(row[9]) { memoBox.classList.add('has-content'); memoBox.title = row[9]; } }
             updateRow(strip.querySelector('[name="task"]')); toggleDone(strip.querySelector('[name="done"]'));
           }
        }
      });
      json.memos.forEach(row => {
        const key = row[2]; const type = row[3]; const content = row[4]; let inputs = [];
        if(type === 'NextPlan' || type === 'Retro') {
            inputs = document.querySelectorAll(`.week-row[data-week-id="${key}"] [name="${type === 'NextPlan' ? 'nextPlan' : 'retrospective'}"]`);
            if(inputs.length > 0) inputs[0].value = content;
        } else if (type === 'Memo' || type === 'ProductLog') {
            if(type === 'ProductLog') {
                if(!isNaN(Number(content))) return; 
            }
            inputs = document.querySelectorAll(`.day-column[data-date="${normalizeDate(key)}"] [name="${type === 'Memo' ? 'dayMemo' : 'productLog'}"]`);
            if(inputs.length > 0) inputs[0].value = content;
        }
      });
    }
  }).finally(() => { loader.style.display = 'none'; });
}

function updateRow(input) { /* 유지 */
  const row = input.closest('.task-strip');
  const cat = row.querySelector('input[name="category"]').value.trim();
  const task = row.querySelector('input[name="task"]').value.trim();
  const noCell = row.querySelector('.c-no');
  const memoBox = row.querySelector('.memo-box');
  if(cat || task) { noCell.innerText = Array.from(row.parentNode.children).indexOf(row) + 1; if(memoBox) memoBox.style.display = 'flex'; } 
  else { noCell.innerText = ''; if(memoBox) memoBox.style.display = 'none'; }
  calculateRate(row.closest('.week-plan-section, .day-column'));
}
function toggleDone(chk) { /* 유지 */
  const row = chk.closest('.task-strip');
  if(chk.checked) row.classList.add('completed'); else row.classList.remove('completed');
  calculateRate(row.closest('.week-plan-section, .day-column'));
}
function calculateRate(container) { /* 유지 */
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

/* ================= [Product Log Logic (유지)] ================= */
function renderProductLogPage() {
  const tbody = document.getElementById('productLogList');
  document.getElementById('loader').style.display = 'flex';
  tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">데이터를 불러오는 중...</td></tr>';
  
  fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "get_all_product_logs", password: authPassword }) })
  .then(res => res.json()).then(json => {
    tbody.innerHTML = '';
    if(json.status === "success" && json.data.length > 0) {
      json.data.sort((a,b) => b.date.localeCompare(a.date));
      json.data.forEach(log => { 
          let content = String(log.content).trim();
          if(!isNaN(Number(content))) return; 

          const tr = document.createElement('tr'); 
          tr.style.cursor = "pointer";
          tr.onclick = function() { jumpToWorkLog(log.date); };
          tr.title = "클릭하면 해당 월간 업무일지로 이동합니다.";
          tr.innerHTML = `<td style="font-weight:700; color:#4f46e5;">${log.date}</td><td>${log.content}</td>`; 
          tbody.appendChild(tr); 
      });
      if(tbody.children.length === 0) {
           tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:30px; color:#999;">저장된 상품 수정 내역이 없습니다.</td></tr>';
      }
    } else { tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:30px; color:#999;">저장된 상품 수정 내역이 없습니다.</td></tr>'; }
  })
  .finally(() => { document.getElementById('loader').style.display = 'none'; });
}

function jumpToWorkLog(dateStr) {
    if(!dateStr) return;
    const targetDate = new Date(dateStr);
    if(isNaN(targetDate.getTime())) return;

    currentWorkYear = targetDate.getFullYear();
    currentWorkMonth = targetDate.getMonth() + 1;
    
    showPage('worklog', document.querySelector('.menu-item[onclick*="worklog"]'));
    updateDateDisplay();
    initMonthlyLog();
    loadWorklogFromServer();

    setTimeout(() => {
        const dayCol = document.querySelector(`.day-column[data-date="${dateStr}"]`);
        if(dayCol) {
            dayCol.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            dayCol.style.border = "2px solid #4f46e5"; 
            setTimeout(() => { dayCol.style.border = ""; }, 2000);
        }
    }, 800);
}


/* ================= [New Note Logic] ================= */
var quill;
var currentNoteType = 'general'; // 'general', 'blog', 'youtube'
var currentDraftId = ""; // 현재 작업 중인 드래프트 ID

function initQuill() {
  if (quill) return;
  quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: '내용을 입력하세요...',
    modules: {
      toolbar: {
        container: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'size': ['small', false, 'large', 'huge'] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image'],
          ['clean']
        ],
        handlers: {
          // [핵심 수정] 이미지 삽입 즉시 Drive에 업로드하는 커스텀 핸들러
          image: imageUploadHandler
        }
      }
    }
  });
}

// [신규] 이미지 선택 → Base64 변환 → 서버 upload_image → Drive URL로 에디터에 삽입
function imageUploadHandler() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.click();

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 크기가 10MB를 초과합니다. 더 작은 이미지를 사용해주세요.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Full = reader.result;
      const base64Data = base64Full.split(',')[1];
      const mimeMatch = base64Full.match(/data:image\/([a-zA-Z]+);base64/);
      const fileType = mimeMatch ? mimeMatch[1] : 'png';

      const loader = document.getElementById('loader');
      if (loader) loader.style.display = 'flex';
      const statusEl = document.getElementById('noteSaveStatus');
      if (statusEl) statusEl.innerText = '이미지 업로드 중...';

      fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'upload_image',
          password: authPassword,
          imageBase64: base64Data,
          fileType: fileType
        })
      })
      .then(res => res.json())
      .then(json => {
        if (json.status === 'success') {
          const range = quill.getSelection(true);
          quill.insertEmbed(range ? range.index : 0, 'image', json.url);
          quill.setSelection((range ? range.index : 0) + 1);
          if (statusEl) statusEl.innerText = '이미지 업로드 완료 ✅';
        } else {
          alert('이미지 업로드 실패: ' + json.message);
          if (statusEl) statusEl.innerText = '이미지 업로드 실패';
        }
      })
      .catch(err => {
        alert('이미지 업로드 중 통신 오류가 발생했습니다.');
        if (statusEl) statusEl.innerText = '업로드 오류';
      })
      .finally(() => {
        if (loader) loader.style.display = 'none';
      });
    };
    reader.readAsDataURL(file);
  };
}

function setNoteTab(type) {
    currentNoteType = type;
    currentDraftId = ""; // 탭 변경시 ID 초기화
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // UI 변경
    const metaArea = document.getElementById('draftMetadataArea');
    const dateSelector = document.querySelector('.date-selector');
    const listContainer = document.getElementById('draftListContainer');
    
    // 에디터 & 메타데이터 초기화
    if(quill) quill.root.innerHTML = "";
    document.getElementById('draftTitle').value = "";
    document.getElementById('draftStatus').value = "saving";
    
    // 일반 노트 모드
    if(type === 'general') {
        metaArea.style.display = 'none';
        listContainer.style.display = 'none';
        dateSelector.style.display = 'flex';
        document.getElementById('editor-wrapper').style.display = 'flex';
        quill.root.dataset.placeholder = "업무 내용을 자유롭게 기록하세요...";
        handleNoteDateChange(); // 날짜 기반 로드
    } 
    // 블로그/유튜브 모드 (리스트 뷰)
    else {
        metaArea.style.display = 'flex';
        listContainer.style.display = 'block'; // 목록 보이기
        dateSelector.style.display = 'none'; // 날짜 숨기기
        document.getElementById('editor-wrapper').style.display = 'none'; // 초기엔 에디터 숨김
        metaArea.style.display = 'none'; // 리스트에서 선택 전까진 메타 숨김
        
        quill.root.dataset.placeholder = type === 'blog' ? "블로그 원고 내용을 작성하세요..." : "유튜브 스크립트를 작성하세요...";
        loadDraftList(); // 목록 불러오기
    }
}

// [추가] 목록 불러오기 함수
function loadDraftList() {
    const listBody = document.getElementById('draftListBody');
    listBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">로딩 중...</td></tr>';
    
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "load_draft_list", password: authPassword, type: currentNoteType }) })
    .then(res => res.json()).then(json => {
        listBody.innerHTML = '';
        if(json.status === "success" && json.list.length > 0) {
            json.list.forEach(item => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.onclick = () => loadDraftContent(item.id);
                
                let statusBadge = item.status === 'uploaded' ? '<span class="badge badge-holiday" style="color:green; bg-color:#dcfce7;">업로드됨</span>' : '<span class="badge">작성중</span>';
                
                tr.innerHTML = `
                    <td>${item.date}</td>
                    <td style="font-weight:bold;">${item.title}</td>
                    <td>${statusBadge}</td>
                    <td style="font-size:12px; color:#888;">${item.savedAt}</td>
                `;
                listBody.appendChild(tr);
            });
        } else {
            listBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#888;">작성된 원고가 없습니다. 새 원고를 작성해보세요!</td></tr>';
        }
    });
}

// [추가] 리스트에서 항목 선택 시 에디터 로드
function loadDraftContent(id) {
    currentDraftId = id;
    document.getElementById('draftListContainer').style.display = 'none';
    document.getElementById('editor-wrapper').style.display = 'flex';
    document.getElementById('draftMetadataArea').style.display = 'flex';
    document.getElementById('loader').style.display = 'flex';
    
    // 날짜 인풋은 오늘 날짜로 일단 세팅 (저장 시 사용)
    document.getElementById('noteDate').valueAsDate = new Date();

    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "load_note", password: authPassword, id: id, type: currentNoteType }) })
    .then(res => res.json()).then(json => {
        if(json.status === "success") {
            const data = json.data;
            quill.root.innerHTML = data.content || "";
            document.getElementById('draftTitle').value = data.title || "";
            document.getElementById('draftStatus').value = data.status || "saving";
            document.getElementById('noteSaveStatus').innerText = "로드 완료";
        }
    }).finally(() => { document.getElementById('loader').style.display = 'none'; });
}

// [추가] 새 원고 작성 버튼 핸들러
function createNewDraft() {
    currentDraftId = ""; // ID 초기화 (신규 생성)
    quill.root.innerHTML = "";
    document.getElementById('draftTitle').value = "";
    document.getElementById('draftStatus').value = "saving";
    document.getElementById('noteDate').valueAsDate = new Date();
    
    document.getElementById('draftListContainer').style.display = 'none';
    document.getElementById('editor-wrapper').style.display = 'flex';
    document.getElementById('draftMetadataArea').style.display = 'flex';
}

// [수정] 날짜 변경 시 (일반 노트만 해당)
function handleNoteDateChange() { 
    if(currentNoteType !== 'general') return;
    
    const selectedDate = document.getElementById('noteDate').value; 
    const statusEl = document.getElementById('noteSaveStatus');
    if(statusEl) statusEl.innerText = "로드 중..."; 
    document.getElementById('loader').style.display = 'flex';
    
    if(!quill) initQuill();
    
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "load_note", password: authPassword, date: selectedDate, type: 'general' }) })
    .then(res => res.json()).then(json => { 
        if (json.status === "success") { 
            quill.root.innerHTML = json.data.content || ""; 
            if(statusEl) statusEl.innerText = "서버 로드 완료"; 
        }
    })
    .finally(() => { document.getElementById('loader').style.display = 'none'; });
}

// [수정] 저장 로직 (ID 전송 및 저장 후 목록 갱신)
function saveNoteToServer() {
  const selectedDate = document.getElementById('noteDate').value; 
  let content = quill.root.innerHTML;
  let title = document.getElementById('draftTitle').value;
  let status = document.getElementById('draftStatus').value;
  const statusEl = document.getElementById('noteSaveStatus');

  if(currentNoteType !== 'general' && !title) { alert("제목을 입력해주세요."); return; }

  // [수정] 이미지는 삽입 시점에 이미 Drive URL로 변환되므로 Base64 용량 체크 불필요

  document.getElementById('loader').style.display = 'flex'; 
  if(statusEl) statusEl.innerText = "저장 중...";
  
  fetch(SCRIPT_URL, { 
      method: 'POST', 
      body: JSON.stringify({ 
          action: "save_note", 
          password: authPassword, 
          date: selectedDate, 
          content: content,
          type: currentNoteType,
          title: title,
          status: status,
          id: currentDraftId // 수정 시 ID 전송
      }) 
  })
  .then(res => res.json()).then(json => { 
      if (json.status === "success") { 
          alert(json.message); 
          if(statusEl) statusEl.innerText = "저장 완료"; 
          
          if(currentNoteType !== 'general') {
              currentDraftId = json.id; // 신규 생성 시 발급된 ID 저장
              document.getElementById('draftLastSaved').innerText = "저장됨: " + new Date().toLocaleTimeString();
          }
      } else { 
          alert("오류: " + json.message); 
          if(statusEl) statusEl.innerText = "저장 실패"; 
      } 
  })
  .catch(err => { alert("통신 오류 발생"); })
  .finally(() => { document.getElementById('loader').style.display = 'none'; });
}

// 목록으로 돌아가기 버튼
function backToList() {
    if(confirm("저장하지 않은 내용은 사라집니다. 목록으로 돌아가시겠습니까?")) {
        setNoteTab(currentNoteType);
    }
}

function resetNoteToOriginal() { if (confirm("최근 저장된 상태로 되돌리시겠습니까?")) { if(currentNoteType === 'general') handleNoteDateChange(); else loadDraftContent(currentDraftId); } }

function searchNotes() { /* 기존 로직 유지 (로컬 스토리지 검색이라 서버 데이터와 별개일 수 있음) */
    const query = document.getElementById('noteSearchInput').value.trim().toLowerCase();
    // (서버 검색 기능이 없으므로 로컬만 유지하거나 추후 개발 필요)
}
