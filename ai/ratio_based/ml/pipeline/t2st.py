import torch
import pandas as pd
import numpy as np

from ml.core.models.comfort_mlp import ComfortMLP
from ml.pipeline.config import TRAIN_CONFIG
from ml.pipeline.train_val import ComfortDataset

def regression_metrics(y_true, y_pred):
    return {
        "MAE": np.mean(np.abs(y_true - y_pred)),
        "MSE": np.mean((y_true - y_pred) ** 2),
        "RMSE": np.sqrt(np.mean((y_true - y_pred) ** 2)),
        "R2": 1 - np.sum((y_true - y_pred)**2)
              / np.sum((y_true - np.mean(y_true))**2),
    }

def test():
    cfg = TRAIN_CONFIG
    device = torch.device(
        "cuda" if torch.cuda.is_available() else "mps"
        if torch.backends.mps.is_available() else "cpu"
    )

    use_tanh_target = (cfg["activation"] == "tanh")
    test_dataset = ComfortDataset(
        csv_path="../data/processed/test.csv",
        use_tanh_target=use_tanh_target
    )
    test_loader = torch.utils.data.DataLoader(
        test_dataset,
        batch_size=cfg["batch_size"],
        shuffle=False,
    )

    model = ComfortMLP(
        input_dim=cfg["input_dim"],
        hidden_dims=cfg["hidden_dims"],
        activation=cfg["activation"],
        dropout=cfg["dropout"],
    ).to(device)
    model.load_state_dict(
        torch.load("../artifacts/model.pt",
                   map_location=device,
                   weights_only=True)
    )
    model.eval()

    predicts, targets = [], []

    with torch.no_grad():
        for X, y in test_loader:
            X, y = X.to(device), y.to(device)
            out = model(X)

            predicts.append(out.cpu().numpy())
            targets.append(y.cpu().numpy())

    predicts = np.vstack(predicts)
    targets = np.vstack(targets)

    if cfg["activation"] == "tanh":
        predicts = (predicts + 1) / 2.0
        targets = (targets + 1) / 2.0

    metrics = regression_metrics(targets, predicts)
    print("Test Result ▼")
    for k, v in metrics.items():
        print(f"{k}: {v:.4f}")

    # pd.DataFrame({
    #     "gt": targets.squeeze(),
    #     "pred": predicts.squeeze(),
    #     "error": predicts.squeeze() - targets.squeeze(),
    # }).to_csv("../artifacts/test_predict.csv", index=False)

if __name__ == "__main__":
    test()