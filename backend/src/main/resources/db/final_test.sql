ROLLBACK;
SET search_path = public;

-- helper: 컬럼 존재 여부
CREATE OR REPLACE FUNCTION pg_temp.col_exists(p_tbl text, p_col text)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = p_tbl
      AND column_name  = p_col
  );
$$;

DO $$
DECLARE
  v_now timestamptz := now();
  v_session_key text := 'sess_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);

  -- session insert builder
  s_cols text[] := ARRAY[]::text[];
  s_vals text[] := ARRAY[]::text[];
  s_sql  text;

  -- session_log insert builder
  l_cols text[] := ARRAY[]::text[];
  l_vals text[] := ARRAY[]::text[];
  l_sql  text;

  -- event_type 감지
  sl_event_col text;
  sl_event_udt text;

  quoted_cols text;
  quoted_vals text;
BEGIN
  --------------------------------------------------------------------
  -- 0) 테이블 존재 체크
  --------------------------------------------------------------------
  IF to_regclass('public.session') IS NULL THEN
    RAISE EXCEPTION 'public.session not exists';
  END IF;

  IF to_regclass('public.session_log') IS NULL THEN
    RAISE EXCEPTION 'public.session_log not exists';
  END IF;

  --------------------------------------------------------------------
  -- 1) session 먼저 INSERT (있는 컬럼만)
  --------------------------------------------------------------------
  s_cols := ARRAY[]::text[];
  s_vals := ARRAY[]::text[];

  -- session_key / key 류
  IF pg_temp.col_exists('session','session_key') THEN
    s_cols := array_append(s_cols,'session_key');
    s_vals := array_append(s_vals, quote_literal(v_session_key));
  ELSIF pg_temp.col_exists('session','session_id') THEN
    s_cols := array_append(s_cols,'session_id');
    s_vals := array_append(s_vals, quote_literal(v_session_key));
  ELSIF pg_temp.col_exists('session','key') THEN
    s_cols := array_append(s_cols,'key');
    s_vals := array_append(s_vals, quote_literal(v_session_key));
  ELSE
    -- session 로그 FK가 session_key를 요구하는데 session 테이블에 키 컬럼이 없으면 설계 불일치라 바로 중단
    RAISE EXCEPTION 'session table has no session_key/session_id/key column';
  END IF;

  -- created_at / updated_at
  IF pg_temp.col_exists('session','created_at') THEN
    s_cols := array_append(s_cols,'created_at'); s_vals := array_append(s_vals, quote_literal(v_now));
  END IF;
  IF pg_temp.col_exists('session','updated_at') THEN
    s_cols := array_append(s_cols,'updated_at'); s_vals := array_append(s_vals, quote_literal(v_now));
  END IF;

  -- status 류 (있으면 ACTIVE 같은 값)
  IF pg_temp.col_exists('session','status') THEN
    s_cols := array_append(s_cols,'status'); s_vals := array_append(s_vals, quote_literal('ACTIVE'));
  END IF;

  -- last_seen_at 류
  IF pg_temp.col_exists('session','last_seen_at') THEN
    s_cols := array_append(s_cols,'last_seen_at'); s_vals := array_append(s_vals, quote_literal(v_now));
  END IF;

  -- ip / user_agent 류
  IF pg_temp.col_exists('session','ip') THEN
    s_cols := array_append(s_cols,'ip'); s_vals := array_append(s_vals, quote_literal('127.0.0.1'));
  END IF;
  IF pg_temp.col_exists('session','user_agent') THEN
    s_cols := array_append(s_cols,'user_agent'); s_vals := array_append(s_vals, quote_literal('seed-script'));
  END IF;

  SELECT string_agg(quote_ident(c), ', ') INTO quoted_cols FROM unnest(s_cols) c;
  SELECT string_agg(v, ', ') INTO quoted_vals FROM unnest(s_vals) v;

  s_sql := format('INSERT INTO public.session (%s) VALUES (%s);', quoted_cols, quoted_vals);
  EXECUTE s_sql;

  --------------------------------------------------------------------
  -- 2) session_log.event_type 컬럼/타입 감지
  --------------------------------------------------------------------
  IF pg_temp.col_exists('session_log','event_type') THEN
    sl_event_col := 'event_type';
  ELSIF pg_temp.col_exists('session_log','session_event_type') THEN
    sl_event_col := 'session_event_type';
  ELSIF pg_temp.col_exists('session_log','type') THEN
    sl_event_col := 'type';
  ELSE
    sl_event_col := NULL;
  END IF;

  IF sl_event_col IS NOT NULL THEN
    SELECT c.udt_name
      INTO sl_event_udt
    FROM information_schema.columns c
    WHERE c.table_schema='public'
      AND c.table_name='session_log'
      AND c.column_name=sl_event_col;
  END IF;

  --------------------------------------------------------------------
  -- 3) session_log INSERT (FK 맞춰서 session_key 넣기)
  --------------------------------------------------------------------
  l_cols := ARRAY[]::text[];
  l_vals := ARRAY[]::text[];

  -- FK 컬럼명: session_key / session_id 둘 중 무엇인지 감지
  IF pg_temp.col_exists('session_log','session_key') THEN
    l_cols := array_append(l_cols,'session_key');
    l_vals := array_append(l_vals, quote_literal(v_session_key));
  ELSIF pg_temp.col_exists('session_log','session_id') THEN
    l_cols := array_append(l_cols,'session_id');
    l_vals := array_append(l_vals, quote_literal(v_session_key));
  ELSE
    RAISE EXCEPTION 'session_log has no session_key/session_id column';
  END IF;

  -- event_type
  IF sl_event_col IS NOT NULL THEN
    l_cols := array_append(l_cols, sl_event_col);
    IF sl_event_udt IS NULL OR sl_event_udt IN ('text','varchar','bpchar') THEN
      l_vals := array_append(l_vals, quote_literal('START'));
    ELSE
      l_vals := array_append(l_vals, format('%L::%I', 'START', sl_event_udt));
    END IF;
  END IF;

  -- occurred_at / created_at / payload
  IF pg_temp.col_exists('session_log','occurred_at') THEN
    l_cols := array_append(l_cols,'occurred_at'); l_vals := array_append(l_vals, quote_literal(v_now));
  END IF;
  IF pg_temp.col_exists('session_log','created_at') THEN
    l_cols := array_append(l_cols,'created_at'); l_vals := array_append(l_vals, quote_literal(v_now));
  END IF;
  IF pg_temp.col_exists('session_log','payload') THEN
    l_cols := array_append(l_cols,'payload'); l_vals := array_append(l_vals, quote_literal('{}'));
  END IF;

  SELECT string_agg(quote_ident(c), ', ') INTO quoted_cols FROM unnest(l_cols) c;
  SELECT string_agg(v, ', ') INTO quoted_vals FROM unnest(l_vals) v;

  l_sql := format('INSERT INTO public.session_log (%s) VALUES (%s);', quoted_cols, quoted_vals);
  EXECUTE l_sql;

  RAISE NOTICE 'OK. session=% , session_log inserted.', v_session_key;
END $$;

---- 검증 -----
SELECT COUNT(*) FROM public.session;
SELECT COUNT(*) FROM public.session_log;

SELECT * FROM public.session ORDER BY 1 DESC LIMIT 5;
SELECT * FROM public.session_log ORDER BY 1 DESC LIMIT 5;
---------------