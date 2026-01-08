from typing import List
import torch

from api.config import DEVICE
from api.schemas.predict_schema import Context, Item, Result
from ml.pipeline.preprocess import build_feature_vector
from api.dependencies.model_loader import load_model


THICKNESS_LOWER = {
    "THIN": "thin",
    "NORMAL": "normal",
    "THICK": "thick",
}

WEATHER_MAP = {
    "CLEAR": "clear",

    "CLOUDS": "cloudy",

    "RAIN": "rain",
    "DRIZZLE": "rain",
    "THUNDERSTORM": "rain",

    "SNOW": "snow",
}


def normalize_thickness(thickness: str) -> str:
    return THICKNESS_LOWER[thickness.upper()]


def normalize_weather(weather_type: str) -> str:
    if not weather_type:
        return "cloudy"

    key = weather_type.upper()
    return WEATHER_MAP.get(key, "cloudy")

def score_0_1_to_0_100(score: float) -> int:
    score = max(0.0, min(1.0, score))
    return int(round(score * 100))


def predict_comfort_batch(
    context: Context,
    items: List[Item],
) -> List[Result]:

    print("\n[DEBUG] ===== Inference Start =====")
    print("[DEBUG] context:", context)

    model = load_model()
    model.eval()

    results: List[Result] = []

    temp_range = context.maxTemperature - context.minTemperature
    weather_type = normalize_weather(context.sky)

    print("[DEBUG] maxTemperature:", context.maxTemperature)
    print("[DEBUG] minTemperature:", context.minTemperature)
    print("[DEBUG] temp_range(calculated):", temp_range)
    print("[DEBUG] sky(normalized):", weather_type)

    for it in items:
        print("\n[DEBUG] item:", it)

        try:
            thickness = normalize_thickness(it.thickness)
            print("[DEBUG] thickness(normalized):", thickness)

            feature = build_feature_vector(
                c_ratio=it.c_ratio,
                thickness=thickness,
                Ta=context.temperature,
                RH=context.humidity,
                Va=context.windSpeed,
                cloud=context.cloudAmount,
                temp_range=temp_range,
                weather_type=weather_type,
            )

            print("[DEBUG] feature vector:", feature)

            x = torch.tensor(feature, dtype=torch.float32).unsqueeze(0).to(DEVICE)
            print("[DEBUG] model input shape:", x.shape)

            with torch.no_grad():
                raw_score = model(x).item()

            print("[DEBUG] raw_score:", raw_score)

            comfort_score = score_0_1_to_0_100(raw_score)
            # comfort_score = raw_score
            print("[DEBUG] comfort_score(0~100):", comfort_score)

            results.append(
                Result(
                    clothingId=it.clothingId,
                    blendRatioScore=comfort_score,
                )
            )

        except Exception as e:
            print("[ERROR] exception:", repr(e))
            results.append(
                Result(
                    clothingId=it.clothingId,
                    blendRatioScore=None,
                    # error=str(e),
                )
            )

    print("[DEBUG] ===== Inference End =====\n")
    return results
