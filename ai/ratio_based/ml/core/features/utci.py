from pythermalcomfort.models import utci

# 구름량 -> delta 계산
def estimate_delta_from_clouds(cloud_pct: float) -> float:
    cloud_pct = max(0.0, min(100.0, cloud_pct))
    delta = 2.0 + 6.0 * (1.0 - cloud_pct / 100.0)
    return delta

# 복사열 근사치 계산
def estimate_tmrt(Ta: float, cloud_pct: float) -> float:
    delta = estimate_delta_from_clouds(cloud_pct)
    return Ta + delta

# UTCI 계산
def weather_to_utci(
    Ta: float, # 기온 (°C)
    RH: float, # 상대습도 (%)
    Va: float, # 풍속 (m/s)
    cloud_pct: float # 구름량 (%)
) -> float:
    # 1) Tmrt 근사
    Tmrt = estimate_tmrt(Ta, cloud_pct)

    # 2) UTCI 계산
    utci_value = utci(
        tdb=Ta,
        tr=Tmrt,
        v=Va,
        rh=RH
    )

    return float(utci_value.utci)


if __name__ == "__main__":
    Ta = 35.0 # °C
    RH = 90.0 # %
    # 1m/s = 3.6km/h
    Va = 1.3 # m/s
    clouds = 5.0 # %

    utci_val = weather_to_utci(Ta, RH, Va, clouds)

    print(f"UTCI = {utci_val.utci:.2f} °C")

