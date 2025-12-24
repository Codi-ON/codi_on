from fastapi import APIRouter
from api.schemas.predict_schema import ComfortBatchRequest, ComfortBatchResult
from api.services.inference_service import predict_comfort_batch

router = APIRouter(prefix="/comfort", tags=["comfort"])

@router.get("/health")
def comfort_health():
    return {"status": "ok"}

@router.post("/batch", response_model=ComfortBatchResult)
def comfort_batch(req: ComfortBatchRequest):
    # batch는 “응답 200 유지”가 목표
    results = predict_comfort_batch(req.context, req.items)
    return ComfortBatchResult(results=results)