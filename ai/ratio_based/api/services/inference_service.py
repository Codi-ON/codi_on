import torch

from api.config import DEVICE
from api.dependencies.model_loader import get_model
from ml.pipeline.preprocess import build_feature_vector


def predict_comfort(c_ratio, Ta, RH, Va, cloud):
    model = get_model()

    # 모델 input은 list가 아닌 tensor 형태
    X = build_feature_vector(c_ratio, Ta, RH, Va, cloud)
    x_tensor = torch.tensor(X, dtype=torch.float32).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        y = model(x_tensor)

    return float(y)

def _test():
    score = predict_comfort(
        c_ratio=60,
        Ta=-2.0,
        RH=60.0,
        Va=1.5,
        cloud=10.0
    )
    print(score)

if __name__ == '__main__':

    _test()