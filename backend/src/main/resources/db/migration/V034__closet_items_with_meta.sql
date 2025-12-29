-- V033__favorite_item_schema.sql
-- favorite_item 단일 테이블 운영 (user_id 없음, session_key 기반)
-- FK는 clothing_item(clothing_id) 기준

BEGIN;

-- 0) FK 타겟 컬럼 유니크 보장 (FK 타겟은 UNIQUE/PK여야 함)
CREATE UNIQUE INDEX IF NOT EXISTS ux_clothing_item_clothing_id
ON clothing_item (clothing_id);

-- 1) favorite_item 테이블
CREATE TABLE IF NOT EXISTS favorite_item (
  id          BIGSERIAL PRIMARY KEY,
  session_key VARCHAR(64) NOT NULL,
  clothing_id BIGINT      NOT NULL,
  created_at  TIMESTAMP   NOT NULL DEFAULT now()
);

-- 2) 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_favorite_item_session_key
ON favorite_item (session_key);

CREATE INDEX IF NOT EXISTS idx_favorite_item_clothing_id
ON favorite_item (clothing_id);

-- 3) 중복 방지: 같은 세션에서 같은 아이템 즐겨찾기 중복 저장 방지
CREATE UNIQUE INDEX IF NOT EXISTS ux_fav_item_session_clothing
ON favorite_item (session_key, clothing_id);

-- 4) FK: favorite_item.clothing_id -> clothing_item.clothing_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_favorite_item_clothing'
      AND conrelid = 'favorite_item'::regclass
  ) THEN
    EXECUTE '
      ALTER TABLE favorite_item
      ADD CONSTRAINT fk_favorite_item_clothing
      FOREIGN KEY (clothing_id)
      REFERENCES clothing_item(clothing_id)
      ON DELETE CASCADE
    ';
  END IF;
END $$;

COMMIT;