-- V033__favorite_item_schema.sql

BEGIN;

-- clothing_item.clothing_id가 FK 타겟이므로 UNIQUE 보장(없어도 동작하지만 FK 생성 조건상 필요)
CREATE UNIQUE INDEX IF NOT EXISTS ux_clothing_item_clothing_id
ON clothing_item (clothing_id);

-- favorite_item 테이블 (세션 기반)
CREATE TABLE IF NOT EXISTS favorite_item (
    id          BIGSERIAL PRIMARY KEY,
    session_key VARCHAR(64) NOT NULL,
    clothing_id BIGINT      NOT NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT now()
);

-- 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_favorite_item_session_key ON favorite_item(session_key);
CREATE INDEX IF NOT EXISTS idx_favorite_item_clothing_id ON favorite_item(clothing_id);

-- 중복 방지 (session_key + clothing_id)
CREATE UNIQUE INDEX IF NOT EXISTS ux_fav_item_session_clothing
ON favorite_item(session_key, clothing_id);

-- FK: favorite_item.clothing_id -> clothing_item.clothing_id (기존 잘못된 FK 있으면 제거 후 재생성)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_favorite_item_clothing'
      AND conrelid = 'favorite_item'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE favorite_item DROP CONSTRAINT fk_favorite_item_clothing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_favorite_item_clothing'
      AND conrelid = 'favorite_item'::regclass
  ) THEN
    EXECUTE '
      ALTER TABLE favorite_item
      ADD CONSTRAINT fk_favorite_item_clothing
      FOREIGN KEY (clothing_id) REFERENCES clothing_item(clothing_id)
      ON DELETE CASCADE
    ';
  END IF;
END $$;

COMMIT;