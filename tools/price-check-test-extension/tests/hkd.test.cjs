const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const path=require('path');
const coreSource=fs.readFileSync(path.join(__dirname,'../price-core.js'),'utf8');
const source=fs.readFileSync(path.join(__dirname,'../worker.js'),'utf8');
const store={},alarms=new Map();
function boot(scanByUrl){
  let listener,lastTabUrl=null;
  const c={crypto:require('crypto').webcrypto,URL,AbortSignal,setTimeout:(fn)=>global.setTimeout(fn,0),importScripts:()=>{},chrome:{
    tabs:{
      create:async({url})=>{lastTabUrl=url;return {id:1};},
      sendMessage:async()=>{const scan=scanByUrl(lastTabUrl);if(!scan)throw Error('no route');return scan;},
      remove:async()=>{},
    },
    storage:{local:{get:async key=>structuredClone({[key]:store[key]}),set:async obj=>Object.assign(store,structuredClone(obj)),remove:async key=>delete store[key]}},
    alarms:{create:async(name,data)=>alarms.set(name,data),get:async n=>alarms.get(n),clear:async n=>alarms.delete(n),onAlarm:{addListener:()=>{}}},
    runtime:{getManifest:()=>({version:'0.30.5'}),onStartup:{addListener:()=>{}},onMessage:{addListener:f=>listener=f}},
  }};
  vm.createContext(c);vm.runInContext(coreSource,c);vm.runInContext(source,c);
  return {c,call:(action,payload)=>new Promise(resolve=>listener({type:'EG_PRICE_TEST',action,payload},{url:'http://127.0.0.1:5500/index.html'},resolve))};
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,1000));
const scan=(id,rows,supplements)=>({ok:true,benefitReady:true,detailUrl:`https://smartstore.naver.com/i/v2/channels/abc/products/${id}`,benefitUrl:'y',productUrl:`https://smartstore.naver.com/hkdy/products/${id}`,rows,...(supplements?{supplements}:{})});
const url=id=>`https://smartstore.naver.com/hkdy/products/${id}`;

(async()=>{
  // 옵션 관리코드가 우리 상품코드와 같으면 코드로 짝짓고, 즉시할인까지 적용된 가격으로 비교한다
  // (2026-09-28 첫 실검사 재현: 439103571은 판매가를 18,000 높게 적고 즉시할인 18,000 — 할인 전
  //  판매가로 비교하면 전 옵션이 +18,000 불일치로 나왔다)
  {
    const {c}=boot(()=>scan(1,[
      {label:'벽산아이소핑크 1호 10T 430x430 3장',code:'Iso_430_430_10_3',finalPrice:2400,salePrice:20400,soldOut:false},
      {label:'벽산아이소핑크 1호 10T 600x900 3장',code:'Iso_600_900_10_3',finalPrice:6800,salePrice:24800,soldOut:false},
    ]));
    const rows=await c.inspectHkd({productId:'1',productUrl:url(1),options:[
      {code:'Iso_430_430_10_3',name:'아이소핑크 430x430 10T_3장',expected:2400},
      {code:'Iso_600_900_10_3',name:'아이소핑크 600x900 10T_3장',expected:6900},
    ]});
    assert.equal(rows[0].status,'일치');
    assert.equal(rows[0].actual,2400);
    assert.equal(rows[0].listPrice,20400);
    assert.equal(rows[0].source,'코드 매칭 · 쿠폰 포함가'); // 이 행엔 즉시할인가가 없어 최대할인가로 폴백
    assert.equal(rows[1].status,'불일치');
    assert.equal(rows[1].diff,-100);
  }
  // 알림쿠폰이 걸린 상품(5697937041 실제 화면): 할인 전 532,000 → 상품 가격 102,000(즉시할인) → 최대할인가
  // 100,000(알림쿠폰 2,000 포함). 단가표는 102,000 — 즉시할인가로 비교해야 일치, 최대할인가로 비교하면 -2,000.
  {
    const {c}=boot(()=>scan(21,[
      {label:'세경아이소 특호 900x1800 70T 3장',code:'Iso_900_1800_70_3',finalPrice:100000,instantPrice:102000,salePrice:532000,soldOut:false},
      {label:'동인아이소 특호 900x1800 100T 3장',code:'Iso_900_1800_100_3',finalPrice:141000,instantPrice:143000,salePrice:590000,soldOut:false},
    ]));
    const rows=await c.inspectHkd({productId:'21',productUrl:url(21),options:[
      {code:'Iso_900_1800_70_3',name:'A',expected:102000},
      {code:'Iso_900_1800_100_3',name:'B',expected:143000},
    ]});
    assert.equal(rows[0].status,'일치');assert.equal(rows[0].actual,102000);assert.equal(rows[0].priceKind,'즉시할인가');
    assert.equal(rows[0].maxPrice,100000);assert.equal(rows[0].listPrice,532000);assert.equal(rows[0].source,'코드 매칭');
    assert.equal(rows[1].status,'일치');
    // 즉시할인가는 진짜 어긋난 가격은 그대로 잡는다
    const bad=await c.inspectHkd({productId:'21',productUrl:url(21),options:[{code:'Iso_900_1800_70_3',name:'A',expected:103000},{code:'Iso_900_1800_100_3',name:'B',expected:143000}]});
    assert.equal(bad[0].status,'불일치');assert.equal(bad[0].diff,-1000);
  }
  // 추가상품 검사(2026-09-29): 스토어 상품 페이지의 추가상품을 추가상품 목록(catalog)과 이름·코드로 짝지어 가격을 비교한다.
  // 옵션 행 뒤에 kind:'추가상품' 행으로 붙고, 목록에 있는데 이 상품에 없는 추가상품은 알리지 않는다.
  {
    const catalog=[
      {code:'TP_GY48',name:'●_(48mm)회색면테이프 25m',expected:5000,use:'Y'},
      {code:'TP_GY100',name:'●_회색면테이프(100mm) 25m',expected:8500,use:'Y'},
      {code:'ISO_BD',name:'●_아이소핑크 본드',expected:4500,use:'N'},
      {code:'SC_HE',name:'●_실리콘 헤라',expected:2000,use:'Y'},
    ];
    const {c}=boot(()=>scan(41,[{label:'(옵션 없음)',finalPrice:18000,instantPrice:18000,salePrice:18000,soldOut:false}],[
      {label:'●_(48mm)회색면테이프 25m',code:null,finalPrice:5000,soldOut:false},   // 일치(이름 매칭)
      {label:'●_회색면테이프(100mm) 25m',code:'TP_GY100',finalPrice:9000,soldOut:false}, // 불일치(코드 매칭)
      {label:'●_아이소핑크 본드',code:null,finalPrice:4500,soldOut:false},          // 사용여부 N인데 쓰는 중
      {label:'●_새 추가상품',code:null,finalPrice:1000,soldOut:false},              // 목록에 없음
    ]));
    // 옵션 검사(mode 없음)는 목록을 넘겨도 옵션 행만 — 추가상품은 따로 돌린다
    const opt=await c.inspectHkd({productId:'41',productUrl:url(41),options:[{code:'BL_5_5_SN',name:'빌트론 5T 1m x 5m 일반형 비접착',expected:18000}]},catalog);
    assert.equal(opt.length,1);assert.equal(opt[0].status,'일치');assert.equal(opt[0].kind,undefined);
    // 추가상품 검사(mode:'supplement')는 추가상품 행만
    const s=await c.inspectHkd({productId:'41',productUrl:url(41)},catalog,'supplement');
    assert.equal(s.length,4);
    assert.equal(JSON.stringify(s.map(r=>r.kind)),JSON.stringify(['추가상품','추가상품','추가상품','추가상품']));
    assert.equal(JSON.stringify(s.map(r=>r.status)),JSON.stringify(['일치','불일치','사용여부 불일치','추가상품 목록에 없음']));
    assert.equal(s[0].source,'이름 매칭');assert.equal(s[0].code,'TP_GY48');assert.equal(s[0].expected,5000);
    assert.equal(s[1].source,'코드 매칭');assert.equal(s[1].diff,500);
    assert.equal(s[3].expected,null);assert.equal(s[3].source,'매칭 안 됨');
    assert.match(s[0].label,/^\[추가상품\] /);
    // 목록이 없으면 추가상품 검사는 시작할 수 없다
    await assert.rejects(()=>c.inspectHkd({productId:'41',productUrl:url(41)},null,'supplement'),/추가상품 목록이 없습니다/);
    // 사용여부 N인 추가상품이 스토어에서 품절·사용안함이면 정상(품절)
    const {c:c2}=boot(()=>scan(42,[{label:'(옵션 없음)',finalPrice:1,instantPrice:100,salePrice:100,soldOut:false}],[{label:'●_아이소핑크 본드',finalPrice:4500,soldOut:true}]));
    const r2=await c2.inspectHkd({productId:'42',productUrl:url(42)},catalog,'supplement');
    assert.equal(r2.length,1);assert.equal(r2[0].status,'품절');
    // 상품 페이지에 추가상품이 없으면 "추가상품 없음" 한 줄(검사했다는 표시)
    const {c:c3}=boot(()=>scan(43,[{label:'(옵션 없음)',finalPrice:1,instantPrice:100,salePrice:100,soldOut:false}],[]));
    const r3=await c3.inspectHkd({productId:'43',productUrl:url(43)},catalog,'supplement');
    assert.equal(r3.length,1);assert.equal(r3[0].status,'추가상품 없음');
  }
  // 추가상품 검사 큐 — 옵션 없이 시작할 수 있고(mode:'supplement'), 목록이 없으면 시작이 거부된다. 상태 응답엔 목록이 실리지 않는다.
  {
    const supplements=[{code:'TP_GY48',name:'●_(48mm)회색면테이프 25m',expected:5000,use:'Y'}];
    const {call}=boot(u=>u===url(51)?scan(51,[{label:'(옵션 없음)',finalPrice:1,salePrice:1,soldOut:false}],[{label:'●_(48mm)회색면테이프 25m',finalPrice:5000,soldOut:false}]):null);
    assert.equal((await call('start',{kind:'hkd',mode:'supplement',items:[{productId:'51',productUrl:url(51)}]})).ok,false); // 목록 없음
    assert.equal((await call('start',{kind:'hkd',mode:'supplement',items:[{productId:'51',productUrl:url(51)},{productId:'52',productUrl:url(52)}],supplements})).ok,true);
    await settle();
    assert.equal(store.priceTest.mode,'supplement');
    assert.equal(store.priceTest.rows[0].status,'일치');assert.equal(store.priceTest.rows[0].kind,'추가상품');
    assert.equal(store.priceTest.rows[1].status,'수집 실패');
    const st=await call('status');
    assert.equal(st.state.mode,'supplement');assert.equal(st.state.supplements,undefined);
  }
  console.log('PASS hkd supplements: name/code match, price diff, unused(N) flag, unlisted flag, sold-out, separate mode, queue');
  // 수집기가 즉시할인가를 못 찾으면(instantPrice 없음) 예전처럼 최대할인가로 비교하고 "쿠폰 포함가"로 표시한다
  {
    const {c}=boot(()=>scan(22,[{label:'A',code:'X',finalPrice:100000,salePrice:532000,soldOut:false}]));
    const rows=await c.inspectHkd({productId:'22',productUrl:url(22),options:[{code:'X',name:'A',expected:100000}]});
    assert.equal(rows[0].status,'일치');assert.equal(rows[0].priceKind,'쿠폰 포함가');assert.equal(rows[0].source,'코드 매칭 · 쿠폰 포함가');
  }
  // 한 상품 안에 다른 카테고리 옵션이 섞인 경우(439904706: 아이소핑크 상품에 이중화이트 색상 옵션) — 스토어 색상 옵션
  // 수십 개가 전부 관리코드 WP_DW_5_1이면, 우리 표에는 WP_DW_5_1 하나만 있어도 색상 옵션이 몇 개든 전부 그 가격과
  // 비교된다(코드 매칭은 다대일). 색상 이름은 우리 표에 없어도 된다.
  {
    const colors=['럭스 화이트','젠틀 화이트','코튼 화이트','헤링본 화이트','베이직 화이트','소프트 화이트','화이트 옥스포드','화이트 클레이','모던라인 화이트','새로 생긴 색상'];
    const {c}=boot(()=>scan(31,[
      {label:'아이소핑크 20T',code:'Iso_600_900_20_1',finalPrice:1,instantPrice:4300,soldOut:false},
      ...colors.map((n,i)=>({label:`단열벽지 5T 1m x 1m ${n}`,code:'WP_DW_5_1',finalPrice:6300,instantPrice:i===9?6700:6300,soldOut:false})),
    ]));
    const rows=await c.inspectHkd({productId:'31',productUrl:url(31),options:[
      {code:'Iso_600_900_20_1',name:'아이소핑크 600x900 20T_1장',expected:4300},
      {code:'WP_DW_5_1',name:'단열벽지 이중화이트 5T x 1m',expected:6700},
    ]});
    assert.equal(rows.length,11);                               // 스토어 행 11개 전부 결과에 나옴("스토어에 없음" 없음)
    assert.equal(rows[0].status,'일치');
    const wall=rows.slice(1);
    assert.equal(wall.every(r=>r.source==='코드 매칭'&&r.code==='WP_DW_5_1'),true);
    assert.equal(wall.filter(r=>r.status==='불일치'&&r.diff===-400).length,9);   // 옛 가격 6,300 → -400
    assert.equal(wall[9].status,'일치');                        // 6,700으로 올려둔 옵션은 일치
  }
  // 관리코드가 없으면 옵션 이름으로 — 띄어쓰기·기호·×/x 차이는 무시
  {
    const {c}=boot(()=>scan(2,[
      {label:'빌트론 5T 1m×1m 일반형 / 비접착',finalPrice:2900,salePrice:2900,soldOut:false},
      {label:'빌트론 5T 1m×10m 일반형 / 비접착',finalPrice:32000,salePrice:32000,soldOut:false},
    ]));
    const rows=await c.inspectHkd({productId:'2',productUrl:url(2),options:[
      {code:'BL_5_1_SN',name:'빌트론 5T 1m x 1m 일반형 비접착',expected:2900},
      {code:'BL_5_10_SN',name:'빌트론 5T 1m x 10m 일반형 비접착',expected:32000},
    ]});
    assert.equal(rows[0].status,'일치');assert.equal(rows[0].code,'BL_5_1_SN');assert.equal(rows[0].source,'이름 매칭 · 쿠폰 포함가');
    assert.equal(rows[1].status,'일치');assert.equal(rows[1].code,'BL_5_10_SN');
  }
  // 이름이 애매하면(후보 2개 이상) 추측하지 않는다 → 스토어 옵션은 "단가표에 없음", 우리 옵션은 "스토어에 없음"
  {
    const {c}=boot(()=>scan(3,[{label:'10m',finalPrice:45000,salePrice:45000,soldOut:false},{label:'20m',finalPrice:69000,salePrice:69000,soldOut:false}]));
    const rows=await c.inspectHkd({productId:'3',productUrl:url(3),options:[
      {code:'WP_P1_5_10',name:'단열벽지 고급형1 5T x 10m',expected:48700},
      {code:'WP_P2_5_10',name:'단열벽지 고급형2 5T x 10m',expected:51200},
    ]});
    assert.equal(rows.map(r=>r.status).join(','),'단가표에 없음,단가표에 없음,스토어에 없음,스토어에 없음');
  }
  // 옵션이 하나씩이면 이름이 달라도 그대로 짝짓는다
  {
    const {c}=boot(()=>scan(4,[{label:'(옵션 없음)',finalPrice:2500,salePrice:2500,soldOut:false}]));
    const rows=await c.inspectHkd({productId:'4',productUrl:url(4),options:[{code:'HF_5_1',name:'필름난방보온재 5T 1m',expected:2500}]});
    assert.equal(rows.length,1);assert.equal(rows[0].status,'일치');assert.equal(rows[0].source,'단일 옵션 · 쿠폰 포함가');
  }
  // 품절 / 우리 표에선 품절·판매중지인데 스토어는 판매중 / 우리 표에서 품절인 옵션이 스토어에 없으면 알리지 않는다
  {
    const {c}=boot(()=>scan(5,[
      {label:'A',code:'X_A',finalPrice:1000,salePrice:1000,soldOut:true},
      {label:'B',code:'X_B',finalPrice:2000,salePrice:2000,soldOut:false},
    ]));
    const rows=await c.inspectHkd({productId:'5',productUrl:url(5),options:[
      {code:'X_A',name:'A',expected:1000},
      {code:'X_B',name:'B',expected:2000,status:'stopped'},
      {code:'X_C',name:'C',expected:3000,status:'soldout'},
    ]});
    assert.equal(rows.map(r=>r.status).join(','),'품절,판매상태 불일치');
  }
  // hkdy가 아닌 스토어 주소는 시작 단계에서 거부, 큐는 상품마다 행을 쌓는다
  {
    const {call}=boot(()=>null);
    const bad=await call('start',{kind:'hkd',items:[{productId:'9',productUrl:'https://smartstore.naver.com/energuardcompany/products/9',options:[{code:'A',name:'A',expected:1}]}]});
    assert.equal(bad.ok,false);
  }
  {
    const {call}=boot(u=>u===url(11)?scan(11,[{label:'A',code:'A',finalPrice:1000,salePrice:1000,soldOut:false}]):null);
    const items=[
      {productId:'11',productUrl:url(11),options:[{code:'A',name:'A',expected:1000}]},
      {productId:'12',productUrl:url(12),options:[{code:'B',name:'B',expected:2000}]},
    ];
    assert.equal((await call('start',{kind:'hkd',items})).ok,true);
    await settle();
    assert.equal(store.priceTest.kind,'hkd');
    assert.equal(store.priceTest.done,2);
    assert.equal(store.priceTest.rows[0].status,'일치');
    assert.equal(store.priceTest.rows[1].status,'수집 실패');
  }
  // 한국단열라이프(hkdylife) — 한국단열과 같은 스마트스토어 구조(2026-09-30, 확장 0.30.4): 스토어 주소를 허용하고, 결과 행에 스토어를 남기고, 검사 채널을 기억한다.
  {
    const lifeUrl=id=>`https://smartstore.naver.com/hkdylife/products/${id}`;
    const lifeScan=(id,rows)=>({ok:true,benefitReady:true,detailUrl:`https://smartstore.naver.com/i/v2/channels/abc/products/${id}`,benefitUrl:'y',productUrl:lifeUrl(id),rows});
    const {c}=boot(()=>lifeScan(31,[{label:'A',code:'GL',finalPrice:500,salePrice:500,soldOut:false},{label:'B',code:'T_SR',finalPrice:2100,salePrice:2100,soldOut:false}]));
    const rows=await c.inspectHkd({productId:'31',productUrl:lifeUrl(31),options:[{code:'GL',name:'A',expected:500},{code:'T_SR',name:'B',expected:2000}]});
    assert.equal(rows[0].status,'일치');assert.equal(rows[0].store,'hkdylife');
    assert.equal(rows[1].status,'불일치');assert.equal(rows[1].diff,100);
    // 주소 안 상품번호가 다르거나(다른 상품), 허용하지 않는 스토어 이름은 거부
    const {call}=boot(()=>null);
    for(const bad of ['https://smartstore.naver.com/hkdylife/products/99','https://smartstore.naver.com/hkdylifex/products/32','https://smartstore.naver.com/otherstore/products/32','https://example.com/hkdylife/products/32']){
      const r=await call('start',{kind:'hkd',channelId:'hkd_life',items:[{productId:'32',productUrl:bad,options:[{code:'A',name:'A',expected:1}]}]});
      assert.equal(r.ok,false,bad);
    }
  }
  {
    const {call}=boot(u=>/hkdylife/.test(u)?{ok:true,benefitReady:true,detailUrl:'https://smartstore.naver.com/i/v2/channels/abc/products/41',benefitUrl:'y',productUrl:u,rows:[{label:'A',code:'A',finalPrice:1000,salePrice:1000,soldOut:false}]}:null);
    const lifeItems=[{productId:'41',productUrl:'https://smartstore.naver.com/hkdylife/products/41',options:[{code:'A',name:'A',expected:1000}]}];
    assert.equal((await call('start',{kind:'hkd',channelId:'hkd_life',items:lifeItems})).ok,true);
    await settle();
    assert.equal(store.priceTest.channelId,'hkd_life');
    assert.equal(store.priceTest.rows[0].status,'일치');assert.equal(store.priceTest.rows[0].store,'hkdylife');
    const status=await call('status');assert.equal(status.state.channelId,'hkd_life');assert.equal(status.state.items,undefined);
    // 채널 이름에 이상한 값이 오면 기록하지 않는다
    await call('start',{kind:'hkd',channelId:'../x<y>',items:lifeItems}).catch(()=>{});
    await settle();
    assert.equal(store.priceTest.channelId,null);
  }
  console.log('PASS hkd: code/name/single matching, sale-price comparison, ambiguity, sold-out/status, store guard(hkdy·hkdylife), queue');
  // 부니몰 홈페이지 — 관리코드가 페이지에 없으므로 이름을 우선하고, 전혀 맞지 않으면서 개수가 같을 때만 등록 순서로 보조 매칭한다.
  {
    const homeUrl=id=>`https://boonimall.kr/goods/view?no=${id}`;
    const homeScan=(id,rows)=>({ok:true,productUrl:homeUrl(id),rows});
    const {c,call}=boot(()=>homeScan(184,[
      {label:'접착식 아이소핑크 10T 600x900 (3장)',finalPrice:12600,instantPrice:12600,salePrice:12600,soldOut:false},
      {label:'접착식 아이소핑크 20T 600x900 (1장)',finalPrice:7100,instantPrice:7100,salePrice:7100,soldOut:false},
    ]));
    const item={productId:'184',productUrl:homeUrl(184),options:[
      {code:'IsoA_600_900_10_3',name:'완전히 다른 내부 이름 A',expected:12600},
      {code:'IsoA_600_900_20_1',name:'완전히 다른 내부 이름 B',expected:7200},
    ]};
    const rows=await c.inspectHkd(item);
    assert.equal(rows[0].store,'boonimall');assert.equal(rows[0].source,'등록 순서 매칭');assert.equal(rows[0].priceKind,'판매가');assert.equal(rows[0].status,'일치');
    assert.equal(rows[1].status,'불일치');assert.equal(rows[1].diff,-100);
    assert.equal((await call('start',{kind:'hkd',channelId:'homepage',items:[item]})).ok,true);
    await settle();assert.equal(store.priceTest.channelId,'homepage');
    for(const bad of ['https://boonimall.kr/goods/view?no=999','https://boonimall.kr/goods/catalog?no=184','https://evil.example/goods/view?no=184']){
      const response=await call('start',{kind:'hkd',channelId:'homepage',items:[{...item,productUrl:bad}]});
      assert.equal(response.ok,false,bad);
    }
  }
  console.log('PASS homepage: boonimall URL guard, sale price, ordered fallback, queue channel');

  // 부니몰 단열벽지는 색상 옵션을 전부 검사하지 않고 상품번호별 대표가 한 건만 비교한다.
  {
    const homeUrl=id=>`https://boonimall.kr/goods/view?no=${id}`;
    const {c}=boot(()=>({ok:true,productUrl:homeUrl(97),basePrice:45000,rows:[
      {label:'42.모노라인',finalPrice:45000,soldOut:false},
      {label:'47.파벽 브라운',finalPrice:45000,soldOut:true},
      {label:'56.플로라',finalPrice:45000,soldOut:false},
    ]}));
    const rows=await c.inspectHkd({productId:'97',productUrl:homeUrl(97),representativeOnly:true,options:[
      {code:'WP_P1_5_10',name:'단열벽지 고급형1 10m',expected:45000}
    ]});
    assert.equal(rows.length,1);assert.equal(rows[0].status,'대표가 일치');assert.equal(rows[0].actual,45000);
    assert.equal(rows[0].code,'WP_P1_5_10');assert.match(rows[0].source,/색상 옵션 3개 제외/);
  }

  // ESM은 G마켓 goodscode·옥션 ItemNo를 따로 열되 같은 단가표 등록가와 비교한다.
  {
    const gm='https://item.gmarket.co.kr/Item?goodscode=4586303844';
    const {c}=boot(()=>({ok:true,marketplace:'gmarket',productId:'4586303844',productUrl:gm,registeredPrice:111300,discountedPrice:104630}));
    const rows=await c.inspectEsm({marketplace:'gmarket',productId:'4586303844',productUrl:gm,code:'BL_13_10_DA',name:'13T 고급형 접착 10m',expected:111300});
    assert.equal(rows.length,1);assert.equal(rows[0].status,'일치');assert.equal(rows[0].actual,111300);assert.equal(rows[0].maxPrice,104630);
  }
  {
    const ac='https://itempage3.auction.co.kr/DetailView.aspx?ItemNo=F392223636';
    const {c}=boot(()=>({ok:true,marketplace:'auction',productId:'F392223636',productUrl:ac,registeredPrice:111300,discountedPrice:104620}));
    const rows=await c.inspectEsm({marketplace:'auction',productId:'F392223636',productUrl:ac,code:'BL_13_10_DA',name:'13T 고급형 접착 10m',expected:111400});
    assert.equal(rows[0].status,'불일치');assert.equal(rows[0].diff,-100);assert.equal(rows[0].store,'auction');
  }
  // 1단 옵션 상품(타이거폼 2K·라이트폼 세트 경질/연질) — 옵션 이름(또는 스토어 옵션명 별칭)으로 짝짓고 등록가(기존가+추가금)를 비교한다.
  {
    const gm='https://item.gmarket.co.kr/Item?goodscode=2031741045';
    const {c}=boot(()=>({ok:true,marketplace:'gmarket',productId:'2031741045',productUrl:gm,registeredPrice:388800,rows:[
      {type:'타이거폼2K 경질(주제+경화제) 1세트',size:'',prices:[388800]},{type:'타이거폼2K 연질(주제+경화제) 1세트',size:'',prices:[421300]}]}));
    const options=[
      {code:'T_2K_H',name:'타이거폼2K 경질',storeName:'타이거폼2K 경질(주제+경화제) 1세트',expected:388800,status:null},
      {code:'T_2K_S',name:'타이거폼2K 연질',storeName:'타이거폼2K 연질(주제+경화제) 1세트',expected:421200,status:null}];
    const rows=await c.inspectEsm({marketplace:'gmarket',productId:'2031741045',productUrl:gm,optionMode:true,options});
    const by=code=>rows.find(r=>r.code===code);
    assert.equal(rows.length,2);assert.equal(by('T_2K_H').status,'일치');assert.equal(by('T_2K_S').status,'불일치');assert.equal(by('T_2K_S').diff,100);
    assert.equal(by('T_2K_H').label,'타이거폼2K 경질(주제+경화제) 1세트');
  }
  // 단열벽지는 그룹상품이 아니라 옵션 상품(단열벽지→사이즈→디자인) — 사이즈별 등록가를 옵션마다 비교한다.
  {
    const gm='https://item.gmarket.co.kr/Item?goodscode=4751750159';
    const rows_=[
      {type:'고급형1_5T',size:'10m',prices:[48600]},{type:'고급형1_5T',size:'20m',prices:[74600]},
      {type:'고급형2_5T',size:'10m',prices:[53000]},{type:'고급형2_5T',size:'20m',prices:[90800]},
      {type:'이중화이트_5T',size:'10m',prices:[58400]},{type:'이중화이트_5T',size:'20m',prices:[97200]},
      {type:'추가형_5T',size:'10m',prices:[70000]},
    ];
    const {c}=boot(()=>({ok:true,marketplace:'gmarket',productId:'4751750159',productUrl:gm,registeredPrice:48600,rows:rows_}));
    const options=[
      ['고급형1 5T x 10m','WP_P1_5_10',48600],['고급형1 5T x 20m','WP_P1_5_20',74600],
      ['고급형2 5T x 10m','WP_P2_5_10',53000],['고급형2 5T x 20m','WP_P2_5_20',90900], // 20m는 일부러 100원 다르게
      ['이중화이트 5T x 10m','WP_DW_5_10',58400],['이중화이트 5T x 20m','WP_DW_5_20',97200],
      ['3D실크벽지 5T x 10m','WP_SK_5_10',54000], // 스토어에 없는 옵션
    ].map(([name,code,expected])=>({code,name:'단열벽지 '+name,expected,status:null}));
    options.push({code:'WP_P1_5_23',name:'단열벽지 고급형1 5T x 2.3m',expected:20600,status:'stopped'}); // 판매중지는 "스토어에 없음"으로 안 본다
    const rows=await c.inspectEsm({marketplace:'gmarket',productId:'4751750159',productUrl:gm,optionMode:true,options});
    const by=code=>rows.find(r=>r.code===code);
    assert.equal(by('WP_P1_5_10').status,'일치');assert.equal(by('WP_P1_5_20').status,'일치');
    assert.equal(by('WP_P2_5_20').status,'불일치');assert.equal(by('WP_P2_5_20').diff,-100);
    assert.equal(by('WP_DW_5_20').status,'일치');
    assert.equal(by('WP_SK_5_10').status,'스토어에 없음');
    assert.ok(!by('WP_P1_5_23'));
    const extra=rows.find(r=>r.status==='단가표에 없음');assert.equal(extra.actual,70000);assert.match(extra.label,/추가형/);
    assert.equal(rows.length,8); // 스토어 7행(매칭 6 + 단가표에 없음 1) + 스토어에 없음 1
  }
  {
    const ac='https://itempage3.auction.co.kr/DetailView.aspx?ItemNo=B395500419';
    // 옥션: 디자인별 추가금이 사이즈 안에서 다르면 어긋난 값을 결과로 남긴다.
    const {c}=boot(()=>({ok:true,marketplace:'auction',productId:'B395500419',productUrl:ac,registeredPrice:48600,rows:[{type:'고급형1_5T',size:'20m',prices:[74600,74700]}]}));
    const rows=await c.inspectEsm({marketplace:'auction',productId:'B395500419',productUrl:ac,optionMode:true,options:[{code:'WP_P1_5_20',name:'단열벽지 고급형1 5T x 20m',expected:74600,status:null}]});
    assert.equal(rows.length,1);assert.equal(rows[0].status,'불일치');assert.equal(rows[0].actual,74700);assert.match(rows[0].source,/디자인별 가격 상이/);
  }
})().catch(e=>{console.error(e);process.exit(1)});
