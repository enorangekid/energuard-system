/* ================================================================
   js/notes.js  —  업무 노트(일반 노트) / 퀵 메모 로직
   블로그·유튜브 원고는 js/media.js("미디어 콘텐츠" 페이지)로 분리됨(2026-08-14).
   의존성: common.js (supabaseClient, showToast, openPanel)
   로드 순서: config.js → common.js → notes.js → media.js
   ================================================================ */

/* ================= [Note Logic: Real-time Save & Undo] ================= */

let currentNoteId = null;
let currentNoteMonth = ''; // 현재 로드된 월 (YYYY-MM)
let noteOriginalContent = ''; // ✅ 롤백(취소) 기준점
let noteAutoSaveTimer = null; // 자동 저장 타이머

// 📌 노트 데이터 불러오기 (월 변경 시)
window.handleNoteDateChange = async function() {
    // 하위호환용 - handleNoteMonthChange 호출
    handleNoteMonthChange();
}

// 연도 드롭박스 + 1~12월 버튼(업무 타임라인/월간 업무일지와 같은 month-quick 스타일).
// 숨겨진 #noteMonthPicker(type=month)를 그대로 "현재 선택된 값"의 저장소로 계속 쓰고,
// 이 UI는 그 값을 읽고 쓰기만 하는 뷰라서 notes.js의 나머지 저장/로드 로직은 안 건드린다.
function renderNoteMonthQuick() {
    const picker = document.getElementById('noteMonthPicker');
    const yearSel = document.getElementById('noteYearSelect');
    const grid = document.getElementById('noteMonthQuick');
    if (!picker || !yearSel || !grid) return;
    const selected = picker.value; // "YYYY-MM"
    const curYear = new Date().getFullYear();
    const years = [];
    for (let y = curYear; y >= curYear - 3; y--) years.push(y);
    const selectedYear = selected ? Number(selected.split('-')[0]) : curYear;
    yearSel.innerHTML = years.map(y => `<option value="${y}"${y === selectedYear ? ' selected' : ''}>${y}년</option>`).join('');
    const year = yearSel.value;
    grid.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
        const ym = `${year}-${String(month).padStart(2, '0')}`;
        const active = ym === selected;
        return `<button type="button" class="worklog-month-card${active ? ' active' : ''}" onclick="selectNoteMonth('${ym}')">${month}월</button>`;
    }).join('');
}

window.handleNoteYearChange = function() {
    renderNoteMonthQuick();
};

window.selectNoteMonth = function(ym) {
    const picker = document.getElementById('noteMonthPicker');
    if (picker) picker.value = ym;
    handleNoteMonthChange();
};

window.handleNoteMonthChange = async function() {
    if (!supabaseClient) return;
    const monthStr = document.getElementById('noteMonthPicker').value; // YYYY-MM
    if (!monthStr) return;
    currentNoteMonth = monthStr;
    renderNoteMonthQuick();
    const monthDate = monthStr + '-01'; // DB 저장 형식: YYYY-MM-01

    try {
        const _uid = window.currentUser?.username || 'admin';
        const { data, error } = await supabaseClient.from('notes')
            .select('*')
            .eq('date', monthDate)
            .eq('type', 'general')
            .eq('user_id', _uid)
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            currentNoteId = data[0].id;
            const noteContent = data[0].content || '';
            setQuillContent(window.quill, noteContent);
            noteOriginalContent = noteContent;
        } else {
            currentNoteId = null;
            setQuillContent(window.quill, '');
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

// 📌 저장된 HTML을 에디터에 안전하게 로드한다. root.innerHTML을 직접 바꾸면 Quill의
// MutationObserver가 이를 "사용자 편집"으로 오인해 text-change(user)를 발생시키고
// (→ 자동저장 트리거), 옛 버전(1.3.6)에서 저장된 중첩 서식 HTML을 Quill 2.x가
// 잘못 재해석해 텍스트가 중복되는 심각한 손상이 실제로 있었다(2026-08-12). 반드시
// clipboard.convert()로 변환한 뒤 setContents(..., 'silent')로 넣어야 안전하다.
// (media.js의 블로그/유튜브 에디터도 이 함수를 그대로 재사용한다.)
function setQuillContent(quillInstance, html) {
    if (!quillInstance) return;
    if (!html) { quillInstance.setContents([], 'silent'); return; }
    const delta = quillInstance.clipboard.convert({ html: html });
    quillInstance.setContents(delta, 'silent');
}

// 📌 Quill 에디터 초기화 (Quill 2.x + quill-table-better, 에너가드랩 admin/work-notes.js에서 이식)
window.initQuill = function() {
    if (window.quill) return;

    // ── 폰트 크기 Whitelist 등록 (attributors/style/size로 무조건 덮어씀) ──
    const Size = Quill.import('attributors/style/size');
    Size.whitelist = ['14px', '15px', '16px', '18px'];
    Quill.register(Size, true);

    // ── 폰트 패밀리 Whitelist 등록 ──
    const Font = Quill.import('formats/font');
    Font.whitelist = ['pretendard', 'gmarket-sans', 'nanum-square', 'nanum-myeongjo', 'gowun-dodum'];
    Quill.register(Font, true);

    // ── 구분선(HR) Blot 등록 (Quill 인스턴스 생성 직전에 등록해야 안전) ──
    if (!Quill.imports['formats/divider']) {
        const BlockEmbed = Quill.import('blots/block/embed');
        class DividerBlot extends BlockEmbed {}
        DividerBlot.blotName = 'divider';
        DividerBlot.tagName  = 'hr';
        Quill.register(DividerBlot);
    }

    // ── quill-table-better — CDN 로드 실패/API 변경 시에도 나머지 에디터 기능은
    // 정상 동작하도록 try/catch로 감싼다 ──
    let tableModuleConfig = false;
    let keyboardBindings;
    try {
        if (typeof QuillTableBetter !== 'undefined') {
            Quill.register({ 'modules/table-better': QuillTableBetter }, true);
            tableModuleConfig = {};
            keyboardBindings = QuillTableBetter.keyboardBindings;
        }
    } catch (e) {
        console.error('quill-table-better 등록 실패:', e);
    }

    const modules = {
        clipboard: {
            matchers: [[Node.ELEMENT_NODE, window.stripHeaderClipboardMatcher]]
        },
        toolbar: {
            container: '#nt-toolbar',
            handlers: {
                'image': imageUploadHandler,
                'divider': function() {
                    const range = this.quill.getSelection(true);
                    this.quill.insertText(range.index, '\n', Quill.sources.USER);
                    this.quill.insertEmbed(range.index + 1, 'divider', true, Quill.sources.USER);
                    this.quill.setSelection(range.index + 2, Quill.sources.SILENT);
                },
                'table-insert': function() {
                    const tableBetter = window.quill.getModule('table-better');
                    if (tableBetter && typeof tableBetter.insertTable === 'function') {
                        tableBetter.insertTable(3, 3);
                    } else {
                        showToast('표 모듈을 불러오지 못했습니다.', 'error');
                    }
                }
            }
        }
    };
    if (tableModuleConfig !== false) {
        modules.table = false;
        modules['table-better'] = tableModuleConfig;
        if (keyboardBindings) modules.keyboard = { bindings: keyboardBindings };
    }

    window.quill = new Quill('#editor', {
        theme: 'snow',
        placeholder: '만능 비서와 함께 업무 내용을 자유롭게 기록하세요...',
        modules
    });
    applyNoteToolbarUi();
    requestAnimationFrame(applyNoteToolbarUi);
    initFontSizeSelects();

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

    // ── 이미지 붙여넣기: capture:true 로 Quill보다 먼저 가로채기 ──
    window.quill.root.addEventListener('paste', handleImagePaste, true);

    // ── 이미지 드래그 앤 드롭: capture:true + dragover 허용 ──
    window.quill.root.addEventListener('dragover', function(e) {
        if (e.dataTransfer && e.dataTransfer.types &&
            Array.from(e.dataTransfer.types).includes('Files')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    }, true);
    window.quill.root.addEventListener('drop', handleImageDrop, true);

    // ── 에디터 외부로 드롭 시 브라우저가 이미지를 새 탭으로 여는 것 방지 ──
    document.addEventListener('dragover', function(e) { e.preventDefault(); }, false);
    document.addEventListener('drop', function(e) {
        if (e.target.closest('#editor')) return; // 에디터 내부는 위 핸들러가 처리
        e.preventDefault();
    }, false);
}

// ── 글꼴/크기 — Quill picker 대신 사이트 공용 .store-select 컴포넌트를 그대로 써서
// quill.format()만 호출한다(에너가드랩 admin/work-notes.js에서 이식). ──
function initFontSizeSelects() {
    const fontLabelMap = { 'pretendard': '프리텐다드', 'gmarket-sans': '지마켓 산스', 'nanum-square': '나눔스퀘어', 'nanum-myeongjo': '나눔명조', 'gowun-dodum': '고운돋움' };
    const sizeLabelMap = { '14px': '14', '15px': '15', '16px': '16', '18px': '18' };

    function setActiveChip(chipsId, value, attr) {
        document.querySelectorAll('#' + chipsId + ' [' + attr + ']').forEach((chip) => {
            chip.classList.toggle('active', chip.getAttribute(attr) === value);
        });
    }
    function applyFont(value) {
        window.quill.format('font', value);
        document.getElementById('wnFontLabel').textContent = fontLabelMap[value] || value;
        setActiveChip('wnFontChips', value, 'data-wn-font');
    }
    function applySize(value) {
        window.quill.format('size', value);
        document.getElementById('wnSizeLabel').textContent = sizeLabelMap[value] || value;
        setActiveChip('wnSizeChips', value, 'data-wn-size');
    }

    document.addEventListener('click', (e) => {
        const fontChips = document.getElementById('wnFontChips');
        const sizeChips = document.getElementById('wnSizeChips');

        if (e.target.closest('[data-action="toggle-wn-font-menu"]')) {
            fontChips?.classList.toggle('open');
            sizeChips?.classList.remove('open');
            return;
        }
        const fontOption = e.target.closest('[data-wn-font]');
        if (fontOption) {
            applyFont(fontOption.dataset.wnFont);
            fontChips?.classList.remove('open');
            return;
        }
        if (fontChips && !e.target.closest('#wnFontChips')) fontChips.classList.remove('open');

        if (e.target.closest('[data-action="toggle-wn-size-menu"]')) {
            sizeChips?.classList.toggle('open');
            fontChips?.classList.remove('open');
            return;
        }
        const sizeOption = e.target.closest('[data-wn-size]');
        if (sizeOption) {
            applySize(sizeOption.dataset.wnSize);
            sizeChips?.classList.remove('open');
            return;
        }
        if (sizeChips && !e.target.closest('#wnSizeChips')) sizeChips.classList.remove('open');
    });

    window.quill.on('selection-change', (range) => {
        if (!range) return;
        const format = window.quill.getFormat(range);
        const fontVal = format.font || 'pretendard';
        const sizeVal = format.size || '15px';
        document.getElementById('wnFontLabel').textContent = fontLabelMap[fontVal] || fontVal;
        setActiveChip('wnFontChips', fontVal, 'data-wn-font');
        document.getElementById('wnSizeLabel').textContent = sizeLabelMap[sizeVal] || sizeVal;
        setActiveChip('wnSizeChips', sizeVal, 'data-wn-size');
    });
}

// ── 툴바 버튼 아이콘을 Tabler 아이콘 세트(SVG)로 교체(에너가드랩 admin/work-notes.js에서 이식) ──
function applyNoteToolbarUi() {
    const icons = {
        image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 8h.01"/><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12"/><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5"/><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3"/></svg>',
        blockquote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5"/><path d="M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5"/></svg>',
        divider: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7v3"/><path d="M4 12h16"/><path d="M20 7v3"/></svg>',
        'table-insert': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14"/><path d="M3 10h18"/><path d="M10 3v18"/></svg>',
        bold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5h6a3.5 3.5 0 0 1 0 7h-6l0 -7"/><path d="M13 12h1a3.5 3.5 0 0 1 0 7h-7v-7"/></svg>',
        italic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5l6 0"/><path d="M7 19l6 0"/><path d="M14 5l-4 14"/></svg>',
        underline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5v5a5 5 0 0 0 10 0v-5"/><path d="M5 19h14"/></svg>',
        strike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l14 0"/><path d="M16 6.5a4 2 0 0 0 -4 -1.5h-1a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-1.5a4 2 0 0 1 -4 -1.5"/></svg>',
        'ordered-list': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 6h9"/><path d="M11 12h9"/><path d="M12 18h8"/><path d="M4 16a2 2 0 1 1 4 0c0 .591 -.5 1 -1 1.5l-3 2.5h4"/><path d="M6 10v-6l-2 2"/></svg>',
        'bullet-list': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l11 0"/><path d="M9 12l11 0"/><path d="M9 18l11 0"/><path d="M5 6l0 .01"/><path d="M5 12l0 .01"/><path d="M5 18l0 .01"/></svg>',
        'align-left': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l16 0"/><path d="M4 12l10 0"/><path d="M4 18l14 0"/></svg>',
        'align-center': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l16 0"/><path d="M8 12l8 0"/><path d="M6 18l12 0"/></svg>',
        'align-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l16 0"/><path d="M10 12l10 0"/><path d="M6 18l14 0"/></svg>',
        clean: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 15l4 4m0 -4l-4 4"/><path d="M7 6v-1h11v1"/><path d="M7 19l4 0"/><path d="M13 5l-4 14"/></svg>',
        today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/><path d="M11 15h1v3"/></svg>',
        print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2"/><path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4"/><path d="M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z"/></svg>',
    };

    document.querySelectorAll('#nt-toolbar button.nt-tb-btn[data-label]').forEach((button) => {
        const key =
            button.dataset.icon ||
            Array.from(button.classList)
                .find((className) => className.startsWith('ql-'))
                ?.replace('ql-', '');
        if (!key || !icons[key]) return;
        button.innerHTML = icons[key] + '<span class="nt-tb-label">' + button.dataset.label + '</span>';
    });
}

// 📌 [자동 저장] - 원본(noteOriginalContent)은 갱신하지 않음!
async function autoSaveNote() {
    if (!supabaseClient) return;
    const monthStr = currentNoteMonth || document.getElementById('noteMonthPicker').value;
    const noteContent = window.quill.root.innerHTML;
    if (!monthStr || !noteContent || noteContent === '<p><br></p>') return;

    const statusLabel = document.getElementById('noteSaveStatus');

    try {
        if (currentNoteId) {
            await supabaseClient.from('notes').update({ content: noteContent, saved_at: new Date() }).eq('id', currentNoteId);
        } else {
            const _uid2 = window.currentUser?.username || 'admin';
            const { data } = await supabaseClient.from('notes').insert([{ date: monthStr + '-01', type: 'general', title: '일반 노트', content: noteContent, status: 'saving', user_id: _uid2 }]).select();
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
    if (typeof window.isNoteTabReadonly === 'function' && window.isNoteTabReadonly('general')) {
        if (typeof showToast === 'function') showToast('읽기 전용 상태입니다. 저장할 수 없습니다.', 'warning');
        return;
    }
    clearTimeout(noteAutoSaveTimer); // 대기 중인 자동저장 취소
    await saveNoteToServer(true); // true = 매뉴얼 저장 플래그
}

window.saveNoteToServer = async function(isManual = false) {
    if (!supabaseClient) return;
    const date = currentNoteMonth ? currentNoteMonth + '-01' : document.getElementById('noteMonthPicker').value + '-01';
    const content = window.quill.root.innerHTML;

    if (!date) { showToast('월을 선택해주세요.', 'warning'); return; }
    if (content === "<p><br></p>" || !content) { showToast('내용을 입력해주세요.', 'warning'); return; }

    const saveBtn = document.getElementById('noteHeaderSaveBtn');
    saveBtn.disabled = true;

    try {
        if (currentNoteId) {
            const { error } = await supabaseClient.from('notes').update({ content: content, saved_at: new Date() }).eq('id', currentNoteId);
            if (error) throw error;
        } else {
            const _uid3 = window.currentUser?.username || 'admin';
            const { data, error } = await supabaseClient.from('notes').insert([{ date: date, type: 'general', title: '일반 노트', content: content, status: 'saving', user_id: _uid3 }]).select();
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

    } catch (e) {
        console.error("저장 오류:", e);
        showToast("저장 중 오류가 발생했습니다.", "error");
    } finally {
        saveBtn.disabled = false;
    }
}

// 📌 [취소/롤백] - 자동 저장된 내용까지 모두 날리고 원본으로 복구
window.cancelNoteChanges = async function() {
    if(!confirm("작성 중인 내용을 취소하고, 마지막 저장 상태로 되돌리겠습니까?\n(자동 저장된 내용도 초기화됩니다.)")) return;

    clearTimeout(noteAutoSaveTimer); // 자동저장 타이머 Kill

    // 1. 에디터 내용을 원본으로 롤백
    setQuillContent(window.quill, noteOriginalContent);

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
        }
    } else {
        if(statusLabel) statusLabel.innerHTML = '초기화됨';
    }
}

// 📌 [인쇄 기능] — media.js의 블로그/유튜브 원고 인쇄도 이 함수를 그대로 재사용한다
// (window.print()만 호출하는 범용 함수라 에디터 종류를 가리지 않는다).
window.printNote = function() {
    window.print();
}

// (이하 이미지 핸들러 등 보조 함수는 그대로 유지)
function handleImagePaste(e) {
    if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                e.preventDefault();
                e.stopPropagation();
                const file = items[i].getAsFile();
                uploadFileToSupabase(file);
                return;
            }
        }
    }
}
function handleImageDrop(e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
            e.preventDefault();
            e.stopPropagation();
            // 드롭한 위치의 커서 인덱스 계산
            let dropIndex = null;
            if (document.caretRangeFromPoint) {
                const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                if (range) {
                    const blot = Quill.find(range.startContainer) || Quill.find(range.startContainer.parentNode);
                    if (blot) {
                        const blotIndex = window.quill.getIndex(blot);
                        dropIndex = blotIndex + range.startOffset;
                    }
                }
            }
            uploadFileToSupabase(file, dropIndex);
        }
    }
}
function imageUploadHandler() {
    const input = document.createElement('input'); input.setAttribute('type', 'file'); input.setAttribute('accept', 'image/*'); input.click();
    input.onchange = () => { const file = input.files[0]; if (file) uploadFileToSupabase(file); };
}
async function uploadFileToSupabase(file, dropIndex = null) {
    if (!supabaseClient) return;
    document.getElementById('loader').style.display = 'flex';
    try {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `editor/${fileName}`;
        const { error: uploadError } = await supabaseClient.storage
            .from('images')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabaseClient.storage.from('images').getPublicUrl(filePath);
        // 드롭 위치 > 현재 선택 > 맨 끝 순으로 삽입 위치 결정
        let index = dropIndex;
        if (index === null) {
            const range = window.quill.getSelection();
            index = range ? range.index : window.quill.getLength();
        }
        window.quill.insertEmbed(index, 'image', data.publicUrl, Quill.sources.USER);
        window.quill.setSelection(index + 1, Quill.sources.SILENT);
        showToast('이미지가 삽입되었습니다.', 'success');
    } catch (error) {
        console.error('이미지 업로드 오류:', error);
        showToast('이미지 업로드 실패: ' + (error.message || ''), 'error');
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
}

/* ================= [검색 기능 — 일반 노트 전용] ================= */
let noteSearchTimer = null;

window.searchNotes = function() {
    const query = document.getElementById('noteSearchInput').value.trim();
    const resultsEl = document.getElementById('noteSearchResults');

    clearTimeout(noteSearchTimer);

    // 검색어 없으면 결과창 닫기
    if (!query || query.length < 1) {
        resultsEl.style.display = 'none';
        resultsEl.innerHTML = '';
        return;
    }

    // 150ms 디바운스
    noteSearchTimer = setTimeout(() => doSearchNotes(query), 150);
}

async function doSearchNotes(query) {
    const resultsEl = document.getElementById('noteSearchResults');
    if (!supabaseClient) return;

    // 로딩 표시
    resultsEl.style.display = 'block';
    resultsEl.innerHTML = '<div style="padding:12px 16px; color:#94a3b8; font-size:13px;"><i class="fa-solid fa-spinner fa-spin"></i> 검색 중...</div>';

    try {
        // title + content 전체에서 검색 (ilike = 대소문자 무시), 일반 노트는 본인 것만
        const _uid6 = window.currentUser?.username || 'admin';
        const { data, error } = await supabaseClient
            .from('notes')
            .select('id, type, title, content, date, status, user_id')
            .eq('type', 'general')
            .eq('user_id', _uid6)
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .order('saved_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        if (!data || data.length === 0) {
            resultsEl.innerHTML = '<div style="padding:16px; text-align:center; color:#94a3b8; font-size:13px;">검색 결과가 없습니다.</div>';
            return;
        }

        // HTML 태그 제거 유틸
        function stripHtml(html) {
            const tmp = document.createElement('div');
            tmp.innerHTML = html || '';
            return tmp.textContent || tmp.innerText || '';
        }

        // 검색어 하이라이트 유틸
        function highlight(text, q) {
            if (!text) return '';
            const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return text.replace(new RegExp(escaped, 'gi'), m => `<mark style="background:#fef08a; color:#1e293b; border-radius:2px; padding:0 2px;">${m}</mark>`);
        }

        resultsEl.innerHTML = data.map(item => {
            const plain = stripHtml(item.content);
            // 본문에서 검색어 주변 컨텍스트 추출 (앞뒤 40자)
            const lc = plain.toLowerCase();
            const qi = lc.indexOf(query.toLowerCase());
            let snippet = '';
            if (qi !== -1) {
                const start = Math.max(0, qi - 40);
                const end   = Math.min(plain.length, qi + query.length + 40);
                snippet = (start > 0 ? '…' : '') + plain.slice(start, end) + (end < plain.length ? '…' : '');
            } else {
                snippet = plain.slice(0, 80) + (plain.length > 80 ? '…' : '');
            }

            const titleHl   = highlight(item.title || '(제목 없음)', query);
            const snippetHl = highlight(snippet, query);
            const dateStr   = item.date ? item.date.slice(0, 7) : '';

            return `<div class="note-search-item" onclick="openSearchResult('${item.id}')"
                style="padding:10px 16px; cursor:pointer; border-bottom:1px solid #f1f5f9; transition:background 0.15s;"
                onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <span style="font-size:13px; font-weight:600; color:#1e293b; flex:1;">${titleHl}</span>
                    <span style="font-size:11px; color:#94a3b8; flex-shrink:0;">${dateStr}</span>
                </div>
                ${snippet ? `<div style="font-size:12px; color:#64748b; line-height:1.5; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">${snippetHl}</div>` : ''}
            </div>`;
        }).join('');

        // 결과 수 헤더
        resultsEl.innerHTML =
            `<div style="padding:8px 16px; font-size:11px; font-weight:700; color:#94a3b8; background:#f8fafc; border-bottom:1px solid #f1f5f9;">
                검색 결과 ${data.length}건
            </div>` + resultsEl.innerHTML;

    } catch(e) {
        console.error('노트 검색 실패:', e);
        resultsEl.innerHTML = '<div style="padding:12px 16px; color:#ef4444; font-size:13px;">검색 중 오류가 발생했습니다.</div>';
    }
}

// 검색 결과 클릭 → 해당 월로 피커 이동 후 로드
window.openSearchResult = async function(noteId) {
    // 결과창 닫기
    const resultsEl = document.getElementById('noteSearchResults');
    resultsEl.style.display = 'none';
    document.getElementById('noteSearchInput').value = '';

    try {
        const { data } = await supabaseClient.from('notes').select('date').eq('id', noteId).single();
        if (data && data.date) {
            const monthStr = data.date.slice(0, 7); // YYYY-MM
            document.getElementById('noteMonthPicker').value = monthStr;
            handleNoteMonthChange();
        }
    } catch(e) { console.error(e); }
}

// 검색 인풋 포커스 아웃 시 결과창 닫기 (클릭 이벤트보다 늦게 닫히도록 딜레이)
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('noteSearchInput');
    if (input) {
        input.addEventListener('blur', function() {
            setTimeout(() => {
                const resultsEl = document.getElementById('noteSearchResults');
                if (resultsEl) resultsEl.style.display = 'none';
            }, 200);
        });
        input.addEventListener('focus', function() {
            // 검색어 있으면 다시 검색
            if (this.value.trim().length > 0) searchNotes();
        });
    }
});


/* ================= [🚀 퀵 메모 (Quick Memo) 연동 로직] ================= */
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
            clipboard: {
                matchers: [[Node.ELEMENT_NODE, window.stripHeaderClipboardMatcher]]
            },
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
        const _uid4 = window.currentUser?.username || 'admin';
        const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .eq('date', monthStr + '-01')
            .eq('type', 'general')
            .eq('user_id', _uid4)
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            currentQuickNoteId = data[0].id;
            currentQuickNoteMonth = monthStr;
            // 이번 달 노트 내용을 그대로 표시 (수정 가능)
            setQuillContent(quickQuill, data[0].content || '');
        } else {
            currentQuickNoteId = null;
            currentQuickNoteMonth = monthStr;
            setQuillContent(quickQuill, '');
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
                .insert([{ date: monthStr + '-01', type: 'general', title: '일반 노트', content: quickContent, status: 'saving', user_id: window.currentUser?.username || 'admin' }])
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
