-- R__seed_one_cycle_with_session.sql
-- 목적: 날씨 -> 체크리스트 -> 추천 -> 피드백 흐름을 recommendation_event_log에 남기기
-- 전제: recommendation_event_log.session_id는 NOT NULL이고, bigint(=session_log.id)로 운용

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id        BIGINT;
  v_closet_id      BIGINT;
  v_session_log_id BIGINT;
  v_session_key    TEXT;
  v_session_uuid   UUID;
  v_reco_id        BIGINT;
  v_clothing_id    BIGINT;
BEGIN
  -- 1) 유저 1명 확보 (없으면 생성)
  SELECT id INTO v_user_id
  FROM public.app_user
  ORDER BY id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    INSERT INTO public.app_user DEFAULT VALUES
    RETURNING id INTO v_user_id;
  END IF;

  -- 2) default closet 확보
  SELECT id INTO v_closet_id
  FROM public.closet
  WHERE user_id = v_user_id AND name = 'default'
  ORDER BY id
  LIMIT 1;

  IF v_closet_id IS NULL THEN
    INSERT INTO public.closet(user_id, name, created_at)
    VALUES (v_user_id, 'default', now())
    RETURNING id INTO v_closet_id;
  END IF;

  -- 3) 옷 1개 최소 생성(필수 컬럼 위주)
  v_clothing_id := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;

  INSERT INTO public.clothing_item(
      clothing_id, name, category, thickness_level, usage_type,
      suitable_min_temp, suitable_max_temp,
      user_id, closet_id
  )
  VALUES (
      v_clothing_id,
      'seed-item',
      'TOP',
      'NORMAL',
      'BOTH',
      10, 25,
      v_user_id, v_closet_id
  )
  ON CONFLICT (clothing_id) DO NOTHING;

  -- 4) session_log 생성 (event_type NOT NULL 주의)
  v_session_key  := md5(random()::text || clock_timestamp()::text);
  v_session_uuid := gen_random_uuid();
  v_session_log_id := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000000)::BIGINT + (random() * 1000)::BIGINT;

  INSERT INTO public.session_log(
      id, created_at, user_id, event_type, payload, session_key, session_id
  )
  VALUES (
      v_session_log_id, now(), v_user_id,
      'START',
      jsonb_build_object('source','seed'),
      v_session_key,
      v_session_uuid
  );

  -- 5) recommendation_id 생성(임의)
  v_reco_id := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;

  -- 6) recommendation_event_log에 “한 싸이클” 이벤트 4개 적재
  INSERT INTO public.recommendation_event_log(
      created_at, user_id, session_id, session_key, recommendation_id, event_type, payload
  )
  VALUES
    (now(), v_user_id, v_session_log_id, v_session_key, v_reco_id, 'WEATHER_FETCHED',
      jsonb_build_object('region','SEOUL','temp',5,'feelsLike',2)),
    (now(), v_user_id, v_session_log_id, v_session_key, v_reco_id, 'CHECKLIST_SUBMITTED',
      jsonb_build_object('isRainy',false,'isWindy',false,'indoorOutdoor','BOTH')),
    (now(), v_user_id, v_session_log_id, v_session_key, v_reco_id, 'RECOMMENDATION_CREATED',
      jsonb_build_object('strategy','DEFAULT','pickedClothingId', v_clothing_id)),
    (now(), v_user_id, v_session_log_id, v_session_key, v_reco_id, 'FEEDBACK_SUBMITTED',
      jsonb_build_object('liked',true,'reason','seed'));
END $$;