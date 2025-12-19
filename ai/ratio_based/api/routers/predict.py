from fastapi import APIRouter, HTTPException

from api.schemas.predict_schema import ComfortResponse, ComfortRequest
from api.services.inference_service import predict_comfort

router = APIRouter(
    prefix="/predict", # 엔드포인트
    tags=["comfort"],
)

@router.post("/comfort", response_model=ComfortResponse)
def predict(request: ComfortRequest):
    try:
        score = predict_comfort(
            c_ratio=request.c_ratio,
            Ta=request.Ta,
            RH=request.RH,
            Va=request.Va,
            cloud=request.cloud,
        )
        return ComfortResponse(comfort_score=score)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))