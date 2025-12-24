from typing import Any, Dict
from fastapi import APIRouter
from pydantic import ValidationError

from ..schemas.predict_schema import ComfortBatchRequest, ComfortBatchResult
from ..services.inference_service import predict_comfort_batch  # ✅ 상대 임포트

router = APIRouter(prefix="/comfort", tags=["comfort"])

def _parse(payload: Dict[str, Any]) -> ComfortBatchRequest:
    if hasattr(ComfortBatchRequest, "model_validate"):
        return ComfortBatchRequest.model_validate(payload)
    return ComfortBatchRequest.parse_obj(payload)

@router.get("/health")
def health():
    return {"status": "ok", "service": "comfort"}

@router.post("/batch")
def batch(payload: Dict[str, Any]):
    try:
        req = _parse(payload)
    except ValidationError:
        return {"results": [{"item_id": 0, "comfort_score": None, "error": "VALIDATION_ERROR"}]}
    except Exception:
        return {"results": [{"item_id": 0, "comfort_score": None, "error": "INTERNAL_ERROR"}]}

    try:
        results = predict_comfort_batch(req.context, req.items)
        dto = ComfortBatchResult(results=results)
        return dto.model_dump() if hasattr(dto, "model_dump") else dto.dict()
    except Exception:
        return {"results": [{"item_id": 0, "comfort_score": None, "error": "INTERNAL_ERROR"}]}