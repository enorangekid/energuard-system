/* ================= [Timeline Logic] ================= */
let collapsedDates = {};
let timeLogs = [];

function formatTimeStr(str) {
  if(!str) return "";
  str = str.trim();
  return str.indexOf(':') === 1 ? "0" + str : str;
}
function getDayKor(dateStr) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(dateStr).getDay()];
}
// 이름 변경: loadFromServer -> loadTimelineFromServer (충돌 방지)
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
                  <td><button onclick="if(confirm('삭제?')) { timeLogs.splice(${realIdx}, 1); renderTimeLog(); }" style="border:none;background:none;cursor:pointer;color:#ef4444;"><i class="fa-solid fa-trash-can"></i></button></td>`;
              tbody.appendChild(row);
          });
      }
  });
}

function addTimeLog() {
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
  timeLogs.push({ date, category, task, start, end, duration, min });
  document.getElementById('tTask').value = '';
  ['tStartH','tStartM','tEndH','tEndM'].forEach(id => document.getElementById(id).value = '');
  renderTimeLog();
}

/* ================= [Worklog Logic] ================= */
let currentWorkYear = new Date().getFullYear();
let currentWorkMonth = new Date().getMonth() + 1; 
let activeMemoBox = null;

window.addEventListener('DOMContentLoaded', () => {
   updateDateDisplay();
   setupDragSelection(); 
   initMonthlyLog(); // 초기 렌더링
});

function openHiddenPicker() {
  const picker = document.getElementById('hiddenWorklogPicker');
  if(picker && picker.showPicker) {
    const mm = String(currentWorkMonth).padStart(2, '0');
    picker.value = `${currentWorkYear}-${mm}`;
    picker.showPicker();
  } else {
    alert("브라우저가 달력 기능을 지원하지 않습니다.");
  }
}

function handleDateChange(input) {
  if(!input.value) return;
  const parts = input.value.split('-');
  currentWorkYear = parseInt(parts[0]);
  currentWorkMonth = parseInt(parts[1]);
  updateDateDisplay();
  initMonthlyLog(); 
  loadWorklogFromServer(); 
}

function updateDateDisplay() {
  const display = document.getElementById('currentMonthDisplay');
  if(display) {
      display.innerText = `${currentWorkYear}년 ${String(currentWorkMonth).padStart(2, '0')}월`;
  }
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

// 드래그 선택 로직 (요약)
function setupDragSelection() {
  let isSelecting = false; let startInput = null; let selectedInputs = [];
  document.addEventListener('mousedown', (e) => { if (!e.target.classList.contains('clean-input')) { clearSelection(); return; } isSelecting = true; startInput = e.target; clearSelection(); selectInput(startInput); });
  document.addEventListener('mouseover', (e) => { if (!isSelecting || !startInput || !e.target.classList.contains('clean-input')) return; if (startInput.closest('.wp-list') !== e.target.closest('.wp-list')) return; updateSelection(startInput, e.target); });
  document.addEventListener('mouseup', () => { isSelecting = false; });
  document.addEventListener('keydown', (e) => { if ((e.key === 'Delete' || e.key === 'Backspace') && selectedInputs.length > 0) { selectedInputs.forEach(input => { input.value = ''; if(input.name === 'category' || input.name === 'task') updateRow(input); }); e.preventDefault(); } });
  function clearSelection() { document.querySelectorAll('.clean-input.cell-selected').forEach(el => el.classList.remove('cell-selected')); selectedInputs = []; }
  function selectInput(el) { el.classList.add('cell-selected'); selectedInputs.push(el); }
  function updateSelection(start, end) {
    clearSelection();
    const allRows = Array.from(start.closest('.wp-list').querySelectorAll('.task-strip'));
    const startRowIdx = allRows.indexOf(start.closest('.task-strip')); const endRowIdx = allRows.indexOf(end.closest('.task-strip'));
    const startInputs = Array.from(allRows[startRowIdx].querySelectorAll('.clean-input')); const endInputs = Array.from(allRows[endRowIdx].querySelectorAll('.clean-input'));
    const startColIdx = startInputs.indexOf(start); const endColIdx = endInputs.indexOf(end);
    for (let r = Math.min(startRowIdx, endRowIdx); r <= Math.max(startRowIdx, endRowIdx); r++) {
      const inputs = allRows[r].querySelectorAll('.clean-input');
      for (let c = Math.min(startColIdx, endColIdx); c <= Math.max(startColIdx, endColIdx); c++) if (inputs[c]) selectInput(inputs[c]);
    }
  }
}

function collectAndSaveWorklog() {
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

function loadWorklogFromServer() {
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
        if(type === 'NextPlan' || type === 'Retro') inputs = document.querySelectorAll(`.week-row[data-week-id="${key}"] [name="${type === 'NextPlan' ? 'nextPlan' : 'retrospective'}"]`);
        else inputs = document.querySelectorAll(`.day-column[data-date="${normalizeDate(key)}"] [name="${type === 'Memo' ? 'dayMemo' : 'productLog'}"]`);
        if(inputs.length > 0) inputs[0].value = content;
      });
    }
  }).finally(() => { loader.style.display = 'none'; });
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

/* ================= [Product Log Logic] ================= */
function renderProductLogPage() {
  const tbody = document.getElementById('productLogList');
  tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">데이터를 불러오는 중...</td></tr>';
  fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "get_all_product_logs", password: authPassword }) })
  .then(res => res.json()).then(json => {
    tbody.innerHTML = '';
    if(json.status === "success" && json.data.length > 0) {
      json.data.sort((a,b) => b.date.localeCompare(a.date));
      json.data.forEach(log => { const tr = document.createElement('tr'); tr.innerHTML = `<td style="font-weight:700; color:#4f46e5;">${log.date}</td><td>${log.content}</td>`; tbody.appendChild(tr); });
    } else { tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:30px; color:#999;">저장된 상품 수정 내역이 없습니다.</td></tr>'; }
  });
}

/* ================= [Note Logic] ================= */
var quill;
function initQuill() {
  quill = new Quill('#editor', { theme: 'snow', placeholder: '업무 내용을 자유롭게 기록하세요...', modules: { toolbar: [ [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ 'color': [] }, { 'background': [] }], [{ 'size': ['small', false, 'large', 'huge'] }], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['link', 'image'], ['clean'] ] } });
  const wrapper = document.getElementById('editor-wrapper');
  wrapper.addEventListener('dragover', (e) => { e.preventDefault(); wrapper.classList.add('drag-over'); });
  wrapper.addEventListener('dragleave', () => { wrapper.classList.remove('drag-over'); });
  wrapper.addEventListener('drop', (e) => { e.preventDefault(); wrapper.classList.remove('drag-over'); const files = e.dataTransfer.files; if(files.length > 0) { Array.from(files).forEach(file => { if(file.type.startsWith('image/')) { const reader = new FileReader(); reader.onload = (event) => { const range = quill.getSelection(true); const index = range ? range.index : quill.getLength(); quill.insertEmbed(index, 'image', event.target.result); quill.setSelection(index + 1); }; reader.readAsDataURL(file); } }); } });
}
function handleNoteDateChange() { const selectedDate = document.getElementById('noteDate').value; document.getElementById('noteSaveStatus').innerText = "로드 중..."; loadNoteFromServer(selectedDate); }
function saveNoteToServer() {
  const selectedDate = document.getElementById('noteDate').value; const content = quill.root.innerHTML;
  if(!confirm(`[${selectedDate}] 업무노트를 서버에 저장하시겠습니까?`)) return;
  document.getElementById('noteSaveStatus').innerText = "서버 저장 중...";
  fetch(SCRIPT_URL, { method: 'POST', redirect: 'follow', body: JSON.stringify({ action: "save_note", password: authPassword, date: selectedDate, content: content }) })
  .then(res => res.json()).then(json => { if (json.status === "success") { alert(json.message); document.getElementById('noteSaveStatus').innerText = "저장 완료"; localStorage.setItem('note_' + selectedDate, content); } else { alert(json.message); document.getElementById('noteSaveStatus').innerText = "저장 실패"; } });
}
function loadNoteFromServer(date) {
  if(!date) date = document.getElementById('noteDate').value;
  fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "load_note", password: authPassword, date: date }) })
  .then(res => res.json()).then(json => { if (json.status === "success" && json.content) { quill.root.innerHTML = json.content; localStorage.setItem('note_' + date, json.content); document.getElementById('noteSaveStatus').innerText = "서버 로드 완료"; } else { const localData = localStorage.getItem('note_' + date); if(localData) { quill.root.innerHTML = localData; document.getElementById('noteSaveStatus').innerText = "로컬 데이터 로드"; } else { quill.root.innerHTML = ""; document.getElementById('noteSaveStatus').innerText = "새 기록"; } } });
}
function resetNoteToOriginal() { const selectedDate = document.getElementById('noteDate').value; if (confirm(`[${selectedDate}] 저장된 최신 상태로 되돌리시겠습니까?`)) loadNoteFromServer(selectedDate); }
function searchNotes() {
    const query = document.getElementById('noteSearchInput').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('noteSearchResults');
    if (query.length < 2) { resultsDiv.style.display = 'none'; return; }
    resultsDiv.innerHTML = '';
    let foundCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('note_')) {
            const content = localStorage.getItem(key);
            const date = key.replace('note_', '');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const plainText = tempDiv.textContent || "";
            if (plainText.toLowerCase().includes(query)) {
                foundCount++;
                const item = document.createElement('div');
                item.className = 'search-item';
                const snippet = "..." + plainText.substring(Math.max(0, plainText.toLowerCase().indexOf(query) - 20), Math.min(plainText.length, plainText.toLowerCase().indexOf(query) + 30)) + "...";
                item.innerHTML = `<div class="res-date">${date}</div><div class="res-snippet">${snippet}</div>`;
                item.onclick = () => { document.getElementById('noteDate').value = date; resultsDiv.style.display = 'none'; document.getElementById('noteSearchInput').value = ''; handleNoteDateChange(); };
                resultsDiv.appendChild(item);
            }
        }
    }
    resultsDiv.style.display = foundCount > 0 ? 'block' : 'none';
}
document.addEventListener('click', (e) => { if (!e.target.closest('.note-search-area')) { const resDiv = document.getElementById('noteSearchResults'); if(resDiv) resDiv.style.display = 'none'; } });