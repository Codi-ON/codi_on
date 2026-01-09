from typing import Any, Dict
from fastapi import APIRouter
from pydantic import ValidationError
from datetime import date

from ..schemas.blend_ratio_schema import ComfortBatchRequest, ComfortBatchResult
from ..services.blend_ratio_service import predict_comfort_batch
from ..services.feedback_service import run_feedback_recommend

router = APIRouter(prefix="/recommend", tags=["comfort"])

def _parse(payload: Dict[str, Any]) -> ComfortBatchRequest:
    if hasattr(ComfortBatchRequest, "model_validate"):
        return ComfortBatchRequest.model_validate(payload)
    return ComfortBatchRequest.parse_obj(payload)

@router.get("/blend-ratio/health")
def health():
    return {"status": "ok", "service": "comfort"}

@router.post("/blend-ratio")
def batch(payload: Dict[str, Any]):
    try:
        req = _parse(payload)
    except ValidationError:
        return {
            "results": [{"clothingId": 0, "blendRatioScore": None}]
        }
    except Exception:
        return {
            "results": [{"clothingId": 0, "blendRatioScore": None}]
        }

    try:
        results = predict_comfort_batch(req.context, req.items)
        public_results = [
            {
                "clothingId": r.clothingId,
                "blendRatioScore": int(r.blendRatioScore * 100 + 0.5)
            }
            for r in results
        ]
        dto = ComfortBatchResult(results=public_results)
        return dto.model_dump() if hasattr(dto, "model_dump") else dto.dict()
    except Exception:
        return {
            "results": [{"clothingId": 0, "blendRatioScore": None}]
        }

@router.post("/yesterday-feedback")
def yesterday_feedback(payload: Dict[str, Any]):
    try:
        req = _parse(payload)
    except ValidationError:
        return {
            "results": [{"clothingId": 0, "blendRatioScore": None}]
        }
    except Exception:
        return {
            "results": [{"clothingId": 0, "blendRatioScore": None}]
        }

    try:
        result = run_feedback_recommend(req)

        public_results = [
            {
                "clothingId": item["clothingId"],
                "blendRatioScore": int(item["score"] * 100 + 0.5)
            }
            for item in result["results"]
        ]

        dto = ComfortBatchResult(
            date=result["date"],
            results=public_results,
        )
        return dto.model_dump() if hasattr(dto, "model_dump") else dto.dict()

    except Exception as e:
        print("[ERROR][/yesterday-feedback]", repr(e))
        return {
            "results": [{"clothingId": 0, "blendRatioScore": None}]
        }

