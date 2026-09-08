-- 아이소핑크 1호 신설로 10T/20T가 특호(grade_id='isopink') 범위에서 빠지면서,
-- 그 두께에 이미 등록돼 있던 경쟁사가 데이터가 화면에서 안 보이게 됐다(그대로 DB에는
-- 남아있음). 1호(grade_id='1ho')의 같은 두께 행으로 옮겨서 다시 보이게 한다.
-- 대상 값은 2026-09-08 조회 시점 기준(10T: 산일상사 3000원, 20T: 산일상사 7000원/대유물류 5800원).
insert into public.competitor_prices (tab_id, grade_id, thickness, comp1_price, comp1_link, comp2_price, comp2_link, comp3_price, comp3_link)
values
  ('isopink', '1ho', 10, null, null, 3000, 'https://smartstore.naver.com/sanil/products/13165280361', null, null),
  ('isopink', '1ho', 20, null, null, 7000, 'https://smartstore.naver.com/sanil/products/13165280361', 5800,
    'https://baro0909.com/ecatalog5.php?ssub=%EC%95%84%EC%9D%B4%EC%86%8C%ED%95%91%ED%81%AC&n_media=122875&n_query=%EC%95%84%EC%9D%B4%EC%86%8C%ED%95%91%ED%81%AC&n_rank=12&n_ad_group=grp-a001-01-000000055412671&n_ad=nad-a001-01-000000421746486&n_keyword_id=nkw-a001-01-000007551315552&n_keyword=%EC%95%84%EC%9D%B4%EC%86%8C%ED%95%91%ED%81%AC&n_campaign_type=1&n_ad_group_type=1&n_match=1&NaPm=ct%3Dmqzywq3b%7Cci%3DERfa9e6353%2D7422%2D11f1%2D8ff1%2D825df9ecc1e1%7Ctr%3Dsa%7Chk%3D603330e3644b13473c4ccebb3f6a08b4c913f223%7Cnacn%3DQeqKD4BmJR9cA')
on conflict (tab_id, grade_id, thickness) do update set
  comp2_price = excluded.comp2_price, comp2_link = excluded.comp2_link,
  comp3_price = excluded.comp3_price, comp3_link = excluded.comp3_link;
