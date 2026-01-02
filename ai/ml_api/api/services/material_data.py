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
# Warmth(1~5), Breathability(1~5), Water_Res(1~5), Clo(보온력 참고치)
MATERIAL_DB = {
    "Cotton": {
        "Light": {"warmth": 1, "breathability": 5, "water_res": 1, "clo": 0.15},  # 티셔츠
        "Medium": {"warmth": 2, "breathability": 4, "water_res": 1, "clo": 0.30},  # 셔츠
        "Heavy": {"warmth": 4, "breathability": 3, "water_res": 2, "clo": 0.60},  # 후드/맨투맨
    },
    "Polyester": {
        "Light": {"warmth": 2, "breathability": 4, "water_res": 3, "clo": 0.20},  # 쿨링 소재
        "Medium": {"warmth": 3, "breathability": 3, "water_res": 4, "clo": 0.40},  # 일반 자켓
        "Heavy": {"warmth": 5, "breathability": 1, "water_res": 5, "clo": 0.70},  # 플리스/패딩
    },
    "Wool": {
        "Light": {"warmth": 3, "breathability": 4, "water_res": 2, "clo": 0.35},  # 얇은 니트
        "Medium": {"warmth": 4, "breathability": 3, "water_res": 2, "clo": 0.50},  # 가디건
        "Heavy": {"warmth": 5, "breathability": 2, "water_res": 3, "clo": 1.00},  # 코트
    },
    "Linen": {
        # 린넨은 두꺼워도 보온성이 낮음
        "Light": {"warmth": 1, "breathability": 5, "water_res": 1, "clo": 0.10},
        "Medium": {"warmth": 1, "breathability": 5, "water_res": 1, "clo": 0.15},
        "Heavy": {"warmth": 2, "breathability": 4, "water_res": 1, "clo": 0.20},
    },
    "Denim": {
        "Light": {"warmth": 2, "breathability": 3, "water_res": 2, "clo": 0.25},
        "Medium": {"warmth": 3, "breathability": 3, "water_res": 2, "clo": 0.35},
        "Heavy": {"warmth": 4, "breathability": 2, "water_res": 2, "clo": 0.45},  # 기모 데님 등
    },
    # 기본값 (매핑 안 된 소재용)
    "Unknown": {
        "Light": {"warmth": 2, "breathability": 3, "water_res": 3, "clo": 0.2},
        "Medium": {"warmth": 3, "breathability": 3, "water_res": 3, "clo": 0.3},
        "Heavy": {"warmth": 4, "breathability": 3, "water_res": 3, "clo": 0.5},
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

