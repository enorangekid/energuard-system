const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../boonimall-collector.js'),'utf8');

function option(value,price,attrs={}){
  return {value,textContent:value,disabled:!!attrs.disabled,className:attrs.className||'',getAttribute:name=>name==='price'?String(price):(attrs[name]||null)};
}
function boot({id='184',base=0,options=[]}={}){
  let listener;
  const script={textContent:`gl_goods_price = ${base};`};
  const document={
    scripts:[script],title:'부니몰 상품',
    querySelector(selector){
      if(selector==='input[name="goodsSeq"]')return {value:id};
      if(selector.includes('h3'))return {textContent:'테스트 상품'};
      return null;
    },
    querySelectorAll(selector){return selector==='select[name="viewOptions[]"] option'?options:[];},
  };
  const context={URL,location:{href:`https://boonimall.kr/goods/view?no=${id}`},document,chrome:{runtime:{onMessage:{addListener:fn=>listener=fn}}}};
  vm.createContext(context);vm.runInContext(source,context);
  let response;listener({type:'GET_BOONIMALL_SCAN_DATA'},null,value=>{response=value;});return response;
}

{
  const result=boot({id:'187',base:2400});
  assert.equal(result.ok,true);assert.equal(result.productId,'187');assert.equal(result.rows.length,1);
  assert.equal(result.rows[0].label,'(옵션 없음)');assert.equal(result.rows[0].finalPrice,2400);
}
{
  const result=boot({options:[
    option('표시문구 10T(+0원)',12600,{opt1:'접착식 아이소핑크 10T 600x900 (3장)'}),
    option('표시문구 20T(-5,500원)',7100,{opt1:'접착식 아이소핑크 20T 600x900 (1장)'}),
  ]});
  assert.equal(result.rows.length,2);assert.equal(result.rows[0].label,'접착식 아이소핑크 10T 600x900 (3장)');
  assert.equal(result.rows[1].finalPrice,7100);assert.equal(result.rows[1].instantPrice,7100);
  assert.equal(result.basePrice,0);
}
console.log('PASS boonimall collector: single product and absolute option prices');
