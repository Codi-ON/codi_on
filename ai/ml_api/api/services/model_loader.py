import sys
import os
import torch

# ---------------------------------------------------------
# 🛠️ [경로 연결] 팀원의 'ml' 폴더 위치 찾기 (로컬 vs Docker)
# ---------------------------------------------------------
current_dir = os.path.dirname(os.path.abspath(__file__))

# 1. 로컬 환경 경로 (현재 위치에서 3칸 위 -> ratio_based)
# 위치: CodiON/ai/ratio_based
local_target_path = os.path.abspath(os.path.join(current_dir, "../../../ratio_based"))

# 2. Docker 환경 경로 (Dockerfile 설정 기준)
# 위치: /app/models/ratio_based
docker_target_path = "/app/models/ratio_based"

# 3. 존재하는 경로를 찾아 sys.path에 추가
if os.path.exists(docker_target_path):
    if docker_target_path not in sys.path:
        sys.path.append(docker_target_path)
        print(f"🐳 Docker 환경: '{docker_target_path}' 경로 추가됨")
elif os.path.exists(local_target_path):
    if local_target_path not in sys.path:
        sys.path.append(local_target_path)
        print(f"📂 로컬 환경: '{local_target_path}' 경로 추가됨")
else:
    print(f"⚠️ 경고: 팀원 모델 폴더(ratio_based)를 찾을 수 없습니다.")
# ---------------------------------------------------------

# 빨간 줄이 떠도 실제 실행에는 문제 없습니다. (IDE 인식 불가 문제)
try:
    from ml.core.models.comfort_mlp import ComfortMLP  # type: ignore
except ImportError as e:
    print(f"🔥 Import Error: {e}")
    ComfortMLP = None

# config 불러오기 (같은 폴더)
try:
    from .config import MODEL_PATH, DEVICE, MODEL_CONFIG
except ImportError:
    # 경로 문제 시 절대 경로로 시도
    from ai.ml_api.api.services.config import MODEL_PATH, DEVICE, MODEL_CONFIG

_model = None


def load_model() -> torch.nn.Module:
    global _model

    if _model is not None:
        return _model

    if ComfortMLP is None:
        print("❌ ComfortMLP 클래스가 없어 모델을 로드할 수 없습니다.")
        return None

    # 모델 초기화
    # MODEL_CONFIG가 딕셔너리라면 **를 붙여서 언패킹
    model = ComfortMLP(**MODEL_CONFIG)

    try:
        print(f"🔄 모델 파일 로딩 중: {MODEL_PATH}")
        state_dict = torch.load(
            MODEL_PATH,
            map_location=DEVICE,
            # weights_only=True # 필요 시 주석 해제
        )
        model.load_state_dict(state_dict)
        model.to(DEVICE)
        model.eval()

        _model = model
        print("✅ 팀원 모델(ComfortMLP) 로드 완료!")
        return _model
    except Exception as e:
        print(f"🔥 모델 가중치 로드 실패: {e}")
        return None


def get_model() -> torch.nn.Module:
    if _model is None:
        return load_model()
    return _model