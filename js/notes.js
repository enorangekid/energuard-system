/* ================================================================
   js/notes.js  —  업무 노트 / 퀵 메모 로직
   의존성: common.js (supabaseClient, showToast, openPanel)
   로드 순서: config.js → common.js → notes.js
   ================================================================ */

/* ================= [Note Logic: Real-time Save & Undo (Updated)] ================= */

let currentNoteTab = 'general';
let currentNoteId = null;
let currentNoteMonth = ''; // 현재 로드된 월 (YYYY-MM)
let noteOriginalContent = ''; // ✅ 롤백(취소) 기준점
let noteAutoSaveTimer = null; // 자동 저장 타이머
let aiSuggestCache = { blog: '', youtube: '' };
let aiSuggestCacheDraftId = { blog: null, youtube: null };

window.setNoteTab = function(tab) {
    currentNoteTab = tab;
    document.querySelectorAll('.tab-btn, .nt-tab').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[onclick*="${tab}"], .nt-tab[onclick*="${tab}"]`);
    if(activeBtn) activeBtn.classList.add('active');

    const metaArea      = document.getElementById('draftMetadataArea');
    const listContainer = document.getElementById('draftListContainer');
    const editorWrapper = document.getElementById('editor-wrapper');
    const titleInput    = document.getElementById('draftTitle');

    // 읽기 전용 여부 (common.js의 isNoteTabReadonly 참조)
    const readonly = typeof window.isNoteTabReadonly === 'function' && window.isNoteTabReadonly(tab);

    if (tab === 'general') {
        if(metaArea) metaArea.style.display = 'none';
        if(listContainer) listContainer.style.display = 'none';
        if(editorWrapper) editorWrapper.style.display = 'flex';
        // general 탭은 항상 쓰기 가능 — 이전 탭에서 비활성화됐을 수 있으므로 복구
        if (window.quill) window.quill.enable(true);
        handleNoteMonthChange();
    } else {
        if(metaArea) metaArea.style.display = 'none';
        if(listContainer) listContainer.style.display = 'block';
        if(editorWrapper) editorWrapper.style.display = 'none';
        if(titleInput) titleInput.placeholder = tab === 'blog' ? "블로그 원고 제목을 입력하세요" : "유튜브 기획/대본 제목을 입력하세요";

        // 읽기 전용 탭 — 새 원고 작성 버튼 숨기기
        const newDraftBtn = document.querySelector('#draftListContainer .list-toolbar');
        if (newDraftBtn) newDraftBtn.style.display = readonly ? 'none' : 'flex';

        loadDraftList(tab);
    }

    // 상단 저장/취소 버튼 — 읽기 전용이면 숨기기
    const saveBtn   = document.querySelector('.note-controls .btn-primary');
    const cancelBtn = document.querySelector('.note-controls .btn-secondary[onclick*="cancel"]');
    const todayBtn  = document.querySelector('.note-controls .btn-secondary[onclick*="insertToday"]');
    if (saveBtn)   saveBtn.style.display   = (readonly && tab !== 'general') ? 'none' : '';
    if (cancelBtn) cancelBtn.style.display = (readonly && tab !== 'general') ? 'none' : '';
    if (todayBtn)  todayBtn.style.display  = (readonly && tab !== 'general') ? 'none' : '';
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
    // ── 폰트 크기 Whitelist 등록 (attributors/style/size로 무조건 덮어씀) ──
    const Size = Quill.import('attributors/style/size');
    Size.whitelist = ['14px', '16px', '18px'];
    Quill.register(Size, true);

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
                    [{ 'size': ['14px', '16px', '18px', false] }], ['bold', 'italic', 'underline', 'strike'],
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
    if (typeof window.isNoteTabReadonly === 'function' && window.isNoteTabReadonly(currentNoteTab)) {
        if (typeof showToast === 'function') showToast('읽기 전용 탭입니다. 저장할 수 없습니다.', 'warning');
        return;
    }
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
            const _uid3 = (currentNoteTab === 'general') ? (window.currentUser?.username || 'admin') : null;
            const insertData = { date: date, type: currentNoteTab, title: title, content: content, status: status };
            if (_uid3) insertData.user_id = _uid3;
            const { data, error } = await supabaseClient.from('notes').insert([insertData]).select();
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
            noteOriginalContent = data.content || '';
            document.getElementById('draftListContainer').style.display = 'none';
            document.getElementById('draftMetadataArea').style.display = 'flex';
            document.getElementById('editor-wrapper').style.display = 'flex';

            // 읽기 전용 탭이면 에디터 비활성화 + 저장 버튼 숨기기
            const readonly = typeof window.isNoteTabReadonly === 'function' && window.isNoteTabReadonly(currentNoteTab);
            document.getElementById('aiSuggestBtn').style.display = readonly ? 'none' : '';
            const aiResultEl = document.getElementById('aiSuggestResult');
            const _tab = currentNoteTab;
            const _savedAi = !readonly && localStorage.getItem('aiSuggest_' + noteId);
            if (_savedAi) {
                aiResultEl.innerHTML = _savedAi;
                aiResultEl.style.display = 'block';
                const statusEl = aiResultEl.querySelector('.ai-save-status');
                if (statusEl) statusEl.textContent = '저장됨 ✓';
                aiSuggestCache[_tab] = _savedAi;
                aiSuggestCacheDraftId[_tab] = noteId;
            } else if (!readonly && noteId == aiSuggestCacheDraftId[_tab] && aiSuggestCache[_tab]) {
                aiResultEl.innerHTML = aiSuggestCache[_tab];
                aiResultEl.style.display = 'block';
            } else {
                aiSuggestCache[_tab] = '';
                aiSuggestCacheDraftId[_tab] = null;
                aiResultEl.innerHTML = '';
                aiResultEl.style.display = 'none';
            }
            if (window.quill) window.quill.enable(!readonly);
            const draftTitle  = document.getElementById('draftTitle');
            const draftStatus = document.getElementById('draftStatus');
            const saveBtn     = document.querySelector('.note-controls .btn-primary');
            if (draftTitle)  draftTitle.readOnly  = readonly;
            if (draftStatus) draftStatus.disabled = readonly;
            if (saveBtn)     saveBtn.style.display = readonly ? 'none' : '';
            if (readonly) {
                // 읽기 전용 배너 표시
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
    if (typeof window.isNoteTabReadonly === 'function' && window.isNoteTabReadonly(currentNoteTab)) {
        if (typeof showToast === 'function') showToast('읽기 전용 탭입니다. 새 원고를 작성할 수 없습니다.', 'warning');
        return;
    }
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

/* ================= [검색 기능] ================= */
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
        // title + content 전체에서 검색 (ilike = 대소문자 무시)
        const _uid6 = window.currentUser?.username || 'admin';
        const { data, error } = await supabaseClient
            .from('notes')
            .select('id, type, title, content, date, status, user_id')
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .order('saved_at', { ascending: false })
            .limit(50);

        // general 노트는 본인 것만, blog/youtube는 공용
        const filteredData = (data || []).filter(r =>
            r.type !== 'general' || r.user_id === _uid6
        ).slice(0, 20);

        if (error) throw error;

        if (!filteredData || filteredData.length === 0) {
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

        // 탭 레이블
        const typeLabel = { general: '일반', blog: '블로그', youtube: '유튜브' };
        const typeColor  = { general: '#4f46e5', blog: '#16a34a', youtube: '#dc2626' };

        resultsEl.innerHTML = filteredData.map(item => {
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
            const label     = typeLabel[item.type] || item.type;
            const color     = typeColor[item.type] || '#64748b';

            return `<div class="note-search-item" onclick="openSearchResult('${item.id}', '${item.type}')"
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

        // 결과 수 헤더
        resultsEl.innerHTML =
            `<div style="padding:8px 16px; font-size:11px; font-weight:700; color:#94a3b8; background:#f8fafc; border-bottom:1px solid #f1f5f9;">
                검색 결과 ${filteredData.length}건
            </div>` + resultsEl.innerHTML;

    } catch(e) {
        console.error('노트 검색 실패:', e);
        resultsEl.innerHTML = '<div style="padding:12px 16px; color:#ef4444; font-size:13px;">검색 중 오류가 발생했습니다.</div>';
    }
}

// 검색 결과 클릭 → 해당 탭으로 이동 후 노트 열기
window.openSearchResult = async function(noteId, type) {
    // 결과창 닫기
    const resultsEl = document.getElementById('noteSearchResults');
    resultsEl.style.display = 'none';
    document.getElementById('noteSearchInput').value = '';

    // 탭 전환
    setNoteTab(type);

    if (type === 'general') {
        // 일반 노트: 해당 월로 피커 이동 후 로드
        try {
            const { data } = await supabaseClient.from('notes').select('date').eq('id', noteId).single();
            if (data && data.date) {
                const monthStr = data.date.slice(0, 7); // YYYY-MM
                document.getElementById('noteMonthPicker').value = monthStr;
                handleNoteMonthChange();
            }
        } catch(e) { console.error(e); }
    } else {
        // 블로그/유튜브: 목록에서 해당 원고 열기
        // loadDraftList 완료 후 클릭 — 약간 딜레이 후 직접 로드
        setTimeout(() => loadDraftContent(noteId), 300);
    }
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
/* ================= [✨ AI 추천 기능] ================= */

// 원고 열릴 때 AI 추천 버튼 표시/숨김 제어 — loadDraftContent 함수 내 data 처리 직후 호출
// loadDraftContent 함수에서 editor-wrapper display:flex 설정 줄 바로 아래에 아래 한 줄 추가:
// document.getElementById('aiSuggestBtn').style.display = readonly ? 'none' : '';
// document.getElementById('aiSuggestResult').style.display = 'none';

window.saveAiSuggestResult = function() {
    const resultEl = document.getElementById('aiSuggestResult');
    if (!currentNoteId || !resultEl || resultEl.style.display === 'none') return;
    localStorage.setItem('aiSuggest_' + currentNoteId, resultEl.innerHTML);
    const statusEl = resultEl.querySelector('.ai-save-status');
    if (statusEl) statusEl.textContent = '저장됨 ✓';
    showToast('AI 추천 결과가 저장되었습니다.', 'success');
}

window.clearAiSuggestResult = function() {
    if (currentNoteId) localStorage.removeItem('aiSuggest_' + currentNoteId);
    const resultEl = document.getElementById('aiSuggestResult');
    if (resultEl) { resultEl.innerHTML = ''; resultEl.style.display = 'none'; }
    const _tab = currentNoteTab;
    aiSuggestCache[_tab] = '';
    aiSuggestCacheDraftId[_tab] = null;
}

window.runAiSuggest = async function() {
    const btn = document.getElementById('aiSuggestBtn');
    const resultEl = document.getElementById('aiSuggestResult');
    if (!window.quill) return;

    // 에디터 HTML → 문단 추출
    const html = window.quill.root.innerHTML;
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

    const isYoutube = currentNoteTab === 'youtube';

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 분석중...';
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
                <div class="ai-suggest-content">${suggestion.replace(/\n/g, '<br>')}</div>
            </div>`;
        }).join('');

        const summaryMatch = text.match(/\[전체 요약\]([\s\S]*?)$/);
        const summaryHTML = summaryMatch
            ? `<div class="ai-suggest-item" style="background:#fefce8;border-color:#fde047;">
                <div class="ai-suggest-paragraph" style="color:#854d0e;">👑 전체 요약</div>
                <div class="ai-suggest-content">${summaryMatch[1].trim().replace(/\n/g, '<br>')}</div>
               </div>`
            : '';

        resultEl.innerHTML =
            `<div class="ai-suggest-save-bar" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin-bottom:12px;gap:8px;">
                <span style="font-size:12px;color:#0369a1;"><i class="fa-solid fa-wand-magic-sparkles"></i> AI 추천 결과 (${isYoutube ? '영상 소스' : '이미지 아이디어'})</span>
                <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
                    <span class="ai-save-status" style="font-size:11px;color:#10b981;font-weight:600;"></span>
                    <button onclick="saveAiSuggestResult()" style="padding:4px 12px;background:#0ea5e9;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600;"><i class="fa-solid fa-floppy-disk"></i> 저장</button>
                    <button onclick="clearAiSuggestResult()" title="결과 삭제" style="padding:4px 9px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;font-size:12px;cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>` + contentHTML + summaryHTML;

        resultEl.style.display = 'block';
        aiSuggestCache[currentNoteTab] = resultEl.innerHTML;
        aiSuggestCacheDraftId[currentNoteTab] = currentNoteId;

    } catch(e) {
        console.error('AI 추천 오류:', e);
        showToast('AI 추천 중 오류가 발생했습니다.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI 추천';
    }
}
