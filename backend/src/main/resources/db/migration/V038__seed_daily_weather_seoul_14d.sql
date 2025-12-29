-- V037__seed_daily_weather_seoul_14d.sql
-- Seoul 고정 14일치 seed (중복 안전 / UNIQUE(region, weather_date) 기준 upsert)

BEGIN;

-- ✅ (선택) unique 보장: uk_daily_weather_region_date 가 없으면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_daily_weather_region_date'
  ) THEN
    ALTER TABLE daily_weather
      ADD CONSTRAINT uk_daily_weather_region_date UNIQUE (region, weather_date);
  END IF;
END $$;

-- ✅ seed: 오늘 ~ +13일
WITH days AS (
  SELECT
    'Seoul'::varchar AS region,
    (CURRENT_DATE + gs.i)::date AS weather_date,
    -- 아래 값들은 "보기용 더미" (프론트 검증용)
    (5 + (gs.i % 7))::double precision AS temperature,
    (2 + (gs.i % 5))::double precision AS min_temperature,
    (10 + (gs.i % 6))::double precision AS max_temperature,
    (4 + (gs.i % 7))::double precision AS feels_like_temperature,
    ((gs.i * 7) % 101)::int AS cloud_amount,
    CASE
      WHEN (gs.i % 4) = 0 THEN 'CLEAR'
      WHEN (gs.i % 4) = 1 THEN 'CLOUDS'
      WHEN (gs.i % 4) = 2 THEN 'RAIN'
      ELSE 'SNOW'
    END AS sky,
    ((gs.i * 9) % 101)::int AS precipitation_probability,
    (45 + (gs.i * 3) % 50)::int AS humidity,
    (1.5 + (gs.i % 5) * 0.7)::double precision AS wind_speed,
    now() AS fetched_at
  FROM (SELECT generate_series(0, 13) AS i) gs
)
INSERT INTO daily_weather (
  region, weather_date,
  temperature, min_temperature, max_temperature,
  feels_like_temperature, cloud_amount,
  sky, precipitation_probability, humidity, wind_speed,
  fetched_at
)
SELECT
  region, weather_date,
  temperature, min_temperature, max_temperature,
  feels_like_temperature, cloud_amount,
  sky, precipitation_probability, humidity, wind_speed,
  fetched_at
FROM days
ON CONFLICT (region, weather_date)
DO UPDATE SET
  temperature               = EXCLUDED.temperature,
  min_temperature           = EXCLUDED.min_temperature,
  max_temperature           = EXCLUDED.max_temperature,
  feels_like_temperature    = EXCLUDED.feels_like_temperature,
  cloud_amount              = EXCLUDED.cloud_amount,
  sky                       = EXCLUDED.sky,
  precipitation_probability = EXCLUDED.precipitation_probability,
  humidity                  = EXCLUDED.humidity,
  wind_speed                = EXCLUDED.wind_speed,
  fetched_at                = EXCLUDED.fetched_at;

COMMIT;