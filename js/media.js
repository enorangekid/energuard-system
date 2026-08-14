/* ================================================================
   js/media.js  —  미디어 콘텐츠(블로그 원고 / 유튜브 원고) 로직
   업무 노트(js/notes.js)에서 분리됨(2026-08-14) — 업무 노트에 별도의 "프로젝트" 기능을
   추가할 예정이라 일반 노트와 콘텐츠 원고를 서로 다른 페이지로 나눴다.
   의존성: common.js (supabaseClient, showToast, openPanel), notes.js (setQuillContent 재사용)
   로드 순서: config.js → common.js → notes.js → media.js
   ================================================================ */

let currentMediaTab = 'blog';
let currentMediaId = null;
let aiSuggestCache = { blog: '', youtube: '' };
let aiSuggestCacheDraftId = { blog: null, youtube: null };

// 콘텐츠 종류 선택 — 업무노트와 같은 .store-chips 커스텀 드롭박스(2026-08-14).
const MEDIA_TAB_LABELS = { blog: '블로그 원고', youtube: '유튜브 원고' };
document.addEventListener('click', (e) => {
    const chips = document.getElementById('mediaTabChips');
    if (!chips) return;
    if (e.target.closest('[data-action="toggle-media-tab-menu"]')) {
        chips.classList.toggle('open');
        return;
    }
    const option = e.target.closest('[data-media-tab]');
    if (option) {
        setMediaTab(option.dataset.mediaTab);
        chips.classList.remove('open');
        return;
    }
    if (!e.target.closest('#mediaTabChips')) chips.classList.remove('open');
});

// 원고 상태(작성중/업로드됨) 선택 — 이모지 없는 .store-chips 드롭박스. 실제 값은 숨겨진
// #draftStatus(select)가 그대로 들고 있고, 이 UI는 그 값을 읽고 쓰기만 하는 뷰다
// (업무노트 월 선택 달력이 #noteMonthPicker를 숨겨서 쓰는 것과 같은 패턴, 2026-08-14).
const DRAFT_STATUS_LABELS = { saving: '작성중', uploaded: '업로드됨' };
document.addEventListener('click', (e) => {
    const chips = document.getElementById('draftStatusChips');
    if (!chips) return;
    if (e.target.closest('[data-action="toggle-draft-status-menu"]')) {
        chips.classList.toggle('open');
        return;
    }
    const option = e.target.closest('[data-draft-status]');
    if (option) {
        document.getElementById('draftStatus').value = option.dataset.draftStatus;
        syncDraftStatusChips();
        chips.classList.remove('open');
        return;
    }
    if (!e.target.closest('#draftStatusChips')) chips.classList.remove('open');
});
function syncDraftStatusChips() {
    const value = document.getElementById('draftStatus').value;
    const label = document.getElementById('draftStatusLabel');
    if (label) label.textContent = DRAFT_STATUS_LABELS[value] || value;
    document.querySelectorAll('#draftStatusChips [data-draft-status]').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.draftStatus === value);
    });
}

window.setMediaTab = function(tab) {
    currentMediaTab = tab;
    const tabLabel = document.getElementById('mediaTabLabel');
    if (tabLabel) tabLabel.textContent = MEDIA_TAB_LABELS[tab] || tab;
    document.querySelectorAll('#mediaTabChips [data-media-tab]').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.mediaTab === tab);
    });

    const metaArea      = document.getElementById('draftMetadataArea');
    const listContainer = document.getElementById('draftListContainer');
    const editorWrapper = document.getElementById('media-editor-wrapper');
    const titleInput    = document.getElementById('draftTitle');

    metaArea.style.display = 'none';
    listContainer.style.display = 'block';
    editorWrapper.style.display = 'none';
    titleInput.placeholder = tab === 'blog' ? "블로그 원고 제목을 입력하세요" : "유튜브 기획/대본 제목을 입력하세요";

    // 읽기 전용 여부 (common.js의 isNoteTabReadonly 참조)
    const readonly = typeof window.isNoteTabReadonly === 'function' && window.isNoteTabReadonly(tab);

    loadDraftList(tab);

    // 탭을 바꾸면 항상 목록 화면으로 돌아오므로 "새 원고" 플로팅 버튼만 보이고(읽기 전용이면
    // 그것도 숨김), "저장" 플로팅 버튼은 숨긴다 — 저장은 원고 본문에 들어갔을 때만 나온다.
    const newDraftFabBtn = document.getElementById('mediaNewDraftFabBtn');
    const saveBtn = document.getElementById('mediaHeaderSaveBtn');
    const aiBtn = document.getElementById('aiSuggestBtn');
    if (newDraftFabBtn) newDraftFabBtn.style.display = readonly ? 'none' : 'flex';
    if (saveBtn) saveBtn.style.display = 'none';
    if (aiBtn) aiBtn.style.display = 'none';

    // 오늘(서식 툴바) — 읽기 전용이면 숨기기. .nt-toolbar.ql-snow button.nt-tb-btn
    // { display:flex !important; } 규칙 안에 있어서 일반 style.display로는 안 먹는다.
    const todayBtn = document.getElementById('mediaTodayBtn');
    if (todayBtn) todayBtn.style.setProperty('display', readonly ? 'none' : 'flex', 'important');
}

window.backToList = function() {
    document.getElementById('draftMetadataArea').style.display = 'none';
    document.getElementById('media-editor-wrapper').style.display = 'none';
    document.getElementById('draftListContainer').style.display = 'block';
    loadDraftList(currentMediaTab);

    const readonly = typeof window.isNoteTabReadonly === 'function' && window.isNoteTabReadonly(currentMediaTab);
    const newDraftFabBtn = document.getElementById('mediaNewDraftFabBtn');
    const saveBtn = document.getElementById('mediaHeaderSaveBtn');
    const aiBtn = document.getElementById('aiSuggestBtn');
    if (newDraftFabBtn) newDraftFabBtn.style.display = readonly ? 'none' : 'flex';
    if (saveBtn) saveBtn.style.display = 'none';
    if (aiBtn) aiBtn.style.display = 'none';
}

// 📌 오늘 날짜 헤더를 에디터에 삽입
window.insertMediaTodayHeader = function() {
    if (!window.mediaQuill) return;
    const now = new Date();
    const days = ['일','월','화','수','목','금','토'];
    const label = now.getFullYear() + '년 ' + (now.getMonth()+1) + '월 ' + now.getDate() + '일 (' + days[now.getDay()] + ')';
    const range = window.mediaQuill.getSelection(true);
    const index = range ? range.index : window.mediaQuill.getLength();
    if (window.mediaQuill.getLength() > 1) {
        window.mediaQuill.insertText(index, '\n', 'user');
    }
    window.mediaQuill.insertEmbed(index + (window.mediaQuill.getLength() > 1 ? 1 : 0), 'divider', true, 'user');
    const afterHr = index + (window.mediaQuill.getLength() > 1 ? 2 : 1);
    window.mediaQuill.insertText(afterHr, label + '\n', { 'bold': true, 'color': '#4f46e5' }, 'user');
    window.mediaQuill.setSelection(afterHr + label.length + 1, 'silent');
}

// 📌 Quill 에디터 초기화 (Quill 2.x + quill-table-better) — 업무노트 에디터(window.quill)와
// 완전히 별개의 인스턴스. Size/Font whitelist·구분선 Blot·table-better 등록은 Quill 클래스
// 전역에 걸리는 등록이라 notes.js의 initQuill()과 값이 겹쳐도 안전(멱등)하다.
window.initMediaQuill = function() {
    if (window.mediaQuill) return;

    const Size = Quill.import('attributors/style/size');
    Size.whitelist = ['14px', '15px', '16px', '18px'];
    Quill.register(Size, true);

    const Font = Quill.import('formats/font');
    Font.whitelist = ['pretendard', 'gmarket-sans', 'nanum-square', 'nanum-myeongjo', 'gowun-dodum'];
    Quill.register(Font, true);

    if (!Quill.imports['formats/divider']) {
        const BlockEmbed = Quill.import('blots/block/embed');
        class DividerBlot extends BlockEmbed {}
        DividerBlot.blotName = 'divider';
        DividerBlot.tagName  = 'hr';
        Quill.register(DividerBlot);
    }

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
        toolbar: {
            container: '#media-toolbar',
            handlers: {
                'image': mediaImageUploadHandler,
                'divider': function() {
                    const range = this.quill.getSelection(true);
                    this.quill.insertText(range.index, '\n', Quill.sources.USER);
                    this.quill.insertEmbed(range.index + 1, 'divider', true, Quill.sources.USER);
                    this.quill.setSelection(range.index + 2, Quill.sources.SILENT);
                },
                'table-insert': function() {
                    const tableBetter = window.mediaQuill.getModule('table-better');
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

    window.mediaQuill = new Quill('#media-editor', {
        theme: 'snow',
        placeholder: '블로그·유튜브 원고를 자유롭게 작성하세요...',
        modules
    });
    applyMediaToolbarUi();
    requestAnimationFrame(applyMediaToolbarUi);
    initMediaFontSizeSelects();

    window.mediaQuill.on('text-change', function(delta, oldDelta, source) {
        if (source === 'user') {
            const statusLabel = document.getElementById('mediaSaveStatus');
            if (statusLabel) statusLabel.innerHTML = '작성 중...';
        }
    });

    window.mediaQuill.root.addEventListener('paste', handleMediaImagePaste, true);
    window.mediaQuill.root.addEventListener('dragover', function(e) {
        if (e.dataTransfer && e.dataTransfer.types &&
            Array.from(e.dataTransfer.types).includes('Files')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    }, true);
    window.mediaQuill.root.addEventListener('drop', handleMediaImageDrop, true);

    document.addEventListener('drop', function(e) {
        if (e.target.closest('#media-editor')) return;
        e.preventDefault();
    }, false);

    // 최초 진입 시 기본 탭(블로그) 목록 화면을 띄운다 — draftListContainer/draftMetadataArea/
    // media-editor-wrapper 모두 display:none이 아닌 CSS 기본값이라 setMediaTab()을 한 번
    // 호출해 목록 뷰로 정리해줘야 한다. 이 함수는 첫 호출 이후로는 위쪽의
    // `if (window.mediaQuill) return;`에 걸려 다시 실행되지 않는다.
    setMediaTab(currentMediaTab);
}

// ── 글꼴/크기 — 업무노트 에디터와 동일한 .store-select 컴포넌트 패턴 ──
function initMediaFontSizeSelects() {
    const fontLabelMap = { 'pretendard': '프리텐다드', 'gmarket-sans': '지마켓 산스', 'nanum-square': '나눔스퀘어', 'nanum-myeongjo': '나눔명조', 'gowun-dodum': '고운돋움' };
    const sizeLabelMap = { '14px': '14', '15px': '15', '16px': '16', '18px': '18' };

    function setActiveChip(chipsId, value, attr) {
        document.querySelectorAll('#' + chipsId + ' [' + attr + ']').forEach((chip) => {
            chip.classList.toggle('active', chip.getAttribute(attr) === value);
        });
    }
    function applyFont(value) {
        window.mediaQuill.format('font', value);
        document.getElementById('mdFontLabel').textContent = fontLabelMap[value] || value;
        setActiveChip('mdFontChips', value, 'data-md-font');
    }
    function applySize(value) {
        window.mediaQuill.format('size', value);
        document.getElementById('mdSizeLabel').textContent = sizeLabelMap[value] || value;
        setActiveChip('mdSizeChips', value, 'data-md-size');
    }

    document.addEventListener('click', (e) => {
        const fontChips = document.getElementById('mdFontChips');
        const sizeChips = document.getElementById('mdSizeChips');

        if (e.target.closest('[data-action="toggle-md-font-menu"]')) {
            fontChips?.classList.toggle('open');
            sizeChips?.classList.remove('open');
            return;
        }
        const fontOption = e.target.closest('[data-md-font]');
        if (fontOption) {
            applyFont(fontOption.dataset.mdFont);
            fontChips?.classList.remove('open');
            return;
        }
        if (fontChips && !e.target.closest('#mdFontChips')) fontChips.classList.remove('open');

        if (e.target.closest('[data-action="toggle-md-size-menu"]')) {
            sizeChips?.classList.toggle('open');
            fontChips?.classList.remove('open');
            return;
        }
        const sizeOption = e.target.closest('[data-md-size]');
        if (sizeOption) {
            applySize(sizeOption.dataset.mdSize);
            sizeChips?.classList.remove('open');
            return;
        }
        if (sizeChips && !e.target.closest('#mdSizeChips')) sizeChips.classList.remove('open');
    });

    window.mediaQuill.on('selection-change', (range) => {
        if (!range) return;
        const format = window.mediaQuill.getFormat(range);
        const fontVal = format.font || 'pretendard';
        const sizeVal = format.size || '15px';
        document.getElementById('mdFontLabel').textContent = fontLabelMap[fontVal] || fontVal;
        setActiveChip('mdFontChips', fontVal, 'data-md-font');
        document.getElementById('mdSizeLabel').textContent = sizeLabelMap[sizeVal] || sizeVal;
        setActiveChip('mdSizeChips', sizeVal, 'data-md-size');
    });
}

// ── 툴바 버튼 아이콘을 Tabler 아이콘 세트(SVG)로 교체 ──
function applyMediaToolbarUi() {
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
        clean: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 15l4 4m0 -4l-4 4"/><path d="M7 6v-1h11v1"/><path d="M7 19l4 0"/><path d="M13 5l-4 14"/></svg>',
        today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/><path d="M11 15h1v3"/></svg>',
        print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2"/><path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4"/><path d="M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z"/></svg>',
    };

    document.querySelectorAll('#media-toolbar button.nt-tb-btn[data-label]').forEach((button) => {
        const key =
            button.dataset.icon ||
            Array.from(button.classList)
                .find((className) => className.startsWith('ql-'))
                ?.replace('ql-', '');
        if (!key || !icons[key]) return;
        button.innerHTML = icons[key] + '<span class="nt-tb-label">' + button.dataset.label + '</span>';
    });
}

// 📌 [수동 저장]
window.saveMediaManual = async function() {
    if (typeof window.isNoteTabReadonly === 'function' && window.isNoteTabReadonly(currentMediaTab)) {
        if (typeof showToast === 'function') showToast('읽기 전용 탭입니다. 저장할 수 없습니다.', 'warning');
        return;
    }
    await saveMediaToServer(true);
}

window.saveMediaToServer = async function(isManual = false) {
    if (!supabaseClient) return;
    const date = document.getElementById('noteDate').value;
    const title = document.getElementById('draftTitle').value.trim();
    const status = document.getElementById('draftStatus').value;
    const content = window.mediaQuill.root.innerHTML;

    if (!date) { showToast('날짜를 선택해주세요.', 'warning'); return; }
    if (content === "<p><br></p>" || !content) { showToast('내용을 입력해주세요.', 'warning'); return; }

    const saveBtn = document.getElementById('mediaHeaderSaveBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장중...';
    saveBtn.disabled = true;

    try {
        if (currentMediaId) {
            const { error } = await supabaseClient.from('notes').update({ title: title, content: content, status: status, saved_at: new Date() }).eq('id', currentMediaId);
            if (error) throw error;
        } else {
            const insertData = { date: date, type: currentMediaTab, title: title, content: content, status: status };
            const { data, error } = await supabaseClient.from('notes').insert([insertData]).select();
            if (error) throw error;
            if (data && data.length > 0) currentMediaId = data[0].id;
        }

        if(isManual) {
            showToast('저장되었습니다.', 'success');
        }

        const statusLabel = document.getElementById('mediaSaveStatus');
        if(statusLabel) statusLabel.innerHTML = '저장 완료';

        loadDraftList(currentMediaTab);

    } catch (e) {
        console.error("저장 오류:", e);
        showToast("저장 중 오류가 발생했습니다.", "error");
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// (이하 이미지 핸들러 — window.mediaQuill 대상)
function handleMediaImagePaste(e) {
    if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                e.preventDefault();
                e.stopPropagation();
                const file = items[i].getAsFile();
                uploadMediaFileToSupabase(file);
                return;
            }
        }
    }
}
function handleMediaImageDrop(e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
            e.preventDefault();
            e.stopPropagation();
            let dropIndex = null;
            if (document.caretRangeFromPoint) {
                const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                if (range) {
                    const blot = Quill.find(range.startContainer) || Quill.find(range.startContainer.parentNode);
                    if (blot) {
                        const blotIndex = window.mediaQuill.getIndex(blot);
                        dropIndex = blotIndex + range.startOffset;
                    }
                }
            }
            uploadMediaFileToSupabase(file, dropIndex);
        }
    }
}
function mediaImageUploadHandler() {
    const input = document.createElement('input'); input.setAttribute('type', 'file'); input.setAttribute('accept', 'image/*'); input.click();
    input.onchange = () => { const file = input.files[0]; if (file) uploadMediaFileToSupabase(file); };
}
async function uploadMediaFileToSupabase(file, dropIndex = null) {
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
        let index = dropIndex;
        if (index === null) {
            const range = window.mediaQuill.getSelection();
            index = range ? range.index : window.mediaQuill.getLength();
        }
        window.mediaQuill.insertEmbed(index, 'image', data.publicUrl, Quill.sources.USER);
        window.mediaQuill.setSelection(index + 1, Quill.sources.SILENT);
        showToast('이미지가 삽입되었습니다.', 'success');
    } catch (error) {
        console.error('이미지 업로드 오류:', error);
        showToast('이미지 업로드 실패: ' + (error.message || ''), 'error');
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
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
            currentMediaId = data.id; document.getElementById('noteDate').value = data.date;
            document.getElementById('draftTitle').value = data.title || ''; document.getElementById('draftStatus').value = data.status || 'saving';
            syncDraftStatusChips();
            setQuillContent(window.mediaQuill, data.content || '');
            document.getElementById('draftListContainer').style.display = 'none';
            document.getElementById('draftMetadataArea').style.display = 'flex';
            document.getElementById('media-editor-wrapper').style.display = 'flex';
            const newDraftFabBtn = document.getElementById('mediaNewDraftFabBtn');
            if (newDraftFabBtn) newDraftFabBtn.style.display = 'none';

            // 읽기 전용 탭이면 에디터 비활성화 + 저장 버튼 숨기기
            const readonly = typeof window.isNoteTabReadonly === 'function' && window.isNoteTabReadonly(currentMediaTab);
            document.getElementById('aiSuggestBtn').style.display = readonly ? 'none' : 'flex';
            const aiResultEl = document.getElementById('aiSuggestResult');
            const _tab = currentMediaTab;
            const _isYoutube = _tab === 'youtube';
            const _savedAi = !readonly && data.ai_suggestion;
            if (_savedAi) {
                // data.ai_suggestion은 카드 본문(.ai-result-body 안쪽)만 저장돼 있다 — 헤더는
                // 매번 새로 그린다(2026-08-14, 리디자인하면서 본문/헤더 분리). 리디자인 이전에
                // 저장된 기록은 예전 헤더가 그대로 몸통에 섞여 나올 수 있음 — 다시 저장하면 정리됨.
                aiResultEl.innerHTML = buildAiResultHeader(_isYoutube, true) + `<div class="ai-result-body">${_savedAi}</div>`;
                aiResultEl.style.display = 'flex';
                aiSuggestCache[_tab] = _savedAi;
                aiSuggestCacheDraftId[_tab] = noteId;
            } else if (!readonly && noteId == aiSuggestCacheDraftId[_tab] && aiSuggestCache[_tab]) {
                aiResultEl.innerHTML = buildAiResultHeader(_isYoutube, false) + `<div class="ai-result-body">${aiSuggestCache[_tab]}</div>`;
                aiResultEl.style.display = 'flex';
            } else {
                aiSuggestCache[_tab] = '';
                aiSuggestCacheDraftId[_tab] = null;
                aiResultEl.innerHTML = '';
                aiResultEl.style.display = 'none';
            }
            if (window.mediaQuill) window.mediaQuill.enable(!readonly);
            const draftTitle       = document.getElementById('draftTitle');
            const draftStatus      = document.getElementById('draftStatus');
            const draftStatusBtn   = document.querySelector('#draftStatusChips .store-select');
            const saveBtn          = document.getElementById('mediaHeaderSaveBtn');
            if (draftTitle)     draftTitle.readOnly  = readonly;
            if (draftStatus)    draftStatus.disabled = readonly;
            if (draftStatusBtn) draftStatusBtn.disabled = readonly;
            if (saveBtn)        saveBtn.style.display = readonly ? 'none' : 'flex';
            if (readonly) {
                const metaArea = document.getElementById('draftMetadataArea');
                if (metaArea && !metaArea.querySelector('.readonly-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'readonly-badge';
                    badge.style.cssText = 'font-size:11px; font-weight:700; color:#f59e0b; background:#fffbeb; border:1px solid #fcd34d; padding:3px 10px; border-radius:12px; flex-shrink:0;';
                    badge.textContent = '읽기 전용';
                    metaArea.appendChild(badge);
                }
            } else {
                const badge = document.getElementById('draftMetadataArea')?.querySelector('.readonly-badge');
                if (badge) badge.remove();
            }
        }
    } catch (e) { console.error("원고 불러오기 오류:", e); showToast('원고를 불러오지 못했습니다.', 'error'); } finally { document.getElementById('loader').style.display = 'none'; }
}
window.createNewDraft = function() {
    if (typeof window.isNoteTabReadonly === 'function' && window.isNoteTabReadonly(currentMediaTab)) {
        if (typeof showToast === 'function') showToast('읽기 전용 탭입니다. 새 원고를 작성할 수 없습니다.', 'warning');
        return;
    }
    currentMediaId = null; document.getElementById('draftTitle').value = ''; document.getElementById('draftStatus').value = 'saving';
    syncDraftStatusChips();
    setQuillContent(window.mediaQuill, '');
    const todayStr = new Date().toISOString().slice(0, 10);
    document.getElementById('noteDate').value = todayStr;
    document.getElementById('draftListContainer').style.display = 'none'; document.getElementById('draftMetadataArea').style.display = 'flex'; document.getElementById('media-editor-wrapper').style.display = 'flex';
    const newDraftFabBtn = document.getElementById('mediaNewDraftFabBtn');
    const saveBtn = document.getElementById('mediaHeaderSaveBtn');
    const aiBtn = document.getElementById('aiSuggestBtn');
    if (newDraftFabBtn) newDraftFabBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'flex';
    if (aiBtn) aiBtn.style.display = 'flex';
}

/* ================= [검색 기능 — 블로그/유튜브 전용] ================= */
let mediaSearchTimer = null;

window.searchMediaNotes = function() {
    const query = document.getElementById('mediaSearchInput').value.trim();
    const resultsEl = document.getElementById('mediaSearchResults');

    clearTimeout(mediaSearchTimer);

    if (!query || query.length < 1) {
        resultsEl.style.display = 'none';
        resultsEl.innerHTML = '';
        return;
    }

    mediaSearchTimer = setTimeout(() => doSearchMediaNotes(query), 150);
}

async function doSearchMediaNotes(query) {
    const resultsEl = document.getElementById('mediaSearchResults');
    if (!supabaseClient) return;

    resultsEl.style.display = 'block';
    resultsEl.innerHTML = '<div style="padding:12px 16px; color:#94a3b8; font-size:13px;"><i class="fa-solid fa-spinner fa-spin"></i> 검색 중...</div>';

    try {
        const { data, error } = await supabaseClient
            .from('notes')
            .select('id, type, title, content, date, status')
            .in('type', ['blog', 'youtube'])
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .order('saved_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        if (!data || data.length === 0) {
            resultsEl.innerHTML = '<div style="padding:16px; text-align:center; color:#94a3b8; font-size:13px;">검색 결과가 없습니다.</div>';
            return;
        }

        function stripHtml(html) {
            const tmp = document.createElement('div');
            tmp.innerHTML = html || '';
            return tmp.textContent || tmp.innerText || '';
        }

        function highlight(text, q) {
            if (!text) return '';
            const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return text.replace(new RegExp(escaped, 'gi'), m => `<mark style="background:#fef08a; color:#1e293b; border-radius:2px; padding:0 2px;">${m}</mark>`);
        }

        const typeLabel = { blog: '블로그', youtube: '유튜브' };
        const typeColor  = { blog: '#16a34a', youtube: '#dc2626' };

        resultsEl.innerHTML = data.map(item => {
            const plain = stripHtml(item.content);
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
            const label     = typeLabel[item.type] || item.type;
            const color     = typeColor[item.type] || '#64748b';

            return `<div class="note-search-item" onclick="openMediaSearchResult('${item.id}', '${item.type}')"
                style="padding:10px 16px; cursor:pointer; border-bottom:1px solid #f1f5f9; transition:background 0.15s;"
                onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <span style="font-size:10px; font-weight:700; color:${color}; background:${color}18; padding:2px 7px; border-radius:10px;">${label}</span>
                    <span style="font-size:13px; font-weight:600; color:#1e293b; flex:1;">${titleHl}</span>
                    <span style="font-size:11px; color:#94a3b8; flex-shrink:0;">${dateStr}</span>
                </div>
                ${snippet ? `<div style="font-size:12px; color:#64748b; line-height:1.5; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">${snippetHl}</div>` : ''}
            </div>`;
        }).join('');

        resultsEl.innerHTML =
            `<div style="padding:8px 16px; font-size:11px; font-weight:700; color:#94a3b8; background:#f8fafc; border-bottom:1px solid #f1f5f9;">
                검색 결과 ${data.length}건
            </div>` + resultsEl.innerHTML;

    } catch(e) {
        console.error('원고 검색 실패:', e);
        resultsEl.innerHTML = '<div style="padding:12px 16px; color:#ef4444; font-size:13px;">검색 중 오류가 발생했습니다.</div>';
    }
}

window.openMediaSearchResult = async function(noteId, type) {
    const resultsEl = document.getElementById('mediaSearchResults');
    resultsEl.style.display = 'none';
    document.getElementById('mediaSearchInput').value = '';

    setMediaTab(type);
    setTimeout(() => loadDraftContent(noteId), 300);
}

document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('mediaSearchInput');
    if (input) {
        input.addEventListener('blur', function() {
            setTimeout(() => {
                const resultsEl = document.getElementById('mediaSearchResults');
                if (resultsEl) resultsEl.style.display = 'none';
            }, 200);
        });
        input.addEventListener('focus', function() {
            if (this.value.trim().length > 0) searchMediaNotes();
        });
    }
});

/* ================= [✨ AI 추천 기능] ================= */

// 결과 패널의 헤더(제목/저장/삭제 버튼)는 매번 새로 그린다 — DB에는 카드 본문(.ai-result-body
// 안쪽)만 저장해서, 나중에 헤더 디자인이 또 바뀌어도 이미 저장된 결과가 옛날 스타일로
// 굳어있지 않게 한다(2026-08-14, 리디자인하면서 본문/헤더를 분리).
function buildAiResultHeader(isYoutube, alreadySaved) {
    return `<div class="ai-result-header">
        <div class="ai-result-title">
            <span class="ai-result-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
            <span><strong>AI 추천 결과</strong><small>(${isYoutube ? '영상 소스' : '이미지 아이디어'})</small></span>
        </div>
        <div class="ai-result-actions">
            <span class="ai-save-status">${alreadySaved ? '저장됨 ✓' : ''}</span>
            <button type="button" class="ai-result-save-btn" onclick="saveAiSuggestResult()"><i class="fa-solid fa-floppy-disk"></i> 저장</button>
            <button type="button" class="ai-result-del-btn" onclick="clearAiSuggestResult()" title="결과 삭제"><i class="fa-solid fa-trash-can"></i></button>
            <button type="button" class="ai-result-toggle-btn" onclick="toggleAiResultCollapse()" title="접기/펼치기">
                <i class="fa-solid fa-chevron-up"></i>
            </button>
        </div>
    </div>`;
}

// 본문 작성 중에 AI 결과 카드가 아래쪽 영역을 침범해 불편할 때 헤더만 남기고 접는다(2026-08-14).
window.toggleAiResultCollapse = function() {
    const resultEl = document.getElementById('aiSuggestResult');
    if (resultEl) resultEl.classList.toggle('collapsed');
};

// AI 응답 텍스트의 "① 강추/② 차선"과 "🔍 검색어:" 줄을 구분해서 스타일을 입힌다(가독성 개선).
function formatAiSuggestionText(text) {
    return text.split('\n').map((line) => {
        const t = line.trim();
        if (!t) return '';
        if (/^[①②]/.test(t)) return `<div class="ai-pick-line">${t}</div>`;
        if (/^🔍/.test(t)) return `<div class="ai-keyword-line">${t}</div>`;
        return `<div>${t}</div>`;
    }).join('');
}

// ai_suggestion 컬럼에 영구 저장 — 레거시(localStorage)와 달리 기기가 바뀌어도 유지됨.
// 헤더는 저장 대상에서 빼고 카드 본문(.ai-result-body)만 저장한다.
window.saveAiSuggestResult = async function() {
    const resultEl = document.getElementById('aiSuggestResult');
    if (!currentMediaId || !resultEl || resultEl.style.display === 'none') return;
    const bodyEl = resultEl.querySelector('.ai-result-body');
    if (!bodyEl) return;
    try {
        const { error } = await supabaseClient.from('notes').update({ ai_suggestion: bodyEl.innerHTML }).eq('id', currentMediaId);
        if (error) throw error;
        const statusEl = resultEl.querySelector('.ai-save-status');
        if (statusEl) statusEl.textContent = '저장됨 ✓';
        showToast('AI 추천 결과가 저장되었습니다.', 'success');
    } catch (e) {
        console.error('AI 추천 저장 실패:', e);
        showToast('AI 추천 결과 저장에 실패했습니다.', 'error');
    }
}

window.clearAiSuggestResult = async function() {
    if (currentMediaId) {
        try {
            const { error } = await supabaseClient.from('notes').update({ ai_suggestion: null }).eq('id', currentMediaId);
            if (error) throw error;
        } catch (e) {
            console.error('AI 추천 삭제 실패:', e);
        }
    }
    const resultEl = document.getElementById('aiSuggestResult');
    if (resultEl) { resultEl.innerHTML = ''; resultEl.style.display = 'none'; }
    const _tab = currentMediaTab;
    aiSuggestCache[_tab] = '';
    aiSuggestCacheDraftId[_tab] = null;
}

window.runAiSuggest = async function() {
    const btn = document.getElementById('aiSuggestBtn');
    const resultEl = document.getElementById('aiSuggestResult');
    if (!window.mediaQuill) return;

    // 에디터 HTML → 문단 추출
    const html = window.mediaQuill.root.innerHTML;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;

    // HR(구분선) 기준으로 섹션 분리, 없으면 <p> 기준
    const paragraphs = [];
    let current = [];
    tmp.childNodes.forEach(node => {
        if (node.tagName === 'HR') {
            if (current.length) {
                const text = current.map(n => n.textContent || '').join(' ').trim();
                if (text) paragraphs.push(text);
                current = [];
            }
        } else {
            current.push(node);
        }
    });
    if (current.length) {
        const text = current.map(n => n.textContent || '').join(' ').trim();
        if (text) paragraphs.push(text);
    }

    if (!paragraphs.length) {
        showToast('원고 내용이 없습니다.', 'warning');
        return;
    }

    const isYoutube = currentMediaTab === 'youtube';

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    resultEl.style.display = 'none';
    resultEl.innerHTML = '';

    try {
        const prompt = `당신은 ${isYoutube ? '유튜브 영상 제작' : '블로그 포스팅'} 전문 콘텐츠 디렉터입니다.
아래 원고의 각 문단에 어울리는 ${isYoutube ? 'B-roll 영상 소스' : '이미지 소재'}를 추천해주세요.

[출력 형식 — 반드시 준수]
각 문단마다:

[문단 N] 문단 핵심 키워드
${isYoutube
    ? `① 강추 🎬 장면 설명 (구도·피사체·분위기)
   🔍 검색어: footage keyword1, keyword2 (영문)
② 차선 🎬 장면 설명
   🔍 검색어: footage keyword1, keyword2 (영문)`
    : `① 강추 📷 이미지 설명 (구도·색감·분위기·소재)
   🔍 검색어: image keyword1, keyword2 (영문)
② 차선 📷 이미지 설명
   🔍 검색어: image keyword1, keyword2 (영문)`}

[전체 요약] (맨 마지막에 한 번만)
👑 가장 임팩트 있는 ${isYoutube ? '장면' : '이미지'} TOP 3: 문단N-①, 문단N-①, 문단N-① 순으로 우선 확보 권장

[주의사항]
- 검색어는 반드시 영문으로, Pixabay·Pexels·${isYoutube ? 'Storyblocks' : 'Unsplash'}에서 바로 쓸 수 있는 실용적인 단어로
- 추상적 표현 금지, 구체적 피사체와 상황 묘사 필수
- 한국 단열재/건축자재 업체 콘텐츠임을 감안해 현장감 있는 소재 우선 추천
- [주의] 인사말, 도입 설명 없이 [문단 1]부터 바로 시작할 것

---원고---
${paragraphs.map((p, i) => `[문단 ${i+1}]\n${p}`).join('\n\n')}`;

        const res = await fetch(
            `${SUPABASE_URL}/functions/v1/gemini-chat`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ chatHistory: [{ role: 'user', parts: [{ text: prompt }] }] })
            }
        );
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('Gemini 원본 응답:', text);

        if (!text) throw new Error('응답 없음');

        // 결과 파싱 — [문단 N] 번호 기준으로 매핑
        const sectionMatches = [...text.matchAll(/\[문단\s*(\d+)\]([\s\S]*?)(?=\[문단\s*\d+\]|\[전체 요약\]|$)/g)];
        const sectionMap = {};
        sectionMatches.forEach(m => { sectionMap[parseInt(m[1])] = m[2].trim(); });

        const contentHTML = paragraphs.map((p, i) => {
            const suggestion = sectionMap[i + 1] || '-';
            const preview = p.length > 60 ? p.slice(0, 60) + '…' : p;
            return `<div class="ai-suggest-item">
                <div class="ai-suggest-paragraph">문단 ${i+1}: ${preview}</div>
                <div class="ai-suggest-content">${formatAiSuggestionText(suggestion)}</div>
            </div>`;
        }).join('');

        const summaryMatch = text.match(/\[전체 요약\]([\s\S]*?)$/);
        const summaryHTML = summaryMatch
            ? `<div class="ai-suggest-item ai-suggest-summary">
                <div class="ai-suggest-paragraph">👑 전체 요약</div>
                <div class="ai-suggest-content">${formatAiSuggestionText(summaryMatch[1].trim())}</div>
               </div>`
            : '';

        const bodyHTML = contentHTML + summaryHTML;
        resultEl.innerHTML = buildAiResultHeader(isYoutube, false) + `<div class="ai-result-body">${bodyHTML}</div>`;
        resultEl.style.display = 'flex';
        aiSuggestCache[currentMediaTab] = bodyHTML;
        aiSuggestCacheDraftId[currentMediaTab] = currentMediaId;

    } catch(e) {
        console.error('AI 추천 오류:', e);
        showToast('AI 추천 중 오류가 발생했습니다.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
    }
}
