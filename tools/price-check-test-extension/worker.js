importScripts('price-core.js');
let processing = false;
const ALARM = "eg-price-check-next";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function save(state) { await chrome.storage.local.set({priceTest:state}); }
function endpoint(raw, id, kind) {
  const url = new URL(raw, 'https://smartstore.naver.com');
  if (url.origin !== 'https://smartstore.naver.com' || !new RegExp('^/i/v2/channels/[^/]+/'+kind+'/'+id+'$').test(url.pathname)) throw Error('수집 요청 주소가 상품과 일치하지 않습니다.');
  return url.href;
}
async function json(url) {
  const response = await fetch(url, {credentials:'include',signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw Error(`직접 조회 실패 HTTP ${response.status}`);
  return response.json();
}
function optionRows(product, benefit) {
  const base = benefit?.optimalDiscount?.totalDiscountResult?.summary?.totalPayAmount;
  if (base == null || !Number.isFinite(Number(base)) || Number(base) <= 0) throw Error('할인 기준가 확인 불가');
  const combos = product.optionCombinations?.length ? product.optionCombinations : product.combinationOptions?.[0]?.options || product.standardCombinations || [];
  if (!combos.length) return [{label:'(옵션 없음)', finalPrice:Number(base), soldOut:(product.stockQuantity ?? 1) <= 0}];
  return combos.map(c => ({label:[c.optionName1,c.optionName2,c.optionName3].filter(Boolean).join(' / '),optionName1:c.optionName1,optionName2:c.optionName2,optionName3:c.optionName3,finalPrice:Number(base)+Number(c.price || 0),soldOut:(c.stockQuantity ?? 1) <= 0}));
}
async function inspect(item, pricing) {
  const id = String(item.productId);
  if (!/^\d+$/.test(id)) throw Error('상품번호 오류');
  const url=new URL(item.productUrl || 'https://smartstore.naver.com/energuardcompany/products/'+id);
  if(url.origin!=='https://smartstore.naver.com' || !['/energuardcompany/products/'+id,'/hkdy/products/'+id].includes(url.pathname.replace(/\/$/,''))) throw Error('허용되지 않은 상품 주소');
  const tab = await chrome.tabs.create({url:url.href,active:false});
  await chrome.storage.local.set({priceCheckTab:{id:tab.id,url:url.href}});
  try {
    let scan;
    for (let n=0;n<25;n++) {
      await delay(1000);
      try { scan = await chrome.tabs.sendMessage(tab.id,{type:'GET_COMPETITOR_SCAN_DATA'}); } catch {}
      if (scan?.ok && scan.benefitReady && scan.detailUrl && scan.benefitUrl) break;
    }
    if (!scan?.benefitReady) throw Error('페이지 할인 정보 수집 실패 — 로그인·차단 여부 확인 필요');
    // 직접 API 요청은 HTTP 429가 확인되어 사용하지 않는다. 페이지가 이미 받은 응답만 사용.
    endpoint(scan.detailUrl,id,'products'); endpoint(scan.benefitUrl,id,'product-benefits');
    if (!scan.ok || !Array.isArray(scan.rows) || !scan.rows.length || scan.rows.some(r => !Number.isFinite(r.finalPrice) || r.finalPrice <= 0)) throw Error('페이지 판매가 확인 불가');
    const pageUrl=new URL(scan.productUrl);
    if (pageUrl.origin !== url.origin || pageUrl.pathname.replace(/\/$/,'') !== url.pathname.replace(/\/$/,'')) throw Error('수집 상품 주소 불일치');
    const rows=scan.rows;
    return rows.map(row => {
      let resolved;
      if (row.label === '(옵션 없음)') resolved={gradeId:item.mapping.grade_id,thickness:item.mapping.thickness,area:item.mapping.area};
      else if (item.mapping.product_type==='pf' && /_(s|l)$/.test(item.mapping.grade_id || '')) {
        const thickness=extractThicknessMm(row.label);
        resolved=thickness ? {gradeId:item.mapping.grade_id,thickness,area:PF_GRADE_AREA[item.mapping.grade_id]} : null;
      } else resolved=resolveOptionMapping(item.mapping,row);
      const expected = resolved ? getTablePrice({...item.mapping,grade_id:resolved.gradeId,thickness:resolved.thickness,area:resolved.area},pricing) : null;
      const status = row.soldOut ? '품절' : !resolved ? '매핑 필요' : !(expected > 0) ? '단가 확인 불가' : expected === row.finalPrice ? '일치' : '불일치';
      return {productId:id,label:row.label,actual:row.finalPrice,expected,status,source:'페이지 수집',diff:expected > 0 ? row.finalPrice-expected : null};
    });
  } finally { await chrome.tabs.remove(tab.id).catch(()=>{}); await chrome.storage.local.remove('priceCheckTab'); }
}

// One product per alarm; queue and fixed live snapshot survive popup/worker closure.
async function readState(){return (await chrome.storage.local.get('priceTest')).priceTest;}
async function arm(){await chrome.alarms.create(ALARM,{delayInMinutes:0.5});}

function listEligible(item){
  const m=item.mapping||{};
  // ISO single products may contain 1호/특호 choices; keep detailed inspection.
  return m.product_type!=='iso' && m.product_type!=='isopink' && !m.is_bundle && Number(m.thickness)>0 && Number(m.area)>0 && !!m.grade_id && getTablePrice(m,{})!==0;
}
async function readList(url){
  const u=new URL(url);
  if(u.origin!=='https://smartstore.naver.com'||!/^\/(energuardcompany|hkdy)\//.test(u.pathname)||u.pathname.includes('/products/'))throw Error('목록 주소 오류');
  const tab=await chrome.tabs.create({url:u.href,active:false});
  await chrome.storage.local.set({priceCheckTab:{id:tab.id,url:u.href}});
  try{
    for(let n=0;n<15;n++){
      await delay(1000);
      try{const data=await chrome.tabs.sendMessage(tab.id,{type:'EG_PRICE_LIST_PAGE'});if(data?.products?.length)return data;}catch{}
    }
    return {products:[],next:null};
  }finally{await chrome.tabs.remove(tab.id).catch(()=>{});await chrome.storage.local.remove('priceCheckTab');}
}
async function listStep(state){
  const url=state.listQueue.shift();
  if(state.listVisited.includes(url))return;
  state.listVisited.push(url);
  const data=await readList(url);
  const listed=new Map(data.products.map(p=>[String(p.productId),p]));
  const hits=[],remaining=[];
  for(const item of state.items.slice(state.done)){
    const p=listed.get(String(item.productId));
    const expected=getTablePrice(item.mapping,state.pricing);
    // 목록에서 찾은 단품(옵션 없는 제품군)은 대표가 = 실제 판매가이므로 일치든 불일치든
    // 여기서 바로 확정한다(상세페이지 안 들어가 시간 절약 — 테스트 중 불일치가 많아도 빠름).
    // 옵션 붙는 아이소핑크 단품/모음전은 listEligible=false라 이 경로 안 탐. 목록에서
    // 못 찾았거나 이름이 모음전스러우면(remaining) 상세 스캔으로 넘긴다.
    if(p && listEligible(item) && !/모음|선택|종합/.test(p.name||'') && Number.isFinite(p.price)){
      hits.push(item);
      const status=!(expected>0)?'단가 확인 불가':p.price===expected?'일치':'불일치';
      state.rows.push({productId:item.productId,label:(p.name||'단품')+' — 대표가(옵션 미검사)',actual:p.price,expected:expected>0?expected:null,diff:expected>0?p.price-expected:null,status,source:'상품 목록'});
    } else remaining.push(item);
  }
  state.items=[...state.items.slice(0,state.done),...hits,...remaining];state.done+=hits.length;
  state.listMatched=(state.listMatched||0)+hits.length;
  if(data.next && !state.listVisited.includes(data.next) && remaining.some(listEligible)){
    const next=new URL(data.next),prev=new URL(url);
    if(next.origin===prev.origin && next.pathname===prev.pathname && Number(next.searchParams.get('page'))>Number(prev.searchParams.get('page')))state.listQueue.push(next.href);
  }
}
async function processNext(){
  if(processing)return;
  processing=true;
  try {
    let state=await readState();
    if(!state || !state.running)return;
    const orphan=(await chrome.storage.local.get('priceCheckTab')).priceCheckTab;
    if(orphan){const old=await chrome.tabs.get(orphan.id).catch(()=>null);if(old?.url===orphan.url)await chrome.tabs.remove(orphan.id).catch(()=>{});await chrome.storage.local.remove('priceCheckTab');}
    if(!state.listVisited){
      state.listVisited=[];
      const stores=[...new Set(state.items.slice(state.done).filter(listEligible).map(i=>new URL(i.productUrl||'https://smartstore.naver.com/energuardcompany/products/'+i.productId).pathname.split('/')[1]))];
      state.listQueue=stores.map(store=>'https://smartstore.naver.com/'+store+'/category/ALL?st=TOTAL&dt=BIG_IMAGE&page=1&size=80');
    }
    if(state.listQueue.length){
      await arm();
      await listStep(state);
      const latest=await readState();
      if(latest?.runId!==state.runId)return;
      state.running=latest.running;state.reason=latest.reason;state.phase='목록 수집';
      if(state.done>=state.total){state.running=false;state.finishedAt=Date.now();state.reason='완료';}
      await save(state);
      if(state.running){await arm();setTimeout(processNext,3000);}else await chrome.alarms.clear(ALARM);
      return;
    }
    state.phase='옵션 상세 검사';
    const item=state.items[state.done];
    if(!item){state.running=false;state.finishedAt=Date.now();await save(state);return;}
    state.currentProduct=item.productId;await save(state);
    // Watchdog also recovers a worker interrupted during this product.
    await arm();
    let rows,failed=false;
    try{rows=await inspect(item,state.pricing);}catch(error){failed=true;rows=[{productId:item.productId,status:'수집 실패',label:error.message}];}
    const latest=await readState();
    if(latest?.runId!==state.runId)return;
    state=latest;state.rows.push(...rows);state.done++;state.currentProduct=null;state.updatedAt=Date.now();
    if(failed){state.running=false;state.reason='수집 실패로 일시정지';}
    if(state.done>=state.total){state.running=false;state.finishedAt=Date.now();state.reason=failed?'검사 종료 — 수집 실패 포함':'완료';}
    await save(state);
    if(state.running){await arm();setTimeout(processNext,3000);}else await chrome.alarms.clear(ALARM);
  }catch(error){const state=await readState();if(state){state.running=false;state.reason='실행 오류: '+error.message;await save(state);}await chrome.alarms.clear(ALARM);}
  finally{processing=false;}
}
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name===ALARM)processNext();});
chrome.runtime.onStartup.addListener(async()=>{const state=await readState();if(state?.running)await arm();});
// On a fresh worker instance, ensure an interrupted queue has a wake-up.
readState().then(async state=>{if(state?.running && !await chrome.alarms.get(ALARM))await arm();});
let commandBusy=false;
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(message?.type!=='EG_PRICE_TEST')return;
  const host=new URL(sender.url||'https://invalid').hostname;
  if(!['localhost','127.0.0.1','enorangekid.github.io'].includes(host))return;
  (async()=>{
    if(message.action==='ping')return {ok:true,version:'0.29.1'};
    if(message.action==='status'){
      const s=await readState();
      if(!s)return {ok:true,state:null};
      const {items,pricing,...state}=s;
      return {ok:true,state};
    }
    if(commandBusy)throw Error('요청 처리 중입니다. 잠시 후 다시 시도해주세요.');
    commandBusy=true;
    try{
      let state=await readState();
      if(message.action==='pause'){
        if(state){state.running=false;state.reason='사용자 일시정지';await save(state);}await chrome.alarms.clear(ALARM);return {ok:true};
      }
      if(message.action==='resume'){
        if(processing)throw Error('현재 상품 처리가 끝난 뒤 재개해주세요.');
        if(!state || state.done>=state.total)throw Error('재개할 검사가 없습니다.');
        state.running=true;state.reason='';await save(state);await arm();processNext();return {ok:true};
      }
      if(message.action!=='start')throw Error('지원하지 않는 요청');
      if(processing || state?.running)throw Error('검사가 이미 실행 중입니다.');
      const p=message.payload;
      if(!p?.pricing?.id || p.pricing.is_live!==true || !Array.isArray(p.items) || !p.items.length || p.items.some(i=>!/^\d+$/.test(String(i.productId)) || !i.mapping))throw Error('검사 데이터 오류');
      if(new Set(p.items.map(i=>String(i.productId))).size!==p.items.length)throw Error('중복 상품번호');
      state={runId:crypto.randomUUID(),running:true,startedAt:Date.now(),liveId:p.pricing.id,done:0,total:p.items.length,rows:[],items:p.items,pricing:p.pricing};
      await save(state);await arm();processNext();return {ok:true};
    }finally{commandBusy=false;}
  })().then(respond).catch(error=>respond({ok:false,error:error.message}));return true;
});
