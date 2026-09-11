/* 소수 상품 읽기 전용 검사. 가격 변경/외부 결과 저장 없이 테스트 확장과 통신한다. */
(() => {
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
  window.openPriceCheckTest=function() {
    if(window.currentUser?.role!=='admin')return;
    const existing=document.getElementById('priceCheckTestDialog');
    if(existing){existing.showModal();return;}
    const dialog=document.createElement('dialog');dialog.id='priceCheckTestDialog';
    dialog.style.cssText='width:min(960px,92vw);max-height:85vh;overflow:auto;padding:24px;border:1px solid #cbd5e1;border-radius:12px;color:#1e293b';
    dialog.innerHTML=`<strong>스토어 전체 가격검사</strong><button type="button" style="float:right" data-close>닫기</button>
      <p>등록된 에너가드 스토어 전체 상품 · 실제 적용 단가 기준 · 가격은 변경하지 않습니다.</p>
      <p style="font-size:12px;color:#64748b">통합 확장 0.29.0 이상을 설치한 Chrome에서 실행하세요. 상품 탭에서 수집한 할인·옵션 가격으로 비교합니다. 직접 API 조회는 사용하지 않습니다.</p>
      <label>상품번호 또는 상품 URL (쉼표/줄바꿈 구분, 비우면 등록된 전체 상품)<textarea data-products rows="2" style="display:block;width:100%;margin:8px 0" placeholder="전체 검사 시 비워두세요"></textarea></label>
      <button type="button" class="pricing-margin-edit-btn" data-run>전체 검사 시작</button>
      <button type="button" data-pause>일시정지</button> <button type="button" data-resume>이어서 검사</button> <label><input type="checkbox" data-only checked>확인 필요한 항목만</label> <button type="button" data-export>결과 CSV 저장</button>
      <p data-status role="status">검사 전</p><div data-result></div>`;
    document.body.appendChild(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.showModal();
    let snapshot=null,polling=false;
    const status=dialog.querySelector('[data-status]'),result=dialog.querySelector('[data-result]');
    function render(){
      const state=snapshot;if(!state){status.textContent='검사 이력이 없습니다.';return;}
      const counts={};for(const row of state.rows)counts[row.status]=(counts[row.status]||0)+1;
      status.textContent=`적용 단가 ${state.liveId} · ${state.done}/${state.total}개 상품 · ${state.running?'진행 중':state.reason||'완료'} · ${Object.entries(counts).map(([k,v])=>k+' '+v+'건').join(' / ')}`;
      dialog.querySelector('[data-run]').disabled=busy||state.running;
      dialog.querySelector('[data-resume]').disabled=state.running||state.done>=state.total;
      dialog.querySelector('[data-pause]').disabled=!state.running;
      const rows=state.rows.filter(row=>!dialog.querySelector('[data-only]').checked||!['일치','품절'].includes(row.status));
      const table=document.createElement('table');table.style.cssText='width:100%;font-size:12px;border-collapse:collapse';
      const header=table.insertRow();for(const text of ['상품번호','옵션 / 사유','스토어','단가표','차액','판정','수집 방식']){const th=document.createElement('th');th.textContent=text;header.appendChild(th);}
      for(const row of rows.slice(-500)){const tr=table.insertRow();for(const value of [row.productId,row.label,row.actual,row.expected,row.diff,row.status,row.source]){const td=tr.insertCell();td.textContent=value==null?'—':typeof value==='number'?value.toLocaleString('ko-KR'):String(value);td.style.cssText='padding:8px;border-top:1px solid #e2e8f0';}}
      result.replaceChildren(table);if(rows.length>500){const note=document.createElement('p');note.textContent='화면은 최근 500행만 표시합니다. 전체 결과는 CSV로 저장하세요.';result.appendChild(note);}
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
        status.textContent='확장 연결 확인 중…';const extension=await request('ping');if(!extension.version || String(extension.version)<'0.29.0')throw Error('통합 확장을 0.29.0 이상으로 업데이트·리로드해주세요.');
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
        const selected=ids.length?ids:[...byId.keys()];
        if(selected.some(id=>!byId.has(id)))throw Error('입력한 상품 중 매핑이 없는 상품이 있습니다.');
        await request('start',{pricing:live.data[0],items:selected.map(productId=>({productId,productUrl:productUrls.get(productId)||byId.get(productId).product_url||`https://smartstore.naver.com/energuardcompany/products/${productId}`,mapping:byId.get(productId)}))});
        await refresh();
      } catch(error){status.textContent=error.message || '검사 실패';}
      finally{busy=false;button.disabled=!!snapshot?.running;}
    };
  };
})();
