# 최소값 보다 작으면 최소값으로, 최대값 보다 크면 최대값으로
def clamp(x, minx=0.0, maxx=1.0):
    return max(min(x, maxx), minx)

# min-max normalization
def minmaxnorm(x, minx, maxx):
    if maxx <= minx:
        return 0.0
    return clamp((x - minx) / (maxx - minx))

def compute_comfort_score(
    environment_context: dict,
    clothing_response: dict,
    thickness: str,
) -> float:
    utci = environment_context["UTCI"]
    temp_range = environment_context["temp_range"]
    weather_type = environment_context["weather_type"]

    WEATHER_MULTIPLIER = {
        "clear": 1.00,
        "cloudy": 1.05,
        "rain": 1.15,
        "snow": 1.25,
    }
    weather_mult = WEATHER_MULTIPLIER.get(weather_type, 1.0)

    # cold:  neutral(15) -> extreme cold stress(-40)
    cold_demand = minmaxnorm(9.0 - utci, 0.0, 36.0)
    cold_eff = cold_demand ** weather_mult
    # heat: neutral(20) -> extreme heat stress(46)
    heat_demand = minmaxnorm(utci - 26.0, 0.0, 20.0)
    heat_eff = heat_demand ** weather_mult

    r_ct = clothing_response["R_ct"] # 열저항
    r_et = clothing_response["R_et"] # 증기저항
    ap = clothing_response["AP"] # 공기투과

    THICKNESS_FACTOR = {
        "thin": 0.90,
        "normal": 1.00,
        "thick": 1.15,
    }
    if thickness not in THICKNESS_FACTOR:
        raise ValueError(f"Invalid thickness: {thickness}")

    t = THICKNESS_FACTOR[thickness]

    r_ct_eff = r_ct * t
    r_et_eff = r_et * t
    ap_eff = ap / t

    # 보온
    insulation_cap = minmaxnorm(r_ct_eff, 0.02, 0.15)
    # 습윤
    ret_score = minmaxnorm(1.0 / max(r_et_eff, 1e-6), 0.05, 0.20)
    ap_score = minmaxnorm(ap_eff, 30.0, 300.0)
    moisture_release = clamp(0.6 * ret_score + 0.4 * ap_score)
    # 추위의 score 최대치 제한
    cold_target = clamp(0.50 + 0.40 * cold_eff)
    under_insulation = max(0.0, cold_target - insulation_cap)
    cold_penalty = cold_eff * under_insulation
    # 더위의 score 최소치 제한
    heat_max = clamp(0.50 - 0.30 * heat_eff)
    over_insulation = max(0.0, insulation_cap - heat_max)
    heat_penalty = heat_eff * over_insulation

    moisture_penalty = heat_eff * (1.0 - moisture_release)

    instability = clamp(temp_range / 15.0)
    neutral_gate = 1.0 - max(cold_eff, heat_eff)
    instability_penalty = instability * abs(insulation_cap - 0.5) * 0.25 * neutral_gate

    total_penalty = (
        cold_penalty +
        heat_penalty +
        moisture_penalty +
        instability_penalty
    )

    comfort_score = clamp(1.0 - total_penalty)

    return round(comfort_score, 4)
