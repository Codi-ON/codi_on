-- V037__seed_recommendation_event_log.sql
-- 목적: recommendation_event_log 테스트용 시드 5건
-- 특징:
--  - 존재하는 컬럼만 넣음
--  - occurred_at/created_at/event_at 중 실제 존재하는 컬럼을 파티션 키로 자동 선택
--  - recommendation_key (NOT NULL) 있으면 자동 주입 (reco_seed_001~005)
--  - event_type이 ENUM이면 enum 첫 값 자동 선택

DO $$
DECLARE
  part_col   TEXT;   -- partition key column name
  event_udt  TEXT;
  event_val  TEXT;

  has_session_key        BOOLEAN;
  has_event_type         BOOLEAN;
  has_payload            BOOLEAN;
  has_recommendation_key BOOLEAN;

  cols TEXT;
  vals TEXT;
  sql_text TEXT;

  i INT;
BEGIN
  -- 0) 테이블 존재 확인
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema='public'
      AND table_name='recommendation_event_log'
  ) THEN
    RAISE NOTICE 'skip seed: recommendation_event_log not found';
    RETURN;
  END IF;

  -- 1) 파티션 키 컬럼 자동 감지
  SELECT c.column_name
    INTO part_col
  FROM information_schema.columns c
  WHERE c.table_schema='public'
    AND c.table_name='recommendation_event_log'
    AND c.column_name IN ('occurred_at','created_at','event_at')
  ORDER BY CASE c.column_name
            WHEN 'occurred_at' THEN 1
            WHEN 'created_at'  THEN 2
            WHEN 'event_at'    THEN 3
           END
  LIMIT 1;

  IF part_col IS NULL THEN
    RAISE NOTICE 'skip seed: partition key column not found (occurred_at/created_at/event_at)';
    RETURN;
  END IF;

  -- 2) 컬럼 존재 플래그
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_event_log' AND column_name='session_key'
  ) INTO has_session_key;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_event_log' AND column_name='event_type'
  ) INTO has_event_type;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_event_log' AND column_name='payload'
  ) INTO has_payload;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_event_log' AND column_name='recommendation_key'
  ) INTO has_recommendation_key;

  -- 3) session upsert (session 테이블이 있고, 로그에 session_key 있을 때만)
  IF has_session_key
     AND EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema='public' AND table_name='session'
     )
  THEN
    INSERT INTO session (session_key, created_at, last_seen_at)
    VALUES ('sess_demo_001', now(), now())
    ON CONFLICT (session_key)
    DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at;
  END IF;

  -- 4) event_type 값 준비 (ENUM이면 enum 첫 값)
  IF has_event_type THEN
    SELECT c.udt_name
      INTO event_udt
    FROM information_schema.columns c
    WHERE c.table_schema='public'
      AND c.table_name='recommendation_event_log'
      AND c.column_name='event_type'
    LIMIT 1;

    IF EXISTS (SELECT 1 FROM pg_type t WHERE t.typname = event_udt AND t.typtype = 'e') THEN
      SELECT e.enumlabel
        INTO event_val
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = event_udt
      ORDER BY e.enumsortorder
      LIMIT 1;
    ELSE
      event_val := 'RECO_SHOWN';
    END IF;
  END IF;

  -- 5) 5건 insert (각 row마다 recommendation_key 유니크)
  FOR i IN 1..5 LOOP
    cols := '';
    vals := '';

    IF has_session_key THEN
      cols := cols || 'session_key,';
      vals := vals || quote_literal('sess_demo_001') || ',';
    END IF;

    IF has_recommendation_key THEN
      cols := cols || 'recommendation_key,';
      vals := vals || quote_literal('reco_seed_' || lpad(i::text, 3, '0')) || ',';
    END IF;

    IF has_event_type THEN
      cols := cols || 'event_type,';
      vals := vals || quote_literal(event_val) || ',';
    END IF;

    IF has_payload THEN
      cols := cols || 'payload,';
      vals := vals || quote_literal('{"source":"seed"}') || '::jsonb,';
    END IF;

    -- partition key는 무조건 포함
    cols := cols || format('%I,', part_col);
    vals := vals || format('(now() + (%s || '' seconds'')::interval),', (i - 1) * 5);

    -- trailing comma 제거
    cols := left(cols, length(cols) - 1);
    vals := left(vals, length(vals) - 1);

    sql_text := format('INSERT INTO recommendation_event_log (%s) VALUES (%s);', cols, vals);
    EXECUTE sql_text;
  END LOOP;
END $$;