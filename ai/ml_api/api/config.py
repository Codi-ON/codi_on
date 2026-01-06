import os
from pathlib import Path
import torch

BASE_DIR = Path(__file__).resolve().parent.parent  # /app

MODEL_BASE_PATH = os.getenv("MODEL_BASE_PATH")  # docker: /app/models

if MODEL_BASE_PATH:
    MODEL_PATH = Path(MODEL_BASE_PATH) / "ratio_based" / "ml" / "artifacts" / "model.pt"
else:
    # 로컬: ai/ml_api/api 기준으로 ai/ratio_based/ml/artifacts/model.pt
    MODEL_PATH = (BASE_DIR.parent / "ratio_based" / "ml" / "artifacts" / "model.pt").resolve()

MODEL_CONFIG = {
    "input_dim": 9,
    "hidden_dims": [32, 16],
    "activation": "silu",
    "dropout": 0.1,
}

# docker(linux)는 mps 없음. cuda 아니면 cpu로 고정.
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")