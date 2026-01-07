-- =========================================================
-- SESSION_LOG (월별 RANGE 파티셔닝, KST 경계 +09)
-- 목적: B안(MVP) "요청 들어오면 HEARTBEAT로 간주" 로그 적재용
-- 파일 예시: src/main/resources/partition/session_log.sql
-- =========================================================

BEGIN;

-- [개발/로컬 전용] 완전 초기화가 필요할 때만 사용 (운영이면 절대 금지)
-- DROP TABLE IF EXISTS public.session_log CASCADE;

-- 1) 부모(파티션) 테이블
CREATE TABLE IF NOT EXISTS public.session_log
(
    id          BIGINT GENERATED ALWAYS AS IDENTITY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    user_id     BIGINT       NULL,
    session_key VARCHAR(64)  NOT NULL,   -- X-Session-Key (UUID v4 문자열)
    event_type  VARCHAR(50)  NOT NULL,   -- START/HEARTBEAT/END/ERROR/...
    payload     JSONB        NULL,

    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 2) 파티션 (KST 기준 월 경계 +09)
-- 필요 시 월 단위로 계속 추가

-- 2025-12
CREATE TABLE IF NOT EXISTS public.session_log_202512
    PARTITION OF public.session_log
    FOR VALUES FROM ('2025-12-01 00:00:00+09') TO ('2026-01-01 00:00:00+09');

-- 2026-01
CREATE TABLE IF NOT EXISTS public.session_log_202601
    PARTITION OF public.session_log
    FOR VALUES FROM ('2026-01-01 00:00:00+09') TO ('2026-02-01 00:00:00+09');

-- 2026-02
CREATE TABLE IF NOT EXISTS public.session_log_202602
    PARTITION OF public.session_log
    FOR VALUES FROM ('2026-02-01 00:00:00+09') TO ('2026-03-01 00:00:00+09');

-- 범위 밖 안전장치
CREATE TABLE IF NOT EXISTS public.session_log_default
    PARTITION OF public.session_log
    DEFAULT;

-- 3) 인덱스 (대시보드 집계/필터 패턴 기준)
CREATE INDEX IF NOT EXISTS idx_session_log_created_at
    ON public.session_log (created_at);

CREATE INDEX IF NOT EXISTS idx_session_log_session_key_created_at
    ON public.session_log (session_key, created_at);

CREATE INDEX IF NOT EXISTS idx_session_log_event_type_created_at
    ON public.session_log (event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_session_log_user_id_created_at
    ON public.session_log (user_id, created_at);

COMMIT;

-- === 확인용 (원하면 별도 실행) ===

-- SELECT to_regclass('public.session_log');
-- SELECT c.relname
-- FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid
-- WHERE i.inhparent = 'public.session_log'::regclass
-- ORDER BY 1;
--
-- INSERT가 어느 파티션에 들어갔는지 확인:
-- SELECT tableoid::regclass AS physical_table, *
-- FROM public.session_log
-- ORDER BY created_at DESC
-- LIMIT 20;