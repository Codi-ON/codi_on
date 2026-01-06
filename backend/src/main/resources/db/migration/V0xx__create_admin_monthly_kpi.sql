-- V0xx__create_admin_monthly_kpi.sql
CREATE TABLE IF NOT EXISTS public.admin_monthly_kpi (
  month_start             date                     NOT NULL,
  region                  text                     NOT NULL,
  generated_at            timestamptz              NOT NULL DEFAULT now(),

  total_session_events    bigint                   NOT NULL DEFAULT 0,
  total_sessions          bigint                   NOT NULL DEFAULT 0,
  unique_users            bigint                   NOT NULL DEFAULT 0,
  avg_sessions_per_user   double precision         NOT NULL DEFAULT 0,

  total_clicks            bigint                   NOT NULL DEFAULT 0,
  total_reco_events       bigint                   NOT NULL DEFAULT 0,
  error_events            bigint                   NOT NULL DEFAULT 0,

  started_sessions        bigint                   NOT NULL DEFAULT 0,
  ended_sessions          bigint                   NOT NULL DEFAULT 0,
  session_end_rate        double precision         NOT NULL DEFAULT 0,

  reco_empty              bigint                   NOT NULL DEFAULT 0,
  reco_generated          bigint                   NOT NULL DEFAULT 0,
  reco_empty_rate         double precision         NOT NULL DEFAULT 0,

  PRIMARY KEY (month_start, region)
);

CREATE INDEX IF NOT EXISTS idx_admin_monthly_kpi_month
  ON public.admin_monthly_kpi (month_start DESC);

CREATE INDEX IF NOT EXISTS idx_admin_monthly_kpi_region_month
  ON public.admin_monthly_kpi (region, month_start DESC);