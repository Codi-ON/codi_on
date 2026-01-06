# 소재 데이터

# 1. 백엔드 데이터 매핑 (Backend String -> Internal Key)
THICKNESS_MAPPER = {
    "THIN": "Light",
    "NORMAL": "Medium",
    "THICK": "Heavy"
}

MATERIAL_NAME_MAPPER = {
    "면": "Cotton", "코튼": "Cotton",
    "폴리에스테르": "Polyester", "폴리": "Polyester",
    "울": "Wool", "양모": "Wool",
    "실크": "Silk", "비단": "Silk",
    "린넨": "Linen", "마": "Linen",
    "데님": "Denim", "청": "Denim",
    "가죽": "Leather", "레더": "Leather",
    "나일론": "Nylon",
    "스판": "Spandex",
    "Unknown": "Unknown"
}

# 2. 소재 물성 데이터베이스 (Material Physics DB)
# 학습 기준: W1(0.15), W2(0.4), W3(0.7), W4(1.0), W5(1.5)
MATERIAL_DB = {
    "Cotton": {
        "Light": {"warmth": 1, "breathability": 5, "water_res": 1, "clo": 0.15},   # 티셔츠
        "Medium": {"warmth": 2, "breathability": 4, "water_res": 1, "clo": 0.30},  # 셔츠 (W2 근접)
        "Heavy": {"warmth": 4, "breathability": 3, "water_res": 2, "clo": 1.10},   # 기모 후드/맨투맨
    },
    "Polyester": {
        "Light": {"warmth": 1, "breathability": 4, "water_res": 3, "clo": 0.20},   # 쿨링/스포츠 (W1 근접)
        "Medium": {"warmth": 2, "breathability": 3, "water_res": 4, "clo": 0.95},  # 바람막이/자켓
        "Heavy": {"warmth": 5, "breathability": 1, "water_res": 5, "clo": 2.80},   # 헤비 패딩/플리스
    },
    "Wool": {
        "Light": {"warmth": 2, "breathability": 4, "water_res": 2, "clo": 0.35},   # 얇은 니트
        "Medium": {"warmth": 3, "breathability": 3, "water_res": 2, "clo": 0.90},  # 두꺼운 가디건 (W3 근접)
        "Heavy": {"warmth": 4, "breathability": 2, "water_res": 3, "clo": 1.50},   # 울 코트
    },
    "Linen": {
        "Light": {"warmth": 1, "breathability": 5, "water_res": 1, "clo": 0.10},
        "Medium": {"warmth": 1, "breathability": 5, "water_res": 1, "clo": 0.15},
        "Heavy": {"warmth": 1, "breathability": 4, "water_res": 1, "clo": 0.20},
    },
    "Denim": {
        "Light": {"warmth": 1, "breathability": 3, "water_res": 2, "clo": 0.55},
        "Medium": {"warmth": 2, "breathability": 3, "water_res": 2, "clo": 0.95},  # 일반 청바지
        "Heavy": {"warmth": 3, "breathability": 2, "water_res": 2, "clo": 1.40},   # 겨울용 두꺼운 데님
    },
    "Unknown": {
        "Light": {"warmth": 1, "breathability": 3, "water_res": 3, "clo": 0.2},
        "Medium": {"warmth": 2, "breathability": 3, "water_res": 3, "clo": 0.4},
        "Heavy": {"warmth": 3, "breathability": 3, "water_res": 3, "clo": 0.7},
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
    # 해당 소재가 DB에 없으면 Unknown 사용
    material_data = MATERIAL_DB.get(name_en, MATERIAL_DB["Unknown"])

    # 해당 두께 데이터가 없으면 Medium 사용
    props = material_data.get(thickness_key, material_data["Medium"])

    return props

