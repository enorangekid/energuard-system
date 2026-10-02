const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');

// 실제 쿠팡 Next.js Flight 형식처럼 self.__next_f.push([1,"id:JSON\n..."]) 안에
// attributeVendorItemMap과 옵션별 quantityBase.price가 들어오는 상황을 검증한다.
const collector=fs.readFileSync(path.join(__dirname,'../coupang-collector.js'),'utf8');
let listener;
const optionMap={attributeVendorItemMap:{
  91272690373:{vendorItemId:91272690373,itemName:'10mm × 3개',soldOut:false,invalid:false,buyableQuantity:99,vendor:{name:'주식회사 에너가드컴퍼니'},quantityBase:[{price:{originPrice:'9,800',couponPrice:'8,820',finalPrice:'8,820',discountRate:'10',priceList:[{title:'쿠팡판매가',price:'9,800'}]}}]},
  91272690376:{vendorItemId:91272690376,itemName:'20mm × 3개',soldOut:true,invalid:false,buyableQuantity:0,quantityBase:[{price:{originPrice:'14,300',finalPrice:'12,870',discountRate:'10'}}]},
}};
const flight='1c:'+JSON.stringify(['$',{atfData:optionMap}])+'\n1d:'+JSON.stringify(['$',{ignored:true}]);
const script={textContent:'self.__next_f.push('+JSON.stringify([1,flight])+')'};
const document={scripts:[script],body:{innerText:'정상 상품'},querySelector:()=>null,querySelectorAll:()=>[]};
const context={URL,location:new URL('https://www.coupang.com/vp/products/6410758339?vendorItemId=91272690373'),document,chrome:{runtime:{onMessage:{addListener:fn=>listener=fn}}}};
vm.createContext(context);vm.runInContext(collector,context);
let result;listener({type:'GET_COUPANG_SCAN_DATA',optionIds:['91272690373','91272690376']},null,value=>result=value);
assert.equal(result.ok,true);assert.equal(result.productId,'6410758339');assert.equal(result.rows.length,2);
const first=result.rows.find(row=>row.optionId==='91272690373');
assert.equal(first.registeredPrice,9800);assert.equal(first.finalPrice,8820);assert.equal(first.discountRate,10);assert.equal(first.sellerName,'주식회사 에너가드컴퍼니');
assert.equal(result.rows.find(row=>row.optionId==='91272690376').soldOut,true);

const core=fs.readFileSync(path.join(__dirname,'../price-core.js'),'utf8');
const worker=fs.readFileSync(path.join(__dirname,'../worker.js'),'utf8').replace("importScripts('price-core.js');",'');
const workerContext={URL,AbortSignal,crypto:require('crypto').webcrypto,setTimeout:fn=>{fn();return 0;},importScripts:()=>{},chrome:{storage:{local:{get:async()=>({}),set:async()=>{},remove:async()=>{}}},tabs:{create:async()=>({id:1}),update:async()=>({id:1}),sendMessage:async()=>result,remove:async()=>{}},alarms:{create:async()=>{},get:async()=>null,clear:async()=>{},onAlarm:{addListener:()=>{}}},runtime:{getManifest:()=>({version:'0.31.11'}),onStartup:{addListener:()=>{}},onMessage:{addListener:()=>{}}}}};
vm.createContext(workerContext);vm.runInContext(core,workerContext);vm.runInContext(worker,workerContext);
const compared=workerContext.matchCoupangOptions('6410758339',result.rows,[
  {optionId:'91272690373',code:'Iso_430_430_10_3',name:'아이소핑크 10T',expected:9800,expectedFinal:8820,expectedDiscount:10},
  {optionId:'91272690376',code:'Iso_430_430_20_3',name:'아이소핑크 20T',expected:14300,expectedFinal:12870,expectedDiscount:10},
]);
assert.equal(compared[0].status,'일치');assert.equal(compared[0].diff,0);assert.equal(compared[0].actualFinal,8820);
assert.equal(compared[1].status,'품절');
const discountMismatch=workerContext.matchCoupangOptions('1',[{optionId:'2',registeredPrice:9800,finalPrice:9000,discountRate:8,soldOut:false}],[{optionId:'2',expected:9800,expectedFinal:8820}]);
assert.equal(discountMismatch[0].status,'할인가 불일치');
const winnerMismatch=workerContext.matchCoupangOptions('1213202111',[{optionId:'94167949231',registeredPrice:39900,finalPrice:33800,discountRate:15,soldOut:false}],[{optionId:'94167949231',code:'WP_P1_5_10_C',expected:33900,expectedFinal:33900,winner:true}]);
assert.equal(winnerMismatch[0].status,'불일치');assert.equal(winnerMismatch[0].actual,33800);assert.equal(winnerMismatch[0].diff,-100);assert.match(winnerMismatch[0].source,/위너 실제 판매가 기준/);
// 페이지 데이터에 없는 기본 선택 옵션은 화면 가격으로 읽는다 — 가격 영역 글자의 숫자를 이어 붙이지 않고 "숫자원" 단위로 읽고, 다른 영역의 취소선은 등록가로 쓰지 않는다(실제 화면 글자, 2026-10-02)
{
  const make=(id,optionId,priceText)=>{
    const ctx={URL,location:new URL(`https://www.coupang.com/vp/products/${id}?vendorItemId=${optionId}`),document:{scripts:[],body:{innerText:'정상 상품'},
      querySelector:selector=>/price-container/.test(selector)?{textContent:priceText}:/del|\bs\b/.test(selector)?{textContent:'100,000'}:null,querySelectorAll:()=>[]},chrome:{runtime:{onMessage:{addListener:fn=>ctx.listener=fn}}}};
    vm.createContext(ctx);vm.runInContext(collector,ctx);
    let out;ctx.listener({type:'GET_COUPANG_SCAN_DATA',optionIds:[optionId]},null,v=>out=v);return out;
  };
  const a=make('5830333163','91463660435','12%56,140원(1개당 5,614원)63,800원7,660원할인').rows[0];
  assert.equal(a.finalPrice,56140);assert.equal(a.registeredPrice,63800);assert.equal(a.discountRate,12);
  const b=make('5994531539','91273973750','46,450원(1개당 9,290원)51,620원5,170원할인').rows[0];
  assert.equal(b.finalPrice,46450);assert.equal(b.registeredPrice,51620);
  const noDiscount=make('1','2','5,000원(1개당 1,000원)').rows[0];
  assert.equal(noDiscount.finalPrice,5000);assert.equal(noDiscount.registeredPrice,5000);
  // 등록가를 못 읽은 화면 읽기 옵션은 할인가로만 비교한다
  const unknown=workerContext.matchCoupangOptions('1',[{optionId:'2',registeredPrice:null,finalPrice:56140,discountRate:0,soldOut:false,fallback:true}],[{optionId:'2',expected:63800,expectedFinal:56140}]);
  assert.equal(unknown[0].status,'일치');assert.match(unknown[0].source,/등록가는 읽지 못함/);
  const unknownBad=workerContext.matchCoupangOptions('1',[{optionId:'2',registeredPrice:null,finalPrice:50000,discountRate:0,soldOut:false,fallback:true}],[{optionId:'2',expected:63800,expectedFinal:56140}]);
  assert.equal(unknownBad[0].status,'할인가 불일치');
}
// 쿠팡 접근 제한 화면(사용권한이 없습니다)은 차단으로 인식해 바로 멈춘다
{
  const ctx2={URL,location:new URL('https://www.coupang.com/vp/products/8581386325?vendorItemId=500'),document:{scripts:[],body:{innerText:'요청하신 페이지의 사용권한이 없습니다.'},querySelector:()=>null,querySelectorAll:()=>[]},chrome:{runtime:{onMessage:{addListener:fn=>ctx2.listener=fn}}}};
  vm.createContext(ctx2);vm.runInContext(collector,ctx2);
  let r4;ctx2.listener({type:'GET_COUPANG_SCAN_DATA',optionIds:['500']},null,v=>r4=v);
  assert.equal(r4.blocked,true);
}
// 성인 인증(본인인증 19) 화면은 차단이 아니라 adult로 알린다
{
  const ctx3={URL,location:new URL('https://www.coupang.com/vp/products/8477013920?vendorItemId=91295815796'),document:{scripts:[],body:{innerText:'본인인증\n회원님, 본 상품은 연령확인이 필요합니다.\n휴대폰 번호로 인증하기\n19세 미만 쿠팡홈으로'},querySelector:()=>null,querySelectorAll:()=>[]},chrome:{runtime:{onMessage:{addListener:fn=>ctx3.listener=fn}}}};
  vm.createContext(ctx3);vm.runInContext(collector,ctx3);
  let r5;ctx3.listener({type:'GET_COUPANG_SCAN_DATA',optionIds:['91295815796']},null,v=>r5=v);
  assert.equal(r5.adult,true);assert.equal(r5.blocked,undefined);assert.equal(r5.productId,'8477013920');
}
(async()=>{
  // 성인 인증 상품: 실패 없이 옵션마다 '성인인증 필요' 행을 돌려준다
  workerContext.chrome.tabs.create=async()=>({id:3});
  workerContext.chrome.tabs.sendMessage=async()=>({ok:false,adult:true,productId:'8477013920'});
  const adult=await workerContext.inspectCoupang({productId:'8477013920',productUrl:'https://www.coupang.com/vp/products/8477013920?vendorItemId=91295815796',options:[{optionId:'91295815796',code:'T_GUN_PRO',name:'타이거폼건(전문가용)',expected:30000}]});
  assert.equal(adult.length,1);assert.equal(adult[0].status,'성인인증 필요');assert.equal(adult[0].optionId,'91295815796');assert.equal(adult[0].expected,30000);
  // 인증 화면이 다른 주소로 넘어가 수집기가 응답하지 않아도 주소로 구분한다
  // 실제 성인 인증 주소(login.coupang.com/login/adult.pang)로 넘어가 수집기가 응답하지 않아도 주소로 구분한다 — 이동한 주소를 함께 표시
  workerContext.chrome.tabs.sendMessage=async()=>{throw Error('no receiver');};
  workerContext.chrome.tabs.get=async()=>({url:'https://login.coupang.com/login/adult.pang?rtnUrl=x'});
  const adult2=await workerContext.inspectCoupang({productId:'8477013920',options:[{optionId:'91295815796',code:'T_GUN_PRO',name:'x',expected:1}]});
  assert.equal(adult2[0].status,'성인인증 필요');assert.match(adult2[0].source,/login\.coupang\.com\/login\/adult\.pang/);
  // 그냥 로그인 화면이면 로그인이 풀린 것이라 검사를 멈춘다
  workerContext.chrome.tabs.get=async()=>({url:'https://login.coupang.com/login/login.pang'});
  await assert.rejects(()=>workerContext.inspectCoupang({productId:'8477013920',options:[{optionId:'91295815796',code:'x',expected:1}]}),/로그인이 필요합니다/);
  // 그 밖의 실패는 현재 주소를 알려 준다
  workerContext.chrome.tabs.get=async()=>({url:'https://www.coupang.com/np/search'});
  await assert.rejects(()=>workerContext.inspectCoupang({productId:'8477013920',options:[{optionId:'91295815796',code:'x',expected:1}]}),/현재 주소 www\.coupang\.com\/np\/search/);
  workerContext.chrome.tabs.create=async()=>({id:2});workerContext.chrome.tabs.get=async()=>({});
  let currentUrl='',updates=0;
  workerContext.chrome.tabs.create=async({url})=>{currentUrl=url;return {id:2};};
  workerContext.chrome.tabs.update=async(_id,{url})=>{currentUrl=url;updates++;return {id:2};};
  workerContext.chrome.tabs.sendMessage=async()=>currentUrl.includes('91272690376')
    ? {ok:true,productId:'6410758339',rows:[result.rows.find(row=>row.optionId==='91272690376')]}
    : {ok:true,productId:'6410758339',rows:[result.rows.find(row=>row.optionId==='91272690373')]};
  const fallback=await workerContext.inspectCoupang({
    productId:'6410758339',productUrl:'https://www.coupang.com/vp/products/6410758339?vendorItemId=91272690373',
    options:[
      {optionId:'91272690373',code:'A',expected:9800,expectedFinal:8820},
      {optionId:'91272690376',code:'B',expected:14300,expectedFinal:12870},
    ],
  });
  assert.equal(updates,1);assert.equal(fallback.length,2);assert.equal(fallback.some(row=>row.status==='스토어에 없음'),false);
  console.log('PASS Coupang collector + vendorItemId registered/final price matching + missing-option fallback');
})().catch(error=>{console.error(error);process.exitCode=1;});
