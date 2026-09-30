const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../esm-collector.js'),'utf8');
function node(text){return {textContent:text,getAttribute:()=>null};}
function boot({url,title='상품',original,discounted,body='',labeled=[]}){
  let listener;const root={querySelector(selector){if(selector.includes('price_original'))return original?node(original):null;if(/price_coupon|price_real|price-seller|price > strong|price strong/.test(selector))return discounted?node(discounted):null;return null;},querySelectorAll:()=>labeled.map(node)};
  const document={title,body:{innerText:body},querySelector(selector){if(/#frmMain|#itemcase_basic/.test(selector))return root;if(selector==='h1')return node('테스트 상품');return null;}};
  const context={URL,location:new URL(url),document,chrome:{runtime:{onMessage:{addListener:fn=>listener=fn}}}};vm.createContext(context);vm.runInContext(source,context);let result;listener({type:'GET_ESM_SCAN_DATA'},null,v=>result=v);return result;
}
let r=boot({url:'https://item.gmarket.co.kr/Item?goodscode=4586303844',original:'기존가 111,300원',discounted:'104,630원'});
assert.equal(r.ok,true);assert.equal(r.marketplace,'gmarket');assert.equal(r.productId,'4586303844');assert.equal(r.registeredPrice,111300);assert.equal(r.discountedPrice,104630);
r=boot({url:'https://itempage3.auction.co.kr/DetailView.aspx?ItemNo=F392223636',original:'원가 111,300원',discounted:'104,620원'});
assert.equal(r.ok,true);assert.equal(r.marketplace,'auction');assert.equal(r.productId,'F392223636');assert.equal(r.registeredPrice,111300);
r=boot({url:'https://item.gmarket.co.kr/Item?goodscode=2000609425',original:'할인률 5% 기존가 9,100 원',labeled:['할인률 5% 기존가 9,100 원'],discounted:'8,560원'});
assert.equal(r.registeredPrice,9100);assert.equal(r.discountedPrice,8560);
r=boot({url:'https://item.gmarket.co.kr/Item?goodscode=1',body:'간단한 봇 확인 절차',original:'1,000원'});assert.equal(r.ok,false);assert.match(r.error,/확인 화면/);
console.log('PASS ESM collector: Gmarket/Auction item ID, labeled registered price over coupon price, bot screen stop');
