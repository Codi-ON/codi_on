from ml.core.features.cloth_properties import get_cloth_properties
from ml.core.features.utci import weather_to_utci

def build_feature_vector(
        c_ratio: float,
        Ta: float,
        RH: float,
        Va: float,
        cloud: float,
        use_ap: bool = False
) -> list:
    props = get_cloth_properties(c_ratio)
    utci = weather_to_utci(Ta, RH, Va, cloud)

    if use_ap:
        return [props["R_ct"], props["R_et"], props["AP"], utci]
    else:
        return [props["R_ct"], props["R_et"], utci]