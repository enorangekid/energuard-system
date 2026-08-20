/* ================================================================
   js/projects.js  —  업무노트 "프로젝트" 기능
   특정 테마/목적(외국인노동자관리, 환경표지인증절차, 양도양수절차 등)을 언제든 꺼내보고
   수정하는 장기 참고 문서("책"). 프로젝트 하나(projects)는 여러 개의 탭(project_tabs,
   엑셀 시트처럼)으로 구성되고, 각 탭이 독립된 Quill 문서 하나다. 월별 업무노트(notes.js)와는
   완전히 별개의 테이블/에디터 인스턴스를 쓴다.
   의존성: common.js (supabaseClient, showToast), notes.js (setQuillContent 재사용)
   로드 순서: config.js → common.js → notes.js → media.js → projects.js
   ================================================================ */

let projectsCache = [];
let currentProjectId = null;
let currentProjectTitle = '';
let projectTabsCache = [];
let currentProjectTabId = null;
let projectTabOriginalContent = '';
let projectAutoSaveTimer = null;
let currentProjectThumbnailUrl = null;

/* ================= [일반 노트 ↔ 프로젝트 전환] =================
   드롭박스가 업무노트 헤더/프로젝트 헤더 두 곳에 각각 하나씩(같은 제목 옆에 있어야 해서)
   떠 있다 — id 대신 .note-mode-chips 클래스로 여러 인스턴스를 동시에 다룬다(2026-08-14). */
const NOTE_MODE_LABELS = { general: '일반 노트', project: '프로젝트' };
document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('[data-action="toggle-note-mode-menu"]');
    if (toggleBtn) {
        const chips = toggleBtn.closest('.note-mode-chips');
        document.querySelectorAll('.note-mode-chips').forEach((c) => { if (c !== chips) c.classList.remove('open'); });
        chips.classList.toggle('open');
        return;
    }
    const option = e.target.closest('[data-note-mode]');
    if (option) {
        setNoteMode(option.dataset.noteMode);
        document.querySelectorAll('.note-mode-chips').forEach((c) => c.classList.remove('open'));
        return;
    }
    if (!e.target.closest('.note-mode-chips')) {
        document.querySelectorAll('.note-mode-chips').forEach((c) => c.classList.remove('open'));
    }
});

window.setNoteMode = function(mode) {
    document.querySelectorAll('.note-mode-label').forEach((label) => { label.textContent = NOTE_MODE_LABELS[mode] || mode; });
    document.querySelectorAll('.note-mode-chips [data-note-mode]').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.noteMode === mode);
    });
    document.getElementById('noteModeGeneral').style.display = mode === 'general' ? 'flex' : 'none';
    document.getElementById('noteModeProject').style.display = mode === 'project' ? 'flex' : 'none';

    if (mode === 'project') {
        loadProjectsFromServer();
    }
};

/* ================= [프로젝트 목록 (책장)] ================= */
async function loadProjectsFromServer() {
    if (!supabaseClient) return;
    const grid = document.getElementById('projectGrid');
    if (grid) grid.innerHTML = '<div class="proj-grid-empty"><i class="fa-solid fa-spinner fa-spin"></i> 불러오는 중...</div>';

    try {
        const [{ data: projects, error: pErr }, { data: tabs, error: tErr }] = await Promise.all([
            supabaseClient.from('projects').select('id, title, updated_at, thumbnail_url, subtitle, category').order('updated_at', { ascending: false }),
            supabaseClient.from('project_tabs').select('id, project_id, content, sort_order')
        ]);
        if (pErr) throw pErr;
        if (tErr) throw tErr;

        // 카드의 "내용"(요약)은 첫 번째 탭(sort_order 최솟값)의 본문에서 뽑아온다.
        // "소제목"/"말머리"는 이제 subtitle/category 컬럼에 직접 입력받는다(2026-08-14,
        // 예전엔 첫 탭 제목을 재활용했는데 항상 "개요"로 뜨거나 프로젝트 제목과 중복돼서 분리함).
        const tabCountMap = {};
        const firstTabByProject = {};
        (tabs || []).forEach((t) => {
            tabCountMap[t.project_id] = (tabCountMap[t.project_id] || 0) + 1;
            const cur = firstTabByProject[t.project_id];
            if (!cur || t.sort_order < cur.sort_order) firstTabByProject[t.project_id] = t;
        });

        projectsCache = (projects || []).map((p) => {
            const firstTab = firstTabByProject[p.id];
            return {
                ...p,
                tabCount: tabCountMap[p.id] || 0,
                excerptText: firstTab ? stripHtmlToText(firstTab.content) : '아직 작성된 내용이 없습니다.',
            };
        });
        renderProjectGrid();
    } catch (e) {
        console.error('프로젝트 목록 로드 실패:', e);
        if (grid) grid.innerHTML = '<div class="proj-grid-empty">프로젝트 목록을 불러오지 못했습니다.</div>';
    }
}

function stripHtmlToText(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = sanitizeAdminHtml(html || '');
    const text = (tmp.textContent || tmp.innerText || '').trim();
    return text ? (text.length > 90 ? text.slice(0, 90) + '…' : text) : '아직 작성된 내용이 없습니다.';
}

window.renderProjectGrid = function() {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;
    const query = (document.getElementById('projectSearchInput')?.value || '').trim().toLowerCase();
    const list = query ? projectsCache.filter((p) => p.title.toLowerCase().includes(query)) : projectsCache;

    if (list.length === 0) {
        grid.innerHTML = `<div class="proj-grid-empty">${query ? '검색 결과가 없습니다.' : '등록된 프로젝트가 없습니다. "새 프로젝트"로 시작해보세요.'}</div>`;
        return;
    }

    grid.innerHTML = list.map((p) => {
        const d = new Date(p.updated_at);
        const dateStr = `${d.getMonth() + 1}/${d.getDate()} 수정`;
        const categoryColor = PROJECT_CATEGORY_COLORS[p.category] || '#ea580c';
        return `<div class="proj-card" onclick="openProject(${p.id})">
            <button type="button" class="proj-card-del" onclick="event.stopPropagation(); deleteProject(${p.id})" title="프로젝트 삭제">
                <i class="fa-solid fa-trash-can"></i>
            </button>
            <div class="proj-card-thumb">
                ${p.category ? `<span class="proj-card-tag-badge" style="background:${categoryColor};">${escapeHtml(p.category)}</span>` : ''}
                ${safeAdminUrl(p.thumbnail_url) ? `<img src="${escapeAdminHtml(safeAdminUrl(p.thumbnail_url))}" alt="">` : '<i class="fa-solid fa-book"></i>'}
            </div>
            <div class="proj-card-body">
                ${p.subtitle ? `<div class="proj-card-badge">${escapeHtml(p.subtitle)}</div>` : ''}
                <div class="proj-card-title">${escapeHtml(p.title)}</div>
                <div class="proj-card-excerpt">${escapeHtml(p.excerptText)}</div>
                <div class="proj-card-meta">${dateStr} | 탭 ${p.tabCount}개</div>
            </div>
        </div>`;
    }).join('');
};

const PROJECT_CATEGORY_COLORS = {
    '인증·서류': '#3b82f6',
    '인사·노무': '#8b5cf6',
    '거래·계약': '#f59e0b',
    '쇼핑몰 운영': '#10b981',
    '기타': '#64748b',
};

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

window.createNewProject = async function() {
    const title = prompt('새 프로젝트 이름을 입력하세요.\n예: 외국인노동자관리, 환경표지인증절차');
    if (!title || !title.trim()) return;

    try {
        const { data: proj, error: pErr } = await supabaseClient.from('projects')
            .insert([{ title: title.trim() }]).select().single();
        if (pErr) throw pErr;

        const { error: tErr } = await supabaseClient.from('project_tabs')
            .insert([{ project_id: proj.id, title: '개요', content: '', sort_order: 0 }]);
        if (tErr) throw tErr;

        showToast('프로젝트가 생성되었습니다.', 'success');
        await loadProjectsFromServer();
        openProject(proj.id);
    } catch (e) {
        console.error('프로젝트 생성 실패:', e);
        showToast('프로젝트 생성에 실패했습니다.', 'error');
    }
};

window.deleteProject = async function(id) {
    const proj = projectsCache.find((p) => p.id === id);
    if (!confirm(`"${proj ? proj.title : '이 프로젝트'}"를 삭제하시겠습니까?\n안의 모든 탭 내용도 함께 삭제되며 되돌릴 수 없습니다.`)) return;

    try {
        const { error } = await supabaseClient.from('projects').delete().eq('id', id);
        if (error) throw error;
        showToast('프로젝트가 삭제되었습니다.', 'success');
        loadProjectsFromServer();
    } catch (e) {
        console.error('프로젝트 삭제 실패:', e);
        showToast('프로젝트 삭제에 실패했습니다.', 'error');
    }
};

/* ================= [프로젝트 상세 — 탭 스트립 + 에디터] ================= */
window.openProject = async function(id) {
    document.getElementById('loader').style.display = 'flex';
    try {
        const [{ data: proj, error: pErr }, { data: tabs, error: tErr }] = await Promise.all([
            supabaseClient.from('projects').select('*').eq('id', id).single(),
            supabaseClient.from('project_tabs').select('*').eq('project_id', id).order('sort_order', { ascending: true })
        ]);
        if (pErr) throw pErr;
        if (tErr) throw tErr;

        currentProjectId = proj.id;
        currentProjectTitle = proj.title;
        currentProjectThumbnailUrl = proj.thumbnail_url || null;
        projectTabsCache = tabs || [];

        document.getElementById('projectDetailTitle').value = proj.title;
        updateProjectThumbBtnState();
        document.getElementById('projectSubtitleInput').value = proj.subtitle || '';
        syncProjectCategoryChips(proj.category || '');
        document.getElementById('projectListView').style.display = 'none';
        document.getElementById('projectDetailView').style.display = 'flex';
        document.getElementById('projectTabStrip').style.display = 'flex';
        document.getElementById('projectNewFabBtn').style.display = 'none';
        document.getElementById('projectHeaderSaveBtn').style.display = 'flex';

        // Quill을 항상 "보이는 상태"에서 초기화하려고 여기서 부른다(display:none 컨테이너에
        // 초기화하면 레이아웃 계산이 깨질 수 있다) — initProjectQuill()은 멱등이라 반복 호출 안전.
        if (typeof initProjectQuill === 'function') initProjectQuill();

        renderProjectTabStrip();
        if (projectTabsCache.length > 0) {
            selectProjectTab(projectTabsCache[0].id);
        } else {
            currentProjectTabId = null;
            setQuillContent(window.projectQuill, '');
            projectTabOriginalContent = '';
        }
    } catch (e) {
        console.error('프로젝트 열기 실패:', e);
        showToast('프로젝트를 불러오지 못했습니다.', 'error');
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
};

window.backToProjectList = function() {
    document.getElementById('projectDetailView').style.display = 'none';
    document.getElementById('projectListView').style.display = 'flex';
    document.getElementById('projectTabStrip').style.display = 'none';
    document.getElementById('projectNewFabBtn').style.display = 'flex';
    document.getElementById('projectHeaderSaveBtn').style.display = 'none';
    currentProjectId = null;
    currentProjectTabId = null;
    loadProjectsFromServer();
};

// 제목 입력칸에서 포커스가 빠질 때(blur) 바뀐 값이 있으면 바로 이름을 바꾼다
// (블로그 원고 제목칸처럼 별도 저장 버튼 없이 즉시 반영, 2026-08-14).
window.renameCurrentProject = async function(inputEl) {
    if (!currentProjectId) return;
    const newTitle = inputEl.value.trim();
    if (!newTitle) { inputEl.value = currentProjectTitle; return; }
    if (newTitle === currentProjectTitle) return;

    try {
        const { error } = await supabaseClient.from('projects').update({ title: newTitle }).eq('id', currentProjectId);
        if (error) throw error;
        currentProjectTitle = newTitle;
        const cached = projectsCache.find((p) => p.id === currentProjectId);
        if (cached) cached.title = newTitle;
        showToast('프로젝트 이름이 변경되었습니다.', 'success');
    } catch (e) {
        console.error('프로젝트 이름 변경 실패:', e);
        showToast('이름 변경에 실패했습니다.', 'error');
        inputEl.value = currentProjectTitle;
    }
};

// 소제목 — 목록 카드의 부제 배지에 그대로 표시된다(blur 시 저장, 2026-08-14).
window.updateProjectSubtitle = async function(inputEl) {
    if (!currentProjectId) return;
    const subtitle = inputEl.value.trim();
    try {
        const { error } = await supabaseClient.from('projects').update({ subtitle: subtitle || null }).eq('id', currentProjectId);
        if (error) throw error;
        const cached = projectsCache.find((p) => p.id === currentProjectId);
        if (cached) cached.subtitle = subtitle || null;
    } catch (e) {
        console.error('소제목 저장 실패:', e);
        showToast('소제목 저장에 실패했습니다.', 'error');
    }
};

// 말머리(카테고리) — 목록 카드 썸네일 좌상단에 색깔 배지로 표시된다. 업무노트/미디어콘텐츠의
// .store-chips 드롭박스와 같은 패턴(2026-08-14).
const PROJECT_CATEGORY_LABELS = { '': '말머리 없음', '인증·서류': '인증·서류', '인사·노무': '인사·노무', '거래·계약': '거래·계약', '쇼핑몰 운영': '쇼핑몰 운영', '기타': '기타' };
document.addEventListener('click', (e) => {
    const chips = document.getElementById('projectCategoryChips');
    if (!chips) return;
    if (e.target.closest('[data-action="toggle-project-category-menu"]')) {
        chips.classList.toggle('open');
        return;
    }
    const option = e.target.closest('[data-project-category]');
    if (option) {
        const value = option.dataset.projectCategory;
        syncProjectCategoryChips(value);
        chips.classList.remove('open');
        saveProjectCategory(value);
        return;
    }
    if (!e.target.closest('#projectCategoryChips')) chips.classList.remove('open');
});
function syncProjectCategoryChips(value) {
    const label = document.getElementById('projectCategoryLabel');
    if (label) label.textContent = PROJECT_CATEGORY_LABELS[value] || value || '말머리 없음';
    document.querySelectorAll('#projectCategoryChips [data-project-category]').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.projectCategory === value);
    });
}
async function saveProjectCategory(value) {
    if (!currentProjectId) return;
    try {
        const { error } = await supabaseClient.from('projects').update({ category: value || null }).eq('id', currentProjectId);
        if (error) throw error;
        const cached = projectsCache.find((p) => p.id === currentProjectId);
        if (cached) cached.category = value || null;
    } catch (e) {
        console.error('말머리 저장 실패:', e);
        showToast('말머리 저장에 실패했습니다.', 'error');
    }
}

/* ================= [프로젝트 대표 이미지] ================= */
function updateProjectThumbBtnState() {
    const btn = document.getElementById('projectThumbBtn');
    const label = document.getElementById('projectThumbBtnLabel');
    if (!btn || !label) return;
    const hasThumb = !!currentProjectThumbnailUrl;
    btn.classList.toggle('has-thumb', hasThumb);
    label.textContent = hasThumb ? '이미지 저장됨' : '대표 이미지';
}

window.handleProjectThumbnailSelect = async function(inputEl) {
    const file = inputEl.files && inputEl.files[0];
    inputEl.value = ''; // 같은 파일 다시 선택해도 change가 또 발생하게 초기화
    if (!file || !currentProjectId || !supabaseClient) return;

    document.getElementById('loader').style.display = 'flex';
    try {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `project-thumbs/${fileName}`;
        const { error: uploadError } = await supabaseClient.storage
            .from('images')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabaseClient.storage.from('images').getPublicUrl(filePath);

        const { error: updateError } = await supabaseClient.from('projects')
            .update({ thumbnail_url: data.publicUrl }).eq('id', currentProjectId);
        if (updateError) throw updateError;

        currentProjectThumbnailUrl = data.publicUrl;
        updateProjectThumbBtnState();
        const cached = projectsCache.find((p) => p.id === currentProjectId);
        if (cached) cached.thumbnail_url = data.publicUrl;
        showToast('대표 이미지가 저장되었습니다.', 'success');
    } catch (e) {
        console.error('대표 이미지 업로드 실패:', e);
        showToast('대표 이미지 저장에 실패했습니다.', 'error');
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
};

function renderProjectTabStrip() {
    const strip = document.getElementById('projectTabStrip');
    if (!strip) return;
    const chips = projectTabsCache.map((t) => `
        <div class="proj-tab-chip${t.id === currentProjectTabId ? ' active' : ''}" data-tab-id="${t.id}" onclick="selectProjectTab(${t.id})" ondblclick="renameProjectTabPrompt(${t.id})">
            <span class="proj-tab-label">${escapeHtml(t.title)}</span>
            <button type="button" class="proj-tab-del" onclick="event.stopPropagation(); deleteProjectTab(${t.id})" title="탭 삭제">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>
            </button>
        </div>
    `).join('');
    strip.innerHTML = chips + `
        <button type="button" class="proj-tab-add" onclick="createProjectTab()" title="새 탭 추가">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg>
        </button>`;
}

window.selectProjectTab = function(tabId) {
    const tab = projectTabsCache.find((t) => t.id === tabId);
    if (!tab) return;
    currentProjectTabId = tabId;
    setQuillContent(window.projectQuill, tab.content || '');
    projectTabOriginalContent = tab.content || '';
    renderProjectTabStrip();
    const statusLabel = document.getElementById('projectSaveStatus');
    if (statusLabel) statusLabel.innerHTML = '최신 상태';
};

window.createProjectTab = async function() {
    const title = prompt('새 탭 이름을 입력하세요.\n예: 비자 신청 절차, 서류 양식');
    if (!title || !title.trim()) return;

    try {
        const nextOrder = projectTabsCache.length > 0 ? Math.max(...projectTabsCache.map((t) => t.sort_order)) + 1 : 0;
        const { data, error } = await supabaseClient.from('project_tabs')
            .insert([{ project_id: currentProjectId, title: title.trim(), content: '', sort_order: nextOrder }])
            .select().single();
        if (error) throw error;
        projectTabsCache.push(data);
        selectProjectTab(data.id);
    } catch (e) {
        console.error('탭 생성 실패:', e);
        showToast('탭 생성에 실패했습니다.', 'error');
    }
};

window.renameProjectTabPrompt = async function(tabId) {
    const tab = projectTabsCache.find((t) => t.id === tabId);
    if (!tab) return;
    const newTitle = prompt('탭 이름 변경', tab.title);
    if (!newTitle || !newTitle.trim() || newTitle.trim() === tab.title) return;

    try {
        const { error } = await supabaseClient.from('project_tabs').update({ title: newTitle.trim() }).eq('id', tabId);
        if (error) throw error;
        tab.title = newTitle.trim();
        renderProjectTabStrip();
    } catch (e) {
        console.error('탭 이름 변경 실패:', e);
        showToast('탭 이름 변경에 실패했습니다.', 'error');
    }
};

window.deleteProjectTab = async function(tabId) {
    if (!confirm('이 탭을 삭제하시겠습니까? 되돌릴 수 없습니다.')) return;

    try {
        const { error } = await supabaseClient.from('project_tabs').delete().eq('id', tabId);
        if (error) throw error;
        projectTabsCache = projectTabsCache.filter((t) => t.id !== tabId);
        if (currentProjectTabId === tabId) {
            if (projectTabsCache.length > 0) {
                selectProjectTab(projectTabsCache[0].id);
            } else {
                currentProjectTabId = null;
                setQuillContent(window.projectQuill, '');
                projectTabOriginalContent = '';
                renderProjectTabStrip();
            }
        } else {
            renderProjectTabStrip();
        }
    } catch (e) {
        console.error('탭 삭제 실패:', e);
        showToast('탭 삭제에 실패했습니다.', 'error');
    }
};

/* ================= [저장] ================= */
async function autoSaveProjectTab() {
    if (!supabaseClient || !currentProjectTabId) return;
    const content = window.projectQuill.root.innerHTML;
    if (!content || content === '<p><br></p>') return;

    const statusLabel = document.getElementById('projectSaveStatus');
    try {
        const { error } = await supabaseClient.from('project_tabs').update({ content: content, updated_at: new Date() }).eq('id', currentProjectTabId);
        if (error) throw error;
        if (statusLabel) {
            const now = new Date();
            statusLabel.innerHTML = '자동 저장됨 (' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ')';
        }
        const tab = projectTabsCache.find((t) => t.id === currentProjectTabId);
        if (tab) tab.content = content;
    } catch (e) {
        console.error('프로젝트 자동저장 실패:', e);
        if (statusLabel) statusLabel.innerHTML = '자동저장 실패';
    }
}

window.saveProjectTabManual = async function() {
    if (!currentProjectTabId) {
        showToast('저장할 탭이 없습니다. 먼저 탭을 추가해주세요.', 'warning');
        return;
    }
    clearTimeout(projectAutoSaveTimer);

    const saveBtn = document.getElementById('projectHeaderSaveBtn');
    saveBtn.disabled = true;

    const content = window.projectQuill.root.innerHTML;
    try {
        const { error } = await supabaseClient.from('project_tabs').update({ content: content, updated_at: new Date() }).eq('id', currentProjectTabId);
        if (error) throw error;
        projectTabOriginalContent = content;
        const tab = projectTabsCache.find((t) => t.id === currentProjectTabId);
        if (tab) tab.content = content;
        showToast('저장되었습니다.', 'success');
        const statusLabel = document.getElementById('projectSaveStatus');
        if (statusLabel) statusLabel.innerHTML = '저장 완료';
    } catch (e) {
        console.error('프로젝트 저장 실패:', e);
        showToast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
        saveBtn.disabled = false;
    }
};

/* ================= [Quill 에디터 초기화] ================= */
window.initProjectQuill = function() {
    if (window.projectQuill) return;

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
        clipboard: {
            matchers: [[Node.ELEMENT_NODE, window.stripHeaderClipboardMatcher]]
        },
        toolbar: {
            container: '#project-toolbar',
            handlers: {
                'image': projectImageUploadHandler,
                'divider': function() {
                    const range = this.quill.getSelection(true);
                    this.quill.insertText(range.index, '\n', Quill.sources.USER);
                    this.quill.insertEmbed(range.index + 1, 'divider', true, Quill.sources.USER);
                    this.quill.setSelection(range.index + 2, Quill.sources.SILENT);
                },
                'table-insert': function() {
                    const tableBetter = window.projectQuill.getModule('table-better');
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

    window.projectQuill = new Quill('#project-editor', {
        theme: 'snow',
        placeholder: '이 탭의 내용을 자유롭게 정리하세요...',
        modules
    });
    applyProjectToolbarUi();
    requestAnimationFrame(applyProjectToolbarUi);
    initProjectFontSizeSelects();

    window.projectQuill.on('text-change', function(delta, oldDelta, source) {
        if (source === 'user') {
            const statusLabel = document.getElementById('projectSaveStatus');
            if (statusLabel) statusLabel.innerHTML = '작성 중...';

            clearTimeout(projectAutoSaveTimer);
            projectAutoSaveTimer = setTimeout(function() {
                autoSaveProjectTab();
            }, 2000);
        }
    });

    window.projectQuill.root.addEventListener('paste', handleProjectImagePaste, true);
    window.projectQuill.root.addEventListener('dragover', function(e) {
        if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    }, true);
    window.projectQuill.root.addEventListener('drop', handleProjectImageDrop, true);

    document.addEventListener('drop', function(e) {
        if (e.target.closest('#project-editor')) return;
        e.preventDefault();
    }, false);
};

function initProjectFontSizeSelects() {
    const fontLabelMap = { 'pretendard': '프리텐다드', 'gmarket-sans': '지마켓 산스', 'nanum-square': '나눔스퀘어', 'nanum-myeongjo': '나눔명조', 'gowun-dodum': '고운돋움' };
    const sizeLabelMap = { '14px': '14', '15px': '15', '16px': '16', '18px': '18' };

    function setActiveChip(chipsId, value, attr) {
        document.querySelectorAll('#' + chipsId + ' [' + attr + ']').forEach((chip) => {
            chip.classList.toggle('active', chip.getAttribute(attr) === value);
        });
    }
    function applyFont(value) {
        window.projectQuill.format('font', value);
        document.getElementById('pjFontLabel').textContent = fontLabelMap[value] || value;
        setActiveChip('pjFontChips', value, 'data-pj-font');
    }
    function applySize(value) {
        window.projectQuill.format('size', value);
        document.getElementById('pjSizeLabel').textContent = sizeLabelMap[value] || value;
        setActiveChip('pjSizeChips', value, 'data-pj-size');
    }

    document.addEventListener('click', (e) => {
        const fontChips = document.getElementById('pjFontChips');
        const sizeChips = document.getElementById('pjSizeChips');

        if (e.target.closest('[data-action="toggle-pj-font-menu"]')) {
            fontChips?.classList.toggle('open');
            sizeChips?.classList.remove('open');
            return;
        }
        const fontOption = e.target.closest('[data-pj-font]');
        if (fontOption) {
            applyFont(fontOption.dataset.pjFont);
            fontChips?.classList.remove('open');
            return;
        }
        if (fontChips && !e.target.closest('#pjFontChips')) fontChips.classList.remove('open');

        if (e.target.closest('[data-action="toggle-pj-size-menu"]')) {
            sizeChips?.classList.toggle('open');
            fontChips?.classList.remove('open');
            return;
        }
        const sizeOption = e.target.closest('[data-pj-size]');
        if (sizeOption) {
            applySize(sizeOption.dataset.pjSize);
            sizeChips?.classList.remove('open');
            return;
        }
        if (sizeChips && !e.target.closest('#pjSizeChips')) sizeChips.classList.remove('open');
    });

    window.projectQuill.on('selection-change', (range) => {
        if (!range) return;
        const format = window.projectQuill.getFormat(range);
        const fontVal = format.font || 'pretendard';
        const sizeVal = format.size || '15px';
        document.getElementById('pjFontLabel').textContent = fontLabelMap[fontVal] || fontVal;
        setActiveChip('pjFontChips', fontVal, 'data-pj-font');
        document.getElementById('pjSizeLabel').textContent = sizeLabelMap[sizeVal] || sizeVal;
        setActiveChip('pjSizeChips', sizeVal, 'data-pj-size');
    });
}

function applyProjectToolbarUi() {
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
    };

    document.querySelectorAll('#project-toolbar button.nt-tb-btn[data-label]').forEach((button) => {
        const key =
            button.dataset.icon ||
            Array.from(button.classList)
                .find((className) => className.startsWith('ql-'))
                ?.replace('ql-', '');
        if (!key || !icons[key]) return;
        button.innerHTML = icons[key] + '<span class="nt-tb-label">' + button.dataset.label + '</span>';
    });
}

/* ================= [이미지 업로드] ================= */
function handleProjectImagePaste(e) {
    if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                e.preventDefault();
                e.stopPropagation();
                const file = items[i].getAsFile();
                uploadProjectFileToSupabase(file);
                return;
            }
        }
    }
}
function handleProjectImageDrop(e) {
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
                        const blotIndex = window.projectQuill.getIndex(blot);
                        dropIndex = blotIndex + range.startOffset;
                    }
                }
            }
            uploadProjectFileToSupabase(file, dropIndex);
        }
    }
}
function projectImageUploadHandler() {
    const input = document.createElement('input'); input.setAttribute('type', 'file'); input.setAttribute('accept', 'image/*'); input.click();
    input.onchange = () => { const file = input.files[0]; if (file) uploadProjectFileToSupabase(file); };
}
async function uploadProjectFileToSupabase(file, dropIndex = null) {
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
            const range = window.projectQuill.getSelection();
            index = range ? range.index : window.projectQuill.getLength();
        }
        window.projectQuill.insertEmbed(index, 'image', data.publicUrl, Quill.sources.USER);
        window.projectQuill.setSelection(index + 1, Quill.sources.SILENT);
        showToast('이미지가 삽입되었습니다.', 'success');
    } catch (error) {
        console.error('이미지 업로드 오류:', error);
        showToast('이미지 업로드 실패: ' + (error.message || ''), 'error');
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
}
