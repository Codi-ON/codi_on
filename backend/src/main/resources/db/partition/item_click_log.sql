-- 운영 마이그레이션에서는 DROP 금지 (테스트 스크립트로만)
CREATE TABLE IF NOT EXISTS public.item_click_log (
  id                BIGINT GENERATED ALWAYS AS IDENTITY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 세션 테이블과 정합성 맞추기 (둘 중 하나 택1)
  session_key       VARCHAR(64) NOT NULL,
  user_id           BIGINT NULL,

  recommendation_id BIGINT NULL,   -- 있으면 좋음(선택/클릭이 어느 추천에 속하는지)
  clothing_item_id  BIGINT NOT NULL,

  -- 컨벤션: UPPER_SNAKE_CASE
  event_type        VARCHAR(50) NOT NULL,  -- ITEM_CLICK / RECO_ITEM_SELECTED

  payload           JSONB NULL,

  PRIMARY KEY (created_at, id)
) PARTITION BY RANGE (created_at);

-- 파티션 (KST 경계)
CREATE TABLE IF NOT EXISTS public.item_click_log_202601
  PARTITION OF public.item_click_log
  FOR VALUES FROM ('2026-01-01 00:00:00+09') TO ('2026-02-01 00:00:00+09');

CREATE TABLE IF NOT EXISTS public.item_click_log_default
  PARTITION OF public.item_click_log DEFAULT;

-- 인덱스: 대시보드 쿼리 기준 (기간 + topN)
CREATE INDEX IF NOT EXISTS idx_item_click_log_event_created_at
  ON public.item_click_log (event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_item_click_log_item_event_created_at
  ON public.item_click_log (clothing_item_id, event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_item_click_log_session_created_at
  ON public.item_click_log (session_key, created_at);

CREATE INDEX IF NOT EXISTS idx_item_click_log_reco_created_at
  ON public.item_click_log (recommendation_id, created_at);