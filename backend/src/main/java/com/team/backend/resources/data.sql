-- =========================================================
-- 1. 기존 테이블 정리
-- =========================================================
DROP TABLE IF EXISTS clothing_item_season CASCADE;
DROP TABLE IF EXISTS clothing_item CASCADE;

-- =========================================================
-- 2. clothing_item 테이블 생성 (엔티티/기능정의서 기준)
-- =========================================================
CREATE TABLE clothing_item (
    id                  BIGSERIAL PRIMARY KEY,
    clothing_id         BIGINT       NOT NULL,
    name                VARCHAR(60)  NOT NULL,
    category            VARCHAR(20)  NOT NULL,
    thickness_level     VARCHAR(10)  NOT NULL,
    usage_type          VARCHAR(10)  NOT NULL,
    suitable_min_temp   INT          NOT NULL,
    suitable_max_temp   INT          NOT NULL,
    color               VARCHAR(30),
    style_tag           VARCHAR(50),
    image_url           TEXT,
    selected_count      INT          NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_clothing_item_clothing_id UNIQUE (clothing_id),
    CONSTRAINT chk_clothing_item_category
        CHECK (category IN ('TOP','BOTTOM','OUTER','ONE_PIECE','ACCESSORY')),
    CONSTRAINT chk_clothing_item_thickness
        CHECK (thickness_level IN ('THICK','NORMAL','THIN')),
    CONSTRAINT chk_clothing_item_usage
        CHECK (usage_type IN ('INDOOR','OUTDOOR','BOTH')),
    CONSTRAINT chk_clothing_item_temp_range
        CHECK (suitable_min_temp <= suitable_max_temp)
);

CREATE INDEX idx_clothing_item_category
    ON clothing_item(category);

CREATE INDEX idx_clothing_item_thickness
    ON clothing_item(thickness_level);

CREATE INDEX idx_clothing_item_usage
    ON clothing_item(usage_type);

CREATE INDEX idx_clothing_item_temp_range
    ON clothing_item(suitable_min_temp, suitable_max_temp);

CREATE INDEX idx_clothing_item_selected
    ON clothing_item(selected_count);

-- =========================================================
-- 3. clothing_item_season 테이블 생성 (정규화된 시즌 매핑)
-- =========================================================
CREATE TABLE clothing_item_season (
    clothing_item_id BIGINT      NOT NULL,
    season           VARCHAR(10) NOT NULL,
    CONSTRAINT pk_clothing_item_season
        PRIMARY KEY (clothing_item_id, season),
    CONSTRAINT fk_clothing_item_season_item
        FOREIGN KEY (clothing_item_id)
        REFERENCES clothing_item(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_clothing_item_season
        CHECK (season IN ('SPRING','SUMMER','AUTUMN','WINTER'))
);

-- =========================================================
-- 4. 더미 의류 데이터 30개 INSERT
--    - clothing_id는 외부 비즈니스 키(ML/프론트 매칭용)
-- =========================================================
INSERT INTO clothing_item
(clothing_id, name, category, thickness_level, usage_type,
 suitable_min_temp, suitable_max_temp,
 color, style_tag, image_url, selected_count)
VALUES
-- 1001~1006 : 상의
(1001, '흰 반팔 티셔츠',        'TOP', 'THIN',   'INDOOR', 20, 30, 'white',  'basic',      NULL, 0),
(1002, '검정 반팔 티셔츠',      'TOP', 'THIN',   'BOTH',   20, 30, 'black',  'basic',      NULL, 0),
(1003, '긴팔 티셔츠',           'TOP', 'NORMAL', 'BOTH',   15, 25, 'white',  'casual',     NULL, 0),
(1004, '니트 스웨터',           'TOP', 'THICK',  'BOTH',    5, 15, 'beige',  'knit',       NULL, 0),
(1005, '후드티',                'TOP', 'NORMAL', 'BOTH',   10, 20, 'gray',   'hoodie',     NULL, 0),
(1006, '스트라이프 셔츠',       'TOP', 'THIN',   'BOTH',   15, 25, 'blue',   'shirt',      NULL, 0),

-- 1007~1010 : 하의
(1007, '슬림 슬랙스',           'BOTTOM', 'NORMAL', 'BOTH', 10, 25, 'black',  'slacks',     NULL, 0),
(1008, '청바지',                'BOTTOM', 'NORMAL', 'BOTH',  5, 20, 'blue',   'denim',      NULL, 0),
(1009, '숏팬츠',                'BOTTOM', 'THIN',   'OUTDOOR',22, 35, 'beige',  'shorts',     NULL, 0),
(1010, '조거 팬츠',             'BOTTOM', 'NORMAL', 'BOTH',  8, 18, 'gray',   'jogger',     NULL, 0),

-- 1011~1015 : 아우터
(1011, '경량 패딩',             'OUTER', 'THIN',   'OUTDOOR', 5, 15,  'navy',  'light_down', NULL, 0),
(1012, '롱 패딩',               'OUTER', 'THICK',  'OUTDOOR',-10, 5,  'black', 'long_down',  NULL, 0),
(1013, '트렌치 코트',           'OUTER', 'NORMAL', 'OUTDOOR',10, 18, 'beige', 'trench',     NULL, 0),
(1014, '가죽 자켓',             'OUTER', 'NORMAL', 'OUTDOOR', 8, 18, 'black', 'leather',    NULL, 0),
(1015, '가디건',                'OUTER', 'THIN',   'INDOOR', 16, 22, 'brown', 'cardigan',   NULL, 0),

-- 1016~1018 : 원피스/스커트
(1016, '여름 원피스',           'ONE_PIECE', 'THIN',   'BOTH',  22, 32, 'yellow','onepiece',  NULL, 0),
(1017, '봄가을 원피스',         'ONE_PIECE', 'NORMAL', 'BOTH',  15, 24, 'pink',  'onepiece',  NULL, 0),
(1018, '롱 스커트',             'BOTTOM',    'THIN',   'BOTH',  18, 28, 'black', 'skirt',     NULL, 0),

-- 1019~1025 : 기타 상·하의
(1019, '조끼',                  'OUTER', 'THIN',   'BOTH',  15, 22, 'beige', 'vest',       NULL, 0),
(1020, '셔츠형 아우터',         'OUTER', 'NORMAL', 'BOTH',  14, 22, 'khaki', 'shirt_outer',NULL, 0),
(1021, '와이드 팬츠',           'BOTTOM','NORMAL', 'BOTH',  15, 26, 'ivory', 'wide_pants', NULL, 0),
(1022, '린넨 셔츠',             'TOP',   'THIN',   'BOTH',  20, 30, 'white', 'linen_shirt',NULL, 0),
(1023, '린넨 팬츠',             'BOTTOM','THIN',   'BOTH',  22, 32, 'beige', 'linen_pants',NULL, 0),
(1024, '반팔 니트',             'TOP',   'NORMAL', 'BOTH',  18, 26, 'mint',  'knit',       NULL, 0),
(1025, '카라 티셔츠',           'TOP',   'THIN',   'BOTH',  18, 28, 'navy',  'polo',       NULL, 0),

-- 1026~1030 : 겨울/조깅/우비 등
(1026, '기모 이너 상의',        'TOP',   'THIN',   'INDOOR', -5, 10, 'black', 'inner',      NULL, 0),
(1027, '두꺼운 니트 원피스',    'ONE_PIECE', 'THICK', 'BOTH', 0, 12, 'brown','knit_one',   NULL, 0),
(1028, '조깅 셋업 상의',        'TOP',   'NORMAL', 'OUTDOOR',10, 20, 'gray', 'jogging_top',NULL, 0),
(1029, '조깅 셋업 하의',        'BOTTOM','NORMAL', 'OUTDOOR',10, 20, 'gray', 'jogging_bottom',NULL,0),
(1030, '우비',                  'OUTER', 'THIN',   'OUTDOOR',10, 25, 'blue', 'rain_coat',  NULL, 0);

-- =========================================================
-- 5. 시즌 매핑 INSERT
--    - clothing_id 기준으로 id를 찾아 season 매핑
-- =========================================================

-- 여름 전용
INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'SUMMER'
FROM clothing_item
WHERE clothing_id IN (1001, 1002, 1009, 1016, 1022, 1023, 1024, 1025, 1030);

-- 봄/가을 상의/원피스/아우터
INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'SPRING'
FROM clothing_item
WHERE clothing_id IN (1003, 1005, 1006, 1013, 1015, 1017, 1018, 1019, 1020, 1021, 1022, 1024, 1025);

INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'AUTUMN'
FROM clothing_item
WHERE clothing_id IN (1003, 1004, 1005, 1006, 1008, 1011, 1013, 1014, 1015, 1017, 1018, 1019, 1020, 1021, 1027, 1028, 1029, 1030);

-- 겨울 전용/겨울 포함
INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'WINTER'
FROM clothing_item
WHERE clothing_id IN (1004, 1008, 1010, 1011, 1012, 1026, 1027);

-- 봄·여름·가을 3계절용 (롱스커트, 와이드팬츠, 우비 등)
INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'SPRING'
FROM clothing_item
WHERE clothing_id IN (1018, 1021, 1030);

INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'SUMMER'
FROM clothing_item
WHERE clothing_id IN (1018, 1021, 1030);

INSERT INTO clothing_item_season (clothing_item_id, season)
SELECT id, 'AUTUMN'
FROM clothing_item
WHERE clothing_id IN (1018, 1021, 1030);