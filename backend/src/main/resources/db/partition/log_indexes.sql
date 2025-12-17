-- ============================================================
-- Log Tables Indexes (Partitioned Tables Safe Script)
-- - recommendation_event_log
-- - session_log
-- - item_click_log
-- PostgreSQL
-- ============================================================

SET search_path TO public;

DO $$
    DECLARE
        has_user_id          boolean;
        has_session_key      boolean;
        has_event_type       boolean;
        has_payload          boolean;
        has_item_id          boolean;
        has_clothing_item_id boolean;
    BEGIN
        -- ==========================================================
        -- 1) recommendation_event_log
        -- ==========================================================
        IF to_regclass('public.recommendation_event_log') IS NULL THEN
            RAISE NOTICE '[SKIP] public.recommendation_event_log not found';
        ELSE
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='recommendation_event_log' AND column_name='created_at'
            ) INTO has_payload; -- 임시 재사용(변수명 의미만 다름)

            -- created_at 인덱스 (기간조회/정렬)
            IF has_payload THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reco_event_log_created_at
               ON public.recommendation_event_log (created_at DESC)';
            END IF;

            -- event_type + created_at (타입별 집계/최근순)
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='recommendation_event_log' AND column_name='event_type'
            ) INTO has_event_type;

            IF has_event_type AND has_payload THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reco_event_log_event_type_created_at
               ON public.recommendation_event_log (event_type, created_at DESC)';
            END IF;

            RAISE NOTICE '[OK] recommendation_event_log indexes ensured';
        END IF;

        -- ==========================================================
        -- 2) session_log
        -- ==========================================================
        IF to_regclass('public.session_log') IS NULL THEN
            RAISE NOTICE '[SKIP] public.session_log not found';
        ELSE
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='session_log' AND column_name='created_at'
            ) INTO has_payload;

            -- created_at 인덱스 (기간조회/정렬)
            IF has_payload THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_session_log_created_at
               ON public.session_log (created_at DESC)';
            END IF;

            -- user_id + created_at
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='session_log' AND column_name='user_id'
            ) INTO has_user_id;

            IF has_user_id AND has_payload THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_session_log_user_id_created_at
               ON public.session_log (user_id, created_at DESC)';
            END IF;

            -- session_key + created_at
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='session_log' AND column_name='session_key'
            ) INTO has_session_key;

            IF has_session_key AND has_payload THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_session_log_session_key_created_at
               ON public.session_log (session_key, created_at DESC)';
            END IF;

            -- event_type + created_at
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='session_log' AND column_name='event_type'
            ) INTO has_event_type;

            IF has_event_type AND has_payload THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_session_log_event_type_created_at
               ON public.session_log (event_type, created_at DESC)';
            END IF;

            RAISE NOTICE '[OK] session_log indexes ensured';
        END IF;

        -- ==========================================================
        -- 3) item_click_log
        -- ==========================================================
        IF to_regclass('public.item_click_log') IS NULL THEN
            RAISE NOTICE '[SKIP] public.item_click_log not found';
        ELSE
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='item_click_log' AND column_name='created_at'
            ) INTO has_payload;

            -- created_at 인덱스
            IF has_payload THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_item_click_log_created_at
               ON public.item_click_log (created_at DESC)';
            END IF;

            -- user_id + created_at
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='item_click_log' AND column_name='user_id'
            ) INTO has_user_id;

            IF has_user_id AND has_payload THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_item_click_log_user_id_created_at
               ON public.item_click_log (user_id, created_at DESC)';
            END IF;

            -- clothing_item_id(우선) 또는 item_id(대체) + created_at
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='item_click_log' AND column_name='clothing_item_id'
            ) INTO has_clothing_item_id;

            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='item_click_log' AND column_name='item_id'
            ) INTO has_item_id;

            IF has_clothing_item_id AND has_payload THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_item_click_log_clothing_item_id_created_at
               ON public.item_click_log (clothing_item_id, created_at DESC)';
            ELSIF has_item_id AND has_payload THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_item_click_log_item_id_created_at
               ON public.item_click_log (item_id, created_at DESC)';
            END IF;

            -- event_type + created_at (있으면)
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='item_click_log' AND column_name='event_type'
            ) INTO has_event_type;

            IF has_event_type AND has_payload THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_item_click_log_event_type_created_at
               ON public.item_click_log (event_type, created_at DESC)';
            END IF;

            RAISE NOTICE '[OK] item_click_log indexes ensured';
        END IF;
    END $$;

-- 통계 갱신(개발환경이면 추천)
ANALYZE public.recommendation_event_log;
ANALYZE public.session_log;
ANALYZE public.item_click_log;