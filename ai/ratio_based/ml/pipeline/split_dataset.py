import os
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_DIR = os.path.join(BASE_DIR, "..", "artifacts")
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "data", "processed")

INPUT_CSV = os.path.join(INPUT_DIR, "dataset.csv")

def split_dataset(
    csv_path: str,
    output_dir: str,
    train_ratio: float = 0.8,
    val_ratio: float = 0.1,
    seed: int = 42,
):
    # 1. load
    df = pd.read_csv(csv_path)
    n_total = len(df)

    # 2. shuffle index
    indices = np.arange(n_total)
    np.random.seed(seed)
    np.random.shuffle(indices)

    train_end = int(n_total * train_ratio)
    val_end = train_end + int(n_total * val_ratio)

    train_idx = indices[:train_end]
    val_idx = indices[train_end:val_end]
    test_idx = indices[val_end:]

    # 3. save
    os.makedirs(output_dir, exist_ok=True)

    df.iloc[train_idx].to_csv(
        os.path.join(output_dir, "train.csv"), index=False
    )
    df.iloc[val_idx].to_csv(
        os.path.join(output_dir, "val.csv"), index=False
    )
    df.iloc[test_idx].to_csv(
        os.path.join(output_dir, "test.csv"), index=False
    )

    print("✅ Dataset split completed")
    print(f" - Total : {n_total}")
    print(f" - Train : {len(train_idx)}")
    print(f" - Val   : {len(val_idx)}")
    print(f" - Test  : {len(test_idx)}")


if __name__ == "__main__":
    split_dataset(
        csv_path=INPUT_CSV,
        output_dir=OUTPUT_DIR,
        train_ratio=0.8,
        val_ratio=0.1,
        seed=42,
    )
