-- A0xx__create_admin_monthly_top_clicked_item.sql
CREATE TABLE IF NOT EXISTS public.admin_monthly_top_clicked_item (
  month_start       date        NOT NULL,
  region            text        NOT NULL,

  clothing_item_id  bigint      NOT NULL,
  click_count       bigint      NOT NULL DEFAULT 0,

  rank_no           int         NOT NULL,          -- 1..N
  created_at        timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (month_start, region, rank_no)
);

-- 월/지역 조회 + 정렬
CREATE INDEX IF NOT EXISTS idx_admin_monthly_top_clicked_item_month
  ON public.admin_monthly_top_clicked_item (month_start DESC);

CREATE INDEX IF NOT EXISTS idx_admin_monthly_top_clicked_item_region_month
  ON public.admin_monthly_top_clicked_item (region, month_start DESC);

-- 아이템 기준 분석용(선택)
CREATE INDEX IF NOT EXISTS idx_admin_monthly_top_clicked_item_item
  ON public.admin_monthly_top_clicked_item (clothing_item_id);