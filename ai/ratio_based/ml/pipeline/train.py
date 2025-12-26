import os
import numpy as np
import torch
import torch.nn as nn
import pandas as pd
from torch.utils.data import Dataset, DataLoader
import matplotlib.pyplot as plt
import time
import random

from ml.pipeline.preprocess import build_feature_vector
from ml.core.models.comfort_mlp import ComfortMLP
from ml.pipeline.config import TRAIN_CONFIG

DATA_DIR = "../data/processed"

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    # CUDA 결정성 설정
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

class ComfortDataset(Dataset):
    def __init__(self, csv_path: str, use_tanh_target: bool):
        self.df = pd.read_csv(csv_path)

        self.X = []
        self.y = []

        for _, row in self.df.iterrows():
            features = build_feature_vector(
                c_ratio=row["C_ratio"],
                thickness=row["thickness"],
                usage=row["usage"],
                Ta=row["Ta"],
                RH=row["RH"],
                Va=row["Va"],
                cloud=row["cloud"],
                temp_range=row["temp_range"],
                weather_type=row["weather_type"],
            )
            self.X.append(features)
            self.y.append(row["comfort_score"])

        self.X = torch.tensor(self.X, dtype=torch.float32)
        self.y = torch.tensor(self.y, dtype=torch.float32).unsqueeze(1)

        if use_tanh_target:
            self.y = self.y * 2.0 - 1.0

    def __len__(self):
        return len(self.y)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

def get_loss_function(cfg):
    if cfg["loss"] == "mse":
        return nn.MSELoss()
    elif cfg["loss"] == "mae":
        return nn.L1Loss()
    else:
        raise ValueError(f"Unsupported loss: {cfg['loss']}")

def get_optimizer(model, cfg):
    opt_name = cfg["optimizer"].lower()
    lr = cfg["learning_rate"]
    wd = cfg.get("weight_decay", 0.0)

    if opt_name == "adam":
        return torch.optim.Adam(
            model.parameters(),
            lr=lr,
            weight_decay=wd
        )

    elif opt_name == "adamw":
        return torch.optim.AdamW(
            model.parameters(),
            lr=lr,
            weight_decay=wd
        )

    elif opt_name == "sgd":
        return torch.optim.SGD(
            model.parameters(),
            lr=lr,
            momentum=cfg.get("momentum", 0.0),
            weight_decay=wd
        )

    elif opt_name == "rmsprop":
        return torch.optim.RMSprop(
            model.parameters(),
            lr=lr,
            weight_decay=wd,
            momentum=cfg.get("momentum", 0.0)
        )

    else:
        raise ValueError(
            f"Unsupported optimizer '{cfg['optimizer']}'. "
        )

class EarlyStopping:
    def __init__(self, patience=10, min_delta=0.0):
        self.patience = patience
        self.min_delta = min_delta
        self.counter = 0
        self.best = None
        self.stop = False

    def step(self, value):
        if self.best is None:
            self.best = value
            return False

        if value < self.best - self.min_delta:
            self.best = value
            self.counter = 0
        else:
            self.counter += 1

        if self.counter >= self.patience:
            self.stop = True

        return self.stop

def train():
    start_time = time.time()
    cfg = TRAIN_CONFIG

    device = torch.device(
        "cuda" if torch.cuda.is_available() else "mps"
        if torch.backends.mps.is_available() else "cpu"
    )
    print(f"Using device: {device}")

    # tanh 사용을 위한 target normalization
    use_tanh_target = (cfg["activation"] == "tanh")
    # Dataset & Loader
    train_dataset = ComfortDataset(
        csv_path=os.path.join(DATA_DIR, "train.csv"),
        use_tanh_target=use_tanh_target
    )
    val_dataset = ComfortDataset(
        csv_path=os.path.join(DATA_DIR, "val.csv"),
        use_tanh_target=use_tanh_target
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=cfg["batch_size"],
        shuffle=True,
        num_workers=4,
        pin_memory=True
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=cfg["batch_size"],
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )

    model = ComfortMLP(
        input_dim=cfg["input_dim"],
        hidden_dims=cfg["hidden_dims"],
        activation=cfg["activation"],
        dropout=cfg["dropout"],
    ).to(device)

    loss_fn = get_loss_function(cfg)
    optimizer = get_optimizer(model, cfg)

    es = EarlyStopping(
        patience=cfg["es_patience"],
        min_delta=cfg["es_min_delta"]
    ) if cfg.get("early_stopping", False) else None

    train_losses = []
    val_losses = []

    best_train_loss = None # 결과 저장용 변수
    best_val_loss = float("inf") # 비교용 변수
    best_epoch = -1
    best_state = None # best model(= 가장 성능이 좋았던 epoch) 저장
    stop_epoch = -1

    # 한 줄로 print되는 epoch 갯수
    LOG_INTERVAL = max(1, 10)

    for epoch in range(cfg["epochs"]):
        # ---- Train ----
        model.train()
        train_loss = 0.0

        for x, y in train_loader:
            x, y = x.to(device), y.to(device)

            pred = model(x)
            loss = loss_fn(pred, y)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            train_loss += loss.item()

        train_loss /= len(train_loader)
        train_losses.append(train_loss)

        # ---- Validation ----
        model.eval()
        val_loss = 0.0

        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                pred = model(x)
                loss = loss_fn(pred, y)
                val_loss += loss.item()

        val_loss /= len(val_loader)
        val_losses.append(val_loss)

        # ---- Logging ----
        if epoch % LOG_INTERVAL == 0 or epoch == cfg["epochs"] - 1:
            print(
                f"[{epoch+1}/{cfg['epochs']}] "
                f"train_loss={train_loss:.4f} | val_loss={val_loss:.4f}"
            )

        # ---- Best model (VAL 기준) ----
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_epoch = epoch + 1
            best_state = model.state_dict()
            best_train_loss = train_loss

        # ---- Early Stopping ----
        if es and es.step(val_loss):
            stop_epoch = epoch + 1
            print(f"Early stopping at epoch {stop_epoch}")
            break

    # std 범위 설정
    k = 10
    last_k = min(k, len(val_losses))
    val_loss_std = np.std(val_losses[-last_k:])
    # val_loss_std = np.std(val_losses)

    # Save best model
    model_save_dir = "../artifacts"
    os.makedirs(model_save_dir, exist_ok=True)
    model.load_state_dict(best_state)
    torch.save(model.state_dict(), os.path.join(model_save_dir, "model.pt"))

    print("\n=== Training Summary ===")
    print(f"Best epoch : {best_epoch}")
    print(f"Best val loss : {best_val_loss:.4f}")
    print(f"Best train loss : {best_train_loss:.4f}")
    print(f"Stopped epoch : {stop_epoch}")
    print(f"Val loss std : {val_loss_std:.6f}")

    elapsed = time.time() - start_time
    print(f"Total time: {elapsed:.2f}s")

    plt.figure(figsize=(6, 4))
    plt.plot(train_losses, label="Train Loss")
    plt.plot(val_losses, label="Val Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.title("Train / Val Loss")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    set_seed()
    train()
