const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const coreSource=fs.readFileSync(path.join(__dirname,'../price-core.js'),'utf8');
const source=fs.readFileSync(path.join(__dirname,'../worker.js'),'utf8').replace("importScripts('price-core.js');",'');
const store={},alarms=new Map();
function boot(scan){
  let listener,lastTabUrl=null,lastMessage=null;
  const c={crypto:require('crypto').webcrypto,URL,AbortSignal,setTimeout:(fn)=>global.setTimeout(fn,0),importScripts:()=>{},chrome:{
    tabs:{create:async({url})=>{lastTabUrl=url;return {id:1};},sendMessage:async(_id,message)=>{lastMessage=message;const value=typeof scan==='function'?scan(lastTabUrl,message):scan;if(!value)throw Error('no route');return value;},remove:async()=>{}},
    storage:{local:{get:async key=>structuredClone({[key]:store[key]}),set:async obj=>Object.assign(store,structuredClone(obj)),remove:async key=>delete store[key]}},
    alarms:{create:async(name,data)=>alarms.set(name,data),get:async n=>alarms.get(n),clear:async n=>alarms.delete(n),onAlarm:{addListener:()=>{}}},
    runtime:{getManifest:()=>({version:'0.31.0'}),onStartup:{addListener:()=>{}},onMessage:{addListener:f=>listener=f}},
  }};
  vm.createContext(c);vm.runInContext(coreSource,c);vm.runInContext(source,c);
  return {c,lastMessage:()=>lastMessage,call:(action,payload)=>new Promise(resolve=>listener({type:'EG_PRICE_TEST',action,payload},{url:'http://127.0.0.1:5500/index.html'},resolve))};
}
(async()=>{
  const {c}=boot(()=>({ok:true}));
  const name=(text)=>c.st11KeyFromName(text);
  const code=(text)=>c.st11KeyFromCode(text);
  // 실제 11번가 옵션 이름 → 단가표 관리코드와 같은 열쇠
  const same=(storeName,itemCode)=>{const a=name(storeName),b=code(itemCode);assert.ok(a&&b,`parse ${storeName} / ${itemCode}`);assert.equal(a.key,b.key,`${storeName} → ${itemCode}`);return {a,b};};
  same('스티로폼(3호)_10T-430x430(5장)','St_430_430_10_5');
  same('★접착_스티로폼_20T-600x900(2장)','StA_600_900_20_2');
  same('(KS정품) 회색스티로폼(2호)_20T-430㎜x430㎜(3장)','Neo_430_430_20_3');
  same('백색스티로폼(1종3호)_50T / 430 x 430(2장)','St_430_430_50_2');
  same('회색스티로폼(2종2호)_100T / 430 x 430(1장)','Neo_430_430_100_2');
  same('아이소핑크(특호)_30T / 430 x 430(2장)','Iso_430_430_30_2');
  same('벽산아이소핑크 KS인증 II-B-2_20T / 430 x 430(3장)','Iso_430_430_20_3');
  same('접착식 벽산아이소핑크 / 10T-600 x 900(3장)','IsoA_600_900_10_3');
  same('★접착식 아이소핑크(특호) / 30T-600x900(1장)','IsoA_600_900_30_1');
  same('백색 스티로폼 / 20T 900x1800 (7장)','St_900_1800_20_7');
  same('백색스티로폼 / 200T 900mm x 1800mm','St_900_1800_200_1');
  same('[KS정품] 백색 스티로폼 200T 3호 200Tx600㎜x900㎜','St_600_900_200_1');
  same('[KS정품]회색 스티로폼 500T(2호)-[500Tx600㎜x900㎜]','Neo_600_900_500_1');
  same('벽산아이소핑크 KS정품_10T-430㎜x430㎜(3장)','Iso_430_430_10_3');
  same('열반사단열재 빌트론 5T [ 1m x 50m ] / 일반형 비접착','BL_5_50_SN_R');
  same('열반사단열재 빌트론 20T [ 1m x 10m ] / 고급형 한쪽접착','BL_20_10_DA');
  same('열반사단열재 빌트론 6T [ 1m x 25m ] / 고급형 비접착','BL_6_25_DN');
  same('단열벽지 고급형1 5T x 10m','WP_P1_5_10');
  same('단열벽지 3D실크벽지 5T x 2.3m','WP_SK_5_23');
  same('단열벽지 이중화이트 5T x 20m','WP_DW_5_20');
  // 장수가 규격 뒤에 공백으로만 붙은 이름("900x1800 10장")이 "180010장"으로 읽히면 안 된다(2026-09-30 실제 3666826849 검사에서 발견)
  {const r=same('★접착식 벽산 아이소핑크 10T 900x1800 10장','IsoA_900_1800_10_10');assert.equal(r.a.count,10);assert.equal(r.b.count,10);}
  assert.equal(name('★접착식 벽산 아이소핑크 50T 900x1800 2장').count,2);
  assert.equal(name('백색 스티로폼 / 20T 900x1800 (7장)').count,7);
  assert.equal(name('스티로폼(3호)_10T-430x430(5장)').count,5);
  assert.equal(name('쓰레기 옵션'),null);
  assert.equal(code('T_TF_G'),null);
  assert.equal(name('회색스티로폼(2종2호)_100T / 430 x 430(1장)').count,1); // 이름의 장수(1장)는 단가표(2장)와 다르다 — 아래에서 알려주는지 본다

  // 옵션 이름과 가격이 서로 바뀐 스토어 옵션(2026-09-30 실제 1534558353) → 열쇠는 같아서 짝지어지고 가격이 어긋난다
  const opts=[
    {code:'St_430_430_100_1',name:'백색스티로폼 430x430 100T_1장',expected:11400,status:null},
    {code:'St_600_900_100_1',name:'백색스티로폼 600x900 100T_1장',expected:15900,status:null},
    {code:'Neo_430_430_100_2',name:'회색스티로폼 430x430 100T_2장',expected:23800,status:null},
    {code:'Neo_600_900_100_1',name:'회색스티로폼 600x900 100T_1장',expected:24800,status:null},
    {code:'St_430_430_20_3',name:'백색스티로폼 430x430 20T_3장',expected:9400,status:null},
    {code:'St_600_900_20_2',name:'백색스티로폼 600x900 20T_2장',expected:10600,status:'stopped'},
  ];
  const rows=[
    {name:'백색스티로폼(1종3호)_100T / 600 x 900(1장)',price:11400,qty:9803},
    {name:'백색스티로폼(1종3호)_100T / 430 x 430(1장)',price:15900,qty:9958},
    {name:'회색스티로폼(2종2호)_100T / 600 x 900(1장)',price:23800,qty:9982},
    {name:'회색스티로폼(2종2호)_100T / 430 x 430(2장)',price:24800,qty:9908},
    {name:'백색스티로폼(1종3호)_20T / 430 x 430(3장)',price:9400,qty:0},
    {name:'접착식 백색스티로폼(1종3호) / 20T-600 x 900(2장)',price:11900,qty:5},
    {name:'알 수 없는 옵션',price:1000,qty:5},
  ];
  const out=c.match11stOptions('1534558353',rows,opts);
  const by=code=>out.find(r=>r.code===code);
  assert.equal(by('St_600_900_100_1').status,'불일치');assert.equal(by('St_600_900_100_1').actual,11400);assert.equal(by('St_600_900_100_1').diff,-4500);
  assert.equal(by('St_430_430_100_1').status,'불일치');assert.equal(by('St_430_430_100_1').diff,4500);
  assert.match(by('St_600_900_100_1').source,/짝 옵션\(St_430_430_100_1\)과 가격이 서로 바뀐/);assert.match(by('St_430_430_100_1').source,/짝 옵션\(St_600_900_100_1\)/);
  assert.equal(by('Neo_600_900_100_1').status,'불일치');
  assert.equal(by('Neo_430_430_100_2').status,'불일치');assert.equal(by('Neo_430_430_100_2').diff,1000);
  assert.equal(by('St_430_430_20_3').status,'품절'); // 스토어 재고 0
  assert.ok(!by('St_600_900_20_2')||by('St_600_900_20_2').status!=='스토어에 없음'); // 판매중지 옵션은 "스토어에 없음"으로 안 본다
  assert.ok(out.find(r=>r.status==='단가표에 없음'&&/접착식/.test(r.label)));
  assert.ok(out.find(r=>r.status==='이름 해석 불가'));
  // 가격이 같고 장수만 다르면 "이름 확인 필요"
  const soft=c.match11stOptions('1',[{name:'회색스티로폼(2종2호)_100T / 430 x 430(1장)',price:23800,qty:5}],[{code:'Neo_430_430_100_2',name:'x',expected:23800,status:null}]);
  assert.equal(soft[0].status,'이름 확인 필요');
  // 같은 열쇠가 둘이면 장수로 가른다(아이소핑크 900x1800 70T 1장/3장)
  const dup=c.match11stOptions('1',[{name:'아이소핑크 900x1800 70T (1장)',price:40000,qty:5},{name:'아이소핑크 900x1800 70T (3장)',price:99000,qty:5}],[{code:'Iso_900_1800_70_3',name:'a',expected:99000,status:null},{code:'IIso_900_1800_70_1',name:'b',expected:40000,status:null}]);
  assert.equal(JSON.stringify(dup.map(r=>r.status)),JSON.stringify(['일치','일치']));assert.equal(dup[0].code,'IIso_900_1800_70_1');

  // 단열벽지 — 색상 옵션은 대표가 한 줄로(색상별 "단가표에 없음"이 쏟아지면 안 된다, 2026-09-30 실제 1684647231·1680254582)
  {
    const wOpts=[{code:'WP_P1_5_1',name:'a',expected:7500,status:null},{code:'WP_P2_5_1',name:'b',expected:10300,status:null},{code:'WP_DW_5_1',name:'c',expected:10600,status:null},{code:'WP_SK_5_1',name:'d',expected:10600,status:'stopped'},{code:'WP_P1_5_10',name:'e',expected:48600,status:null}];
    const wRows=[
      {name:'고급형1_5T(1m x 1m) / 42.모노라인',price:7500,qty:99},{name:'고급형1_5T(1m x 1m) / 43.스트라이프 베이지',price:7500,qty:99},{name:'고급형1_5T(1m x 1m) / 44.스트라이프 블루',price:7500,qty:0},
      {name:'고급형2_5T(1m x 1m) / 04.프랜치 바닐라',price:10300,qty:99},{name:'고급형2_5T(1m x 1m) / 05.프랜치 그린',price:10400,qty:99},{name:'고급형2_5T(1m x 1m) / 06.프랜치 블루',price:10300,qty:99},
      {name:'이중화이트_5T(1m x 1m) / 01.화이트',price:10600,qty:0},{name:'이중화이트_5T(1m x 1m) / 11.럭스 화이트',price:10600,qty:0},
      {name:'3D 실크벽지_5T(1m x 1m) / 코지 웜그레이 옥스포드',price:10600,qty:99},
      {name:'고급형1_5T 1x20m / 42.모노라인',price:74600,qty:99},
    ];
    const r=c.match11stOptions('1684647231',wRows,wOpts);
    const byCode=code=>r.find(x=>x.code===code);
    assert.equal(byCode('WP_P1_5_1').status,'대표가 일치');assert.match(byCode('WP_P1_5_1').label,/고급형1_5T\(1m x 1m\) · 대표가/);assert.match(byCode('WP_P1_5_1').source,/색상 옵션 3개/); // 품절 색상(44)은 가격 비교에서 뺀다
    assert.equal(byCode('WP_P2_5_1').status,'대표가 불일치');assert.equal(byCode('WP_P2_5_1').actual,10400);assert.equal(byCode('WP_P2_5_1').diff,100);assert.match(byCode('WP_P2_5_1').source,/1개 가격 다름/);
    assert.equal(byCode('WP_DW_5_1').status,'품절'); // 색상이 전부 품절
    assert.equal(byCode('WP_SK_5_1').status,'품절'); // 판매중지 옵션
    const extra=r.find(x=>x.status==='단가표에 없음');assert.ok(extra&&/1x20m/.test(extra.label));
    assert.ok(!r.find(x=>x.status==='이름 해석 불가'));
    assert.equal(r.filter(x=>x.status==='스토어에 없음').length,1); // 스토어에 10m 행이 없는 WP_P1_5_10 하나(20m 행은 단가표에 없음)
  }

  // 작업자: 옵션 검사 / 추가상품 검사 / 주소 제한 / 큐
  const gm='https://www.11st.co.kr/products/1848852975';
  {
    const {c:w,lastMessage}=boot(()=>({ok:true,productId:'1848852975',productUrl:gm,rows:[{name:'스티로폼(3호)_10T-430x430(5장)',price:8700,qty:99999,stck:'32470568124'}]}));
    const res=await w.inspect11st({productId:'1848852975',productUrl:gm,options:[{code:'St_430_430_10_5',name:'백색스티로폼 430x430 10T_5장',expected:8700,status:null}]},null,'options');
    assert.equal(res.length,1);assert.equal(res[0].status,'일치');assert.equal(res[0].store,'11st');assert.equal(lastMessage().mode,'options');
    await assert.rejects(()=>w.inspect11st({productId:'1848852975',productUrl:'https://evil.example/products/1848852975',options:[]},null,'options'),/허용되지 않은/);
    await assert.rejects(()=>w.inspect11st({productId:'1848852975',productUrl:'https://www.11st.co.kr/products/999',options:[]},null,'options'),/허용되지 않은/);
  }
  {
    const {c:w,lastMessage}=boot(()=>({ok:true,productId:'1848852975',productUrl:gm,supplements:[{label:'●_(48mm)회색면테이프 25m',finalPrice:5400,soldOut:false},{label:'●_스티커 제거제',finalPrice:4800,soldOut:false},{label:'●_모르는 상품',finalPrice:100,soldOut:false}]}));
    const catalog=[{code:'TP_GY48',name:'●_(48mm)회색면테이프 25m',expected:5400,use:'Y'},{code:'T_SR',name:'●_스티커 제거제',expected:4900,use:'Y'}];
    const res=await w.inspect11st({productId:'1848852975',productUrl:gm,options:[]},catalog,'supplement');
    assert.equal(lastMessage().mode,'supplement');
    assert.equal(JSON.stringify(res.map(r=>r.status)),JSON.stringify(['일치','불일치','추가상품 목록에 없음']));assert.equal(res[1].diff,-100);assert.equal(res[0].store,'11st');
  }
  {
    // 봇 확인 화면이면 실패로 남고 검사가 일시정지된다. 옵션이 안 읽히는 상품 하나는 실패 행만 남기고 계속한다.
    const {c:w,call}=boot((url)=>/1111$/.test(url)?{ok:false,error:'옵션 목록을 찾지 못했습니다.'}:{ok:true,productId:url.split('/').pop(),productUrl:url,rows:[{name:'스티로폼(3호)_10T-430x430(5장)',price:8700,qty:1}]});
    const items=['1111','2222'].map(id=>({productId:id,productUrl:'https://www.11st.co.kr/products/'+id,options:[{code:'St_430_430_10_5',name:'x',expected:8700,status:null}]}));
    assert.equal(JSON.stringify(await call('start',{kind:'11st',items:[{productId:'1',productUrl:'https://smartstore.naver.com/x/products/1',options:[{}]}]})),JSON.stringify({ok:false,error:'허용되지 않은 11번가 상품 주소'}));
    assert.equal((await call('start',{kind:'11st',mode:'supplement',items})).ok,false); // 추가상품 목록 없이는 시작 불가
    assert.equal(JSON.stringify(await call('start',{kind:'11st',items:[items[0],items[0]]})),JSON.stringify({ok:false,error:'중복 상품번호'}));
    assert.equal((await call('start',{kind:'11st',items})).ok,true);
    for(let i=0;i<40;i++){await new Promise(r=>global.setTimeout(r,20));const s=(await call('status')).state;if(s&&!s.running)break;}
    const s=(await call('status')).state;
    assert.equal(s.kind,'11st');assert.equal(s.channelId,'11st');assert.equal(s.done,2);assert.equal(s.rows.find(r=>r.productId==='1111').status,'수집 실패');assert.equal(s.rows.find(r=>r.productId==='2222').status,'일치');
  }
  console.log('PASS 11st: spec keys (bead/iso/reflective/wallpaper), swapped label/price detection, count note, sold-out, supplements, URL guard, queue');
})().catch(e=>{console.error(e);process.exit(1)});
