-- R0_dev_reset_session_tables.sql
-- 로컬/개발: session 계열 테이블만 싹 밀고 다시 만든다 (타입/제약/파티션 꼬임 제거)

ROLLBACK; -- 혹시 이전 트랜잭션 죽어있으면 정리

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS public.recommendation_event_log CASCADE;
DROP TABLE IF EXISTS public.session_log CASCADE;
DROP TABLE IF EXISTS public.app_session CASCADE;

-- 1) app_session (세션의 “정답 테이블”)
CREATE TABLE public.app_session (
    session_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     bigint NULL,
    session_key varchar(100) NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_session_user_id     ON public.app_session(user_id);
CREATE INDEX IF NOT EXISTS idx_app_session_created_at  ON public.app_session(created_at);

-- 2) session_log (파티션: created_at 기준)
CREATE TABLE public.session_log (
    id          bigint GENERATED ALWAYS AS IDENTITY,
    created_at  timestamptz NOT NULL DEFAULT now(),
    user_id     bigint NULL,
    event_type  varchar(50) NOT NULL,
    payload     jsonb NULL,
    session_key varchar(100) NULL,
    session_id  uuid NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE public.session_log_default
    PARTITION OF public.session_log DEFAULT;

CREATE INDEX IF NOT EXISTS idx_session_log_session_id   ON public.session_log(session_id);
CREATE INDEX IF NOT EXISTS idx_session_log_user_id      ON public.session_log(user_id);
CREATE INDEX IF NOT EXISTS idx_session_log_created_at   ON public.session_log(created_at);

-- 3) recommendation_event_log (파티션: created_at 기준)
CREATE TABLE public.recommendation_event_log (
    id               bigint GENERATED ALWAYS AS IDENTITY,
    created_at        timestamptz NOT NULL DEFAULT now(),
    user_id          bigint NULL,
    session_id       uuid NULL,
    recommendation_id bigint NULL,
    event_type       varchar(50) NOT NULL,
    payload          jsonb NULL,
    session_key      varchar(100) NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE public.recommendation_event_log_default
    PARTITION OF public.recommendation_event_log DEFAULT;

CREATE INDEX IF NOT EXISTS idx_reco_event_log_session_id ON public.recommendation_event_log(session_id);
CREATE INDEX IF NOT EXISTS idx_reco_event_log_user_id    ON public.recommendation_event_log(user_id);
CREATE INDEX IF NOT EXISTS idx_reco_event_log_created_at ON public.recommendation_event_log(created_at);