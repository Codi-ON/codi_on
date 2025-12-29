-- V035__seed_session_and_closet_items.sql
-- session 1개 + closet 1개 + closet_item 10개 시드 (중복 안전)
-- 핵심: closet_item.clothing_id FK가 clothing_item의 어떤 컬럼을 참조하든 자동 감지해서 그 컬럼에서 "존재하는 값"만 넣는다.

BEGIN;

DO $$
DECLARE
  v_session_key text := 'sess_demo_001';
  v_closet_id   bigint;
  v_ref_col     text;   -- clothing_item 쪽에서 FK가 가리키는 컬럼명 (id or clothing_id)
  v_sql         text;
BEGIN
  -- 1) session upsert
  INSERT INTO session (session_key, created_at, last_seen_at)
  VALUES (v_session_key, now(), now())
  ON CONFLICT (session_key)
  DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at;

  -- 2) closet upsert
  INSERT INTO closet (session_key, created_at)
  VALUES (v_session_key, now())
  ON CONFLICT (session_key)
  DO UPDATE SET session_key = EXCLUDED.session_key;

  SELECT id INTO v_closet_id
  FROM closet
  WHERE session_key = v_session_key;

  IF v_closet_id IS NULL THEN
    RAISE EXCEPTION 'closet row not found for session_key=%', v_session_key;
  END IF;

  -- 3) FK가 clothing_item의 어떤 컬럼을 참조하는지 자동 감지
  SELECT a.attname
    INTO v_ref_col
  FROM pg_constraint c
  JOIN pg_class confrel ON confrel.oid = c.confrelid
  JOIN pg_attribute a   ON a.attrelid = confrel.oid AND a.attnum = c.confkey[1]
  WHERE c.conrelid = 'closet_item'::regclass
    AND c.contype  = 'f'
    AND c.confrelid = 'clothing_item'::regclass
  LIMIT 1;

  IF v_ref_col IS NULL THEN
    RAISE EXCEPTION 'FK closet_item -> clothing_item not found';
  END IF;

  -- 4) FK 타겟 컬럼에 맞춰 "실제 존재하는 값" 10개만 뽑아 시드
  IF v_ref_col = 'id' THEN
    v_sql := $SQL$
      WITH picked AS (
        SELECT ci.id AS clothing_ref,
               row_number() OVER (ORDER BY ci.id) AS rn
        FROM clothing_item ci
        ORDER BY ci.id
        LIMIT 10
      )
      INSERT INTO closet_item (
        closet_id, clothing_id, quantity, possession_status,
        purchased_at, memo, created_at, updated_at
      )
      SELECT
        $1,
        p.clothing_ref,
        ((p.rn::int % 3) + 1),
        'OWNED',
        (CURRENT_DATE - p.rn::int),
        ('seed item #' || p.rn || ' (demo)'),
        now(), now()
      FROM picked p
      ON CONFLICT (closet_id, clothing_id)
      DO UPDATE SET
        quantity          = EXCLUDED.quantity,
        possession_status = EXCLUDED.possession_status,
        purchased_at      = EXCLUDED.purchased_at,
        memo              = EXCLUDED.memo,
        updated_at        = now();
    $SQL$;
  ELSE
    -- ref_col = clothing_id 인 케이스
    v_sql := $SQL$
      WITH picked AS (
        SELECT ci.clothing_id AS clothing_ref,
               row_number() OVER (ORDER BY ci.clothing_id) AS rn
        FROM clothing_item ci
        WHERE ci.clothing_id IS NOT NULL
        ORDER BY ci.clothing_id
        LIMIT 10
      )
      INSERT INTO closet_item (
        closet_id, clothing_id, quantity, possession_status,
        purchased_at, memo, created_at, updated_at
      )
      SELECT
        $1,
        p.clothing_ref,
        ((p.rn::int % 3) + 1),
        'OWNED',
        (CURRENT_DATE - p.rn::int),
        ('seed item #' || p.rn || ' (demo)'),
        now(), now()
      FROM picked p
      ON CONFLICT (closet_id, clothing_id)
      DO UPDATE SET
        quantity          = EXCLUDED.quantity,
        possession_status = EXCLUDED.possession_status,
        purchased_at      = EXCLUDED.purchased_at,
        memo              = EXCLUDED.memo,
        updated_at        = now();
    $SQL$;
  END IF;

  EXECUTE v_sql USING v_closet_id;

END $$;

COMMIT;