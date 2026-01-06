BEGIN;

WITH params AS (
  SELECT 'dfe4a6af-1483-4e5d-8ae9-967da0b949ba'::varchar AS session_key
),
ins_closet AS (
  INSERT INTO public.closet (session_key, created_at)
  SELECT p.session_key, now()
  FROM params p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.closet c WHERE c.session_key = p.session_key
  )
  RETURNING id
),
target_closet AS (
  SELECT c.id
  FROM public.closet c
  JOIN params p ON p.session_key = c.session_key
),
picked AS (
  SELECT tc.id AS closet_id, ci.id AS clothing_item_id
  FROM target_closet tc
  JOIN LATERAL (
    SELECT id FROM public.clothing_item
    WHERE category = 'TOP'
    ORDER BY clothing_id
    LIMIT 5
  ) ci ON true

  UNION ALL
  SELECT tc.id AS closet_id, ci.id AS clothing_item_id
  FROM target_closet tc
  JOIN LATERAL (
    SELECT id FROM public.clothing_item
    WHERE category = 'BOTTOM'
    ORDER BY clothing_id
    LIMIT 5
  ) ci ON true

  UNION ALL
  SELECT tc.id AS closet_id, ci.id AS clothing_item_id
  FROM target_closet tc
  JOIN LATERAL (
    SELECT id FROM public.clothing_item
    WHERE category = 'OUTER'
    ORDER BY clothing_id
    LIMIT 5
  ) ci ON true
)
INSERT INTO public.closet_item (closet_id, clothing_item_id, created_at)
SELECT p.closet_id, p.clothing_item_id, now()
FROM picked p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.closet_item x
  WHERE x.closet_id = p.closet_id
    AND x.clothing_item_id = p.clothing_item_id
);

COMMIT;