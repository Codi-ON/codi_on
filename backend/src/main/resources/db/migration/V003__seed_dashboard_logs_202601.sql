-- Vxxx__seed_dashboard_logs_202601.sql
-- 목적: 월간 대시보드(admin_monthly_kpi, admin_monthly_top_clicked_item) 집계가 "바로" 보이게 로그 더미 생성
-- 기간: 2026-01-01 00:00:00+09 ~ 2026-02-01 00:00:00+09

BEGIN;

-- 0) 기준 시간(UTC+9) 만들기: timestamptz는 ISO8601로 넣으면 안전
-- 2026-01-01T00:00:00+09:00 부터 31일

-- 1) 세션/세션로그 더미
-- session 테이블이 있으면 거기에 넣어도 되는데, KPI는 session_log만 보면 됨.
-- session_log 컬럼은 보통: (id, session_id, user_id, event_type, created_at, ...) 형태.
-- 너 스키마가 다르면 컬럼명만 맞춰라.

-- user_id는 일부만 채워 uniqueUsers > 0 되게 구성
-- session_id는 20개 세션 생성, 각 세션에 START/HEARTBEAT/END + 일부 ERROR
WITH
days AS (
  SELECT generate_series(0, 30) AS d
),
sessions AS (
  SELECT
    ('sess-' || d::text || '-' || s::text) AS session_id,
    CASE WHEN s % 3 = 0 THEN ('user-' || (s % 5)::text) ELSE NULL END AS user_id, -- 일부만 유저 부여
    d AS day_offset,
    s AS sidx
  FROM days
  JOIN generate_series(1, 20) AS s ON true
),
events AS (
  SELECT session_id, user_id, 'START'::text AS event_type,
         (TIMESTAMPTZ '2026-01-01 00:00:00+09:00' + (day_offset || ' days')::interval + (sidx || ' minutes')::interval) AS created_at
  FROM sessions
  UNION ALL
  SELECT session_id, user_id, 'HEARTBEAT',
         (TIMESTAMPTZ '2026-01-01 00:00:00+09:00' + (day_offset || ' days')::interval + (sidx || ' minutes')::interval + interval '10 minutes')
  FROM sessions
  UNION ALL
  SELECT session_id, user_id, 'END',
         (TIMESTAMPTZ '2026-01-01 00:00:00+09:00' + (day_offset || ' days')::interval + (sidx || ' minutes')::interval + interval '20 minutes')
  FROM sessions
  UNION ALL
  -- 10% 정도 에러 이벤트
  SELECT session_id, user_id, 'ERROR',
         (TIMESTAMPTZ '2026-01-01 00:00:00+09:00' + (day_offset || ' days')::interval + (sidx || ' minutes')::interval + interval '5 minutes')
  FROM sessions
  WHERE (sidx % 10) = 0
)
INSERT INTO public.session_log (session_id, user_id, event_type, created_at)
SELECT session_id, user_id, event_type, created_at
FROM events;

-- 2) 추천 이벤트 로그 더미 (EMPTY/GENERATED 섞기)
-- 컬럼: (id, event_type, created_at, ...) 정도라 가정
WITH days AS (
  SELECT generate_series(0, 30) AS d
),
reco AS (
  SELECT
    CASE WHEN (d % 4) = 0 THEN 'RECO_TODAY_EMPTY' ELSE 'RECO_TODAY_GENERATED' END AS event_type,
    (TIMESTAMPTZ '2026-01-01 00:00:00+09:00' + (d || ' days')::interval + interval '12 hours') AS created_at
  FROM days
)
INSERT INTO public.recommendation_event_log (event_type, created_at)
SELECT event_type, created_at
FROM reco;

-- 3) 클릭 로그 더미 (TopClicked 편향)
-- item_click_log이 clothing_item_id를 쓰는지 clothing_id를 쓰는지 너 ERD대로 맞춰야 함.
-- 너 월간 TopClicked 집계 SQL은 item_click_log.l.clothing_item_id 기준이었음.
-- => 여기서는 clothing_item_id(PK)를 넣음.

-- Top 3 아이템에 클릭이 몰리도록 구성
WITH hot_items AS (
  SELECT id AS clothing_item_id
  FROM public.clothing_item
  ORDER BY id
  LIMIT 3
),
other_items AS (
  SELECT id AS clothing_item_id
  FROM public.clothing_item
  ORDER BY id
  OFFSET 3
  LIMIT 20
),
clicks AS (
  -- hot 3개는 하루 30클릭씩(총 31일)
  SELECT
    hi.clothing_item_id,
    (TIMESTAMPTZ '2026-01-01 00:00:00+09:00' + (d || ' days')::interval + (n || ' minutes')::interval) AS created_at
  FROM hot_items hi
  JOIN generate_series(0, 30) d ON true
  JOIN generate_series(1, 30) n ON true

  UNION ALL

  -- 기타 아이템은 하루 3클릭씩
  SELECT
    oi.clothing_item_id,
    (TIMESTAMPTZ '2026-01-01 00:00:00+09:00' + (d || ' days')::interval + (n || ' minutes')::interval + interval '3 hours') AS created_at
  FROM other_items oi
  JOIN generate_series(0, 30) d ON true
  JOIN generate_series(1, 3) n ON true
)
INSERT INTO public.item_click_log (clothing_item_id, created_at)
SELECT clothing_item_id, created_at
FROM clicks;

COMMIT;