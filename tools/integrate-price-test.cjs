const fs=require('fs'),path=require('path');
const source=path.resolve('../Naver-rank/shopping-rank-extension');
const sample=path.resolve('tools/price-check-test-extension');
fs.copyFileSync(path.join(sample,'checker-content.js'),path.join(source,'checker-content.js'));
fs.copyFileSync(path.join(sample,'collector.js'),path.join(source,'smartstore-product-collector.js'));
const core=fs.readFileSync(path.join(sample,'price-core.js'),'utf8');
const worker=fs.readFileSync(path.join(sample,'worker.js'),'utf8').replace("importScripts('price-core.js');",'');
fs.writeFileSync(path.join(source,'price-check-test-worker.js'),'(()=>{\n'+core+'\n'+worker+'\n})();\n');
fs.copyFileSync(path.join(sample,'bridge.js'),path.join(source,'price-check-test-bridge.js'));
fs.copyFileSync(path.join(sample,'list-collector.js'),path.join(source,'price-check-list-collector.js'));
fs.copyFileSync(path.join(sample,'boonimall-collector.js'),path.join(source,'boonimall-price-collector.js'));
fs.copyFileSync(path.join(sample,'esm-collector.js'),path.join(source,'esm-price-collector.js'));
fs.copyFileSync(path.join(sample,'st11-collector.js'),path.join(source,'st11-price-collector.js'));
let s=fs.readFileSync(path.join(source,'service-worker.js'),'utf8');if(!s.includes('importScripts("price-check-test-worker.js")'))s+='\nimportScripts("price-check-test-worker.js");\n';fs.writeFileSync(path.join(source,'service-worker.js'),s);
const m=JSON.parse(fs.readFileSync(path.join(source,'manifest.json'),'utf8'));
if(!m.content_scripts.some(c=>c.js.includes('price-check-test-bridge.js')))m.content_scripts.push({matches:['http://127.0.0.1/*','http://localhost/*','https://enorangekid.github.io/*'],js:['price-check-test-bridge.js'],run_at:'document_start'});
// ?꾩껜?곹뭹 紐⑸줉 ?섏씠吏?먯꽌 移대뱶 媛寃⑹쓣 湲곷뒗 議곌컖 ??checker-content.js??scrapeProducts()瑜?
// ?ъ궗?⑺븯誘濡?諛섎뱶??洹??ㅼ뿉 媛숈? 而⑦뀓?ㅽ듃濡??ㅽ뻾?쇱빞 ?쒕떎(媛숈? content_scripts ??ぉ??append).
const listHost=m.content_scripts.find(c=>c.js.includes('checker-content.js'));
if(listHost){if(!listHost.js.includes('price-check-list-collector.js'))listHost.js.push('price-check-list-collector.js');}
else m.content_scripts.push({matches:['https://smartstore.naver.com/*'],exclude_matches:['https://smartstore.naver.com/*/products/*'],js:['checker-content.js','price-check-list-collector.js'],run_at:'document_idle'});
if(!m.permissions.includes('alarms'))m.permissions.push('alarms');
if(!m.host_permissions.includes('https://boonimall.kr/*'))m.host_permissions.push('https://boonimall.kr/*');
if(!m.content_scripts.some(c=>c.js.includes('boonimall-price-collector.js')))m.content_scripts.push({matches:['https://boonimall.kr/goods/view*'],js:['boonimall-price-collector.js'],run_at:'document_idle'});
for(const permission of ['https://item.gmarket.co.kr/*','https://itempage3.auction.co.kr/*','https://www.11st.co.kr/*'])if(!m.host_permissions.includes(permission))m.host_permissions.push(permission);
if(!m.content_scripts.some(c=>c.js.includes('esm-price-collector.js')))m.content_scripts.push({matches:['https://item.gmarket.co.kr/Item*','https://itempage3.auction.co.kr/DetailView.aspx*'],js:['esm-price-collector.js'],run_at:'document_idle'});
if(!m.content_scripts.some(c=>c.js.includes('st11-price-collector.js')))m.content_scripts.push({matches:['https://www.11st.co.kr/products/*'],js:['st11-price-collector.js'],run_at:'document_idle'});
m.minimum_chrome_version='120';m.version='0.31.8';
fs.writeFileSync(path.join(source,'manifest.json'),JSON.stringify(m,null,2)+'\n');
console.log('Integrated price test v'+m.version+' into '+source);
