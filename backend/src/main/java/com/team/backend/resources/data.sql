-- ===========================
-- clothing_item 더미 데이터
-- ===========================

INSERT INTO clothing_item (
    clothing_id, suitable_min_temp, suitable_max_temp, selected_count,
    category, thickness_level, color, style_tag, image_url, name, usage_type
) VALUES
-- 2001: 봄/가을용 트렌치 코트 (OUTER, NORMAL, 실외)
(2001, 10, 18, 0,
 'OUTER', 'NORMAL', 'beige', 'classic',
 'https://example.com/outer_trench_beige.jpg',
 '베이지 트렌치 코트',
 'OUTDOOR'),

-- 2002: 여름용 기본 반팔 티셔츠 (TOP, THIN, 실내+실외)
(2002, 22, 32, 0,
 'TOP', 'THIN', 'white', 'casual',
 'https://example.com/top_tshirt_white.jpg',
 '화이트 반팔 티셔츠',
 'BOTH'),

-- 2003: 한겨울용 롱 패딩 (OUTER, THICK, 실외)
(2003, -10, 5, 0,
 'OUTER', 'THICK', 'black', 'warm',
 'https://example.com/outer_padding_black.jpg',
 '블랙 롱 패딩',
 'OUTDOOR'),

-- 2004: 가을용 니트 스웨터 (TOP, NORMAL, 실외)
(2004, 12, 18, 0,
 'TOP', 'NORMAL', 'brown', 'autumn',
 'https://example.com/top_knit_brown.jpg',
 '브라운 니트 스웨터',
 'OUTDOOR'),

-- 2005: 봄/여름 린넨 셔츠 (TOP, THIN, 실외)
(2005, 18, 28, 0,
 'TOP', 'THIN', 'skyblue', 'casual',
 'https://example.com/top_linen_skyblue.jpg',
 '스카이 블루 린넨 셔츠',
 'OUTDOOR'),

-- 2006: 기모 맨투맨 (TOP, THICK, 실내)
(2006, 5, 15, 0,
 'TOP', 'THICK', 'gray', 'casual',
 'https://example.com/top_sweatshirt_gray.jpg',
 '기모 맨투맨 스웨트셔츠',
 'INDOOR'),

-- 2007: 여름용 쇼츠 (BOTTOM, THIN, 둘 다)
(2007, 24, 35, 0,
 'BOTTOM', 'THIN', 'navy', 'casual',
 'https://example.com/bottom_shorts_navy.jpg',
 '네이비 코튼 쇼츠',
 'BOTH'),

-- 2008: 겨울용 슬랙스 (BOTTOM, NORMAL, 실외)
(2008, 0, 12, 0,
 'BOTTOM', 'NORMAL', 'black', 'formal',
 'https://example.com/bottom_slacks_black.jpg',
 '블랙 울 슬랙스',
 'OUTDOOR'),

-- 2009: 봄용 롱스커트 (BOTTOM, THIN, 실외)
(2009, 15, 24, 0,
 'BOTTOM', 'THIN', 'cream', 'feminine',
 'https://example.com/bottom_skirt_cream.jpg',
 '크림 롱 스커트',
 'OUTDOOR'),

-- 2010: 플리스 집업 (OUTER, NORMAL, 둘 다)
(2010, 8, 18, 0,
 'OUTER', 'NORMAL', 'ivory', 'casual',
 'https://example.com/outer_fleece_ivory.jpg',
 '아이보리 플리스 집업',
 'BOTH');


-- 2001: 봄/가을용 트렌치 코트 (OUTER)
INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'SPRING' FROM clothing_item WHERE clothing_id = 2001
UNION ALL
SELECT id, 'AUTUMN' FROM clothing_item WHERE clothing_id = 2001;

-- 2002: 한겨울 패딩 (OUTER)
INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'WINTER' FROM clothing_item WHERE clothing_id = 2002;

-- 2003: 가을용 퀼팅 점퍼 (OUTER)
INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'AUTUMN' FROM clothing_item WHERE clothing_id = 2003;

-- 2004: 봄/가을 가디건 (OUTER)
INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'SPRING' FROM clothing_item WHERE clothing_id = 2004
UNION ALL
SELECT id, 'AUTUMN' FROM clothing_item WHERE clothing_id = 2004;

-- 2005: 가을용 항공 점퍼 (OUTER)
INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'AUTUMN' FROM clothing_item WHERE clothing_id = 2005;

-- 2006: 겨울용 양털 자켓 (OUTER)
INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'WINTER' FROM clothing_item WHERE clothing_id = 2006;

-- 2007: 롱 코트 → 가을/겨울
INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'AUTUMN' FROM clothing_item WHERE clothing_id = 2007
UNION ALL
SELECT id, 'WINTER' FROM clothing_item WHERE clothing_id = 2007;

-- 2008: 포멀 수트 자켓 → 봄/가을
INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'SPRING' FROM clothing_item WHERE clothing_id = 2008
UNION ALL
SELECT id, 'AUTUMN' FROM clothing_item WHERE clothing_id = 2008;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- clothing_item 테이블에 어떤 컬럼들이 있는지 확인
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'clothing_item'
ORDER BY ordinal_position;

-- 1) usage_type 컬럼 추가 (기본값 BOTH, NOT NULL)
ALTER TABLE clothing_item
    ADD COLUMN usage_type VARCHAR(10) NOT NULL DEFAULT 'BOTH';

-- 2) usage_type 에 들어갈 수 있는 값 제한
ALTER TABLE clothing_item
    ADD CONSTRAINT clothing_item_usage_type_check
        CHECK (usage_type IN ('INDOOR', 'OUTDOOR', 'BOTH'));

-- 전체 옷 목록
SELECT * FROM clothing_item ORDER BY id;


-- 특정 clothing_id로 확인
SELECT * FROM clothing_item WHERE clothing_id BETWEEN 2001 AND 2010;

-- 시즌 매핑 확인
SELECT * FROM clothing_item_season cs
                  JOIN clothing_item ci ON cs.clothing_item_id = ci.id
WHERE ci.clothing_id BETWEEN 2001 AND 2010
ORDER BY ci.id, cs.season;