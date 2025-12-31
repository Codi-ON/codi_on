BEGIN;

-- 테스트 전용이면 OK (운영이면 DROP 금지)
DROP TABLE IF EXISTS public.item_click_log CASCADE;

CREATE TABLE public.item_click_log (
  id               BIGINT GENERATED ALWAYS AS IDENTITY,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  user_id          BIGINT NULL,
  session_id       UUID NULL,
  recommendation_id BIGINT NULL,

  clothing_item_id BIGINT NOT NULL,
  event_type       VARCHAR(50) NOT NULL,
  payload          JSONB NULL,

  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- KST 기준 월 파티션(경계 +09)
CREATE TABLE public.item_click_log_202512
  PARTITION OF public.item_click_log
  FOR VALUES FROM ('2025-12-01 00:00:00+09') TO ('2026-01-01 00:00:00+09');

CREATE TABLE public.item_click_log_202601
  PARTITION OF public.item_click_log
  FOR VALUES FROM ('2026-01-01 00:00:00+09') TO ('2026-02-01 00:00:00+09');

CREATE TABLE public.item_click_log_default
  PARTITION OF public.item_click_log
  DEFAULT;

-- 인덱스(로그 조회 패턴 기준)
CREATE INDEX idx_item_click_log_created_at ON public.item_click_log (created_at);
CREATE INDEX idx_item_click_log_session_id_created_at ON public.item_click_log (session_id, created_at);
CREATE INDEX idx_item_click_log_reco_id ON public.item_click_log (recommendation_id);
CREATE INDEX idx_item_click_log_item_id ON public.item_click_log (clothing_item_id);

COMMIT;

-- smoke test (event_type는 enum/계약에 맞춰)
INSERT INTO public.item_click_log (created_at, user_id, session_id, recommendation_id, clothing_item_id, event_type, payload)
VALUES ('2025-12-16 12:00:00+09', 1, NULL, NULL, 101, 'ITEM_CLICK', '{"ref":"swagger"}'::jsonb);

SELECT tableoid::regclass AS physical_table, *
FROM public.item_click_log
ORDER BY created_at DESC
LIMIT 10;