from typing import Any, Dict
from fastapi import APIRouter
from pydantic import ValidationError
from datetime import date

from ..schemas.recommendation_schemas import RecommendationRequest
from ..services.compute_bias import apply_bias_and_rerank
from ..services.predictor import recommender_service  # ✅ 상대 임포트로 고정

router = APIRouter(prefix="/recommend", tags=["materialRatioScore"])

def _parse(payload: Dict[str, Any]) -> RecommendationRequest:
    if hasattr(RecommendationRequest, "model_validate"):  # pydantic v2
        return RecommendationRequest.model_validate(payload)
    return RecommendationRequest.parse_obj(payload)       # pydantic v1

@router.get("/material_ratio/health")
def health():
    return {"status": "ok", "service": "recommend"}

@router.post("/material_ratio")
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
        return {
            "date": None,
            "results": results,
            "recoStrategy": None}
    except Exception as e:
        return {"results": []}
        # return {"status": "error", "message": "INTERNAL_ERROR", "details": str(e)}

@router.post("/yesterday-feedback-material")
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
        scored_items = []

        for item in req.items:
            if not item.name or item.name.strip() == "":
                continue

            try:
                score = recommender_service.calculate_score(item, current_weather)

                scored_items.append({
                    "clothingId": item.clothingId,
                    "score": score,
                })

            except Exception as e:
                print(f"아이템({item.name}) 계산 중 에러 건너뜀: {e}")
                continue

        if not scored_items:
            return {"results": []}

        reranked_items = apply_bias_and_rerank(
            model_type="MATERIAL_RATIO",
            scored_items=scored_items,
        )

        results = [
            {
                "clothingId": it["clothingId"],
                "materialRatioScore": it["score"],
            }
            for it in reranked_items
        ]

        return {
            "date": date.today().strftime("%Y-%m-%d"),
            "results": results,
            "recoStrategy": None #"MATERIAL_RATIO"
        }

    except Exception as e:
        print("[ERROR][/yesterday-feedback2]", repr(e))
        return {"results": []}