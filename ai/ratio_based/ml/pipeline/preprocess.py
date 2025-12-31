from ml.core.features.cloth_properties import get_cloth_properties
from ml.core.features.utci import weather_to_utci

def one_hot_weather(weather_type: str) -> list:
    mapping = {
        "clear": [1, 0, 0, 0],
        "cloudy": [0, 1, 0, 0],
        "rain": [0, 0, 1, 0],
        "snow": [0, 0, 0, 1],
    }
    if weather_type not in mapping:
        raise ValueError("Unknown weather type")
    return mapping[weather_type]

def build_feature_vector(
        c_ratio: float,
        thickness: str,
        Ta: float,
        RH: float,
        Va: float,
        cloud: float,
        temp_range: float,
        weather_type: str
) -> list:
    props = get_cloth_properties(c_ratio, thickness)
    clothing_response = [
        props["R_ct"],
        props["R_et"],
        props["AP"],
    ]

    utci = weather_to_utci(Ta, RH, Va, cloud)
    environment_context = [
        utci,
        temp_range,
    ] + one_hot_weather(weather_type)

    return clothing_response + environment_context