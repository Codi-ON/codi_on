-- recommendation_event_log: 월별 RANGE 파티셔닝 (2025-12, 2026-01 + default)

BEGIN;

-- 0) 혹시 남아있던 이전 테이블/파티션 깨끗하게 제거
DROP TABLE IF EXISTS public.recommendation_event_log CASCADE;

-- 1) 부모(파티션 루트) 테이블 생성
CREATE TABLE public.recommendation_event_log (
    id                BIGSERIAL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id           BIGINT,
    session_id        UUID,
    recommendation_id BIGINT,
    event_type        VARCHAR(50) NOT NULL,
    payload           JSONB,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 2) 2025-12 파티션
CREATE TABLE public.recommendation_event_log_202512
    PARTITION OF public.recommendation_event_log
        FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- 3) 2026-01 파티션 (원하면 유지, 아니면 지워도 됨)
CREATE TABLE public.recommendation_event_log_202601
    PARTITION OF public.recommendation_event_log
        FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- 4) 기본(default) 파티션 – 범위 밖 데이터 보호용
CREATE TABLE public.recommendation_event_log_default
    PARTITION OF public.recommendation_event_log
        DEFAULT;

COMMIT;