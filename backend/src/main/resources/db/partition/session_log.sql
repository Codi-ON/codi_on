-- =========================================================
-- SESSION_LOG (월별 RANGE 파티셔닝) - 한번에 실행용
-- 파일: src/main/resources/partition/session_log.sql
-- =========================================================

BEGIN;

-- 0) (선택) 기존 테이블 있으면 통째로 재생성
-- 운영이면 주석 유지하고, 로컬/개발에서만 필요하면 주석 해제
DROP TABLE IF EXISTS public.session_log CASCADE;

-- 1) 부모(파티션) 테이블 생성
CREATE TABLE IF NOT EXISTS public.session_log
(
    id          BIGINT GENERATED ALWAYS AS IDENTITY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 최소 필드(원하면 추가 확장)
    user_id     BIGINT      NULL,
    session_key VARCHAR(64) NOT NULL,
    event_type  VARCHAR(50) NOT NULL,
    payload     JSONB       NULL,

    -- ✅ 파티션 키 포함 필수
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 2) 파티션 생성 (이번달/다음달 + DEFAULT)
-- 필요하면 월만 바꿔서 계속 추가하면 됨

-- 2025-12
CREATE TABLE IF NOT EXISTS public.session_log_202512
    PARTITION OF public.session_log
        FOR VALUES FROM ('2025-12-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');

-- 2026-01
CREATE TABLE IF NOT EXISTS public.session_log_202601
    PARTITION OF public.session_log
        FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-02-01 00:00:00+00');

-- 범위 밖 데이터 안전장치
CREATE TABLE IF NOT EXISTS public.session_log_default
    PARTITION OF public.session_log
        DEFAULT;

-- 3) 인덱스 (파티션 테이블에 생성하면 하위 파티션에도 생성됨)
CREATE INDEX IF NOT EXISTS idx_session_log_created_at
    ON public.session_log (created_at);

CREATE INDEX IF NOT EXISTS idx_session_log_user_id
    ON public.session_log (user_id);

CREATE INDEX IF NOT EXISTS idx_session_log_session_key
    ON public.session_log (session_key);

CREATE INDEX IF NOT EXISTS idx_session_log_event_type
    ON public.session_log (event_type);

-- 4) 스모크 테스트용 insert (원치 않으면 주석 처리)
INSERT INTO public.session_log (created_at, user_id, session_key, event_type, payload)
VALUES (now(), NULL, 'S_SMOKE_001', 'SMOKE_TEST', '{
  "ok": true
}'::jsonb);

COMMIT;


-- 확인 쿼리(필요 시 따로 실행)
SELECT to_regclass('public.session_log');
SELECT c.relname
FROM pg_inherits i
         JOIN pg_class c ON c.oid = i.inhrelid
WHERE i.inhparent = 'public.session_log'::regclass
ORDER BY 1;
--
-- INSERT가 어느 파티션에 들어갔는지 확인:
-- SELECT tableoid::regclass AS physical_table, *
--   FROM public.session_log
--  ORDER BY created_at DESC
--  LIMIT 10;
