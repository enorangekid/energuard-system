const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../collector.js'),'utf8');
let networkListener,messageListener;
const window={addEventListener:(type,fn)=>{if(type==='message')networkListener=fn;}};
const context={
  window,
  location:{href:'https://smartstore.naver.com/daeyuproduce/products/13494466829'},
  document:{title:'대유물류 단품'},
  console,
  setInterval:()=>0,
  chrome:{runtime:{onMessage:{addListener:fn=>{messageListener=fn;}}}},
};
vm.createContext(context);vm.runInContext(source,context);

// 일반 선택옵션 없이 추가 구성만 있는 상품은 optionCombinations 필드가 없다.
networkListener({source:window,data:{
  source:'energuard-smartstore-network',
  url:'https://smartstore.naver.com/i/v2/channels/channel/products/13494466829?withWindow=false',
  data:{name:'비드법 1종 3호 20T',salePrice:3200,stockQuantity:10,supplementProducts:[{name:'운송비'}]},
}});
let response;
messageListener({type:'GET_COMPETITOR_SCAN_DATA'},null,value=>{response=value;});
assert.equal(response.ok,true);
assert.equal(response.benefitReady,false);
assert.equal(response.rows.length,1);
assert.equal(response.rows[0].label,'(옵션 없음)');
assert.equal(response.rows[0].finalPrice,3200);
console.log('PASS collector accepts optionless product with supplemental products');

// 같은 상품 상세가 페이지 로드 중 두 번 잡힐 때, 먼저 온 응답에 옵션이 없고 나중 응답에
// 있으면(프리페치 등으로 가벼운 버전이 먼저 온 경우) 옵션 있는 쪽으로 갈아끼운다 —
// 실제로는 두께별 옵션이 있는 상품인데 단일가로 고정돼버리던 문제 재현.
{
  const window2={addEventListener:(type,fn)=>{if(type==='message')networkListener=fn;}};
  const context2={window:window2,location:{href:'https://smartstore.naver.com/rival/products/7'},document:{title:'옵션 상품'},console,setInterval:()=>0,chrome:{runtime:{onMessage:{addListener:fn=>{messageListener=fn;}}}}};
  vm.createContext(context2);vm.runInContext(source,context2);
  networkListener({source:window2,data:{source:'energuard-smartstore-network',url:'https://smartstore.naver.com/i/v2/channels/c/products/7?withWindow=false',data:{name:'비드법',salePrice:3200,stockQuantity:10}}});
  networkListener({source:window2,data:{source:'energuard-smartstore-network',url:'https://smartstore.naver.com/i/v2/channels/c/products/7?withWindow=true',data:{name:'비드법',salePrice:3200,optionCombinations:[{optionName1:'30T',price:0,stockQuantity:5},{optionName1:'40T',price:1600,stockQuantity:5}]}}});
  let response2;
  messageListener({type:'GET_COMPETITOR_SCAN_DATA'},null,value=>{response2=value;});
  assert.equal(response2.rows.length,2);
  assert.equal(response2.rows[0].label,'30T');
  assert.equal(response2.rows[1].finalPrice,4800);
}
// 반대로 옵션 있는 응답이 먼저 오고 나중에(선택 시 재호출 등) 축소된 응답이 오면 그대로 유지 —
// 다운그레이드는 안 한다.
{
  const window3={addEventListener:(type,fn)=>{if(type==='message')networkListener=fn;}};
  const context3={window:window3,location:{href:'https://smartstore.naver.com/rival/products/8'},document:{title:'옵션 상품'},console,setInterval:()=>0,chrome:{runtime:{onMessage:{addListener:fn=>{messageListener=fn;}}}}};
  vm.createContext(context3);vm.runInContext(source,context3);
  networkListener({source:window3,data:{source:'energuard-smartstore-network',url:'https://smartstore.naver.com/i/v2/channels/c/products/8?withWindow=false',data:{name:'비드법',salePrice:3200,optionCombinations:[{optionName1:'30T',price:0,stockQuantity:5},{optionName1:'40T',price:1600,stockQuantity:5}]}}});
  networkListener({source:window3,data:{source:'energuard-smartstore-network',url:'https://smartstore.naver.com/i/v2/channels/c/products/8?selected=30T',data:{name:'비드법',salePrice:3200}}});
  let response3;
  messageListener({type:'GET_COMPETITOR_SCAN_DATA'},null,value=>{response3=value;});
  assert.equal(response3.rows.length,2);
}
console.log('PASS collector upgrades sparse-then-rich product detail, never downgrades rich-then-sparse');

// 선택옵션 콤보 없이 "기본상품 + 추가상품"으로 두께를 나눠 파는 판매자(대유물류 실사용
// 화면 재현, 2026-09-15) — 기본상품 행 + 추가상품마다 한 행씩, 추가상품 가격은 그 자체가
// 완결된 가격이라 base에 더하지 않는다.
{
  const window4={addEventListener:(type,fn)=>{if(type==='message')networkListener=fn;}};
  const context4={window:window4,location:{href:'https://smartstore.naver.com/daeyuproduce/products/13494466829'},document:{title:'대유물류'},console,setInterval:()=>0,chrome:{runtime:{onMessage:{addListener:fn=>{messageListener=fn;}}}}};
  vm.createContext(context4);vm.runInContext(source,context4);
  networkListener({source:window4,data:{source:'energuard-smartstore-network',url:'https://smartstore.naver.com/i/v2/channels/c/products/13494466829?withWindow=false',data:{
    name:'비드법 1종 3호 20T 900x1800', salePrice:3200, stockQuantity:10,
    supplementProducts:[
      {name:'비드법1종3호 30T 900X1800',price:4800,stockQuantity:5},
      {name:'비드법1종3호 40T 900X1800',price:6400,stockQuantity:5},
      {name:'비드법1종3호 50T 900X1800',price:8000,stockQuantity:5},
    ],
  }}});
  let response4;
  messageListener({type:'GET_COMPETITOR_SCAN_DATA'},null,value=>{response4=value;});
  assert.equal(response4.rows.length,4);
  assert.equal(response4.rows[0].label,'비드법 1종 3호 20T 900x1800');
  assert.equal(response4.rows[0].finalPrice,3200);
  assert.equal(response4.rows[1].label,'비드법1종3호 30T 900X1800');
  assert.equal(response4.rows[1].finalPrice,4800);
  assert.equal(response4.rows[3].finalPrice,8000);
}
console.log('PASS collector splits base+priced-supplement listing into one row per thickness');
