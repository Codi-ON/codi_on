-- Vxxx__seed_clothing_item.sql
-- clothing_item 60개 (TOP 20 / BOTTOM 20 / OUTER 20) + clothing_item_season 매핑
-- SeasonType: SPRING, SUMMER, AUTUMN, WINTER
-- thickness_level: THICK, NORMAL, THIN
-- usage_type: INDOOR, OUTDOOR, BOTH
-- Idempotent: clothing_id 기준 중복 방지 + season 매핑 중복 방지

BEGIN;

WITH src (
  category, clothing_id, color,
  cotton_percentage, polyester_percentage, etc_fiber_percentage,
  image_url, name, selected_count, style_tag,
  suitable_min_temp, suitable_max_temp,
  thickness_level, usage_type,
  seasons
) AS (
  VALUES
    -- =========================
    -- OUTER 20
    -- =========================
    ('OUTER', 10001, 'BLACK',     0, 100, 0, NULL, '롱패딩_블랙',              0, 'OUTDOOR', -15,  2,  'THICK',  'OUTDOOR', ARRAY['WINTER']),
    ('OUTER', 10002, 'IVORY',     0, 100, 0, NULL, '숏패딩_오프화이트',        0, 'OUTDOOR', -10,  5,  'THICK',  'OUTDOOR', ARRAY['WINTER']),
    ('OUTER', 10003, 'CHARCOAL',  0, 100, 0, NULL, '울코트_차콜',              0, 'FORMAL',  -5,   8,  'THICK',  'OUTDOOR', ARRAY['WINTER','AUTUMN']),
    ('OUTER', 10004, 'BEIGE',     0, 100, 0, NULL, '핸드메이드코트_베이지',     0, 'FORMAL',  -3,  10,  'THICK',  'OUTDOOR', ARRAY['WINTER','AUTUMN']),
    ('OUTER', 10005, 'IVORY',    20,  75, 5, NULL, '플리스집업_아이보리',       0, 'CASUAL',   0,  12,  'NORMAL', 'BOTH',   ARRAY['WINTER','AUTUMN']),
    ('OUTER', 10006, 'BLACK',    20,  75, 5, NULL, '플리스자켓_블랙',           0, 'CASUAL',   0,  12,  'NORMAL', 'BOTH',   ARRAY['WINTER','AUTUMN']),
    ('OUTER', 10007, 'NAVY',     10,  85, 5, NULL, '경량패딩_네이비',           0, 'OUTDOOR', -2,  12,  'NORMAL', 'OUTDOOR',ARRAY['WINTER','AUTUMN','SPRING']),
    ('OUTER', 10008, 'BLACK',    10,  85, 5, NULL, '바람막이_블랙',             0, 'OUTDOOR',  8,  20,  'THIN',   'OUTDOOR',ARRAY['SPRING','AUTUMN']),
    ('OUTER', 10009, 'OFFWHITE', 10,  85, 5, NULL, '바람막이_오프화이트',       0, 'OUTDOOR',  8,  20,  'THIN',   'OUTDOOR',ARRAY['SPRING','AUTUMN']),
    ('OUTER', 10010, 'BEIGE',    10,  85, 5, NULL, '트렌치코트_베이지',         0, 'FORMAL',   8,  18,  'NORMAL', 'OUTDOOR',ARRAY['SPRING','AUTUMN']),
    ('OUTER', 10011, 'LIGHTBLUE',20,  75, 5, NULL, '데님자켓_연청',             0, 'STREET',   8,  18,  'NORMAL', 'BOTH',   ARRAY['SPRING','AUTUMN']),
    ('OUTER', 10012, 'BLACK',     5,  90, 5, NULL, '블레이저_블랙',             0, 'FORMAL',  10,  20,  'NORMAL', 'BOTH',   ARRAY['SPRING','AUTUMN']),
    ('OUTER', 10013, 'NAVY',     30,  65, 5, NULL, '가디건_네이비',             0, 'MINIMAL', 10,  18,  'THIN',   'BOTH',   ARRAY['SPRING','AUTUMN']),
    ('OUTER', 10014, 'GRAY',     30,  65, 5, NULL, '가디건_그레이',             0, 'MINIMAL', 10,  18,  'THIN',   'BOTH',   ARRAY['SPRING','AUTUMN']),
    ('OUTER', 10015, 'KHAKI',    20,  75, 5, NULL, '야상자켓_카키',             0, 'OUTDOOR',  6,  16,  'NORMAL', 'OUTDOOR',ARRAY['SPRING','AUTUMN']),
    ('OUTER', 10016, 'BLACK',     0, 100, 0, NULL, '롱코트_블랙',               0, 'FORMAL',  -2,  12,  'THICK',  'OUTDOOR',ARRAY['WINTER','AUTUMN']),
    ('OUTER', 10017, 'CAMEL',     0, 100, 0, NULL, '더플코트_카멜',             0, 'FORMAL',  -3,  10,  'THICK',  'OUTDOOR',ARRAY['WINTER','AUTUMN']),
    ('OUTER', 10018, 'BLACK',    30,  65, 5, NULL, '레더자켓_블랙',             0, 'STREET',   6,  16,  'NORMAL', 'OUTDOOR',ARRAY['SPRING','AUTUMN']),
    ('OUTER', 10019, 'NAVY',     10,  85, 5, NULL, '후리스베스트_네이비',        0, 'OUTDOOR',   2,  14,  'THIN',   'BOTH',   ARRAY['AUTUMN','WINTER']),
    ('OUTER', 10020, 'BLACK',    10,  85, 5, NULL, '경량바람막이_블랙',          0, 'OUTDOOR',  12,  24,  'THIN',   'OUTDOOR',ARRAY['SPRING','SUMMER','AUTUMN']),

    -- =========================
    -- TOP 20
    -- =========================
    ('TOP',   10101, 'GRAY',     70,  25, 5, NULL, '기모후드_그레이',           0, 'CASUAL',  -8,   6,  'THICK',  'BOTH',   ARRAY['WINTER','AUTUMN']),
    ('TOP',   10102, 'BLACK',    70,  25, 5, NULL, '기모후드_블랙',             0, 'CASUAL',  -8,   6,  'THICK',  'BOTH',   ARRAY['WINTER','AUTUMN']),
    ('TOP',   10103, 'OFFWHITE', 70,  25, 5, NULL, '기모맨투맨_오프화이트',     0, 'CASUAL',  -6,   8,  'THICK',  'BOTH',   ARRAY['WINTER','AUTUMN']),
    ('TOP',   10104, 'NAVY',     70,  25, 5, NULL, '기모맨투맨_네이비',         0, 'CASUAL',  -6,   8,  'THICK',  'BOTH',   ARRAY['WINTER','AUTUMN']),
    ('TOP',   10105, 'CREAM',    40,  55, 5, NULL, '니트_크림',                 0, 'MINIMAL', -2,  12,  'NORMAL', 'BOTH',   ARRAY['WINTER','AUTUMN']),
    ('TOP',   10106, 'BROWN',    40,  55, 5, NULL, '니트_브라운',               0, 'MINIMAL', -2,  12,  'NORMAL', 'BOTH',   ARRAY['WINTER','AUTUMN']),
    ('TOP',   10107, 'BLACK',    40,  55, 5, NULL, '니트_블랙',                 0, 'MINIMAL', -2,  12,  'NORMAL', 'BOTH',   ARRAY['WINTER','AUTUMN']),
    ('TOP',   10108, 'WHITE',    95,   5, 0, NULL, '셔츠_화이트',               0, 'FORMAL',  10,  20,  'THIN',   'BOTH',   ARRAY['SPRING','AUTUMN']),
    ('TOP',   10109, 'SKYBLUE',  95,   5, 0, NULL, '셔츠_스카이블루',           0, 'FORMAL',  10,  20,  'THIN',   'BOTH',   ARRAY['SPRING','AUTUMN']),
    ('TOP',   10110, 'LIGHTGRAY',95,   5, 0, NULL, '옥스포드셔츠_라이트그레이', 0, 'FORMAL',  10,  20,  'THIN',   'BOTH',   ARRAY['SPRING','AUTUMN']),
    ('TOP',   10111, 'WHITE',    95,   5, 0, NULL, '긴팔티_화이트',             0, 'CASUAL',   8,  18,  'THIN',   'BOTH',   ARRAY['SPRING','AUTUMN']),
    ('TOP',   10112, 'BLACK',    95,   5, 0, NULL, '긴팔티_블랙',               0, 'CASUAL',   8,  18,  'THIN',   'BOTH',   ARRAY['SPRING','AUTUMN']),
    ('TOP',   10113, 'WHITE',    95,   5, 0, NULL, '반팔티_화이트',             0, 'CASUAL',  18,  32,  'THIN',   'BOTH',   ARRAY['SUMMER']),
    ('TOP',   10114, 'BLACK',    95,   5, 0, NULL, '반팔티_블랙',               0, 'CASUAL',  18,  32,  'THIN',   'BOTH',   ARRAY['SUMMER']),
    ('TOP',   10115, 'NAVY',     95,   5, 0, NULL, '반팔티_네이비',             0, 'CASUAL',  18,  32,  'THIN',   'BOTH',   ARRAY['SUMMER']),
    ('TOP',   10116, 'OFFWHITE', 60,  35, 5, NULL, '린넨셔츠_오프화이트',       0, 'MINIMAL', 16,  30,  'THIN',   'BOTH',   ARRAY['SUMMER','SPRING']),
    ('TOP',   10117, 'BEIGE',    60,  35, 5, NULL, '린넨셔츠_베이지',           0, 'MINIMAL', 16,  30,  'THIN',   'BOTH',   ARRAY['SUMMER','SPRING']),
    ('TOP',   10118, 'BLACK',    35,  60, 5, NULL, '터틀넥_블랙',               0, 'MINIMAL', -4,  10,  'NORMAL', 'BOTH',   ARRAY['WINTER','AUTUMN']),
    ('TOP',   10119, 'BLACK',    10,  80,10, NULL, '히트텍_블랙',               0, 'INDOOR', -10,   6,  'THIN',   'INDOOR', ARRAY['WINTER']),
    ('TOP',   10120, 'WHITE',    10,  80,10, NULL, '히트텍_오프화이트',         0, 'INDOOR', -10,   6,  'THIN',   'INDOOR', ARRAY['WINTER']),

    -- =========================
    -- BOTTOM 20
    -- =========================
    ('BOTTOM',10201, 'DARKBLUE', 80,  18, 2, NULL, '데님팬츠_진청',              0, 'CASUAL',   4,  18,  'NORMAL', 'BOTH',   ARRAY['SPRING','AUTUMN','WINTER']),
    ('BOTTOM',10202, 'LIGHTBLUE',80,  18, 2, NULL, '데님팬츠_연청',              0, 'CASUAL',   8,  22,  'NORMAL', 'BOTH',   ARRAY['SPRING','SUMMER','AUTUMN']),
    ('BOTTOM',10203, 'BLACK',    30,  65, 5, NULL, '슬랙스_블랙',                0, 'FORMAL',   8,  22,  'NORMAL', 'BOTH',   ARRAY['SPRING','AUTUMN','WINTER']),
    ('BOTTOM',10204, 'CHARCOAL', 30,  65, 5, NULL, '슬랙스_차콜',                0, 'FORMAL',   8,  22,  'NORMAL', 'BOTH',   ARRAY['SPRING','AUTUMN','WINTER']),
    ('BOTTOM',10205, 'BEIGE',    95,   5, 0, NULL, '치노팬츠_베이지',            0, 'MINIMAL', 10,  22,  'NORMAL', 'BOTH',   ARRAY['SPRING','AUTUMN']),
    ('BOTTOM',10206, 'KHAKI',    95,   5, 0, NULL, '치노팬츠_카키',              0, 'MINIMAL', 10,  22,  'NORMAL', 'BOTH',   ARRAY['SPRING','AUTUMN']),
    ('BOTTOM',10207, 'GRAY',     70,  25, 5, NULL, '조거팬츠_그레이',            0, 'CASUAL',  -2,  14,  'NORMAL', 'BOTH',   ARRAY['WINTER','AUTUMN','SPRING']),
    ('BOTTOM',10208, 'BLACK',    70,  25, 5, NULL, '조거팬츠_블랙',              0, 'CASUAL',  -2,  14,  'NORMAL', 'BOTH',   ARRAY['WINTER','AUTUMN','SPRING']),
    ('BOTTOM',10209, 'BLACK',    95,   5, 0, NULL, '반바지_블랙',                0, 'CASUAL',  20,  35,  'THIN',   'BOTH',   ARRAY['SUMMER']),
    ('BOTTOM',10210, 'BEIGE',    95,   5, 0, NULL, '반바지_베이지',              0, 'CASUAL',  20,  35,  'THIN',   'BOTH',   ARRAY['SUMMER']),
    ('BOTTOM',10211, 'NAVY',     60,  35, 5, NULL, '트레이닝팬츠_네이비',        0, 'SPORT',    0,  18,  'NORMAL', 'BOTH',   ARRAY['SPRING','AUTUMN','WINTER']),
    ('BOTTOM',10212, 'BLACK',    60,  35, 5, NULL, '트레이닝팬츠_블랙',          0, 'SPORT',    0,  18,  'NORMAL', 'BOTH',   ARRAY['SPRING','AUTUMN','WINTER']),
    ('BOTTOM',10213, 'GRAY',     40,  55, 5, NULL, '니트팬츠_그레이',            0, 'MINIMAL', -2,  14,  'NORMAL', 'INDOOR', ARRAY['WINTER','AUTUMN']),
    ('BOTTOM',10214, 'BLACK',    40,  55, 5, NULL, '니트팬츠_블랙',              0, 'MINIMAL', -2,  14,  'NORMAL', 'INDOOR', ARRAY['WINTER','AUTUMN']),
    ('BOTTOM',10215, 'BLACK',    20,  75, 5, NULL, '레깅스_블랙',                0, 'SPORT',    6,  22,  'THIN',   'BOTH',   ARRAY['SPRING','SUMMER','AUTUMN']),
    ('BOTTOM',10216, 'IVORY',    95,   5, 0, NULL, '와이드팬츠_아이보리',         0, 'STREET',  10,  24,  'NORMAL', 'BOTH',   ARRAY['SPRING','SUMMER','AUTUMN']),
    ('BOTTOM',10217, 'BLACK',    95,   5, 0, NULL, '와이드팬츠_블랙',            0, 'STREET',  10,  24,  'NORMAL', 'BOTH',   ARRAY['SPRING','SUMMER','AUTUMN']),
    ('BOTTOM',10218, 'DARKGRAY', 30,  65, 5, NULL, '기모슬랙스_다크그레이',       0, 'FORMAL', -6,   8,  'THICK',  'BOTH',   ARRAY['WINTER']),
    ('BOTTOM',10219, 'BLACK',    30,  65, 5, NULL, '기모슬랙스_블랙',             0, 'FORMAL', -6,   8,  'THICK',  'BOTH',   ARRAY['WINTER']),
    ('BOTTOM',10220, 'NAVY',     80,  18, 2, NULL, '기모데님팬츠_네이비',         0, 'CASUAL', -8,   8,  'THICK',  'BOTH',   ARRAY['WINTER'])
),

ins AS (
  INSERT INTO public.clothing_item (
    category, clothing_id, color,
    cotton_percentage, etc_fiber_percentage,
    image_url, name,
    polyester_percentage, selected_count, style_tag,
    suitable_max_temp, suitable_min_temp,
    thickness_level, usage_type,
    created_at, updated_at
  )
  SELECT
    s.category, s.clothing_id, s.color,
    s.cotton_percentage, s.etc_fiber_percentage,
    s.image_url, s.name,
    s.polyester_percentage, s.selected_count, s.style_tag,
    s.suitable_max_temp, s.suitable_min_temp,
    s.thickness_level, s.usage_type,
    now(), now()
  FROM src s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.clothing_item ci WHERE ci.clothing_id = s.clothing_id
  )
  RETURNING id, clothing_id
)

INSERT INTO public.clothing_item_season (clothing_item_id, season)
SELECT
  ci.id,
  season_val
FROM src s
JOIN public.clothing_item ci
  ON ci.clothing_id = s.clothing_id
CROSS JOIN LATERAL unnest(s.seasons) AS season_val
WHERE NOT EXISTS (
  SELECT 1
  FROM public.clothing_item_season cis
  WHERE cis.clothing_item_id = ci.id
    AND cis.season = season_val
);

COMMIT;