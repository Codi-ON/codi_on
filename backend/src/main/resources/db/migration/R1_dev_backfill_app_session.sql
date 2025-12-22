-- R1_dev_backfill_app_session.sql
-- FK 걸기 전에 app_session에 “존재해야 하는 session_id”를 먼저 채운다.

ROLLBACK;

-- session_log 기반 backfill
INSERT INTO public.app_session(session_id, user_id, session_key, created_at)
SELECT
    s.session_id,
    MAX(s.user_id)      AS user_id,
    MAX(s.session_key)  AS session_key,
    MIN(s.created_at)   AS created_at
FROM public.session_log s
WHERE s.session_id IS NOT NULL
GROUP BY s.session_id
ON CONFLICT (session_id) DO UPDATE
SET
    user_id = COALESCE(EXCLUDED.user_id, public.app_session.user_id),
    session_key = COALESCE(EXCLUDED.session_key, public.app_session.session_key),
    created_at = LEAST(public.app_session.created_at, EXCLUDED.created_at);

-- recommendation_event_log 기반 backfill
INSERT INTO public.app_session(session_id, user_id, session_key, created_at)
SELECT
    r.session_id,
    MAX(r.user_id)      AS user_id,
    MAX(r.session_key)  AS session_key,
    MIN(r.created_at)   AS created_at
FROM public.recommendation_event_log r
WHERE r.session_id IS NOT NULL
GROUP BY r.session_id
ON CONFLICT (session_id) DO UPDATE
SET
    user_id = COALESCE(EXCLUDED.user_id, public.app_session.user_id),
    session_key = COALESCE(EXCLUDED.session_key, public.app_session.session_key),
    created_at = LEAST(public.app_session.created_at, EXCLUDED.created_at);