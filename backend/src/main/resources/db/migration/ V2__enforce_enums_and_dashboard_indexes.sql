ROLLBACK;

-- =========================================
-- 0) 시스템 유저 1명 보장 + default closet 1개 보장
-- =========================================
DO $$
DECLARE
  v_user_id   BIGINT;
  v_closet_id BIGINT;
BEGIN
  -- app_user 1명 확보 (없으면 생성)
  SELECT id INTO v_user_id
  FROM public.app_user
  ORDER BY id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    INSERT INTO public.app_user DEFAULT VALUES
    RETURNING id INTO v_user_id;
  END IF;

  -- default closet 확보 (없으면 생성)
  SELECT c.id INTO v_closet_id
  FROM public.closet c
  WHERE c.user_id = v_user_id AND c.name = 'default'
  ORDER BY c.id
  LIMIT 1;

  IF v_closet_id IS NULL THEN
    INSERT INTO public.closet(user_id, name, created_at)
    VALUES (v_user_id, 'default', now())
    RETURNING id INTO v_closet_id;
  END IF;

  RAISE NOTICE 'ensured app_user.id=%, closet.id=%', v_user_id, v_closet_id;
END $$;

-- =========================================
-- 1) clothing_item.closet_id NULL 백필
--    (NOT NULL 걸기 전에 반드시)
-- =========================================
DO $$
DECLARE
  v_user_id   BIGINT;
  v_closet_id BIGINT;
BEGIN
  SELECT id INTO v_user_id
  FROM public.app_user
  ORDER BY id
  LIMIT 1;

  SELECT c.id INTO v_closet_id
  FROM public.closet c
  WHERE c.user_id = v_user_id AND c.name = 'default'
  ORDER BY c.id
  LIMIT 1;

  UPDATE public.clothing_item
  SET closet_id = v_closet_id
  WHERE closet_id IS NULL;
END $$;

-- =========================================
-- 2) clothing_item.user_id 컬럼이 없으면 생성
-- =========================================
ALTER TABLE public.clothing_item
ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- =========================================
-- 3) clothing_item.user_id 백필
--    - closet_id가 있으니 closet.user_id로 채움
-- =========================================
UPDATE public.clothing_item ci
SET user_id = c.user_id
FROM public.closet c
WHERE ci.user_id IS NULL
  AND ci.closet_id = c.id;

-- 그래도 NULL이면(예외 케이스) 시스템 유저로 채움
UPDATE public.clothing_item ci
SET user_id = (SELECT id FROM public.app_user ORDER BY id LIMIT 1)
WHERE ci.user_id IS NULL;

-- =========================================
-- 4) 제약조건(순서 중요)
-- =========================================
-- 4-1) closet_id NOT NULL
ALTER TABLE public.clothing_item
ALTER COLUMN closet_id SET NOT NULL;

-- 4-2) user_id NOT NULL
ALTER TABLE public.clothing_item
ALTER COLUMN user_id SET NOT NULL;

-- 4-3) FK: clothing_item -> closet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_clothing_item_closet'
  ) THEN
    ALTER TABLE public.clothing_item
    ADD CONSTRAINT fk_clothing_item_closet
    FOREIGN KEY (closet_id) REFERENCES public.closet(id);
  END IF;
END $$;

-- 4-4) FK: clothing_item -> app_user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_clothing_item_user'
  ) THEN
    ALTER TABLE public.clothing_item
    ADD CONSTRAINT fk_clothing_item_user
    FOREIGN KEY (user_id) REFERENCES public.app_user(id);
  END IF;
END $$;

-- =========================================
-- 5) 인덱스 / 유니크
-- =========================================
-- clothing_id 유니크(이미 쓰고 있던 정책)
CREATE UNIQUE INDEX IF NOT EXISTS uq_clothing_item_clothing_id
  ON public.clothing_item(clothing_id);

-- 조회 최적화: user_id + closet_id
CREATE INDEX IF NOT EXISTS idx_clothing_item_user_closet
  ON public.clothing_item(user_id, closet_id);

-- closet 중복 방지(유저당 default 1개)
CREATE UNIQUE INDEX IF NOT EXISTS uq_closet_user_name
  ON public.closet(user_id, name);