-- V041__seed_recommendation_bundle.sql
-- 목적: 추천 1건(recommendation) + 후보/체크리스트/이벤트로그 최소 시드
-- 전제: sess_demo_001 세션/옷장/closet_item 은 이미 존재(네가 앞에서 만든 것)

BEGIN;

-- 0) reco 기본값(기존 테이블에 있는 값 재사용 -> 체크제약 회피)
WITH defaults AS (
  SELECT
    COALESCE((SELECT reco_strategy FROM recommendation WHERE reco_strategy IS NOT NULL LIMIT 1), 'DEFAULT') AS reco_strategy,
    COALESCE((SELECT reco_funnel  FROM recommendation WHERE reco_funnel  IS NOT NULL LIMIT 1), 'DEFAULT') AS reco_funnel
)
INSERT INTO recommendation (
  recommendation_key,
  session_key,
  reco_strategy,
  reco_funnel,
  temperature,
  feels_like_temperature,
  created_at,
  updated_at
)
SELECT
  'reco_demo_001',
  'sess_demo_001',
  d.reco_strategy,
  d.reco_funnel,
  10.0,
  8.0,
  now(),
  now()
FROM defaults d
ON CONFLICT (recommendation_key)
DO UPDATE SET
  session_key             = EXCLUDED.session_key,
  reco_strategy           = EXCLUDED.reco_strategy,
  reco_funnel             = EXCLUDED.reco_funnel,
  temperature             = EXCLUDED.temperature,
  feels_like_temperature  = EXCLUDED.feels_like_temperature,
  updated_at              = now();

-- 1) 후보 5개 시드 (closet_item에서 실제 존재 clothing_id 가져옴)
--    컬럼명이 다르면 터질 수 있어서: recommendation_item_candidate 컬럼 존재 체크 후, 있는 컬럼만 넣음
DO $$
DECLARE
  cols text := '';
  expr text := '';
  sql_text text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='recommendation_item_candidate'
  ) THEN
    RAISE NOTICE 'skip: recommendation_item_candidate not found';
    RETURN;
  END IF;

  -- recommendation_key
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_item_candidate' AND column_name='recommendation_key'
  ) THEN
    cols := cols || 'recommendation_key,';
    expr := expr || quote_literal('reco_demo_001') || '::text,';
  END IF;

  -- clothing_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_item_candidate' AND column_name='clothing_id'
  ) THEN
    cols := cols || 'clothing_id,';
    expr := expr || 's.clothing_id,';
  END IF;

  -- created_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_item_candidate' AND column_name='created_at'
  ) THEN
    cols := cols || 'created_at,';
    expr := expr || 'now(),';
  END IF;

  -- updated_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_item_candidate' AND column_name='updated_at'
  ) THEN
    cols := cols || 'updated_at,';
    expr := expr || 'now(),';
  END IF;

  -- score (있으면 임의값)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_item_candidate' AND column_name='score'
  ) THEN
    cols := cols || 'score,';
    expr := expr || '(100 - (s.rn * 3))::double precision,';
  END IF;

  -- rank (있으면 rn)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_item_candidate' AND column_name IN ('rank','rank_no','rank_order')
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='recommendation_item_candidate' AND column_name='rank'
    ) THEN
      cols := cols || 'rank,';
      expr := expr || 's.rn,';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='recommendation_item_candidate' AND column_name='rank_no'
    ) THEN
      cols := cols || 'rank_no,';
      expr := expr || 's.rn,';
    ELSE
      cols := cols || 'rank_order,';
      expr := expr || 's.rn,';
    END IF;
  END IF;

  -- 아무 컬럼도 못 맞추면 스킵
  IF cols = '' THEN
    RAISE NOTICE 'skip: no matching columns in recommendation_item_candidate';
    RETURN;
  END IF;

  cols := left(cols, length(cols)-1);
  expr := left(expr, length(expr)-1);

  sql_text := format($f$
    WITH s AS (
      SELECT ci.clothing_id, row_number() over(order by ci.updated_at desc nulls last, ci.created_at desc nulls last) rn
      FROM closet_item ci
      JOIN closet c ON c.id = ci.closet_id
      WHERE c.session_key = %L
      ORDER BY ci.updated_at desc nulls last, ci.created_at desc nulls last
      LIMIT 5
    )
    INSERT INTO recommendation_item_candidate (%s)
    SELECT %s
    FROM s
    ON CONFLICT DO NOTHING
  $f$, 'sess_demo_001', cols, expr);

  EXECUTE sql_text;
END $$;

-- 2) 체크리스트 3개 시드 (테이블 있으면, 있는 컬럼만)
DO $$
DECLARE
  cols text := '';
  sql_text text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='recommendation_checklist'
  ) THEN
    RAISE NOTICE 'skip: recommendation_checklist not found';
    RETURN;
  END IF;

  -- recommendation_key
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_checklist' AND column_name='recommendation_key'
  ) THEN cols := cols || 'recommendation_key,'; END IF;

  -- text/code 계열 후보 컬럼(프로젝트마다 이름이 달라서)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_checklist' AND column_name='check_item'
  ) THEN cols := cols || 'check_item,';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_checklist' AND column_name='question'
  ) THEN cols := cols || 'question,';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_checklist' AND column_name='label'
  ) THEN cols := cols || 'label,';
  END IF;

  -- created_at / updated_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_checklist' AND column_name='created_at'
  ) THEN cols := cols || 'created_at,'; END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='recommendation_checklist' AND column_name='updated_at'
  ) THEN cols := cols || 'updated_at,'; END IF;

  IF cols = '' THEN
    RAISE NOTICE 'skip: no matching columns in recommendation_checklist';
    RETURN;
  END IF;

  cols := left(cols, length(cols)-1);

  -- 컬럼 구성에 맞춰 동적으로 VALUES 구성(3줄)
  sql_text := format($f$
    INSERT INTO recommendation_checklist (%s)
    SELECT * FROM (
      VALUES
        (%s),
        (%s),
        (%s)
    ) v
    ON CONFLICT DO NOTHING
  $f$,
    cols,
    -- row1
    CASE
      WHEN cols LIKE '%recommendation_key%' THEN quote_literal('reco_demo_001') ELSE 'DEFAULT'
    END
    || CASE
      WHEN cols LIKE '%check_item%' THEN ', '||quote_literal('우산 필요?')
      WHEN cols LIKE '%question%'  THEN ', '||quote_literal('우산 필요?')
      WHEN cols LIKE '%label%'     THEN ', '||quote_literal('우산 필요?')
      ELSE ''
    END
    || CASE WHEN cols LIKE '%created_at%' THEN ', now()' ELSE '' END
    || CASE WHEN cols LIKE '%updated_at%' THEN ', now()' ELSE '' END,

    -- row2
    CASE
      WHEN cols LIKE '%recommendation_key%' THEN quote_literal('reco_demo_001') ELSE 'DEFAULT'
    END
    || CASE
      WHEN cols LIKE '%check_item%' THEN ', '||quote_literal('겹쳐 입기 필요?')
      WHEN cols LIKE '%question%'  THEN ', '||quote_literal('겹쳐 입기 필요?')
      WHEN cols LIKE '%label%'     THEN ', '||quote_literal('겹쳐 입기 필요?')
      ELSE ''
    END
    || CASE WHEN cols LIKE '%created_at%' THEN ', now()' ELSE '' END
    || CASE WHEN cols LIKE '%updated_at%' THEN ', now()' ELSE '' END,

    -- row3
    CASE
      WHEN cols LIKE '%recommendation_key%' THEN quote_literal('reco_demo_001') ELSE 'DEFAULT'
    END
    || CASE
      WHEN cols LIKE '%check_item%' THEN ', '||quote_literal('바람 강함?')
      WHEN cols LIKE '%question%'  THEN ', '||quote_literal('바람 강함?')
      WHEN cols LIKE '%label%'     THEN ', '||quote_literal('바람 강함?')
      ELSE ''
    END
    || CASE WHEN cols LIKE '%created_at%' THEN ', now()' ELSE '' END
    || CASE WHEN cols LIKE '%updated_at%' THEN ', now()' ELSE '' END
  );

  EXECUTE sql_text;
END $$;

-- 3) 이벤트 로그 2개(보여줌/상세열람) - recommendation_event_log 컬럼 구성은 네가 이미 맞춰둔 상태 기준
--    (recommendation_key NOT NULL 때문에 반드시 reco_key 넣어야 함)
INSERT INTO recommendation_event_log (session_key, recommendation_key, event_type, payload, occurred_at)
VALUES
  ('sess_demo_001','reco_demo_001','RECO_SHOWN',  '{"source":"seed"}'::jsonb, now()),
  ('sess_demo_001','reco_demo_001','RECO_OPENED', '{"source":"seed"}'::jsonb, now())
ON CONFLICT DO NOTHING;

COMMIT;