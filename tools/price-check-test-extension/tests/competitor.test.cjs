const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const path=require('path');
const coreSource=fs.readFileSync(path.join(__dirname,'../price-core.js'),'utf8');
const source=fs.readFileSync(path.join(__dirname,'../worker.js'),'utf8');
const store={},alarms=new Map();
function boot(scanByUrl){
  let listener,lastTabUrl=null;
  // 폴링 루프(delay(1000))가 실제로 1초씩 기다리지 않도록 setTimeout의 ms를 무시한다 —
  // 순서 보장을 위해 여전히 진짜 setTimeout(콜백,0)을 쓴다.
  const c={crypto:require('crypto').webcrypto,URL,AbortSignal,setTimeout:(fn)=>global.setTimeout(fn,0),importScripts:()=>{},chrome:{
    tabs:{
      create:async({url})=>{lastTabUrl=url;return {id:1};},
      sendMessage:async()=>{
        const scan=scanByUrl(lastTabUrl);
        if(!scan)throw Error('no route');
        return scan;
      },
      remove:async()=>{},
    },
    storage:{local:{get:async key=>structuredClone({[key]:store[key]}),set:async obj=>Object.assign(store,structuredClone(obj)),remove:async key=>delete store[key]}},
    alarms:{create:async(name,data)=>alarms.set(name,data),get:async n=>alarms.get(n),clear:async n=>alarms.delete(n),onAlarm:{addListener:()=>{}}},
    runtime:{getManifest:()=>({version:'0.29.13'}),onStartup:{addListener:()=>{}},onMessage:{addListener:f=>listener=f}},
  }};
  vm.createContext(c);vm.runInContext(coreSource,c);vm.runInContext(source,c);
  return {c,call:(action,payload)=>new Promise(resolve=>listener({type:'EG_PRICE_TEST',action,payload},{url:'http://127.0.0.1:5500/index.html'},resolve))};
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,1000));
const okScan=rows=>({ok:true,benefitReady:true,detailUrl:'x',benefitUrl:'y',rows});

(async()=>{
  // 옵션 없음 단일가 — 그대로 비교
  {
    const {c}=boot(()=>okScan([{label:'(옵션 없음)',finalPrice:10000,soldOut:false}]));
    const rows=await c.inspectCompetitor('https://smartstore.naver.com/rival/products/1',[{thickness:30,recordedPrice:10000,compName:'A'}]);
    assert.equal(rows[0].status,'일치');
    const rows2=await c.inspectCompetitor('https://smartstore.naver.com/rival/products/1',[{thickness:30,recordedPrice:9000,compName:'A'}]);
    assert.equal(rows2[0].status,'불일치');
    assert.equal(rows2[0].diff,1000);
  }
  // 링크 하나가 여러 두께에 재사용됐는데(entries 2개+) 페이지엔 옵션이 1개(단품)뿐이면
  // 그 단일가를 아무 entry에나 갖다붙이지 않는다 — 라벨에서 두께를 읽어 맞는 것만 비교하고
  // 나머지는 "옵션 자동 매칭 불가"(2026-09-15, 비드법에서 같은 링크가 30T~300T 전부에
  // 재사용돼 전부 불일치로 잘못 뜨던 버그 재현).
  {
    const {c}=boot(()=>okScan([{label:'(옵션 없음)',finalPrice:4800,soldOut:false}]));
    const rows=await c.inspectCompetitor('https://smartstore.naver.com/rival/products/30',[
      {thickness:30,recordedPrice:4800,compName:'대유물류'},
      {thickness:40,recordedPrice:6400,compName:'대유물류'},
      {thickness:50,recordedPrice:8000,compName:'대유물류'},
    ]);
    assert.equal(rows[0].status,'옵션 자동 매칭 불가');
    assert.equal(rows[1].status,'옵션 자동 매칭 불가');
    assert.equal(rows[2].status,'옵션 자동 매칭 불가');
    assert.equal(rows[0].actual,null);
  }
  // 위와 같은 상황이라도 라벨에 두께가 박혀있으면(예: 단품 이름에 "30T") 그 하나는 비교한다
  {
    const {c}=boot(()=>okScan([{label:'비드법단열재 2종3호 30T',finalPrice:4800,soldOut:false}]));
    const rows=await c.inspectCompetitor('https://smartstore.naver.com/rival/products/31',[
      {thickness:30,recordedPrice:4800,compName:'대유물류'},
      {thickness:40,recordedPrice:6400,compName:'대유물류'},
    ]);
    assert.equal(rows[0].status,'일치');
    assert.equal(rows[1].status,'옵션 자동 매칭 불가');
  }
  // 같은 두께가 소형/대형으로 중복되면 등급의 규격까지 함께 매칭
  {
    const {c}=boot(()=>okScan([
      {label:'심재준불연 50T / 600x1200',finalPrice:7260,soldOut:false},
      {label:'심재준불연 50T / 900x1800',finalPrice:16340,soldOut:false},
    ]));
    const rows=await c.inspectCompetitor('https://smartstore.naver.com/rival/products/20',[
      {gradeId:'ib_06',thickness:50,recordedPrice:7260,compName:'A'},
      {gradeId:'ib_09',thickness:50,recordedPrice:16340,compName:'A'},
    ]);
    assert.equal(rows[0].status,'일치');
    assert.equal(rows[0].actual,7260);
    assert.equal(rows[1].status,'일치');
    assert.equal(rows[1].actual,16340);
  }
  // 할인 없는 상품은 benefit 응답 없이도 상세 salePrice 기반 행으로 비교
  {
    const {c}=boot(()=>({ok:true,benefitReady:false,detailUrl:'x',benefitUrl:null,rows:[{label:'30T',finalPrice:4800,soldOut:false}]}));
    const rows=await c.inspectCompetitor('https://smartstore.naver.com/rival/products/21',[
      {gradeId:'ia2',thickness:30,recordedPrice:4800,compName:'B'},
    ]);
    assert.equal(rows[0].status,'일치');
  }
  // 옵션 여러 개 — 두께로 유일하게 매칭되면 비교
  {
    const {c}=boot(()=>okScan([
      {label:'30T',finalPrice:5000,soldOut:false},
      {label:'40T',finalPrice:6000,soldOut:false},
    ]));
    const rows=await c.inspectCompetitor('https://smartstore.naver.com/rival/products/2',[
      {thickness:30,recordedPrice:5000,compName:'A'},
      {thickness:40,recordedPrice:6500,compName:'A'},
    ]);
    assert.equal(rows[0].status,'일치');
    assert.equal(rows[1].status,'불일치');
  }
  // 옵션 여러 개인데 두께가 안 겹치거나(0개) 중복되면(2개 이상) 추측하지 않는다
  {
    const {c}=boot(()=>okScan([
      {label:'30T',finalPrice:5000,soldOut:false},
      {label:'30T',finalPrice:5200,soldOut:false},
      {label:'50T',finalPrice:7000,soldOut:false},
    ]));
    const rows=await c.inspectCompetitor('https://smartstore.naver.com/rival/products/3',[
      {thickness:30,recordedPrice:5000,compName:'A'}, // 30T가 2개 — 애매
      {thickness:40,recordedPrice:6000,compName:'A'}, // 40T 없음 — 매칭 불가
    ]);
    assert.equal(rows[0].status,'옵션 자동 매칭 불가');
    assert.equal(rows[1].status,'옵션 자동 매칭 불가');
  }
  // 품절
  {
    const {c}=boot(()=>okScan([{label:'(옵션 없음)',finalPrice:0,soldOut:true}]));
    const rows=await c.inspectCompetitor('https://smartstore.naver.com/rival/products/4',[{thickness:30,recordedPrice:5000,compName:'A'}]);
    assert.equal(rows[0].status,'품절');
  }
  // 스마트스토어가 아닌 주소는 시작 단계에서 거부
  {
    const {call}=boot(()=>null);
    const res=await call('start',{kind:'competitor',items:[{link:'https://www.coupang.com/vp/products/1',entries:[{thickness:30,recordedPrice:1000,compName:'A'}]}]});
    assert.equal(res.ok,false);
  }
  // 큐 통합 — 링크 여러 개(=아이템), 각 아이템 여러 entries, 실패 시 entries 전부 실패행으로
  {
    const scans={
      'https://smartstore.naver.com/rival/products/10':okScan([{label:'(옵션 없음)',finalPrice:1000,soldOut:false}]),
      'https://smartstore.naver.com/rival/products/11':null, // throws -> 실패
    };
    const {call}=boot(url=>{
      if(url==='https://smartstore.naver.com/rival/products/11')throw Error('할인 정보 수집 실패');
      return scans[url];
    });
    const items=[
      {link:'https://smartstore.naver.com/rival/products/10',entries:[{thickness:30,recordedPrice:1000,compName:'A'}]},
      {link:'https://smartstore.naver.com/rival/products/11',entries:[{thickness:30,recordedPrice:1000,compName:'B'},{thickness:40,recordedPrice:2000,compName:'B'}]},
    ];
    assert.equal((await call('start',{kind:'competitor',items})).ok,true);
    // setTimeout이 즉시 발화하도록 모킹돼 있어 자동 체이닝이 큐 전체를 이어서 처리한다
    // (실제 확장에서는 NEXT_DELAY_MS만큼 실제로 기다림) — settle()로 체인이 끝날 때까지 기다린다.
    await settle();
    assert.equal(store.priceTest.done,2);
    assert.equal(store.priceTest.running,false);
    assert.equal(store.priceTest.rows[0].status,'일치');
    assert.equal(store.priceTest.rows.length,3);
    assert.equal(store.priceTest.rows[1].status,'수집 실패');
    assert.equal(store.priceTest.rows[2].status,'수집 실패');
    // status 응답엔 items(entries 포함)가 안 실린다 — 기존 own 모드와 동일 규칙
    const status=await call('status');
    assert.equal(status.state.items,undefined);
  }
  console.log('PASS competitor: single/reused-link-multi-thickness/spec/matched/ambiguous/soldout/no-benefit options, non-store link rejected, queue integration + failure rows');
})().catch(e=>{console.error(e);process.exit(1)});
