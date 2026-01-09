from typing import Any, Dict
from fastapi import APIRouter
from pydantic import ValidationError

from ..schemas.recommendation_schemas import RecommendationRequest
from ..services.predictor import recommender_service  # ✅ 상대 임포트로 고정

router = APIRouter(prefix="/recommend/material_ratio", tags=["recommend"])

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
            # ✅ [추가] 이름이 없으면 계산하지 않고 건너뛰기
            if not item.name or item.name.strip() == "":
                continue
            try:
                score = recommender_service.calculate_score(item, current_weather)
                results.append({
                    "clothingId": item.clothingId,
                    "material_name": item.name,
                    "materialRatioScore": score,
                    "analysis": f"적합도 {score}점"
                })
            except Exception as e:
                print(f"⚠️ 아이템({item.name}) 계산 중 에러 건너뜀: {e}")
                continue
        results.sort(key=lambda x: x["materialRatioScore"], reverse=True)
        return {"results": results}
    except Exception as e:
        return {"results": []}
        # return {"status": "error", "message": "INTERNAL_ERROR", "details": str(e)}