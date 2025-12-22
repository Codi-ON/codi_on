-- R3_dev_seed_one_cycle_min.sql
-- app_session + session_log + reco_event_log에 한 사이클 이벤트를 “같은 session_id”로 찍는다.

ROLLBACK;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id    bigint;
  v_session_id uuid;
  v_session_key text;
BEGIN
  -- 1) user 1명 확보 (없으면 생성)
  IF to_regclass('public.app_user') IS NOT NULL THEN
    SELECT id INTO v_user_id FROM public.app_user ORDER BY id LIMIT 1;
    IF v_user_id IS NULL THEN
      INSERT INTO public.app_user DEFAULT VALUES RETURNING id INTO v_user_id;
    END IF;
  ELSE
    -- app_user 없으면 user_id는 NULL로 진행
    v_user_id := NULL;
  END IF;

  -- 2) session 생성 (정답은 app_session)
  v_session_id := gen_random_uuid();
  v_session_key := md5(random()::text || clock_timestamp()::text);

  INSERT INTO public.app_session(session_id, user_id, session_key, created_at)
  VALUES (v_session_id, v_user_id, v_session_key, now());

  -- 3) session_log (event_type NOT NULL 주의, id는 identity라 넣지 말 것)
  INSERT INTO public.session_log(user_id, event_type, payload, session_key, session_id, created_at)
  VALUES
    (v_user_id, 'START',        jsonb_build_object('source','dev-seed'), v_session_key, v_session_id, now()),
    (v_user_id, 'ACTIVE',       jsonb_build_object('step','weather'),    v_session_key, v_session_id, now()),
    (v_user_id, 'END',          jsonb_build_object('done',true),         v_session_key, v_session_id, now());

  -- 4) recommendation_event_log (같은 session_id로 단계 이벤트)
  INSERT INTO public.recommendation_event_log(user_id, session_id, recommendation_id, event_type, payload, session_key, created_at)
  VALUES
    (v_user_id, v_session_id, 1, 'WEATHER_FETCHED',        jsonb_build_object('region','SEOUL','temp',5), v_session_key, now()),
    (v_user_id, v_session_id, 1, 'CHECKLIST_SUBMITTED',    jsonb_build_object('windy',false,'rainProb',0), v_session_key, now()),
    (v_user_id, v_session_id, 1, 'RECOMMENDATION_SHOWN',   jsonb_build_object('strategy','DEFAULT'), v_session_key, now()),
    (v_user_id, v_session_id, 1, 'FEEDBACK_SUBMITTED',     jsonb_build_object('like',true), v_session_key, now());

  RAISE NOTICE 'seed ok: session_id=% user_id=%', v_session_id, v_user_id;
END $$;

-- 확인
SELECT * FROM public.app_session ORDER BY created_at DESC LIMIT 5;
SELECT * FROM public.session_log ORDER BY created_at DESC LIMIT 20;
SELECT * FROM public.recommendation_event_log ORDER BY created_at DESC LIMIT 20;