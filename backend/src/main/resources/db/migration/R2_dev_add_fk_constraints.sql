-- R2_dev_add_fk_constraints.sql
-- 로컬/개발은 VALID로 그냥 걸어도 됨 (데이터 적음)

ROLLBACK;

-- app_session.user_id -> app_user.id (있으면)
DO $$
BEGIN
  IF to_regclass('public.app_user') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_session_user') THEN
      ALTER TABLE public.app_session
        ADD CONSTRAINT fk_app_session_user
        FOREIGN KEY (user_id) REFERENCES public.app_user(id);
    END IF;
  END IF;
END $$;

-- session_log.session_id -> app_session.session_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_session_log_app_session') THEN
    ALTER TABLE public.session_log
      ADD CONSTRAINT fk_session_log_app_session
      FOREIGN KEY (session_id) REFERENCES public.app_session(session_id);
  END IF;
END $$;

-- recommendation_event_log.session_id -> app_session.session_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reco_event_log_app_session') THEN
    ALTER TABLE public.recommendation_event_log
      ADD CONSTRAINT fk_reco_event_log_app_session
      FOREIGN KEY (session_id) REFERENCES public.app_session(session_id);
  END IF;
END $$;