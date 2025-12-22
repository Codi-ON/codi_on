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
    ap: float,
    neutral_utci: float = 18.0
) -> float:
    # 1. UTCI 편차 페널티
    utci_penalty = abs(utci - neutral_utci)

    # 2. 온열/한랭 가중치
    cold_scale = 18.0
    heat_scale = 14.0
    cold_ratio = np.clip(((neutral_utci - utci) / cold_scale), 0.0, 1.0)
    heat_ratio = np.clip(((utci - neutral_utci) / heat_scale), 0.0, 1.0)
    required_rct = 0.055 + 0.0005 * np.clip(neutral_utci - utci, 0.0, 30.0)
    cold_penalty = np.clip(required_rct - r_ct, 0.0, None)

    # 3. 의복 물성 페널티
    cloth_penalty = (
        cold_ratio * cold_penalty  +
        heat_ratio * r_et +
        heat_ratio * (1.0 / ap)
    )

    weight_utci = 0.04
    weight_cloth = 0.25
    score = (
        1.0
        - weight_utci * utci_penalty
        - weight_cloth * cloth_penalty
    )

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
                            r_et=props["R_et"],
                            ap=props["AP"],
                        )

                        rows.append({
                            "C_ratio": c_ratio,
                            "R_ct": props["R_ct"],
                            "R_et": props["R_et"],
                            "AP": props["AP"],
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
