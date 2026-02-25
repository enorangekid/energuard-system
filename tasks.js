/* ================= [Timeline Logic - Cached Version] ================= */
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

// ✅ (새로 추가) 선택된 날짜의 마지막 기록을 찾아 시작 시간을 자동 세팅하는 함수
window.updateDefaultStartTime = function() {
    if (editingItemIndex > -1) return; // 수정 모드일 때는 덮어쓰지 않음
    const selectedDate = document.getElementById('tDate').value;
    if (!selectedDate) return;

    const dayLogs = timeLogs.filter(log => log.date === selectedDate && log.category !== '휴무');
    if (dayLogs.length > 0) {
        // 종료 시간 기준으로 정렬하여 가장 마지막 시간 가져오기
        dayLogs.sort((a, b) => a.end.localeCompare(b.end));
        const lastLog = dayLogs[dayLogs.length - 1];
        if (lastLog && lastLog.end && lastLog.end !== "00:00") {
            const parts = lastLog.end.split(':');
            document.getElementById('tStartH').value = parts[0];
            document.getElementById('tStartM').value = parts[1];
        }
    } else {
        // 해당 날짜에 기록이 없으면 빈칸
        document.getElementById('tStartH').value = '';
        document.getElementById('tStartM').value = '';
    }
};

async function loadTimelineFromServer() {
  if(!authPassword) return; 
  
  const now = new Date();
  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  document.getElementById('tDate').value = todayStr;

  if(isTimelineFetched) {
      document.getElementById('loader').style.display = 'none';
      renderTimeLog();
      updateDefaultStartTime();
      return;
  }

  const loader = document.getElementById('loader');
  if(loader) loader.style.display = 'flex';

  try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST', body: JSON.stringify({ action: "read", sheetName: "TimeTracker", password: authPassword })
      });
      const json = await res.json();
      
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
          isTimelineFetched = true; // ✅ 통신 완료 플래그 저장
          updateYearFilterOptions();
          renderTimeLog();
          updateDefaultStartTime();
      }
  } catch (e) {
      console.error("타임라인 데이터 로드 오류:", e);
  } finally {
      if(loader) loader.style.display = 'none';
  }
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
                    <button onclick="if(confirm('삭제하시겠습니까?')) { timeLogs.splice(${realIdx}, 1); updateDefaultStartTime(); renderTimeLog(); }" title="삭제" style="border:none;background:none;cursor:pointer;color:#ef4444;"><i class="fa-solid fa-trash-can"></i></button>
                  </td>`;
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
  
  const newItem = { date, category, task, start, end, duration, min };

  if(editingItemIndex > -1) {
      timeLogs[editingItemIndex] = newItem;
      alert("수정되었습니다.");
      cancelEditMode(); 
  } else {
      timeLogs.push(newItem);
      
      document.getElementById('tTask').value = '';
      document.getElementById('tEndH').value = '';
      document.getElementById('tEndM').value = '';
      updateDefaultStartTime(); 
  }
  
  renderTimeLog();
}

// ✅ 전체 접기/펼치기 토글 함수
let isAllCollapsed = false;
window.toggleAllDates = function() {
    isAllCollapsed = !isAllCollapsed; // 클릭할 때마다 상태 반전
    const icon = document.getElementById('globalCollapseIcon');
    
    // 아이콘 화살표 방향 전환
    if (icon) {
        icon.style.transform = isAllCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
    }

    const selectedYear = document.getElementById('yearFilter').value;
    const searchQuery = document.getElementById('taskSearch').value.toLowerCase();
    let filteredLogs = timeLogs.filter(log => log.date.startsWith(selectedYear) && (log.task.toLowerCase().includes(searchQuery) || log.category.toLowerCase().includes(searchQuery)));

    const grouped = {};
    filteredLogs.forEach(log => { 
        if(!grouped[log.date]) grouped[log.date] = []; 
        grouped[log.date].push(log); 
    });

    const sortedDates = Object.keys(grouped).sort((a,b) => b.localeCompare(a));

    if(sortedDates.length > 0) {
        const latestDate = sortedDates[0];
        sortedDates.forEach(date => {
            if (isAllCollapsed) {
                // 접기 모드: 가장 최신 날짜를 제외하고 모두 접기
                collapsedDates[date] = (date !== latestDate); 
            } else {
                // 펼치기 모드: 모두 펼치기
                collapsedDates[date] = false;
            }
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

/* ================= [Worklog Logic - Cached Version] ================= */
let currentWorkYear = new Date().getFullYear();
let currentWorkMonth = new Date().getMonth() + 1; 
let activeMemoBox = null;

// 업무일지 전용 월별 데이터 캐시
let worklogCache = {};

window.addEventListener('DOMContentLoaded', () => {
   updateDateDisplay();
   setupDragSelection(); 
   initMonthlyLog(); 
});

function handleMonthChange(input) {
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

function setupDragSelection() {
  let isSelecting = false;
  let startInput = null;
  let selectedInputs = [];
  
  let undoStack = []; // 실행 취소를 위한 기록 저장소
  let cellFocusVal = null; // 단일 텍스트 수정을 기록하기 위한 임시 변수

  // 1. 단일 셀 수정 기록 (포커스 될 때 기존 값 저장 -> 잃을 때 변경되었으면 스택에 저장)
  document.addEventListener('focusin', (e) => {
      if (e.target.classList && e.target.classList.contains('clean-input')) {
          cellFocusVal = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      }
  });
  
  document.addEventListener('focusout', (e) => {
      if (e.target.classList && e.target.classList.contains('clean-input')) {
          let currentVal = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
          if (cellFocusVal !== null && cellFocusVal !== currentVal) {
              undoStack.push([{ el: e.target, oldVal: cellFocusVal }]); // 변경이 있으면 스택 추가
          }
          cellFocusVal = null;
      }
  });

  document.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox' && e.target.classList && e.target.classList.contains('clean-input')) {
          if (e.isTrusted) { // 사용자가 직접 클릭한 체크박스 변경만 추적
              undoStack.push([{ el: e.target, oldVal: !e.target.checked }]);
          }
      }
  });

  // 2. 마우스 드래그 이벤트
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

  // 3. 키보드 이벤트 (Delete, Backspace, Ctrl+Z, Ctrl+C)
  document.addEventListener('keydown', (e) => {
    
    // 🔥 Ctrl+Z (실행 취소) 기능
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        // 만약 특정 셀 안에 커서가 깜빡거리며 텍스트를 입력 중이라면 (브라우저 기본 실행취소 사용)
        if (document.activeElement && document.activeElement.classList.contains('clean-input')) {
            return; 
        }
        
        // 다중 삭제나 붙여넣기 후라면 우리가 만든 커스텀 실행취소 작동
        if (undoStack.length > 0) {
            e.preventDefault();
            const lastChanges = undoStack.pop();
            lastChanges.forEach(change => {
                if (change.el.type === 'checkbox') change.el.checked = change.oldVal;
                else change.el.value = change.oldVal;
                
                triggerInputEvent(change.el);
                if (change.el.name === 'done') toggleDone(change.el);
            });
        }
        return;
    }

    // 🔥 Delete / Backspace 기능 (드래그 삭제 지원 및 1글자 지움 버그 해결)
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedInputs.length > 0) {
        
        // 버그 해결 핵심: 오직 1칸만 선택되었고, 그 칸에 커서가 있다면 "1글자 지우기(브라우저 기본)" 허용
        if (selectedInputs.length === 1 && document.activeElement === selectedInputs[0]) {
            return; 
        }

        // 그 외 여러 셀을 선택한 상태라면 일괄 삭제 진행
        e.preventDefault();
        
        // 포커스를 해제하여 이후에 브라우저가 아닌 커스텀 Ctrl+Z가 먹히도록 유도
        if (document.activeElement) document.activeElement.blur(); 
        
        let currentChanges = []; // 실행 취소를 위해 삭제되기 전 값 저장
        selectedInputs.forEach(input => {
            currentChanges.push({
                el: input,
                oldVal: input.type === 'checkbox' ? input.checked : input.value
            });

            if(input.type === 'checkbox') input.checked = false;
            else input.value = '';
            
            triggerInputEvent(input);
            if (input.name === 'done') toggleDone(input);
        });
        
        if (currentChanges.length > 0) undoStack.push(currentChanges);
    }
    
    // Copy (Ctrl+C)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedInputs.length > 0) {
       handleCopy(e);
    }
  });

  // 4. 붙여넣기 (Paste)
  document.addEventListener('paste', (e) => {
      const active = document.activeElement;
      if (!active || !active.classList.contains('clean-input')) return;
      e.preventDefault();
      active.blur(); // 포커스를 해제해 커스텀 Ctrl+Z가 제대로 작동하게 함
      handlePaste(e, active);
  });

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

  function handlePaste(e, startCellInput) {
      const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
      if (!clipboardData) return;

      let startCell = selectedInputs.length > 0 ? selectedInputs[0] : startCellInput;
      if (!startCell || !startCell.classList.contains('clean-input')) return;

      const startRow = startCell.closest('.task-strip');
      const container = startRow.closest('.wp-list');
      const allStripRows = Array.from(container.querySelectorAll('.task-strip'));
      
      const startRowIdx = allStripRows.indexOf(startRow);
      const startInputs = Array.from(startRow.querySelectorAll('.clean-input'));
      const startColIdx = startInputs.indexOf(startCell);

      const rows = clipboardData.split(/\r\n|\n|\r/);
      
      let currentChanges = []; // 실행 취소를 위한 상태 저장

      rows.forEach((rowText, rIdx) => {
          if (rowText.trim() === "" && rIdx === rows.length - 1) return;
          
          const targetRow = allStripRows[startRowIdx + rIdx];
          if (!targetRow) return;

          const targetInputs = Array.from(targetRow.querySelectorAll('.clean-input'));
          const cols = rowText.split('\t');

          cols.forEach((val, cIdx) => {
              const input = targetInputs[startColIdx + cIdx];
              if (input) {
                  // 값 덮어쓰기 전 기존 값 기록
                  currentChanges.push({
                      el: input,
                      oldVal: input.type === 'checkbox' ? input.checked : input.value
                  });

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
      
      if(currentChanges.length > 0) undoStack.push(currentChanges);
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
     if(json.status === "success") {
         alert("✅ 저장 완료!"); 
         delete worklogCache[`${targetYear}-${targetMonth}`];
         cachedProductLogs = null;
     } else {
         alert("오류: " + json.message);
     }
  }).finally(() => { loader.style.display = 'none'; });
}

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

async function loadWorklogFromServer() {
  if(!authPassword) return;
  const monthKey = `${currentWorkYear}-${currentWorkMonth}`;
  
  if(worklogCache[monthKey]) {
      applyWorklogData(worklogCache[monthKey]);
      return;
  }

  const loader = document.getElementById('loader'); loader.style.display = 'flex';
  
  try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST', body: JSON.stringify({ action: "load_worklog", password: authPassword, year: currentWorkYear, month: currentWorkMonth })
      });
      const json = await res.json();
      
      if(json.status === "success") {
          worklogCache[monthKey] = json; 
          applyWorklogData(json);       
      }
  } catch(e) {
      console.error("업무 일지 로드 오류:", e);
  } finally {
      loader.style.display = 'none';
  }
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


/* ================= [Product Log Logic - Cached Version] ================= */
let cachedProductLogs = null;
let isFetchingProductLogs = false;

async function fetchProductLogsIfNeeded() {
    if (cachedProductLogs !== null) {
        document.getElementById('loader').style.display = 'none';
        return true;
    }
    if (isFetchingProductLogs) return false;

    isFetchingProductLogs = true;
    document.getElementById('loader').style.display = 'flex';

    try {
        const res = await fetch(SCRIPT_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: "get_all_product_logs", password: authPassword }) 
        });
        const json = await res.json();
        
        if (json.status === "success" && json.data) {
            let validLogs = json.data.filter(log => isNaN(Number(String(log.content).trim())));
            validLogs.sort((a,b) => b.date.localeCompare(a.date));
            cachedProductLogs = validLogs; 
            return true;
        }
    } catch (e) {
        console.error("상품 로그 로드 오류:", e);
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
            .prodlog-month-divider { 
                background-color: #f1f5f9 !important; 
                font-size: 14px; 
                font-weight: 800; 
                color: #334155; 
                text-align: left !important; 
                padding: 12px 20px !important; 
                border-top: 2px solid #e2e8f0; 
                border-bottom: 2px solid #e2e8f0; 
            }
            .prodlog-row { transition: all 0.2s ease; cursor: pointer; }
            .prodlog-row td { transition: all 0.2s ease; }
            .prodlog-row:hover { background-color: #f0f9ff !important; }
            .prodlog-row:hover td { 
                color: #2563eb !important; 
                text-decoration: underline; 
                font-weight: 700; 
            }
        `;
        document.head.appendChild(style);
    }

    const tbody = document.getElementById('productLogList');
    await fetchProductLogsIfNeeded();
    
    tbody.innerHTML = '';
    
    if(cachedProductLogs && cachedProductLogs.length > 0) {
        let currentMonth = "";
        
        cachedProductLogs.forEach(log => { 
            let logMonth = log.date.substring(0, 7); 
            if (logMonth !== currentMonth) {
                currentMonth = logMonth;
                const [yyyy, mm] = logMonth.split('-');
                const divider = document.createElement('tr');
                divider.innerHTML = `<td colspan="2" class="prodlog-month-divider">📅 ${yyyy}년 ${mm}월 수정 내역</td>`;
                tbody.appendChild(divider);
            }

            const tr = document.createElement('tr'); 
            tr.className = "prodlog-row"; 
            tr.onclick = function() { jumpToWorkLog(log.date); };
            tr.title = "클릭하면 해당 일자의 업무일지로 이동합니다.";
            
            tr.innerHTML = `
              <td style="font-weight:700; color:#4f46e5;">${log.date}</td>
              <td>${log.content}</td>
            `; 
            tbody.appendChild(tr); 
        });
    } else { 
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:40px; color:#999;">저장된 상품 수정 내역이 없습니다.</td></tr>'; 
    }
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


/* ================= [Notes Logic - Bulletproof Cached Version] ================= */
var quill;
var currentNoteType = 'general';
var currentDraftId = "";

let cachedNotes = null;
let notesFetchPromise = null; 

function fetchAllNotesIfNeeded() {
    if (cachedNotes !== null) {
        document.getElementById('loader').style.display = 'none';
        return Promise.resolve(true); 
    }
    
    if (notesFetchPromise) return notesFetchPromise; 

    document.getElementById('loader').style.display = 'flex';
    const statusEl = document.getElementById('noteSaveStatus');
    if(statusEl) statusEl.innerText = "데이터 동기화 중...";

    notesFetchPromise = fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "load_all_notes", password: authPassword })
    }).then(r => r.json()).then(res => {
        if (res.status === "success") {
            cachedNotes = res.data;
            if(statusEl) statusEl.innerText = "동기화 완료";
            return true;
        }
        return false;
    }).catch(e => {
        console.error("노트 로드 실패", e);
        if(statusEl) statusEl.innerText = "동기화 실패";
        return false;
    }).finally(() => {
        document.getElementById('loader').style.display = 'none';
        notesFetchPromise = null; 
    });

    return notesFetchPromise;
}

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
        handlers: { image: imageUploadHandler }
      }
    }
  });
}

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
        body: JSON.stringify({ action: 'upload_image', password: authPassword, imageBase64: base64Data, fileType: fileType })
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
      .finally(() => { if (loader) loader.style.display = 'none'; });
    };
    reader.readAsDataURL(file);
  };
}

async function handleNoteDateChange() {
    try {
        if(currentNoteType !== 'general') return; 
        await fetchAllNotesIfNeeded();
        loadGeneralNoteFromCache();
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
}

async function setNoteTab(type) {
    initQuill(); 
    currentNoteType = type;
    currentDraftId = ""; 
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    if(event && event.target && event.target.classList) {
        event.target.classList.add('active');
    } else {
        const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.innerText.includes(type === 'blog' ? '블로그' : (type === 'youtube' ? '유튜브' : '일반')));
        if(btn) btn.classList.add('active');
    }
    
    const metaArea = document.getElementById('draftMetadataArea');
    const dateSelector = document.querySelector('.date-selector-wrapper'); 
    const listContainer = document.getElementById('draftListContainer');
    
    if(quill) quill.root.innerHTML = "";
    document.getElementById('draftTitle').value = "";
    document.getElementById('draftStatus').value = "saving";
    
    try {
        await fetchAllNotesIfNeeded();

        if(type === 'general') {
            metaArea.style.display = 'none';
            listContainer.style.display = 'none';
            if(dateSelector) dateSelector.style.display = 'flex';
            document.getElementById('editor-wrapper').style.display = 'flex';
            if(quill) quill.root.dataset.placeholder = "업무 내용을 자유롭게 기록하세요...";
            
            loadGeneralNoteFromCache(); 
        } 
        else {
            metaArea.style.display = 'none';
            listContainer.style.display = 'block'; 
            if(dateSelector) dateSelector.style.display = 'none'; 
            document.getElementById('editor-wrapper').style.display = 'none';
            
            if(quill) quill.root.dataset.placeholder = type === 'blog' ? "블로그 원고 내용을 작성하세요..." : "유튜브 스크립트를 작성하세요...";
            
            renderDraftListFromCache(type); 
        }
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
}

async function loadDraftContent(id) {
    try {
        await fetchAllNotesIfNeeded();
        currentDraftId = id;
        document.getElementById('draftListContainer').style.display = 'none';
        document.getElementById('editor-wrapper').style.display = 'flex';
        document.getElementById('draftMetadataArea').style.display = 'flex';
        document.getElementById('noteDate').valueAsDate = new Date();

        const note = cachedNotes.find(n => n.id === id);
        if(note) {
            quill.root.innerHTML = note.content || "";
            document.getElementById('draftTitle').value = note.title || "";
            document.getElementById('draftStatus').value = note.status || "saving";
            document.getElementById('noteSaveStatus').innerText = "로드 완료";
        }
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
}

function loadGeneralNoteFromCache() {
    if (!cachedNotes) return;
    const selectedDate = document.getElementById('noteDate').value;
    const note = cachedNotes.find(n => n.type === 'general' && n.date === selectedDate);
    
    quill.root.innerHTML = note ? note.content : "";
    document.getElementById('noteSaveStatus').innerText = "로드 완료";
}

function renderDraftListFromCache(type) {
    const listBody = document.getElementById('draftListBody');
    if (!cachedNotes) return;

    const filtered = cachedNotes.filter(n => n.type === type);
    listBody.innerHTML = '';

    if(filtered.length > 0) {
        filtered.forEach(item => {
            const tr = document.createElement('tr');
            tr.onclick = () => loadDraftContent(item.id);
            
            let statusBadge = item.status === 'uploaded' 
                ? '<span class="badge" style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:4px; font-size:11px;">업로드됨</span>' 
                : '<span class="badge" style="background:#f1f5f9; color:#64748b; padding:4px 8px; border-radius:4px; font-size:11px;">작성중</span>';
            
            tr.innerHTML = `
                <td class="text-sub">${item.date}</td>
                <td class="text-left font-bold">${item.title}</td>
                <td>${statusBadge}</td>
                <td class="text-sub">${item.savedAt}</td>
            `;
            listBody.appendChild(tr);
        });
    } else {
        listBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:60px; color:#94a3b8;"><i class="fa-regular fa-folder-open" style="font-size:30px; margin-bottom:10px;"></i><br>작성된 원고가 없습니다.<br>상단 "새 원고 작성" 버튼을 눌러 시작해보세요.</td></tr>';
    }
}

function createNewDraft() {
    currentDraftId = "";
    quill.root.innerHTML = "";
    document.getElementById('draftTitle').value = "";
    document.getElementById('draftStatus').value = "saving";
    document.getElementById('noteDate').valueAsDate = new Date();
    
    document.getElementById('draftListContainer').style.display = 'none';
    document.getElementById('editor-wrapper').style.display = 'flex';
    document.getElementById('draftMetadataArea').style.display = 'flex';
}

async function processBase64Images() {
  const delta = quill.getContents();
  const ops = delta.ops;
  let hasBase64 = false;

  for (let i = 0; i < ops.length; i++) {
    if (ops[i].insert && ops[i].insert.image && String(ops[i].insert.image).startsWith('data:image')) {
      hasBase64 = true;
      break;
    }
  }

  if (!hasBase64) return true; 

  if (!confirm("붙여넣은 이미지가 감지되었습니다.\n서버로 업로드 변환 후 저장하시겠습니까?\n(이미지가 많으면 시간이 걸릴 수 있습니다.)")) {
    return false;
  }

  const statusEl = document.getElementById('noteSaveStatus');
  if (statusEl) statusEl.innerText = "이미지 변환 중...";
  document.getElementById('loader').style.display = 'flex';

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op.insert && op.insert.image && String(op.insert.image).startsWith('data:image')) {
      const base64Str = op.insert.image;
      
      try {
        const base64Data = base64Str.split(',')[1];
        const mimeMatch = base64Str.match(/data:image\/([a-zA-Z]+);base64/);
        const fileType = mimeMatch ? mimeMatch[1] : 'png';

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'upload_image', password: authPassword, imageBase64: base64Data, fileType: fileType })
        });
        const json = await response.json();

        if (json.status === 'success') {
           ops[i].insert.image = json.url;
        } else {
           alert("이미지 변환 실패: " + json.message);
           document.getElementById('loader').style.display = 'none';
           return false;
        }
      } catch (e) {
        console.error(e);
        alert("이미지 업로드 중 네트워크 오류 발생");
        document.getElementById('loader').style.display = 'none';
        return false;
      }
    }
  }

  quill.setContents(delta);
  return true;
}

async function saveNoteToServer() {
  const isProcessed = await processBase64Images();
  if (!isProcessed) return;

  const selectedDate = document.getElementById('noteDate').value; 
  let content = quill.root.innerHTML;
  let title = document.getElementById('draftTitle').value;
  let status = document.getElementById('draftStatus').value;
  const statusEl = document.getElementById('noteSaveStatus');

  if(currentNoteType !== 'general' && !title) { alert("제목을 입력해주세요."); return; }

  document.getElementById('loader').style.display = 'flex'; 
  if(statusEl) statusEl.innerText = "저장 중...";
  
  fetch(SCRIPT_URL, { 
      method: 'POST', 
      body: JSON.stringify({ 
          action: "save_note", password: authPassword, date: selectedDate, content: content,
          type: currentNoteType, title: title, status: status, id: currentDraftId
      }) 
  })
  .then(res => res.json()).then(json => { 
      if (json.status === "success") { 
          alert(json.message); 
          if(statusEl) statusEl.innerText = "저장 완료"; 
          
          if(currentNoteType !== 'general') {
              currentDraftId = json.id;
              document.getElementById('draftLastSaved').innerText = "저장됨: " + new Date().toLocaleTimeString();
          }

          if(cachedNotes) {
              let existingIndex = cachedNotes.findIndex(n => 
                  currentNoteType === 'general' ? (n.date === selectedDate && n.type === 'general') : n.id === currentDraftId
              );
              
              let updatedNote = {
                  date: selectedDate, content: content,
                  savedAt: json.savedAt || new Date().toLocaleString('ko-KR'), 
                  type: currentNoteType, title: title, status: status,
                  id: currentNoteType !== 'general' ? json.id : ""
              };

              if (existingIndex > -1) cachedNotes[existingIndex] = updatedNote;
              else cachedNotes.unshift(updatedNote); 
          }
      } else { 
          alert("오류: " + json.message); 
          if(statusEl) statusEl.innerText = "저장 실패"; 
      } 
  })
  .catch(err => { alert("통신 오류 발생: " + err); })
  .finally(() => { document.getElementById('loader').style.display = 'none'; });
}

function backToList() {
    if(confirm("저장하지 않은 내용은 사라집니다. 목록으로 돌아가시겠습니까?")) {
        setNoteTab(currentNoteType);
    }
}

function resetNoteToOriginal() { 
    if (confirm("최근 저장된 상태로 되돌리시겠습니까?")) { 
        if(currentNoteType === 'general') loadGeneralNoteFromCache(); 
        else loadDraftContent(currentDraftId); 
    } 
}

function searchNotes() {
    const query = document.getElementById('noteSearchInput').value.trim().toLowerCase();
    
    if (currentNoteType === 'general') return;

    const listBody = document.getElementById('draftListBody');
    if (!cachedNotes) return;

    const filtered = cachedNotes.filter(n => {
        if (n.type !== currentNoteType) return false;
        if (!query) return true; 
        
        const titleMatch = (n.title || "").toLowerCase().includes(query);
        const textContent = (n.content || "").replace(/<[^>]*>?/gm, '');
        const contentMatch = textContent.toLowerCase().includes(query);
        
        return titleMatch || contentMatch;
    });

    listBody.innerHTML = '';

    if (filtered.length > 0) {
        filtered.forEach(item => {
            const tr = document.createElement('tr');
            tr.onclick = () => loadDraftContent(item.id);
            
            let statusBadge = item.status === 'uploaded' 
                ? '<span class="badge" style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:4px; font-size:11px;">업로드됨</span>' 
                : '<span class="badge" style="background:#f1f5f9; color:#64748b; padding:4px 8px; border-radius:4px; font-size:11px;">작성중</span>';
            
            tr.innerHTML = `
                <td class="text-sub">${item.date}</td>
                <td class="text-left font-bold">${item.title}</td>
                <td>${statusBadge}</td>
                <td class="text-sub">${item.savedAt}</td>
            `;
            listBody.appendChild(tr);
        });
    } else {
        listBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:60px; color:#94a3b8;">
            <i class="fa-solid fa-magnifying-glass" style="font-size:30px; margin-bottom:10px;"></i><br>
            '${query}'에 대한 검색 결과가 없습니다.
        </td></tr>`;
    }
}


/* ================= [Quick Memo Panel Logic] ================= */
let quickQuill = null;

// 퀵 메모 패널 열기/닫기
async function toggleQuickMemo() {
    const panel = document.getElementById('quickMemoPanel');
    const aiPanel = document.getElementById('aiChatPanel');
    const calcPanel = document.getElementById('calcPanel'); 
    const widgetPanel = document.getElementById('widgetPanel'); // ✅ 위젯 패널 추가
    
    // 다른 패널이 열려있다면 닫기 (위젯 패널 포함)
    if(aiPanel && aiPanel.classList.contains('open')) aiPanel.classList.remove('open');
    if(calcPanel && calcPanel.classList.contains('open')) calcPanel.classList.remove('open');
    if(widgetPanel && widgetPanel.classList.contains('open')) widgetPanel.classList.remove('open');

    const isOpen = panel.classList.contains('open');
    const statusEl = document.getElementById('quickMemoStatus');
    
    if (!isOpen) {
        panel.classList.add('open');
        
// 1. 오늘 날짜 세팅
        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        
        // 요일 배열 추가
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = days[now.getDay()];
        
        // formatDate 함수를 쓰지 않고, 일(Day)과 요일까지 명확하게 표시
        document.getElementById('quickMemoDate').innerText = `${todayStr} (${dayName})`;
        
        // 2. 미니 에디터 초기화
        if (!quickQuill) {
            quickQuill = new Quill('#quickEditor', {
                theme: 'snow',
                placeholder: '오늘의 주요 업무나 기억할 내용을 자유롭게 메모하세요...',
                modules: { toolbar: false } 
            });
        }
        
        // 3. 기존 노트 데이터 연동 (캐시 활용)
        statusEl.style.color = '#94a3b8';
        statusEl.innerText = "데이터 연동 중...";
        
        await fetchAllNotesIfNeeded(); // 데이터 확실히 로드
        
        const note = cachedNotes ? cachedNotes.find(n => n.type === 'general' && n.date === todayStr) : null;
        
        if (note) {
            quickQuill.root.innerHTML = note.content;
        } else {
            quickQuill.root.innerHTML = "";
        }
        
        statusEl.innerText = "동기화 완료";
        setTimeout(() => { if(statusEl.innerText === "동기화 완료") statusEl.innerText = ""; }, 1500);
        
        quickQuill.focus();
        
    } else {
        panel.classList.remove('open');
    }
}

// 퀵 메모 저장 (메인 노트와 서버에 동시 반영)
async function saveQuickMemo() {
    if(!authPassword) return;
    if(!quickQuill) return;

    const content = quickQuill.root.innerHTML;
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const statusEl = document.getElementById('quickMemoStatus');
    
    statusEl.style.color = '#f59e0b'; // 오렌지색
    statusEl.innerText = "저장 중...";
    
    try {
        const res = await fetch(SCRIPT_URL, { 
            method: 'POST', 
            body: JSON.stringify({ 
                action: "save_note", 
                password: authPassword, 
                date: todayStr, 
                content: content,
                type: 'general',
                title: '',
                status: 'saving',
                id: ''
            }) 
        }).then(r => r.json());
        
        if (res.status === "success") {
            statusEl.style.color = '#10b981'; // 녹색
            statusEl.innerText = "✅ 저장 및 연동 완료!";
            
            // 1. 메모리(캐시) 즉시 업데이트
            if(cachedNotes) {
                let existingIndex = cachedNotes.findIndex(n => n.date === todayStr && n.type === 'general');
                let updatedNote = {
                    date: todayStr, content: content,
                    savedAt: res.savedAt || new Date().toLocaleString('ko-KR'), 
                    type: 'general', title: '', status: 'saving', id: ''
                };
                if (existingIndex > -1) cachedNotes[existingIndex] = updatedNote;
                else cachedNotes.unshift(updatedNote); 
            }
            
            // 2. 만약 백그라운드에 '업무 노트' 화면이 열려있다면 메인 화면 에디터도 동시에 변경
            if(currentNoteType === 'general' && document.getElementById('noteDate').value === todayStr && typeof quill !== 'undefined' && quill) {
                quill.root.innerHTML = content;
            }
            
            setTimeout(() => { statusEl.innerText = ""; }, 2000);
        } else {
            statusEl.style.color = '#ef4444';
            statusEl.innerText = "저장 실패";
        }
    } catch (e) {
        console.error(e);
        statusEl.style.color = '#ef4444';
        statusEl.innerText = "통신 오류 발생";
    }
}


/* ================= [AI Chat Panel Logic] ================= */
// 🚨 반드시 구글 AI 스튜디오에서 '키 복사' 버튼을 눌러 그대로 붙여넣어주세요! (오타 방지)
const GEMINI_API_KEY = "AIzaSyB1cUbczaGCosRjCttpeSOS-7qwyeFvJ7A"; 
let chatHistory = []; // 대화 문맥 기억용 배열

// 텍스트 영역 이벤트 리스너 설정 (엔터키 전송 및 높이 자동 조절)
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

// AI 채팅 패널 열기/닫기
function toggleAIChat() {
    const panel = document.getElementById('aiChatPanel');
    const memoPanel = document.getElementById('quickMemoPanel');
    const calcPanel = document.getElementById('calcPanel');
    const widgetPanel = document.getElementById('widgetPanel'); // ✅ 위젯 패널 추가
    
    // 다른 패널이 열려있다면 닫기 (위젯 패널 포함)
    if(memoPanel && memoPanel.classList.contains('open')) memoPanel.classList.remove('open');
    if(calcPanel && calcPanel.classList.contains('open')) calcPanel.classList.remove('open');
    if(widgetPanel && widgetPanel.classList.contains('open')) widgetPanel.classList.remove('open');

    const isOpen = panel.classList.contains('open');
    if (!isOpen) {
        panel.classList.add('open');
        setTimeout(() => document.getElementById('aiChatInput').focus(), 300); 
    } else {
        panel.classList.remove('open');
    }
}

// Gemini API로 메시지 전송
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory })
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
            appendChatMessage('model', `🚨 API 오류: ${data.error.message}`);
            chatHistory.pop(); 
        } 
        else {
            appendChatMessage('model', '응답을 생성하지 못했습니다.');
            chatHistory.pop();
        }
    } catch(error) {
        console.error("Fetch Error:", error);
        hideTypingIndicator();
        appendChatMessage('model', '⚠️ 네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
        chatHistory.pop();
    }
}

// 메시지 말풍선 추가 함수
function appendChatMessage(role, text) {
    const container = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role === 'user' ? 'user' : 'ai'}`;
    
    const formattedText = text.replace(/\n/g, '<br>').replace(/\*\*/g, '');
    const avatarIcon = role === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';
    
    msgDiv.innerHTML = `
        <div class="chat-avatar">${avatarIcon}</div>
        <div class="chat-bubble">${formattedText}</div>
    `;
    
    container.appendChild(msgDiv);
    scrollToBottom(container);
}

// 타이핑 애니메이션
function showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message ai typing-indicator-msg';
    typingDiv.innerHTML = `
        <div class="chat-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="chat-bubble">
            <div class="typing-indicator">
                <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
            </div>
        </div>
    `;
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