import torch
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR/"ml"/"artifacts"/"model.pt"

# model.pt를 학습할 때의 layer 구조가 동일해야함
MODEL_CONFIG = {
    "input_dim": 9,
    "hidden_dims": [32, 16],
    "activation": "silu",
    "dropout": 0.1,
}

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "mps"
    if torch.backends.mps.is_available() else "cpu"
)