-- =========================================================
-- V1: 현재 테이블 기준으로 "퍼널/타임라인/스키마/인덱스" 검증
-- =========================================================

-- (선택) 이전에 에러난 트랜잭션이 남아있으면 1번 실행
ROLLBACK;

-- =========================================
-- 0) 테이블 현황/기간 확인
-- =========================================
SELECT 'recommendation_event_log' AS t, COUNT(*) AS cnt,
       MIN(created_at) AS min_created_at, MAX(created_at) AS max_created_at
FROM public.recommendation_event_log;

SELECT 'item_click_log' AS t, COUNT(*) AS cnt,
       MIN(created_at) AS min_created_at, MAX(created_at) AS max_created_at
FROM public.item_click_log;

-- =========================================
-- 1) 퍼널 집계 (하루 범위 예시: 2025-12-12 KST)
-- created_at이 timestamptz 기준이라고 가정
-- =========================================
WITH params AS (
  SELECT
    TIMESTAMPTZ '2025-12-12 00:00:00+09' AS from_ts,
    TIMESTAMPTZ '2025-12-13 00:00:00+09' AS to_ts
),
base AS (
  SELECT l.*
  FROM public.recommendation_event_log l, params p
  WHERE l.created_at >= p.from_ts
    AND l.created_at <  p.to_ts
)
SELECT
  (SELECT from_ts FROM params) AS from_inclusive_kst,
  (SELECT to_ts   FROM params) AS to_exclusive_kst,

  COUNT(*) FILTER (WHERE event_type = 'CHECKLIST_SUBMITTED') AS checklist_submitted,
  COUNT(*) FILTER (WHERE event_type = 'RECO_GENERATED')      AS reco_generated,
  COUNT(*) FILTER (WHERE event_type = 'RECO_SHOWN')          AS reco_shown,
  COUNT(*) FILTER (WHERE event_type = 'ITEM_SELECTED')       AS item_selected,
  COUNT(*) FILTER (WHERE event_type = 'FEEDBACK_SUBMITTED')  AS feedback_submitted,
  COUNT(*) FILTER (WHERE event_type = 'RECO_COMPLETED')      AS reco_completed
FROM base;

-- =========================================
-- 2) 샘플 reco_id 하나 뽑고, 타임라인 보기 (CTE 끊기면 안 됨)
-- =========================================
WITH picked AS (
  SELECT recommendation_id AS reco_id
  FROM public.recommendation_event_log
  WHERE recommendation_id IS NOT NULL
  ORDER BY created_at DESC, id DESC
  LIMIT 1
),
timeline AS (
  SELECT
    l.id,
    l.created_at,
    l.user_id,
    l.session_id,
    l.session_key,
    l.recommendation_id,
    l.event_type,
    CASE WHEN l.payload IS NULL THEN NULL ELSE l.payload::text END AS payload_json
  FROM public.recommendation_event_log l
  JOIN picked p ON l.recommendation_id = p.reco_id
  ORDER BY l.created_at, l.id
)
SELECT 'SAMPLE_TIMELINE' AS section, t.*
FROM timeline t;

-- =========================================
-- 3) (선택) reco_id 기준으로 "세션 값이 채워져 있는지" 확인
--  - uuid에 MAX() 쓰지 말고 최신 1건으로 뽑는다.
-- =========================================
WITH picked AS (
  SELECT recommendation_id AS reco_id
  FROM public.recommendation_event_log
  WHERE recommendation_id IS NOT NULL
  ORDER BY created_at DESC, id DESC
  LIMIT 1
),
latest_session AS (
  SELECT l.session_id, l.session_key
  FROM public.recommendation_event_log l
  JOIN picked p ON l.recommendation_id = p.reco_id
  WHERE (l.session_id IS NOT NULL OR l.session_key IS NOT NULL)
  ORDER BY l.created_at DESC, l.id DESC
  LIMIT 1
)
SELECT
  'SAMPLE_SESSION_PRESENCE' AS section,
  (SELECT reco_id FROM picked) AS reco_id,
  EXISTS (SELECT 1 FROM latest_session WHERE session_id IS NOT NULL) AS has_session_id,
  EXISTS (SELECT 1 FROM latest_session WHERE session_key IS NOT NULL) AS has_session_key,
  (SELECT session_id FROM latest_session)  AS sample_session_id,
  (SELECT session_key FROM latest_session) AS sample_session_key;

-- =========================================
-- 4) clothing_item 스키마 확인 + (권장) 유니크 인덱스 적용
-- =========================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name='clothing_item'
ORDER BY ordinal_position;

-- ⚠️ 주의:
-- 이 인덱스는 "clothing_id가 전역에서 유니크"라는 전제가 있어야만 안전.
-- 만약 사용자별로 같은 clothing_id를 쓸 수 있게 설계할 거면(멀티테넌트),
-- 이 인덱스는 나중에 (user_id, clothing_id) 또는 (closet_id, clothing_id)로 바꿔야 함.
CREATE UNIQUE INDEX IF NOT EXISTS uq_clothing_item_clothing_id
  ON public.clothing_item(clothing_id);