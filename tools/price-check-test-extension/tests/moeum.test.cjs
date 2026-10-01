const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');

// 1) 수집기 — 옵션 항목 제목(optionGroupNames)과 관리코드를 응답에 싣는다
const collectorSource=fs.readFileSync(path.join(__dirname,'../collector.js'),'utf8');
function collectorFor(productData,scripts=[]){
  let networkListener,messageListener;
  const window={addEventListener:(type,fn)=>{if(type==='message')networkListener=fn;}};
  const context={window,location:{href:'https://smartstore.naver.com/hkdy/products/2229818356'},document:{title:'모음전',scripts:scripts.map(textContent=>({textContent}))},console,setInterval:()=>0,chrome:{runtime:{onMessage:{addListener:fn=>{messageListener=fn;}}}}};
  vm.createContext(context);vm.runInContext(collectorSource,context);
  networkListener({source:window,data:{source:'energuard-smartstore-network',url:'https://smartstore.naver.com/i/v2/channels/c/products/2229818356?withWindow=false',data:productData}});
  networkListener({source:window,data:{source:'energuard-smartstore-network',url:'https://smartstore.naver.com/i/v2/channels/c/product-benefits/2229818356',data:{optimalDiscount:{totalDiscountResult:{summary:{totalPayAmount:2000}}}}}});
  let response;messageListener({type:'GET_COMPETITOR_SCAN_DATA',ignoreSupplements:true},null,value=>{response=value;});
  return response;
}
{
  const combos=[{optionName1:'벽산아이소핑크 1호 10T 430x430 3장',price:0,stockQuantity:99962,sellerManagerCode:'Iso_430_430_10_3'},{optionName1:'벽산아이소핑크 1호 10T 600x900 3장',price:4400,stockQuantity:99944,sellerManagerCode:'Iso_600_900_10_3'}];
  const withTitle=collectorFor({name:'아이소핑크',salePrice:20400,optionCombinations:combos,optionCombinationGroupNames:{optionGroupName1:'아이소핑크 두께선택'}});
  assert.equal(JSON.stringify(withTitle.optionGroupNames),JSON.stringify(['아이소핑크 두께선택']));
  assert.equal(withTitle.rows[1].optionName1,'벽산아이소핑크 1호 10T 600x900 3장');assert.equal(withTitle.rows[1].code,'Iso_600_900_10_3');
  const twoAxes=collectorFor({name:'x',salePrice:1000,optionCombinations:[{optionName1:'A',optionName2:'B',price:0}],optionCombinationGroupNames:{optionGroupName1:'종류',optionGroupName2:'규격'}});
  assert.equal(JSON.stringify(twoAxes.optionGroupNames),JSON.stringify(['종류','규격']));
  const none=collectorFor({name:'x',salePrice:1000,optionCombinations:combos});
  assert.equal(JSON.stringify(none.optionGroupNames),'[]');assert.ok(Array.isArray(none.optionKeys)&&none.optionKeys.includes('optionCombinations'));
  assert.equal(none.optionHints.optionCombinations,'배열(2)'); // 못 읽었을 때 찾을 단서
  // API 응답에 제목이 없어도 페이지에 심어진 데이터(inline script)에 있으면 읽는다
  const inline='window.__PRELOADED_STATE__={"product":{"A":{"optionCombinationGroupNames":{"optionGroupName1":"아이소핑크 두께선택"},"optionCombinationSortType":"CREATE"}}}';
  const fromPage=collectorFor({name:'x',salePrice:1000,optionCombinations:combos},[inline]);
  assert.equal(JSON.stringify(fromPage.optionGroupNames),JSON.stringify(['아이소핑크 두께선택']));
}
console.log('PASS collector: option group names + codes');

// 2) 작업자 — 모음전 읽기 요청(주소 제한, 옵션 없음 거절, 읽은 내용 전달)
const core=fs.readFileSync(path.join(__dirname,'../price-core.js'),'utf8');
const workerSource=fs.readFileSync(path.join(__dirname,'../worker.js'),'utf8').replace("importScripts('price-core.js');",'');
function bootWorker(scan){
  let listener,closed=0;
  const c={crypto:require('crypto').webcrypto,URL,AbortSignal,setTimeout:fn=>global.setTimeout(fn,0),importScripts:()=>{},chrome:{
    tabs:{create:async()=>({id:9}),sendMessage:async()=>{if(!scan)throw Error('no receiver');return scan;},remove:async()=>{closed++;}},
    storage:{local:{get:async()=>({}),set:async()=>{},remove:async()=>{}}},
    alarms:{create:async()=>{},get:async()=>null,clear:async()=>{},onAlarm:{addListener:()=>{}}},
    runtime:{getManifest:()=>({version:'0.32.0'}),onStartup:{addListener:()=>{}},onMessage:{addListener:f=>listener=f}},
  }};
  vm.createContext(c);vm.runInContext(core,c);vm.runInContext(workerSource,c);
  const call=(action,payload)=>new Promise(resolve=>listener({type:'EG_PRICE_TEST',action,payload},{url:'http://127.0.0.1:5500/index.html'},resolve));
  return {c,call,closed:()=>closed};
}
(async()=>{
  const good={ok:true,detailUrl:'https://smartstore.naver.com/i/v2/channels/c/products/2229818356?withWindow=false',benefitReady:true,productUrl:'https://smartstore.naver.com/hkdy/products/2229818356',optionGroupNames:['아이소핑크 두께선택'],optionKeys:['optionCombinations'],
    rows:[{label:'A',optionName1:'A',code:'Iso_430_430_10_3',stockQuantity:5,soldOut:false},{label:'B',optionName1:'B',code:'Iso_600_900_10_3',stockQuantity:0,soldOut:true}]};
  {
    const {call,closed}=bootWorker(good);
    const res=await call('moeum',{url:'https://smartstore.naver.com/hkdy/products/2229818356'});
    assert.equal(res.ok,true);assert.equal(res.version,'0.32.0');assert.equal(JSON.stringify(res.groupNames),JSON.stringify(['아이소핑크 두께선택']));
    assert.equal(res.rows.length,2);assert.equal(res.rows[0].code,'Iso_430_430_10_3');assert.equal(res.rows[1].soldOut,true);assert.equal(closed(),1);
    // 허용되지 않은 주소
    assert.equal((await call('moeum',{url:'https://smartstore.naver.com/other/products/1'})).ok,false);
    assert.equal((await call('moeum',{url:'https://evil.example/hkdy/products/1'})).ok,false);
    assert.equal((await call('moeum',{url:'not a url'})).ok,false);
  }
  { // 옵션이 없는 단품은 거절
    const {call}=bootWorker({...good,rows:[{label:'(옵션 없음)'}]});
    const res=await call('moeum',{url:'https://smartstore.naver.com/hkdylife/products/2229818356'});
    assert.equal(res.ok,false);assert.match(res.error,/옵션을 읽지 못/);
  }
  console.log('PASS worker: moeum store option read');
})().catch(error=>{console.error(error);process.exit(1);});
