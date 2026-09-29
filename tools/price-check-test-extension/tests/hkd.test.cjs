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
    runtime:{getManifest:()=>({version:'0.30.1'}),onStartup:{addListener:()=>{}},onMessage:{addListener:f=>listener=f}},
  }};
  vm.createContext(c);vm.runInContext(coreSource,c);vm.runInContext(source,c);
  return {c,call:(action,payload)=>new Promise(resolve=>listener({type:'EG_PRICE_TEST',action,payload},{url:'http://127.0.0.1:5500/index.html'},resolve))};
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,1000));
const scan=(id,rows)=>({ok:true,benefitReady:true,detailUrl:`https://smartstore.naver.com/i/v2/channels/abc/products/${id}`,benefitUrl:'y',productUrl:`https://smartstore.naver.com/hkdy/products/${id}`,rows});
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
  console.log('PASS hkd: code/name/single matching, sale-price comparison, ambiguity, sold-out/status, store guard, queue');
})().catch(e=>{console.error(e);process.exit(1)});
