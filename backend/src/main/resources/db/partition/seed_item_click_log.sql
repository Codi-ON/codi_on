-- seed_item_click_log.sql
-- 목표: 대시보드(/admin/dashboard/clicks)에서 클릭 추이/TopN이 보이게 시드 데이터 생성

-- 1) 사용할 clothing_item id 풀
WITH items AS (
  SELECT id
  FROM clothing_item
  ORDER BY id
  LIMIT 20
),
days AS (
  -- 원하는 기간으로 조절
  SELECT generate_series(date '2025-12-01', date '2025-12-04', interval '1 day')::date AS d
),
rows AS (
  -- 날짜 * 아이템 * n번(랜덤) 생성
  SELECT
    (d::timestamp
      + (random() * interval '23 hours')
      + (random() * interval '59 minutes')
    ) AT TIME ZONE 'Asia/Seoul' AS created_at,
    id AS clothing_item_id
  FROM days
  CROSS JOIN items
  CROSS JOIN LATERAL generate_series(1, (1 + floor(random() * 6))::int) g
)
INSERT INTO item_click_log (
  created_at,
  user_id,
  clothing_item_id,
  event_type,
  payload,
  session_id,
  recommendation_id
)
SELECT
  r.created_at,
  NULL, -- user_id가 NOT NULL이면 여기 수정(아래 가이드 참고)
  r.clothing_item_id,
  'ITEM_CLICK',
  NULL, -- payload가 NOT NULL이면 '{}' 로 변경
  NULL, -- session_id가 NOT NULL이면 gen_random_uuid() 또는 uuid_generate_v4() 사용
  NULL
FROM rows r;

-- 기간 내 클릭 수
SELECT created_at::date AS d, COUNT(*)
FROM item_click_log
WHERE created_at::date BETWEEN date '2025-12-01' AND date '2025-12-04'
GROUP BY created_at::date
ORDER BY d;

-- TopN
SELECT clothing_item_id, COUNT(*) AS clicks
FROM item_click_log
WHERE created_at::date BETWEEN date '2025-12-01' AND date '2025-12-04'
GROUP BY clothing_item_id
ORDER BY clicks DESC
LIMIT 10;