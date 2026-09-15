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

// 두께로 걸러도 후보가 여러 개 남을 수 있다 — 실사용 중 확인된 것만도: PF보드 브랜드
// 내부/외부(lx/kd/im + i|o), 규격 소형/대형(_s/_l, 또는 비드법 준불연 ib_06/ib_09),
// 신품/B급 같은 품질 등급. 셋 다 두께와는 독립된 축이라 gradeId가 뜻하는 축들로 좁혀나간다.
//
// ⚠️ 각 축을 "적용 가능하면 걸러보고, 하나도 안 남으면 그냥 포기하고 이전 상태 유지"
// 식으로 순서대로 적용했더니, 앞선 축(예: 내/외부)이 먼저 1개로 좁혀버리면 뒤 축(예:
// 규격)이 그 1개를 걸러도 될지 검증할 기회가 없어서 조용히 넘어가버리는 버그가 있었다
// (2026-09-16, LX 상품이 "대형"만 팔아서 규격 표기가 아예 없는데도 lxi_s가 lxi_l과
// 똑같이 매칭되던 문제). 그래서 이제 "이 상품 후보들 안에 그 축이 실제로 존재하는지"부터
// 먼저 확인하고, 존재하는 축들만 모아 동시에(AND) 걸러낸다 — 소형(_s)인데 후보 중
// 600x1200 표기가 하나도 없으면(=이 페이지엔 소형이 아예 없음) 억지로 대형에 매칭하지
// 않고 바로 매칭 불가로 처리한다.
function narrowToOne(candidates, gradeId) {
  if (candidates.length <= 1) return candidates[0] || null;
  const text = r => [r.optionName1, r.optionName2, r.optionName3, r.label].filter(Boolean).join(' ');
  const texts = candidates.map(text);
  const isSmallGrade = /_s$/.test(gradeId) || gradeId === 'ib_06';
  const isLargeGrade = /_l$/.test(gradeId) || gradeId === 'ib_09';

  // 규격 소형/대형 — 소형은 판매자 불문 "600x1200" 표기가 같아 그걸로 고정 판별한다.
  // 후보 중 600x1200 표기가 하나도 없으면 이 페이지엔 소형 자체가 없다는 뜻 — 소형을
  // 찾는 중이면 바로 매칭 불가, 대형을 찾는 중이면 규격 축 자체를 적용하지 않는다
  // (판매자마다 대형 표기 치수가 다 달라서 "아니면 전부 대형"이라고 단정할 수 없음).
  const hasSmallOption = texts.some(t => /600\s*[xX*×]\s*1200/.test(t));
  if (isSmallGrade && !hasSmallOption) return null;

  const checks = [];
  // 브랜드 내부/외부 — grade_id가 lx|kd|im + i(내부)|o(외부) + _s|_l 형태고, 후보 중
  // 실제로 "내"/"외" 표기가 존재할 때만(그런 축이 아예 없는 상품에 들이대지 않기 위함).
  const io = String(gradeId || '').match(/^(?:lx|kd|im)(i|o)_/);
  if (io && texts.some(t => /내|외/.test(t))) checks.push(t => (io[1] === 'i' ? /내/ : /외/).test(t));
  if (hasSmallOption) {
    if (isSmallGrade) checks.push(t => /600\s*[xX*×]\s*1200/.test(t));
    else if (isLargeGrade) checks.push(t => !/600\s*[xX*×]\s*1200/.test(t));
  }

  let scoped = candidates.filter((_, i) => checks.every(check => check(texts[i])));
  // 신품/B급처럼 등급과 무관하게 품질이 갈리는 경우 — 열위 표기가 있는 쪽을 제외한다.
  if (scoped.length > 1) {
    const normal = scoped.filter(r => !/B급|비품|리퍼|아울렛|전시|중고|하자|스크래치|흠집|반품|불량/.test(text(r)));
    if (normal.length) scoped = normal;
  }
  return scoped.length === 1 ? scoped[0] : null;
}

// 경쟁사 상품 검사(2026-09-15) — 같은 GET_COMPETITOR_SCAN_DATA 수집을 그대로 쓰되,
// 대상이 우리 매핑이 아니라 admin이 competitor_prices에 직접 기록해둔 (등급,두께)별
// 가격이다. 한 링크(모음전)에 여러 두께가 옵션으로 같이 걸려있을 수 있어 entries가
// 배열이다 — 옵션이 여러 개면 라벨에서 두께를 뽑아 유일하게 매칭될 때만 비교하고,
// 애매하면(0개/2개 이상 매칭) 추측하지 않고 "옵션 자동 매칭 불가"로 넘긴다.
async function inspectCompetitor(link, entries) {
  const url = new URL(link);
  if (url.origin !== 'https://smartstore.naver.com' || !/^\/[^/]+\/products\/\d+\/?$/.test(url.pathname)) throw Error('허용되지 않은 경쟁사 상품 주소');
  const tab = await chrome.tabs.create({url:url.href,active:false});
  await chrome.storage.local.set({priceCheckTab:{id:tab.id,url:url.href}});
  try {
    let scan;
    for (let n=0;n<25;n++) {
      await delay(1000);
      try { scan = await chrome.tabs.sendMessage(tab.id,{type:'GET_COMPETITOR_SCAN_DATA'}); } catch {}
      if (scan?.ok && scan.benefitReady && scan.detailUrl && scan.benefitUrl) break;
    }
    // 할인 없는 상품은 product-benefits 요청 자체가 발생하지 않을 수 있다. 수집기는 이때도
    // 상품 상세 응답의 salePrice로 행을 만들 수 있으므로, 충분히 기다린 뒤 유효한 행이 있으면
    // 그대로 사용한다. benefit 응답을 무조건 요구하면 정상 상품도 수집 실패가 된다.
    if (!scan?.ok || !Array.isArray(scan.rows) || !scan.rows.length) {
      const detail = scan?.error || scan?.reason;
      throw Error(`페이지 판매가 확인 불가${detail ? ` (${detail})` : ''} — 로그인·차단·삭제 여부 확인 필요`);
    }
    const rows = scan.rows;
    return entries.map(entry => {
      let matched = null;
      // rows.length===1(옵션 없음/단일가)이어도, 이 링크에 두께가 여러 개 묶여있으면(entries.length>1
      // — 모음전으로 기록해둔 경우) 그 단일가가 "이 entry의" 가격이라고 단정할 수 없다. 실제로는
      // 페이지가 딱 한 두께짜리 단품인데 나머지 두께들이 같은 링크로 잘못 기록됐을 수도 있어서,
      // 링크가 정말 단품(entries 1개)일 때만 무조건 매칭하고 그 외엔 라벨에서 두께를 뽑아 확인한다
      // (2026-09-15, 비드법 단품 링크가 여러 두께에 재사용돼 전부 "불일치"로 잘못 뜨던 문제 수정).
      if (rows.length === 1 && entries.length === 1) matched = rows[0];
      else {
        const candidates = rows.filter(r => extractThicknessMm(r.label) === entry.thickness);
        matched = narrowToOne(candidates, entry.gradeId);
      }
      if (!matched) return {...entry, actual:null, status:'옵션 자동 매칭 불가', diff:null};
      if (matched.soldOut) return {...entry, actual:null, status:'품절', diff:null};
      if (!Number.isFinite(matched.finalPrice) || matched.finalPrice <= 0) return {...entry, actual:null, status:'가격 확인 불가', diff:null};
      const status = matched.finalPrice === entry.recordedPrice ? '일치' : '불일치';
      return {...entry, actual:matched.finalPrice, status, diff: matched.finalPrice - entry.recordedPrice};
    });
  } finally { await chrome.tabs.remove(tab.id).catch(()=>{}); await chrome.storage.local.remove('priceCheckTab'); }
}

// One product per alarm; queue and fixed live snapshot survive popup/worker closure.
async function readState(){return (await chrome.storage.local.get('priceTest')).priceTest;}
async function arm(){await chrome.alarms.create(ALARM,{delayInMinutes:0.5});}

function listMapping(item){
  const m={...(item.mapping||{})};
  if(['iso','isopink'].includes(m.product_type)||[true,1,'true','1'].includes(m.is_bundle)||!(Number(m.thickness)>0)||!m.grade_id)return null;
  if(m.product_type==='pu'){
    if(!['ic','iiia','iia','id_in','id_out'].includes(m.grade_id))return null;
    m.area=Number(m.area)||2;
  }else if(m.product_type==='pf'){
    // Old single-product mappings may store a brand prefix plus a fixed area.
    if(!PF_GRADE_AREA[m.grade_id]){
      const candidates=Object.keys(PF_GRADE_AREA).filter(id=>id.startsWith(m.grade_id+'_') && Math.abs(PF_GRADE_AREA[id]-Number(m.area))<1e-8);
      if(candidates.length!==1)return null;
      m.grade_id=candidates[0];
    }
    m.area=PF_GRADE_AREA[m.grade_id];
  }else if(!(Number(m.area)>0))return null;
  m.thickness=Number(m.thickness);return m;
}
function listEligible(item){return listMapping(item)!=null;}
async function readList(url){
  const u=new URL(url);u.searchParams.delete('cp');if(!u.searchParams.has('page'))u.searchParams.set('page','1');
  if(u.origin!=='https://smartstore.naver.com'||!/^\/(energuardcompany|hkdy)\//.test(u.pathname)||u.pathname.includes('/products/'))throw Error('목록 주소 오류');
  const tab=await chrome.tabs.create({url:u.href,active:false});
  await chrome.storage.local.set({priceCheckTab:{id:tab.id,url:u.href}});
  try{
    let previousSignature=null;
    for(let n=0;n<15;n++){
      await delay(1000);
      try{const data=await chrome.tabs.sendMessage(tab.id,{type:'EG_PRICE_LIST_PAGE',targetPage:Number(u.searchParams.get('page'))||1});if(data?.currentPage===(Number(u.searchParams.get('page'))||1) && data?.products?.length){const signature=data.products.map(p=>p.productId+':'+p.price).join('|');if(signature===previousSignature)return data;previousSignature=signature;}}catch{}
    }
    return {products:[],next:null};
  }finally{await chrome.tabs.remove(tab.id).catch(()=>{});await chrome.storage.local.remove('priceCheckTab');}
}
function pageParamOf(u){ return 'page'; }
async function listStep(state){
  const url=state.listQueue.shift();
  if(state.listVisited.includes(url))return;
  state.listVisited.push(url);
  const data=await readList(url);
  const listed=new Map(data.products.map(p=>[String(p.productId),p]));
  const hits=[],remaining=[];
  for(const item of state.items.slice(state.done)){
    const p=listed.get(String(item.productId));
    const mapping=listMapping(item);
    const expected=mapping?getTablePrice(mapping,state.pricing):null;
    // 고정 규격·두께 단품은 목록 대표가 검사로 완료한다. 옵션 전체 판정과 구분한다.
    if(p && mapping && Number.isFinite(p.price) && p.price>0){
      hits.push(item);
      const status=!(expected>0)?'단가 확인 불가':p.price===expected?'대표가 일치':'대표가 불일치';
      state.rows.push({productId:item.productId,label:(p.name||'단품')+' — 대표가(옵션 미검사)',actual:p.price,expected:expected>0?expected:null,diff:expected>0?p.price-expected:null,status,source:'상품 목록'});
    } else remaining.push(item);
  }
  state.items=[...state.items.slice(0,state.done),...hits,...remaining];state.done+=hits.length;
  state.listMatched=(state.listMatched||0)+hits.length;
  state.listNoHitStreak = hits.length>0 ? 0 : (state.listNoHitStreak||0)+1;
  if(data.next && remaining.some(listEligible) && !state.listVisited.includes(data.next))state.listQueue.push(data.next);
}
const NEXT_DELAY_MS = 1200; // 2026-09-15: 아이소핑크가 목록 검사를 못 타고 매번 상세 스캔을 도는
// 탓에 유독 느리다는 피드백 — 상품 간 고정 대기를 3초에서 줄였다. 순차 처리(동시 탭 없음)라
// 네이버 요청 빈도 자체는 안 늘어난다(직접 API 조회가 아니라 페이지 로딩 대기라 429와 무관).
async function processNext(){
  if(processing)return;
  processing=true;
  try {
    let state=await readState();
    if(!state || !state.running)return;
    const orphan=(await chrome.storage.local.get('priceCheckTab')).priceCheckTab;
    if(orphan){const old=await chrome.tabs.get(orphan.id).catch(()=>null);if(old?.url===orphan.url)await chrome.tabs.remove(orphan.id).catch(()=>{});await chrome.storage.local.remove('priceCheckTab');}
    if(state.kind!=='competitor' && !state.listVisited){
      state.listVisited=[];
      // 카테고리별 목록 URL을 지정해뒀으면(state.listUrl, pricing-check-test.js의
      // CATEGORY_LIST_URL) 전체상품(/category/ALL)에서 찾는 대신 그 URL부터 시작한다 —
      // 상품 수가 훨씬 적어서 더 빠르고 확실하다(2026-09-11).
      if(state.listUrl){
        const u=new URL(state.listUrl);
        const key=pageParamOf(u);
        if(!u.searchParams.get(key))u.searchParams.set(key,'1');
        state.listQueue=[u.href];
      }else{
        const stores=[...new Set(state.items.slice(state.done).filter(listEligible).map(i=>new URL(i.productUrl||'https://smartstore.naver.com/energuardcompany/products/'+i.productId).pathname.split('/')[1]))];
        state.listQueue=stores.map(store=>'https://smartstore.naver.com/'+store+'/category/ALL?st=TOTAL&dt=BIG_IMAGE&cp=1&size=80');
      }
    }
    if(state.listQueue?.length){
      await arm();
      await listStep(state);
      const latest=await readState();
      if(latest?.runId!==state.runId)return;
      state.running=latest.running;state.reason=latest.reason;state.phase='목록 수집';
      if(state.done>=state.total){state.running=false;state.finishedAt=Date.now();state.reason='완료';}
      await save(state);
      if(state.running){await arm();setTimeout(processNext,NEXT_DELAY_MS);}else await chrome.alarms.clear(ALARM);
      return;
    }
    state.phase = state.kind==='competitor' ? '경쟁사 상품 스캔' : (listEligible(state.items[state.done]||{})?'단품 목록 누락 확인':'옵션별 상세 검사');
    const item=state.items[state.done];
    if(!item){state.running=false;state.finishedAt=Date.now();await save(state);return;}
    state.currentProduct = state.kind==='competitor' ? item.link : item.productId;await save(state);
    // Watchdog also recovers a worker interrupted during this product.
    await arm();
    let rows,failed=false;
    try{
      if (state.kind==='competitor') rows=await inspectCompetitor(item.link,item.entries);
      else rows=listEligible(item)?[{productId:item.productId,status:'목록 수집 누락',label:'단품 매핑 — 목록에서 가격을 찾지 못했습니다.',source:'상품 목록'}]:await inspect(item,state.pricing);
    }catch(error){
      failed=true;
      rows = state.kind==='competitor' ? item.entries.map(e=>({...e,actual:null,diff:null,status:'수집 실패',errorMsg:error.message})) : [{productId:item.productId,status:'수집 실패',label:error.message}];
    }
    const latest=await readState();
    if(latest?.runId!==state.runId)return;
    state=latest;state.rows.push(...rows);state.done++;state.currentProduct=null;state.updatedAt=Date.now();
    if(failed){state.running=false;state.reason='수집 실패로 일시정지';}
    if(state.done>=state.total){state.running=false;state.finishedAt=Date.now();state.reason=failed?'검사 종료 — 수집 실패 포함':'완료';}
    await save(state);
    if(state.running){await arm();setTimeout(processNext,NEXT_DELAY_MS);}else await chrome.alarms.clear(ALARM);
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
    if(message.action==='ping')return {ok:true,version:chrome.runtime.getManifest().version};
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
      if(p?.kind==='competitor'){
        if(!Array.isArray(p.items) || !p.items.length)throw Error('검사할 경쟁사 링크가 없습니다.');
        for(const it of p.items){
          const u=new URL(String(it.link||''));
          if(u.origin!=='https://smartstore.naver.com'||!/^\/[^/]+\/products\/\d+\/?$/.test(u.pathname))throw Error('허용되지 않은 경쟁사 상품 주소');
          if(!Array.isArray(it.entries)||!it.entries.length)throw Error('검사 데이터 오류');
        }
        state={runId:crypto.randomUUID(),kind:'competitor',running:true,startedAt:Date.now(),done:0,total:p.items.length,rows:[],items:p.items};
        await save(state);await arm();processNext();return {ok:true};
      }
      if(!p?.pricing?.id || p.pricing.is_live!==true || !Array.isArray(p.items) || !p.items.length || p.items.some(i=>!/^\d+$/.test(String(i.productId)) || !i.mapping))throw Error('검사 데이터 오류');
      if(new Set(p.items.map(i=>String(i.productId))).size!==p.items.length)throw Error('중복 상품번호');
      let listUrl=null;
      if(p.listUrl){
        const u=new URL(String(p.listUrl));
        if(u.origin!=='https://smartstore.naver.com'||!/^\/(energuardcompany|hkdy)\//.test(u.pathname)||u.pathname.includes('/products/'))throw Error('카테고리 목록 URL이 올바르지 않습니다.');
        listUrl=u.href;
      }
      state={runId:crypto.randomUUID(),kind:'own',running:true,startedAt:Date.now(),liveId:p.pricing.id,done:0,total:p.items.length,rows:[],items:p.items,pricing:p.pricing,listUrl};
      await save(state);await arm();processNext();return {ok:true};
    }finally{commandBusy=false;}
  })().then(respond).catch(error=>respond({ok:false,error:error.message}));return true;
});
