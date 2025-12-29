-- V036__seed_favorite_items.sql
-- favorite_item 3개 시드 (중복 안전)
-- * favorite_item에 updated_at이 없을 수 있어서, 컬럼 존재 여부에 따라 동적으로 INSERT 구성
-- * source: closet_item -> clothing_item FK 안전

BEGIN;

-- 0) 중복 방지 유니크 (없으면 생성)
CREATE UNIQUE INDEX IF NOT EXISTS ux_favorite_item_session_clothing
ON favorite_item (session_key, clothing_id);

DO $$
DECLARE
  has_created_at BOOLEAN;
  has_updated_at BOOLEAN;
  sql_text TEXT;
BEGIN
  -- created_at 존재 여부
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'favorite_item'
      AND column_name  = 'created_at'
  ) INTO has_created_at;

  -- updated_at 존재 여부
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'favorite_item'
      AND column_name  = 'updated_at'
  ) INTO has_updated_at;

  sql_text := '
WITH target_closet AS (
  SELECT id AS closet_id
  FROM closet
  WHERE session_key = ''sess_demo_001''
  LIMIT 1
),
picked AS (
  SELECT ci.clothing_id
  FROM closet_item ci
  JOIN target_closet tc ON tc.closet_id = ci.closet_id
  ORDER BY ci.updated_at DESC NULLS LAST, ci.created_at DESC NULLS LAST
  LIMIT 3
)
INSERT INTO favorite_item (session_key, clothing_id';

  IF has_created_at THEN
    sql_text := sql_text || ', created_at';
  END IF;

  IF has_updated_at THEN
    sql_text := sql_text || ', updated_at';
  END IF;

  sql_text := sql_text || ')
SELECT ''sess_demo_001'', p.clothing_id';

  IF has_created_at THEN
    sql_text := sql_text || ', now()';
  END IF;

  IF has_updated_at THEN
    sql_text := sql_text || ', now()';
  END IF;

  sql_text := sql_text || '
FROM picked p
ON CONFLICT (session_key, clothing_id)
DO NOTHING;
';

  EXECUTE sql_text;
END $$;

COMMIT;