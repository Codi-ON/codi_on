WITH target AS (
  SELECT r.recommendation_key
  FROM recommendation r
  WHERE r.recommendation_key = ':recoKey'
  LIMIT 1
)
SELECT
  t.recommendation_key,

  -- recommendation 본문 (컬럼 바뀌어도 안전)
  to_jsonb(r) AS recommendation,

  COALESCE((
    SELECT jsonb_agg(to_jsonb(c))
    FROM recommendation_item_candidate c
    WHERE c.recommendation_key = t.recommendation_key
  ), '[]'::jsonb) AS candidates,

  COALESCE((
    SELECT jsonb_agg(to_jsonb(ch))
    FROM recommendation_checklist ch
    WHERE ch.recommendation_key = t.recommendation_key
  ), '[]'::jsonb) AS checklist,

  COALESCE((
    SELECT jsonb_agg(to_jsonb(fb))
    FROM recommendation_feedback fb
    WHERE fb.recommendation_key = t.recommendation_key
  ), '[]'::jsonb) AS feedback,

  COALESCE((
    SELECT jsonb_agg(to_jsonb(ev))
    FROM recommendation_event_log ev
    WHERE ev.recommendation_key = t.recommendation_key
  ), '[]'::jsonb) AS event_logs

FROM target t
JOIN recommendation r
  ON r.recommendation_key = t.recommendation_key;