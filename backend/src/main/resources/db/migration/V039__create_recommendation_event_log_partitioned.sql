-- V038__create_recommendation_event_log_partitioned.sql
-- recommendation_event_log: 월별 RANGE 파티션 (occurred_at 기준) + DEFAULT 파티션
-- 기존 테이블이 파티션이 아니면 rename 후 마이그레이션
BEGIN;

-- 1) 기존 recommendation_event_log가 있고 "파티션 테이블(relkind='p')"이 아니면 rename
DO $$
    DECLARE
        kind char;
    BEGIN
        SELECT c.relkind INTO kind
        FROM pg_class c
                 JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'recommendation_event_log';

        IF kind IS NOT NULL AND kind <> 'p' THEN
            -- 이미 old가 있으면 충돌나니까 날짜 suffix 붙이기
            IF EXISTS (
                SELECT 1 FROM pg_class c
                                  JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' AND c.relname = 'recommendation_event_log_old'
            ) THEN
                EXECUTE 'ALTER TABLE recommendation_event_log RENAME TO recommendation_event_log_old_' || to_char(now(), 'YYYYMMDD_HH24MISS');
            ELSE
                EXECUTE 'ALTER TABLE recommendation_event_log RENAME TO recommendation_event_log_old';
            END IF;
        END IF;
    END $$;

-- 2) 파티션 부모 테이블 생성
CREATE TABLE IF NOT EXISTS recommendation_event_log (
                                                        id            bigserial PRIMARY KEY,
                                                        occurred_at   timestamptz NOT NULL DEFAULT now(),
                                                        event_type    varchar(40) NOT NULL,
                                                        session_key   varchar(80),
                                                        recommendation_id bigint,
                                                        clothing_id   bigint,
                                                        payload       jsonb,
                                                        created_at    timestamptz NOT NULL DEFAULT now()
) PARTITION BY RANGE (occurred_at);

-- 3) 인덱스(부모에 선언하면 파티션에도 생성되는 형태로 운영 가능)
CREATE INDEX IF NOT EXISTS idx_reco_event_occurred_at ON recommendation_event_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_reco_event_session_key ON recommendation_event_log (session_key);
CREATE INDEX IF NOT EXISTS idx_reco_event_type ON recommendation_event_log (event_type);

-- 4) 파티션 생성: 이번달/다음달/다다음달 + DEFAULT (중복/overlap 안전)
DO $$
    DECLARE
        m0 date := date_trunc('month', now())::date;
        m1 date := (date_trunc('month', now()) + interval '1 month')::date;
        m2 date := (date_trunc('month', now()) + interval '2 month')::date;
        m3 date := (date_trunc('month', now()) + interval '3 month')::date;

        part_name text;
        from_ts   timestamptz;
        to_ts     timestamptz;
    BEGIN
        -- (A) range partitions
        FOR part_name, from_ts, to_ts IN
            SELECT format('recommendation_event_log_%s', to_char(m0,'YYYY_MM')), m0::timestamptz, m1::timestamptz
            UNION ALL
            SELECT format('recommendation_event_log_%s', to_char(m1,'YYYY_MM')), m1::timestamptz, m2::timestamptz
            UNION ALL
            SELECT format('recommendation_event_log_%s', to_char(m2,'YYYY_MM')), m2::timestamptz, m3::timestamptz
            LOOP
                BEGIN
                    EXECUTE format(
                            'CREATE TABLE %I PARTITION OF recommendation_event_log FOR VALUES FROM (%L) TO (%L);',
                            part_name, from_ts, to_ts
                            );
                EXCEPTION
                    WHEN duplicate_table THEN
                        -- 같은 이름 테이블이 이미 있으면 스킵
                        NULL;
                    WHEN invalid_object_definition THEN
                        -- ✅ 42P17 overlap: 같은 기간 파티션이 "다른 이름"으로 이미 있으면 스킵
                        NULL;
                END;
            END LOOP;

        -- (B) DEFAULT partition
        BEGIN
            EXECUTE 'CREATE TABLE IF NOT EXISTS recommendation_event_log_default PARTITION OF recommendation_event_log DEFAULT;';
        EXCEPTION
            WHEN duplicate_table THEN NULL;
            WHEN invalid_object_definition THEN NULL;
        END;
    END $$;

COMMIT;