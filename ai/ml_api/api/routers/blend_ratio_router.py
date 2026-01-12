from typing import Any, Dict
from fastapi import APIRouter
from pydantic import ValidationError
from datetime import date

from ..schemas.blend_ratio_schema import BlendRatioRecommendRequest, BlendRatioRecommendResponse
from ..services.blend_ratio_service import predict_comfort_batch
from ..services.feedback_service import run_feedback_recommend

router = APIRouter(prefix="/recommend", tags=["blendRatioScore"])

def _parse(payload: Dict[str, Any]) -> BlendRatioRecommendRequest:
    if hasattr(BlendRatioRecommendRequest, "model_validate"):
        return BlendRatioRecommendRequest.model_validate(payload)
    return BlendRatioRecommendRequest.parse_obj(payload)

def _empty_result():
    return {"results": [{"clothingId": 0, "blendRatioScore": None}]}

@router.get("/blend-ratio/health")
def health():
    return {"status": "ok", "service": "comfort"}

# comfort score 계산, feedback x
@router.post("/blend-ratio")
def batch(payload: Dict[str, Any]):
    try:
        req = _parse(payload)
    except ValidationError:
        return _empty_result()
    except Exception:
        return _empty_result()
    if not req.items:
        return {"results": []}

    try:
        results = predict_comfort_batch(req.context, req.items)
        public_results = [
            {
                "clothingId": r.clothingId,
                "blendRatioScore": int(r.blendRatioScore * 100 + 0.5)
            }
            for r in results
        ]
        dto = BlendRatioRecommendResponse(results=public_results)
        return dto.model_dump() if hasattr(dto, "model_dump") else dto.dict()
    except Exception:
        return _empty_result()

# feedback 기반 재정렬
@router.post("/yesterday-feedback")
def yesterday_feedback(payload: Dict[str, Any]):
    try:
        req = _parse(payload)
    except ValidationError:
        return _empty_result()
    except Exception:
        return _empty_result()
    if not req.items:
        return {"results": []}

    try:
        result = run_feedback_recommend(req)

        public_results = [
            {
                "clothingId": item["clothingId"],
                "blendRatioScore": int(item["score"] * 100 + 0.5)
            }
            for item in result["results"]
        ]

        dto = BlendRatioRecommendResponse(
            date=result["date"],
            results=public_results,
            recoStrategy=None #"BLEND_RATIO"
        )
        return dto.model_dump() if hasattr(dto, "model_dump") else dto.dict()

    except Exception as e:
        print("[ERROR][/yesterday-feedback]", repr(e))
        return _empty_result()

