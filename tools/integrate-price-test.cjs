const fs=require('fs'),path=require('path');
const source=path.resolve('../Naver-rank/shopping-rank-extension');
const sample=path.resolve('tools/price-check-test-extension');
const core=fs.readFileSync(path.join(sample,'price-core.js'),'utf8');
const worker=fs.readFileSync(path.join(sample,'worker.js'),'utf8').replace("importScripts('price-core.js');",'');
fs.writeFileSync(path.join(source,'price-check-test-worker.js'),'(()=>{\n'+core+'\n'+worker+'\n})();\n');
fs.copyFileSync(path.join(sample,'bridge.js'),path.join(source,'price-check-test-bridge.js'));
fs.copyFileSync(path.join(sample,'list-collector.js'),path.join(source,'price-check-list-collector.js'));
let s=fs.readFileSync(path.join(source,'service-worker.js'),'utf8');if(!s.includes('importScripts("price-check-test-worker.js")'))s+='\nimportScripts("price-check-test-worker.js");\n';fs.writeFileSync(path.join(source,'service-worker.js'),s);
s=fs.readFileSync(path.join(source,'smartstore-product-collector.js'),'utf8');if(!s.includes('let detailUrl = null')){
s=s.replace('  let productData = null;', '  let detailUrl = null, benefitUrl = null;\n  let productData = null;').replace('        productData = msg.data;','        productData = msg.data; detailUrl = msg.url;').replace('        benefitData = msg.data;','        benefitData = msg.data; benefitUrl = msg.url;').replace('      ok: true,','      ok: true, detailUrl, benefitUrl, benefitReady: benefitData != null,');
s=s.replace('      productData = null;', '      productData = null; detailUrl = null; benefitUrl = null;');fs.writeFileSync(path.join(source,'smartstore-product-collector.js'),s);}
const m=JSON.parse(fs.readFileSync(path.join(source,'manifest.json'),'utf8'));
if(!m.content_scripts.some(c=>c.js.includes('price-check-test-bridge.js')))m.content_scripts.push({matches:['http://127.0.0.1/*','http://localhost/*','https://enorangekid.github.io/*'],js:['price-check-test-bridge.js'],run_at:'document_start'});
// 전체상품 목록 페이지에서 카드 가격을 긁는 조각 — checker-content.js의 scrapeProducts()를
// 재사용하므로 반드시 그 뒤에 같은 컨텍스트로 실행돼야 한다(같은 content_scripts 항목에 append).
const listHost=m.content_scripts.find(c=>c.js.includes('checker-content.js'));
if(listHost){if(!listHost.js.includes('price-check-list-collector.js'))listHost.js.push('price-check-list-collector.js');}
else m.content_scripts.push({matches:['https://smartstore.naver.com/*'],exclude_matches:['https://smartstore.naver.com/*/products/*'],js:['checker-content.js','price-check-list-collector.js'],run_at:'document_idle'});
if(!m.permissions.includes('alarms'))m.permissions.push('alarms');
m.minimum_chrome_version='120';m.version='0.29.4';
fs.writeFileSync(path.join(source,'manifest.json'),JSON.stringify(m,null,2)+'\n');
console.log('Integrated price test v'+m.version+' into '+source);
