import os
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_DIR = os.path.join(BASE_DIR, "..", "data", "raw")
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "data", "processed")

INPUT_CSV = os.path.join(INPUT_DIR, "dataset.csv")

def split_dataset(
    csv_path: str,
    output_dir: str,
    train_utci_range: tuple = (None, 10.0),
    val_ratio: float = 0.4,
    seed: int = 42,
):

    df = pd.read_csv(csv_path)

    train_df = df[df["UTCI"] <= train_utci_range[1]]
    holdout_df = df[df["UTCI"] > train_utci_range[1]]

    # hold-out
    np.random.seed(seed)
    holdout_df = holdout_df.sample(frac=1.0, random_state=seed)

    n_holdout = len(holdout_df)
    val_end = int(n_holdout * val_ratio)

    val_df = holdout_df.iloc[:val_end]
    test_df = holdout_df.iloc[val_end:]

    MAX_TEST_ROWS = 100_000  # 원하는 만큼

    if len(test_df) > MAX_TEST_ROWS:
        test_df = test_df.sample(
            n=MAX_TEST_ROWS,
            random_state=seed
        )

    # 4. save
    os.makedirs(output_dir, exist_ok=True)

    train_df.to_csv(os.path.join(output_dir, "train.csv"), index=False)
    val_df.to_csv(os.path.join(output_dir, "val.csv"), index=False)
    test_df.to_csv(os.path.join(output_dir, "test.csv"), index=False)

    print("Dataset split completed (UTCI hold-out)")
    print(f" - Total   : {len(df)}")
    print(f" - Train   : {len(train_df)} (UTCI <= {train_utci_range[1]})")
    print(f" - Val     : {len(val_df)}")
    print(f" - Test    : {len(test_df)}")


if __name__ == "__main__":
    split_dataset(
        csv_path=INPUT_CSV,
        output_dir=OUTPUT_DIR,
        train_utci_range=(None, 18.0),
        val_ratio=0.1,
        seed=42,
    )
