import os
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_DIR = os.path.join(BASE_DIR, "..", "data", "raw")
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "data", "processed")

INPUT_CSV = os.path.join(INPUT_DIR, "dataset.csv")

def minmaxnorm(x, minx, maxx):
    if maxx <= minx:
        return 0.0
    v = (x - minx) / (maxx - minx)
    return max(min(v, 1.0), 0.0)

def infer_regime_from_utci(utci: float) -> str:
    heat_demand = minmaxnorm(utci - 26.0, 0.0, 20.0)
    return "heat" if heat_demand > 0.0 else "cold_neutral"

def split_dataset(
    csv_path: str,
    output_dir: str,
    train_ratio: float = 0.8,
    val_ratio: float = 0.1,
    seed: int = 42,
):
    assert 0 < train_ratio < 1
    assert 0 <= val_ratio < 1
    assert train_ratio + val_ratio < 1, "train_ratio + val_ratio must be < 1"

    df = pd.read_csv(csv_path)

    df["_regime"] = df["UTCI"].apply(infer_regime_from_utci)

    rng = np.random.default_rng(seed)

    train_parts, val_parts, test_parts = [], [], []

    for regime, gdf in df.groupby("_regime"):
        gdf = gdf.sample(frac=1.0, random_state=seed).reset_index(drop=True)

        n = len(gdf)
        n_train = int(n * train_ratio)
        n_val = int(n * val_ratio)

        train_g = gdf.iloc[:n_train]
        val_g = gdf.iloc[n_train:n_train + n_val]
        test_g = gdf.iloc[n_train + n_val:]

        train_parts.append(train_g)
        val_parts.append(val_g)
        test_parts.append(test_g)

        print(f"[{regime}] total={n} | train={len(train_g)} | val={len(val_g)} | test={len(test_g)}")

    train_df = pd.concat(train_parts, ignore_index=True)
    val_df = pd.concat(val_parts, ignore_index=True)
    test_df = pd.concat(test_parts, ignore_index=True)

    for _df in (train_df, val_df, test_df):
        if "_regime" in _df.columns:
            _df.drop(columns=["_regime"], inplace=True)

    os.makedirs(output_dir, exist_ok=True)
    train_df.to_csv(os.path.join(output_dir, "train.csv"), index=False)
    val_df.to_csv(os.path.join(output_dir, "val.csv"), index=False)
    test_df.to_csv(os.path.join(output_dir, "test.csv"), index=False)

    print("\nDataset split completed (regime-aware, no regime saved)")
    print(f" - Total : {len(df)}")
    print(f" - Train : {len(train_df)}")
    print(f" - Val   : {len(val_df)}")
    print(f" - Test  : {len(test_df)}")

if __name__ == "__main__":
    split_dataset(
        csv_path=INPUT_CSV,
        output_dir=OUTPUT_DIR,
        train_ratio=0.8,
        val_ratio=0.1,
        seed=0,
    )
