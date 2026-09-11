const fs=require('fs'),vm=require('vm'),assert=require('assert');
let listener;
let page=1;
const c={URL,location:{href:'https://smartstore.naver.com/energuardcompany/category/example?cp=1'},chrome:{runtime:{onMessage:{addListener:f=>listener=f}}},scrapeProducts:()=>[{productId:'1',price:100}],document:{querySelector:()=>({textContent:String(page)}),querySelectorAll:()=>page===1?[{getAttribute:k=>k==='data-shp-contents-id'?'2':null}]:[]}};
vm.runInNewContext(fs.readFileSync(require('path').join(__dirname,'../list-collector.js'),'utf8'),c);
let result;listener({type:'EG_PRICE_LIST_PAGE'},{},r=>result=r);assert.equal(new URL(result.next).searchParams.get('page'),'2');assert.equal(new URL(result.next).searchParams.has('cp'),false);
page=2;listener({type:'EG_PRICE_LIST_PAGE'},{},r=>result=r);assert.equal(result.next,null);console.log('PASS page=2 navigation and final-page stop');
