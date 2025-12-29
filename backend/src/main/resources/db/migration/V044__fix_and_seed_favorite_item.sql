-- V043__fix_and_seed_favorite_item.sql
-- 목적:
-- 1) favorite_item에 created_at/updated_at 없으면 추가 (중복 실행 안전)
-- 2) sess_demo_001 기준 closet_item에서 3개 골라 favorite_item 시드 (중복 안전)

BEGIN;

-- 1) 컬럼 보정 (없으면 추가)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='favorite_item'
      AND column_name='created_at'
  ) THEN
    ALTER TABLE favorite_item
      ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='favorite_item'
      AND column_name='updated_at'
  ) THEN
    ALTER TABLE favorite_item
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- 2) (session_key, clothing_id) 유니크 보장 (없으면 생성)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_favorite_item_session_clothing'
  ) THEN
    ALTER TABLE favorite_item
      ADD CONSTRAINT uq_favorite_item_session_clothing UNIQUE (session_key, clothing_id);
  END IF;
END $$;

-- 3) 시드 (closet_item에서 3개)
WITH target_closet AS (
  SELECT id
  FROM closet
  WHERE session_key = 'sess_demo_001'
  LIMIT 1
),
picked AS (
  SELECT ci.clothing_id
  FROM closet_item ci
  JOIN target_closet tc ON tc.id = ci.closet_id
  ORDER BY ci.updated_at DESC NULLS LAST, ci.created_at DESC NULLS LAST
  LIMIT 3
)
INSERT INTO favorite_item (session_key, clothing_id, created_at, updated_at)
SELECT 'sess_demo_001', p.clothing_id, now(), now()
FROM picked p
ON CONFLICT (session_key, clothing_id)
DO UPDATE SET updated_at = EXCLUDED.updated_at;

COMMIT;