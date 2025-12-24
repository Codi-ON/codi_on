import torch

from api.config import MODEL_PATH, DEVICE, MODEL_CONFIG
from ml.core.models.comfort_mlp import ComfortMLP

_model = None

# 모델 최초 로드시 전역 변수로 유지
def load_model() -> torch.nn.Module:
    global _model

    if _model is not None:
        return _model

    # MODEL_CONFIG가 dict 타입으로 되어있으므로 이를 해제
    model = ComfortMLP(**MODEL_CONFIG)

    state_dict = torch.load(
        MODEL_PATH,
        map_location=DEVICE,
        weights_only=True,
    )
    model.load_state_dict(state_dict)

    model.to(DEVICE)
    model.eval()

    _model = model
    return _model

# 외부에서 모델을 호출하는 인터페이스
def get_model() -> torch.nn.Module:
    if _model is None:
        return load_model()
    return _model