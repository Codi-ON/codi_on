def clamp(x, min_val=0.0, max_val=1.0):
    return max(min(x, max_val), min_val)

def utci_to_stress_level(utci: float) -> str:
    if utci > 46:
        return "extreme_heat"
    elif utci > 38:
        return "very_strong_heat"
    elif utci > 32:
        return "strong_heat"
    elif utci > 26:
        return "moderate_heat"
    elif utci >= 9:
        return "neutral"
    elif utci >= 0:
        return "slight_cold"
    elif utci >= -13:
        return "moderate_cold"
    elif utci >= -27:
        return "strong_cold"
    elif utci >= -40:
        return "very_strong_cold"
    else:
        return "extreme_cold"

STRESS_STRENGTH = {
    "neutral": 0.0,

    "slight_cold": 0.2,
    "moderate_cold": 0.4,
    "strong_cold": 0.6,
    "very_strong_cold": 0.8,
    "extreme_cold": 1.0,

    "moderate_heat": 0.4,
    "strong_heat": 0.6,
    "very_strong_heat": 0.8,
    "extreme_heat": 1.0,
}

def compute_comfort_score(
    environment_context: dict,
    clothing_response: dict,
) -> float:
    utci = environment_context["UTCI"]
    temp_range = environment_context["temp_range"]

    stress_level = utci_to_stress_level(utci)
    demand_strength = STRESS_STRENGTH[stress_level]

    if stress_level == "neutral":
        demand_type = "neutral"
    elif "cold" in stress_level:
        demand_type = "cold"
    else:
        demand_type = "heat"

    # 일교차 기반 불안정성
    instability = clamp(temp_range / 15.0) # 0~1

    R_ct = clothing_response["R_ct"] # 열저항
    R_et = clothing_response["R_et"] # 증기저항
    AP = clothing_response["AP"] # 공기투과

    R_ct_n = clamp(R_ct / 0.15)
    R_et_n = clamp(R_et / 15.0)
    AP_n = clamp(AP / 100.0)

    if demand_type == "neutral":
        # 열 스트레스 없음 → 옷 차이 거의 반영 안 됨
        mismatch = 0.0

    elif demand_type == "cold":
        # 추위: 보온 부족이 핵심
        mismatch = demand_strength * (1.0 - R_ct_n)

    else:
        # 더위: 과보온 + 땀 배출 방해 + 통기 부족
        mismatch = demand_strength * (
            0.4 * R_ct_n +
            0.4 * R_et_n +
            0.2 * (1.0 - AP_n)
        )

    instability_penalty = instability * 0.3 * abs(R_ct_n - 0.5)

    total_mismatch = clamp(mismatch + instability_penalty)

    comfort_score = 1.0 - total_mismatch

    return round(comfort_score, 4)
