/* 소수 상품 읽기 전용 검사. 가격 변경/외부 결과 저장 없이 테스트 확장과 통신한다. */
(() => {
  // 카테고리별 상품목록 URL — 전체상품(/category/ALL)에서 찾는 대신 이 URL부터 훑는다
  // (상품 수가 적어 더 빠르고 확실함). 사장님이 카테고리별로 직접 주는 값을 채워넣음.
  const CATEGORY_LIST_URL = {
    iso: 'https://smartstore.naver.com/energuardcompany/category/3e62f78f221c422c98cc2d7ac478f93f?st=POPULAR&dt=IMAGE&page=1&size=80',
    bead: 'https://smartstore.naver.com/energuardcompany/category/38f210d3ece044c7a24c0bb59888f4cf?st=POPULAR&dt=IMAGE&page=1&size=80',
    pu: 'https://smartstore.naver.com/energuardcompany/category/27e0203b3cc04dae977af6bc68cd236b?st=POPULAR&dt=IMAGE&page=1&size=80',
    pf: 'https://smartstore.naver.com/energuardcompany/category/7aec947b2ffc4fdbb4d9259f9fd452dd?st=POPULAR&dt=IMAGE&page=1&size=80',
    fr_jun: 'https://smartstore.naver.com/energuardcompany/category/aae6c720b4294fd4b970cd1d4c1fcfe0?st=POPULAR&dt=IMAGE&page=1&size=80',
    fr_bul: 'https://smartstore.naver.com/energuardcompany/category/0b7747111429487e8d7fe05fefe1853b?st=POPULAR&dt=IMAGE&page=1&size=80',
  };
  function mappingMatchesCategory(mapping, category){
    if(category==='all')return true;
    if(category==='fr_jun'||category==='fr_bul')return mapping.product_type==='fr'&&mapping.grade_id===category;
    return mapping.product_type===category;
  }
  function compareExtensionVersions(a,b){
    const left=String(a).split('.').map(Number),right=String(b).split('.').map(Number);
    for(let i=0;i<Math.max(left.length,right.length);i++){const diff=(left[i]||0)-(right[i]||0);if(diff)return diff;}
    return 0;
  }
  let busy=false;
  function request(action,payload) {
    return new Promise((resolve,reject)=>{
      const requestId=crypto.randomUUID();
      const timer=setTimeout(()=>{window.removeEventListener('message',listener);reject(Error('확장 연결이 없습니다. 통합 확장을 업데이트·리로드한 뒤 이 관리자 페이지도 새로고침해주세요.'));},8000);
      function listener(event) {
        if(event.source!==window || event.origin!==location.origin || event.data?.type!=='EG_PRICE_TEST_RESPONSE' || event.data.requestId!==requestId)return;
        clearTimeout(timer);window.removeEventListener('message',listener);
        event.data.result?.ok ? resolve(event.data.result) : reject(Error(event.data.result?.error || '검사 요청 실패'));
      }
      window.addEventListener('message',listener);
      window.postMessage({type:'EG_PRICE_TEST_REQUEST',requestId,action,payload},location.origin);
    });
  }
  function statusBadgeClass(status){
    if(status==='일치'||status==='대표가 일치')return 'good';
    if(status==='품절')return 'neutral';
    if(status==='불일치'||status==='대표가 불일치'||status==='수집 실패')return 'low';
    return 'mid'; // 매핑 필요 / 단가 확인 불가 / 목록 수집 누락 등
  }
  window.openPriceCheckTest=function() {
    if(window.currentUser?.role!=='admin')return;
    const existing=document.getElementById('priceCheckTestDialog');
    if(existing){existing.showModal();return;}
    const dialog=document.createElement('dialog');dialog.id='priceCheckTestDialog';
    dialog.innerHTML=`<div class="pricing-input-modal-header">
        <div class="pim-header-left">
          <span class="pim-title"><i class="fa-solid fa-magnifying-glass-dollar"></i> 스토어 가격검사</span>
          <span class="pim-sub">읽기 전용 · 가격 변경 없음</span>
        </div>
        <button type="button" class="pim-close-btn" data-close><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="pctd-body">
        <div class="pctd-hint"><i class="fa-solid fa-circle-info"></i>
          <span>카테고리별(또는 지정 상품) · 실제 적용 단가 기준으로 비교합니다. 상품 탭에서 수집한 할인·옵션 가격을 쓰며, 직접 API 조회는 사용하지 않습니다.<br>통합 확장 0.29.10 이상을 설치한 Chrome에서 실행하세요.</span>
        </div>
        <div class="pctd-controls">
          <label class="pctd-field">
            <span class="pctd-field-label">카테고리</span>
            <select class="pim-input" data-category>
              <option value="all">전체</option>
              <option value="iso">아이소핑크</option>
              <option value="bead">비드법단열재</option>
              <option value="pu">경질우레탄보드</option>
              <option value="pf">PF보드</option>
              <option value="fr_jun">준불연열반사</option>
              <option value="fr_bul">불연열반사</option>
            </select>
          </label>
          <label class="pctd-field">
            <span class="pctd-field-label">상품번호 또는 URL <em>비우면 카테고리 전체 · 쉼표/줄바꿈 구분</em></span>
            <textarea class="pim-input" data-products rows="2" placeholder="카테고리 검사 시 비워두세요"></textarea>
          </label>
        </div>
        <div class="pctd-actions">
          <button type="button" class="pim-btn-confirm" data-run><i class="fa-solid fa-play"></i> 검사 시작</button>
          <button type="button" class="pim-btn-cancel" data-pause><i class="fa-solid fa-pause"></i> 일시정지</button>
          <button type="button" class="pim-btn-cancel" data-resume><i class="fa-solid fa-forward"></i> 이어서 검사</button>
          <label class="pctd-checkbox"><input type="checkbox" data-only checked> 확인 필요한 항목만</label>
          <button type="button" class="pim-expand-btn" data-export><i class="fa-solid fa-file-csv"></i> CSV 저장</button>
        </div>
        <div class="pctd-status-bar" data-statusbar><span data-status role="status">검사 전</span></div>
        <div class="pctd-summary" data-summary></div>
        <div class="pctd-table-wrap" data-result></div>
      </div>`;
    document.body.appendChild(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.showModal();
    let snapshot=null,polling=false;
    const status=dialog.querySelector('[data-status]'),result=dialog.querySelector('[data-result]');
    const statusBar=dialog.querySelector('[data-statusbar]'),summary=dialog.querySelector('[data-summary]');
    function render(){
      const state=snapshot;
      if(!state){status.textContent='검사 이력이 없습니다.';statusBar.classList.remove('running','error');summary.replaceChildren();return;}
      const counts={};for(const row of state.rows)counts[row.status]=(counts[row.status]||0)+1;
      // 목록 단계가 몇 페이지까지 갔는지 · 연속으로 몇 페이지 못 맞혔는지 보여준다 —
      // 특정 상품군이 목록에서 안 잡히고 계속 상세로 새는 게 페이지네이션이 안 가서인지
      // (페이지 수가 안 늘어남), 3연속 무매칭으로 목록을 포기해서인지 바로 구분하려는
      // 용도(2026-09-11, 심재준불연 상세 스캔 문제 진단 중 추가).
      const listInfo=state.listVisited?.length ? ` · 목록 ${state.listVisited.length}페이지 확인(연속무매칭 ${state.listNoHitStreak||0})` : '';
      status.textContent=`적용 단가 ${state.liveId} · ${state.done}/${state.total}개 상품 · ${state.running?'진행 중':state.reason||'완료'}${listInfo}`;
      statusBar.classList.toggle('running',!!state.running);
      statusBar.classList.toggle('error',!state.running && /실패|오류/.test(state.reason||''));
      summary.replaceChildren(...Object.entries(counts).map(([k,v])=>{
        const badge=document.createElement('span');badge.className='pricing-rate-badge '+statusBadgeClass(k);badge.textContent=k+' '+v+'건';return badge;
      }));
      dialog.querySelector('[data-run]').disabled=busy||state.running;
      dialog.querySelector('[data-resume]').disabled=state.running||state.done>=state.total;
      dialog.querySelector('[data-pause]').disabled=!state.running;
      const rows=state.rows.filter(row=>!dialog.querySelector('[data-only]').checked||!['일치','대표가 일치','품절'].includes(row.status));
      if(!rows.length){result.innerHTML='<p class="pricing-empty-msg"><i class="fa-solid fa-circle-check"></i> 표시할 항목이 없습니다.</p>';return;}
      const table=document.createElement('table');
      const header=table.insertRow();for(const text of ['상품번호','옵션 / 사유','스토어','단가표','차액','판정','수집 방식']){const th=document.createElement('th');th.textContent=text;header.appendChild(th);}
      for(const row of rows.slice(-500)){
        const tr=table.insertRow();
        for(const key of ['productId','label','actual','expected','diff','status','source']){
          const td=tr.insertCell();const value=row[key];
          if(key==='status'){const badge=document.createElement('span');badge.className='pricing-rate-badge '+statusBadgeClass(value);badge.textContent=value;td.appendChild(badge);}
          else{td.textContent=value==null?'—':typeof value==='number'?value.toLocaleString('ko-KR'):String(value);if(typeof value==='number')td.classList.add('pctd-num');}
        }
      }
      result.replaceChildren(table);
      if(rows.length>500){const note=document.createElement('p');note.className='pctd-note';note.textContent='화면은 최근 500행만 표시합니다. 전체 결과는 CSV로 저장하세요.';result.appendChild(note);}
    }
    async function refresh(){if(polling)return;polling=true;try{const r=await request('status');snapshot=r.state;render();}catch(e){status.textContent=e.message;}finally{polling=false;}}
    dialog.querySelector('[data-only]').onchange=render;
    for(const action of ['pause','resume'])dialog.querySelector('[data-'+action+']').onclick=async()=>{try{await request(action);await refresh();}catch(e){status.textContent=e.message;}};
    dialog.querySelector('[data-export]').onclick=()=>{
      if(!snapshot)return;
      const cell=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
      const lines=[['상품번호','옵션/사유','스토어','단가표','차액','판정','수집 방식','적용단가ID'],...snapshot.rows.map(r=>[r.productId,r.label,r.actual,r.expected,r.diff,r.status,r.source,snapshot.liveId])];
      const url=URL.createObjectURL(new Blob(['\ufeff'+lines.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='가격검사-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
    setInterval(()=>{if(dialog.open)refresh();},3000);refresh();
    dialog.querySelector('[data-run]').onclick=async()=>{
      if(busy)return;busy=true;const button=dialog.querySelector('[data-run]'),status=dialog.querySelector('[data-status]'),result=dialog.querySelector('[data-result]');button.disabled=true;result.replaceChildren();
      try {
        status.textContent='확장 연결 확인 중…';const extension=await request('ping');if(!extension.version || compareExtensionVersions(extension.version,'0.29.10')<0)throw Error('통합 확장을 0.29.10 이상으로 업데이트·리로드해주세요.');
        const input=dialog.querySelector('[data-products]').value.trim();
        const tokens=input ? input.split(/[\s,]+/).filter(Boolean) : [];
        const productUrls=new Map();
        const ids=[...new Set(tokens.map(v=>{if(/^\d+$/.test(v))return v;try{const u=new URL(v);if(u.origin==='https://smartstore.naver.com'){const m=u.pathname.match(/^\/(energuardcompany|hkdy)\/products\/(\d+)\/?$/);if(m){productUrls.set(m[2],u.origin+u.pathname);return m[2];}}}catch{}return null;}))];
        if(ids.some(id=>!id))throw Error('에너가드 상품번호 또는 URL을 입력해주세요.');
        const live=await supabaseClient.from('pricing_costs_history').select('*').eq('product_type','all').eq('is_live',true).limit(2);
        if(live.error)throw live.error;if(live.data?.length!==1)throw Error('실제 적용 단가가 정확히 1개 있어야 합니다.');
        const mappingRows=[];
        if(ids.length){
          for(let offset=0;offset<ids.length;offset+=100){const r=await supabaseClient.from('product_mapping').select('*').in('product_id',ids.slice(offset,offset+100));if(r.error)throw r.error;mappingRows.push(...r.data);}
        }else{
          for(let offset=0;;offset+=500){const r=await supabaseClient.from('product_mapping').select('*').order('product_id').range(offset,offset+499);if(r.error)throw r.error;mappingRows.push(...r.data);if(r.data.length<500)break;}
        }
        const mappings={data:mappingRows};
        if(!mappings.data?.length)throw Error('등록된 상품 매핑이 없습니다.');
        const byId=new Map(mappings.data.map(m=>[String(m.product_id),m]));
        const category=dialog.querySelector('[data-category]').value;
        const selected=ids.length?ids:[...byId.keys()].filter(id=>mappingMatchesCategory(byId.get(id),category));
        if(selected.some(id=>!byId.has(id)))throw Error('입력한 상품 중 매핑이 없는 상품이 있습니다.');
        if(!selected.length)throw Error('해당 카테고리에 등록된 상품 매핑이 없습니다.');
        const listUrl=ids.length?null:(CATEGORY_LIST_URL[category]||null);
        await request('start',{pricing:live.data[0],listUrl,items:selected.map(productId=>({productId,productUrl:productUrls.get(productId)||byId.get(productId).product_url||`https://smartstore.naver.com/energuardcompany/products/${productId}`,mapping:byId.get(productId)}))});
        await refresh();
      } catch(error){status.textContent=error.message || '검사 실패';}
      finally{busy=false;button.disabled=!!snapshot?.running;}
    };
  };
})();
