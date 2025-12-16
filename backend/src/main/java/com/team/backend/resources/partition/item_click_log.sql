BEGIN;

CREATE SCHEMA IF NOT EXISTS public;

-- ✅ 기존 테이블 있으면 제거(테스트용). 운영이면 DROP 금지.
DROP TABLE IF EXISTS public.item_click_log CASCADE;

-- ✅ 부모(파티션) 테이블
CREATE TABLE public.item_click_log (
                                       id              BIGINT GENERATED ALWAYS AS IDENTITY,
                                       created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

                                       user_id         BIGINT NULL,
                                       clothing_item_id BIGINT NOT NULL,
                                       event_type      VARCHAR(50) NOT NULL,
                                       payload         JSONB NULL,

    -- 🔥 파티션 키(created_at)를 PK에 포함해야 함
                                       PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- ✅ 이번달 파티션(예: 2025-12)
CREATE TABLE public.item_click_log_202512
    PARTITION OF public.item_click_log
        FOR VALUES FROM ('2025-12-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');

-- ✅ 다음달 파티션(예: 2026-01) - 필요하면 유지
CREATE TABLE public.item_click_log_202601
    PARTITION OF public.item_click_log
        FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-02-01 00:00:00+00');

-- ✅ 안전망(default)
CREATE TABLE public.item_click_log_default
    PARTITION OF public.item_click_log
        DEFAULT;

-- ✅ 인덱스(부모에 생성하면 파티션별 인덱스로 관리됨)
CREATE INDEX idx_item_click_log_created_at ON public.item_click_log (created_at);
CREATE INDEX idx_item_click_log_user_id ON public.item_click_log (user_id);
CREATE INDEX idx_item_click_log_item_id ON public.item_click_log (clothing_item_id);

COMMIT;

-- =========================
-- ✅ 눈으로 확인용 스모크 테스트
-- =========================

INSERT INTO public.item_click_log (created_at, user_id, clothing_item_id, event_type, payload)
VALUES ('2025-12-16 12:00:00+09', 1, 101, 'CLICK', '{"ref":"swagger"}'::jsonb);

-- 어디 파티션으로 들어갔는지(물리 테이블)
SELECT tableoid::regclass AS physical_table, *
FROM public.item_click_log
ORDER BY created_at DESC
LIMIT 10;

-- 파티션 목록 확인
SELECT
    c.relname AS partition_name,
    pg_get_expr(c.relpartbound, c.oid) AS bound
FROM pg_class c
         JOIN pg_inherits i ON i.inhrelid = c.oid
WHERE i.inhparent = 'public.item_click_log'::regclass
ORDER BY 1;