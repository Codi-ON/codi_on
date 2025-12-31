import pandas as pd
import numpy as np
from scipy.interpolate import interp1d

def get_base_cloth_df() -> pd.DataFrame:
    data = {
        "C_ratio": [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0],
        "P_ratio": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        "R_ct":    [0.072, np.nan, 0.069, 0.066, np.nan, 0.060, np.nan, 0.056, np.nan, np.nan, 0.052],
        "R_et":    [np.nan, 9.7, 9.6, 9.1, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan],
        "AP":      [np.nan, 77, 83, 101, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan]
    }
    return pd.DataFrame(data)

def interpolate_r_ct(df: pd.DataFrame) -> pd.Series:
    return df["R_ct"].interpolate(
        method="linear",
        limit_area="inside"
    )

def extrapolate_r_et(df: pd.DataFrame) -> np.ndarray:
    mask = df["R_et"].notna()

    f_ret = interp1d(
        df.loc[mask, "C_ratio"],
        df.loc[mask, "R_et"],
        kind="linear",
        fill_value="extrapolate"
    )

    return f_ret(df["C_ratio"])

def extrapolate_ap(df: pd.DataFrame) -> np.ndarray:
    mask = df["AP"].notna()

    f_ap = interp1d(
        df.loc[mask, "C_ratio"],
        df.loc[mask, "AP"],
        kind="linear",
        fill_value="extrapolate"
    )

    return f_ap(df["C_ratio"])

def build_cloth_property_table() -> pd.DataFrame:
    df = get_base_cloth_df()
    result_df = df.copy()

    result_df["R_ct"] = interpolate_r_ct(df)
    result_df["R_et"] = extrapolate_r_et(df)
    result_df["AP"]   = extrapolate_ap(df)

    return result_df

def get_cloth_properties(
        c_ratio: float,
        thickness: str = "normal",
        table: pd.DataFrame = None
) -> dict:
    if table is None:
        table = build_cloth_property_table()

    table = table.sort_values("C_ratio")
    c_ratio = float(np.clip(c_ratio, 0, 100))

    base_r_ct = np.interp(c_ratio, table["C_ratio"], table["R_ct"])
    base_r_et = np.interp(c_ratio, table["C_ratio"], table["R_et"])
    base_ap = np.interp(c_ratio, table["C_ratio"], table["AP"])

    THICKNESS_SCALE = {
        "thin":   {"R_ct": 0.85, "R_et": 0.90, "AP": 1.15},
        "normal": {"R_ct": 1.00, "R_et": 1.00, "AP": 1.00},
        "thick":  {"R_ct": 1.15, "R_et": 1.10, "AP": 0.85},
    }

    if thickness not in THICKNESS_SCALE:
        raise ValueError(f"invalid thickness: {thickness}")

    scale = THICKNESS_SCALE[thickness]

    r_ct = base_r_ct * scale["R_ct"]
    r_et = base_r_et * scale["R_et"]
    ap = base_ap * scale["AP"]

    return {
        "R_ct": float(r_ct),
        "R_et": float(r_et),
        "AP": float(ap)
    }

if __name__ == '__main__':
    props = get_cloth_properties(65.0)

    print(props)
