-- 2026-09-08 사용자가 채팅으로 준 아이소핑크 상품코드 초기 입력(테스트용).
-- pricing_grade_links.sql / pricing_danpum_codes.sql을 먼저 실행한 뒤 이걸 실행할 것.

-- 특호(grade_id='isopink') 단품 — 두께 300T부터 30T까지 28개
insert into public.pricing_danpum_codes (tab_id, grade_id, thickness, product_code) values
  ('isopink', 'isopink', 300, '11311413570'),
  ('isopink', 'isopink', 290, '11311412668'),
  ('isopink', 'isopink', 280, '11311411664'),
  ('isopink', 'isopink', 270, '11311410355'),
  ('isopink', 'isopink', 260, '11311408861'),
  ('isopink', 'isopink', 250, '11292426358'),
  ('isopink', 'isopink', 240, '11292422519'),
  ('isopink', 'isopink', 230, '10310626366'),
  ('isopink', 'isopink', 220, '10310624749'),
  ('isopink', 'isopink', 210, '10310620304'),
  ('isopink', 'isopink', 200, '10310618105'),
  ('isopink', 'isopink', 190, '10310616334'),
  ('isopink', 'isopink', 180, '10310610944'),
  ('isopink', 'isopink', 170, '10310608690'),
  ('isopink', 'isopink', 160, '10310606441'),
  ('isopink', 'isopink', 150, '10310604491'),
  ('isopink', 'isopink', 140, '10310602559'),
  ('isopink', 'isopink', 130, '10310600806'),
  ('isopink', 'isopink', 120, '10310599011'),
  ('isopink', 'isopink', 110, '10310597063'),
  ('isopink', 'isopink', 100, '10310584661'),
  ('isopink', 'isopink', 90,  '10310581445'),
  ('isopink', 'isopink', 80,  '10310579678'),
  ('isopink', 'isopink', 70,  '10310578146'),
  ('isopink', 'isopink', 60,  '10310575017'),
  ('isopink', 'isopink', 50,  '10310572187'),
  ('isopink', 'isopink', 40,  '10310570196'),
  ('isopink', 'isopink', 30,  '10310568460')
on conflict (tab_id, grade_id, thickness) do update set product_code = excluded.product_code;

-- 특호 모음전 코드 1개
insert into public.pricing_grade_links (tab_id, grade_id, moeum_code) values
  ('isopink', 'isopink', '10297531860')
on conflict (tab_id, grade_id) do update set moeum_code = excluded.moeum_code;

-- 1호(grade_id='1ho') 단품 — 20T, 10T 두 개만 등록됨
insert into public.pricing_danpum_codes (tab_id, grade_id, thickness, product_code) values
  ('isopink', '1ho', 20, '10310566503'),
  ('isopink', '1ho', 10, '10310564564')
on conflict (tab_id, grade_id, thickness) do update set product_code = excluded.product_code;
