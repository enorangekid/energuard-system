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
