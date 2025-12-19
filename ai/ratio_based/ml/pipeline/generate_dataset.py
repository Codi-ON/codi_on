import pandas as pd
import numpy as np
import os

from ml.core.features.cloth_properties import get_cloth_properties
from ml.core.features.utci import weather_to_utci

# comfort score 규칙
def compute_comfort_score(
    utci: float,
    r_ct: float,
    r_et: float,
    neutral_utci: float = 18.0
) -> float:

    utci_penalty = abs(utci - neutral_utci)

    if utci > neutral_utci:
        cloth_penalty = r_et
    else:
        cloth_penalty = r_ct

    score = 1.0 - 0.04 * utci_penalty - 0.3 * cloth_penalty
    return float(np.clip(score, 0.0, 1.0))


# 데이터 생성
def generate_dataset() -> pd.DataFrame:
    rows = []

    # 1. 옷 혼방률 (for문)
    for c_ratio in range(0, 101, 10):
        props = get_cloth_properties(c_ratio)

        # 2. 날씨 입력 범위 (for문)
        for Ta in range(-10, 36, 2): # 기온
            for RH in range(30, 91, 5): # 습도
                for Va in np.arange(0.5, 8.1, 0.5): # 풍속
                    for cloud in range(0, 91, 10): # 구름량

                        utci = weather_to_utci(Ta, RH, Va, cloud)

                        # 3. UTCI 범위 필터링
                        if utci < -40 or utci > 46:
                            continue

                        comfort = compute_comfort_score(
                            utci=utci,
                            r_ct=props["R_ct"],
                            r_et=props["R_et"]
                        )

                        rows.append({
                            "C_ratio": c_ratio,
                            "R_ct": props["R_ct"],
                            "R_et": props["R_et"],
                            "Ta": Ta,
                            "RH": RH,
                            "Va": Va,
                            "cloud": cloud,
                            "UTCI": utci,
                            "comfort_score": comfort
                        })

    return pd.DataFrame(rows)


if __name__ == "__main__":
    SAVE_PATH = "../data/raw"
    df = generate_dataset()

    os.makedirs(SAVE_PATH, exist_ok=True)

    df.to_csv(os.path.join(SAVE_PATH, "dataset.csv"), index=False)
    print(f"Dataset saved: {len(df)} samples")
