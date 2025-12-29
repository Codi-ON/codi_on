-- V042__query_latest_recommendation_detail_fixed.sql
-- 목적: session_key 고정값으로 최신 reco 1건 + 관련 데이터(후보/체크리스트/피드백/이벤트로그) JSON 1행 반환
-- 고정 세션키: sess_demo_001

WITH target AS (
  SELECT r.recommendation_key
  FROM recommendation r
  WHERE r.session_key = 'sess_demo_001'
  ORDER BY r.created_at DESC
  LIMIT 1
)
SELECT
  t.recommendation_key,

  -- recommendation 본문(컬럼명 바뀌어도 안전)
  (SELECT to_jsonb(r)
   FROM recommendation r
   WHERE r.recommendation_key = t.recommendation_key) AS recommendation,

  COALESCE((
    SELECT jsonb_agg(to_jsonb(c) ORDER BY c.created_at DESC NULLS LAST)
    FROM recommendation_item_candidate c
    WHERE c.recommendation_key = t.recommendation_key
  ), '[]'::jsonb) AS candidates,

  COALESCE((
    SELECT jsonb_agg(to_jsonb(ch) ORDER BY ch.created_at DESC NULLS LAST)
    FROM recommendation_checklist ch
    WHERE ch.recommendation_key = t.recommendation_key
  ), '[]'::jsonb) AS checklist,

  COALESCE((
    SELECT jsonb_agg(to_jsonb(f) ORDER BY f.created_at DESC NULLS LAST)
    FROM recommendation_feedback f
    WHERE f.recommendation_key = t.recommendation_key
  ), '[]'::jsonb) AS feedbacks,

  COALESCE((
    SELECT jsonb_agg(to_jsonb(ev) ORDER BY ev.occurred_at DESC NULLS LAST)
    FROM recommendation_event_log ev
    WHERE ev.recommendation_key = t.recommendation_key
  ), '[]'::jsonb) AS event_logs

FROM target t;