import os
import itertools
import pandas as pd
import numpy as np

from ml.core.features.utci import weather_to_utci
from ml.core.features.cloth_properties import get_cloth_properties
from ml.core.scoring.compute_comfort import compute_comfort_score

def build_environment_context(weather: dict) -> dict:
    utci = weather_to_utci(
        Ta=weather["Ta"],
        RH=weather["RH"],
        Va=weather["Va"],
        cloud_pct=weather["cloud"],
    )

    temp_range = weather["temp_max"] - weather["temp_min"]

    weather_main = weather["weather_main"].lower()
    if weather_main in ["rain", "drizzle", "thunderstorm"]:
        weather_type = "rain"
    elif weather_main == "snow":
        weather_type = "snow"
    elif weather_main == "clear":
        weather_type = "clear"
    elif weather_main == "clouds":
        weather_type = "cloudy"
    else:
        weather_type = "etc"

    return {
        "UTCI": utci,
        "temp_range": temp_range,
        "weather_type": weather_type,
    }

def generate_dataset() -> pd.DataFrame:
    rows = []

    cotton_ratios = [100, 80, 60, 40, 20, 0]
    thickness_levels = ["thin", "normal", "thick"]

    ta_list = range(-10, 36, 5)
    rh_list = range(30, 91, 10)
    va_list = np.arange(0.5, 8.1, 1.5)
    cloud_list = range(0, 91, 15)

    temp_ranges = [4, 9, 14]

    def allowed_weather_mains(ta: float):
        mains = ["Clear", "Clouds"]
        if Ta > 0:
            mains.append("Rain")   # 0도 이상이면 비 가능
        else:
            mains.append("Snow")   # 0도 이하면 눈 가능
        return mains

    for c_ratio, thickness in itertools.product(
        cotton_ratios, thickness_levels
    ):
        props = get_cloth_properties(
            c_ratio=c_ratio,
            thickness=thickness,
        )

        clothing_response = {
            "R_ct": props["R_ct"],
            "R_et": props["R_et"],
            "AP": props["AP"],
        }

        for Ta, RH, Va, cloud in itertools.product(
            ta_list, rh_list, va_list, cloud_list
        ):
            for tr in temp_ranges:
                for wm in allowed_weather_mains(Ta):
                    weather = {
                        "Ta": Ta,
                        "RH": RH,
                        "Va": Va,
                        "cloud": cloud,
                        "weather_main": wm,
                        "temp_min": Ta - tr / 2,
                        "temp_max": Ta + tr / 2,
                    }

                    env = build_environment_context(weather)

                    if env["UTCI"] < -40 or env["UTCI"] > 46:
                        continue

                    comfort_score = compute_comfort_score(
                        environment_context=env,
                        clothing_response=clothing_response,
                        thickness=thickness
                    )

                    rows.append({
                        "C_ratio": c_ratio,
                        "thickness": thickness,
                        "R_ct": clothing_response["R_ct"],
                        "R_et": clothing_response["R_et"],
                        "AP": clothing_response["AP"],

                        "Ta": Ta,
                        "RH": RH,
                        "Va": Va,
                        "cloud": cloud,
                        "UTCI": env["UTCI"],
                        "temp_range": env["temp_range"],
                        "weather_type": env["weather_type"],

                        "comfort_score": comfort_score,
                    })

    return pd.DataFrame(rows)

if __name__ == "__main__":
    SAVE_PATH = "../data/raw"
    os.makedirs(SAVE_PATH, exist_ok=True)

    df = generate_dataset()
    save_file = os.path.join(SAVE_PATH, "dataset.csv")
    df.to_csv(save_file, index=False)

    print(f"Dataset saved: {save_file}")
    print(f"Total samples: {len(df)}")

    exit()
    csv_path = "../data/raw/dataset.csv"
    df = pd.read_csv(csv_path)
    print("comfort_score min:", df["UTCI"].min())
    print("comfort_score max:", df["UTCI"].max())