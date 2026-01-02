from typing import Any, Dict
from fastapi import APIRouter
from pydantic import ValidationError

from ..schemas.recommendation_schemas import RecommendationRequest
from ..services.predictor import recommender_service  # ✅ 상대 임포트로 고정

router = APIRouter(prefix="/recommend", tags=["recommend"])

def _parse(payload: Dict[str, Any]) -> RecommendationRequest:
    if hasattr(RecommendationRequest, "model_validate"):  # pydantic v2
        return RecommendationRequest.model_validate(payload)
    return RecommendationRequest.parse_obj(payload)       # pydantic v1

@router.get("/health")
def health():
    return {"status": "ok", "service": "recommend"}

@router.post("")
def recommend(payload: Dict[str, Any]):
    # 422/500 방지: dict로 받고 내부에서 수동검증 + 예외 봉합
    try:
        req = _parse(payload)
    except ValidationError as e:
        return {"status": "fail", "message": "VALIDATION_ERROR", "details": str(e)}
    except Exception as e:
        return {"status": "error", "message": "INTERNAL_ERROR", "details": str(e)}

    try:
        current_weather = req.weather
        results = []
        for item in req.items:
            score = recommender_service.calculate_score(item, current_weather)
            results.append({
                "clothingId": item.clothingId,
                "material_name": item.name,
                "score": score,
                "analysis": f"체감온도 {current_weather.feelsLikeTemperature}도 기준 적합도 {score}점"
            })
        results.sort(key=lambda x: x["score"], reverse=True)
        return {"status": "success", "recommendations": results}
    except Exception as e:
        return {"status": "error", "message": "INTERNAL_ERROR", "details": str(e)}