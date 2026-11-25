/* 판매 종료 채널 (2026-11-25, 사용자 지시 "11번가랑 ESM 상품 모두 판매중지, 두 채널에서 이제 판매 안 할 거야")
   여기 적힌 채널은 상품·옵션 전부를 판매중지로 본다. 단가표 표시·반영 대기·옵션 엑셀이 모두 item.status를 읽으므로 코드 기본값(seedStatus)을 판매중지로 두고,
   DB에 저장된 예전 판매상태(pricing-hankook-db.js)는 이 채널에서는 무시한다. 다시 판매하려면 CLOSED_CHANNELS에서 채널을 빼면 된다.
   (스토어의 실제 판매중지는 11번가 셀러오피스·ESM+에서 따로 처리한다.) */
window.HK_CLOSED_CHANNELS = ['11st', 'esm'];
(function closeChannels() {
  if (typeof HK_CHANNEL_LISTINGS === 'undefined') return;
  window.HK_CLOSED_CHANNELS.forEach(channelId => {
    (HK_CHANNEL_LISTINGS[channelId] || []).forEach(product => {
      product.items.forEach(item => { item.status = 'stopped'; item.seedStatus = 'stopped'; });
    });
  });
})();
