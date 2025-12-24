# 소재 데이터

MATERIAL_FEATURES = {
    "Cotton": {"warmth": 2, "breathability": 5, "water_res": 1},
    "Polyester": {"warmth": 3, "breathability": 2, "water_res": 4},
    "Wool": {"warmth": 5, "breathability": 3, "water_res": 2},
    "Silk": {"warmth": 2, "breathability": 4, "water_res": 1},
    "Linen": {"warmth": 1, "breathability": 5, "water_res": 1},
    "Denim": {"warmth": 3, "breathability": 3, "water_res": 2},
    "Leather": {"warmth": 4, "breathability": 1, "water_res": 4},
    "Nylon": {"warmth": 2, "breathability": 2, "water_res": 5},
    "Spandex": {"warmth": 2, "breathability": 3, "water_res": 2},
    "Unknown": {"warmth": 3, "breathability": 3, "water_res": 3}
}

MATERIAL_MAPPER = {
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
