# 소재 데이터

# 1. 백엔드 데이터 매핑 (Backend String -> Internal Key)
THICKNESS_MAPPER = {
    "THIN": "Light",
    "NORMAL": "Medium",
    "THICK": "Heavy"
}

MATERIAL_NAME_MAPPER = {
    # 기존
    "면": "Cotton", "코튼": "Cotton",
    "폴리에스테르": "Polyester", "폴리": "Polyester",
    "울": "Wool", "양모": "Wool",
    "린넨": "Linen", "마": "Linen",
    "데님": "Denim", "청": "Denim",
    "실크": "Silk", "비단": "Silk",
    "가죽": "Leather", "레더": "Leather",
    "나일론": "Nylon",
    "스판": "Spandex",
    "Unknown": "Unknown"
}

# 2. 소재 물성 데이터베이스 (Material DB)
# [범례 - Float Scale]
# Warmth (보온성): 1.0(시원) ~ 5.0(매우 따뜻)
# Breathability (통기성): 1.0(답답) ~ 5.0(매우 쾌적)
# Water_Res (방수/발수): 1.0(잘 젖음) ~ 5.0(완전 방수)
# Clo (보온력 지수): 0.1(반팔) ~ 2.8(패딩)

MATERIAL_DB = {
    # 1. 면 (Cotton)
    "Cotton": {
        "Light": {"warmth": 1.2, "breathability": 4.8, "water_res": 1.0, "clo": 0.15},  # 린넨보다 아주 살짝 따뜻
        "Medium": {"warmth": 2.2, "breathability": 4.0, "water_res": 1.2, "clo": 0.30},  # 일반 셔츠
        "Heavy": {"warmth": 3.8, "breathability": 3.0, "water_res": 1.5, "clo": 1.10},  # 기모가 꽤 따뜻함
    },

    # 2. 폴리에스테르 (Polyester)
    "Polyester": {
        "Light": {"warmth": 1.5, "breathability": 3.8, "water_res": 3.0, "clo": 0.20},  # 면보다 통기성 살짝 낮음
        "Medium": {"warmth": 2.8, "breathability": 2.5, "water_res": 4.0, "clo": 0.95},  # 바람막이 효과
        "Heavy": {"warmth": 4.8, "breathability": 1.2, "water_res": 4.8, "clo": 2.80},  # 패딩은 보온성 최상
    },

    # 3. 울 (Wool)
    "Wool": {
        "Light": {"warmth": 2.4, "breathability": 4.2, "water_res": 1.8, "clo": 0.35},  # 얇아도 따뜻함
        "Medium": {"warmth": 3.5, "breathability": 3.5, "water_res": 2.2, "clo": 0.90},  # 쾌적한 보온
        "Heavy": {"warmth": 4.9, "breathability": 2.5, "water_res": 2.8, "clo": 1.60},  # 코트의 강력한 보온
    },

    # 4. 린넨 (Linen)
    "Linen": {
        "Light": {"warmth": 1.0, "breathability": 5.0, "water_res": 1.0, "clo": 0.10},  # 가장 시원함
        "Medium": {"warmth": 1.3, "breathability": 4.8, "water_res": 1.0, "clo": 0.15},
        "Heavy": {"warmth": 2.0, "breathability": 4.0, "water_res": 1.2, "clo": 0.25},
    },

    # 5. 데님 (Denim)
    "Denim": {
        "Light": {"warmth": 1.5, "breathability": 3.2, "water_res": 1.5, "clo": 0.55},
        "Medium": {"warmth": 2.5, "breathability": 2.8, "water_res": 1.5, "clo": 0.95},
        "Heavy": {"warmth": 3.5, "breathability": 2.0, "water_res": 1.5, "clo": 1.40},
    },

    # 6. 실크 (Silk)
    "Silk": {
        "Light": {"warmth": 1.8, "breathability": 4.5, "water_res": 1.5, "clo": 0.15},
        "Medium": {"warmth": 2.5, "breathability": 3.8, "water_res": 1.5, "clo": 0.30},
        "Heavy": {"warmth": 3.2, "breathability": 2.5, "water_res": 1.8, "clo": 0.70},
    },

    # 7. 가죽 (Leather)
    "Leather": {
        "Light": {"warmth": 2.8, "breathability": 1.5, "water_res": 3.5, "clo": 0.60},
        "Medium": {"warmth": 4.2, "breathability": 1.0, "water_res": 4.2, "clo": 1.30},
        "Heavy": {"warmth": 5.0, "breathability": 0.5, "water_res": 4.8, "clo": 2.20},
    },

    # 8. 나일론 (Nylon)
    "Nylon": {
        "Light": {"warmth": 1.6, "breathability": 3.0, "water_res": 4.2, "clo": 0.20},
        "Medium": {"warmth": 3.2, "breathability": 1.8, "water_res": 4.5, "clo": 0.80},
        "Heavy": {"warmth": 4.6, "breathability": 1.0, "water_res": 4.9, "clo": 2.50},
    },

    # 9. 스판 (Spandex)
    "Spandex": {
        "Light": {"warmth": 1.4, "breathability": 4.2, "water_res": 2.5, "clo": 0.15},
        "Medium": {"warmth": 2.3, "breathability": 3.2, "water_res": 2.8, "clo": 0.40},
        "Heavy": {"warmth": 3.0, "breathability": 2.2, "water_res": 3.0, "clo": 0.80},
    },

    # 10. 기타 (Unknown)
    "Unknown": {
        "Light": {"warmth": 1.5, "breathability": 3.5, "water_res": 2.5, "clo": 0.20},
        "Medium": {"warmth": 2.5, "breathability": 3.0, "water_res": 2.5, "clo": 0.50},
        "Heavy": {"warmth": 3.5, "breathability": 2.5, "water_res": 2.5, "clo": 1.00},
    }
}


def get_material_props(name_kr, thickness_str):
    """
    한글 소재명과 두께(String)를 받아 구체적인 물성치를 반환
    """
    # 1. 소재명 변환 (한글 -> 영어)
    name_en = MATERIAL_NAME_MAPPER.get(name_kr, "Unknown")

    # 2. 두께 변환 (THIN -> Light)
    thickness_key = THICKNESS_MAPPER.get(thickness_str, "Medium")  # 기본값 Medium

    # 3. 데이터 조회
    material_data = MATERIAL_DB.get(name_en, MATERIAL_DB["Unknown"])
    props = material_data.get(thickness_key, material_data["Medium"])

    return props