from fastapi import APIRouter, Query
from typing import Any, Dict, List
from pydantic import ValidationError

from ..schemas.blend_ratio_schema import BlendRatioFeedbackRequest
from ..schemas.recommendation_schemas import RecommendationRequest
from ..services.compute_bias import apply_bias_and_rerank, run_blend_ratio
from ..services.feedback_service import run_feedback_recommend
from ..services.predictor import recommender_service

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

_LAST_BACKEND_PAYLOAD = None

def clamp_score(score: float) -> int:
    return max(0, min(100, int(score + 0.5)))

def _parse(schema, payload: Dict[str, Any]):
    if hasattr(schema, "model_validate"):
        return schema.model_validate(payload)
    return schema.parse_obj(payload)

@router.get("/backend/last-payload")
def backend_last_payload():
    if _LAST_BACKEND_PAYLOAD is None:
        return {
            "received": False,
            "message": "아직 백엔드에서 POST 요청을 받지 못했습니다.",
        }

    return {
        "received": True,
        "payload": _LAST_BACKEND_PAYLOAD,
    }

@router.post("/adaptive")
def feedback_adaptive(
    payload: Dict[str, Any],
    year: int = Query(...),
    month: int = Query(...),
):
    feedback_id = payload.get("feedbackId")
    samples: List[Dict] = payload.get("samples", [])

    models = []

    trained = False
    used_samples = len(samples)
    raw_user_bias = 0.0

    # ---------- BLEND_ADAPTIVE ----------
    try:
        # 1. 요청 파싱
        blend_req = _parse(BlendRatioFeedbackRequest, payload)

        # 2. 1차 BLEND score 계산
        blend_scored = run_blend_ratio(blend_req)

        if blend_scored:
            # 3. bias + rerank (공통 bias 계산의 기준)
            blend_bias_result = apply_bias_and_rerank(
                scored_items=blend_scored,
                samples=samples,
            )

            # 4. 대표 bias 결과 설정 (한 번만)
            trained = blend_bias_result["trained"]
            used_samples = blend_bias_result["usedSamples"]
            raw_user_bias = blend_bias_result["userBias"]

            # 5. 응답용 결과 구성
            models.append({
                "modelType": "BLEND_ADAPTIVE",
                "modelVersion": "blend-adaptive-v0",
                "results": [
                    {
                        "clothingId": it["clothingId"],
                        # BLEND 점수는 0~1 → 0~100 변환
                        "score": clamp_score(it["score"] * 100),
                    }
                    for it in blend_bias_result["results"]
                ],
            })
        else:
            models.append({
                "modelType": "BLEND_ADAPTIVE",
                "modelVersion": "v.26.1.0b",
                "results": [],
            })

    except ValidationError:
        models.append({
            "modelType": "BLEND_ADAPTIVE",
            "modelVersion": "v.26.1.0b",
            "results": [],
        })


    # ---------- MATERIAL_ADAPTIVE ----------
    try:
        material_req = _parse(RecommendationRequest, payload)

        scored_items = []
        for item in material_req.items:
            if not item.name or item.name.strip() == "":
                continue
            score = recommender_service.calculate_score(
                item, material_req.weather
            )
            scored_items.append({
                "clothingId": item.clothingId,
                "score": score,
            })

        if scored_items:
            bias_result = apply_bias_and_rerank(
                scored_items=scored_items,
                samples=samples,
            )

            trained = bias_result["trained"]
            used_samples = bias_result["usedSamples"]
            raw_user_bias = bias_result["userBias"]

            models.append({
                "modelType": "MATERIAL_ADAPTIVE",
                "modelVersion": "material-adaptive-v0",
                "results": [
                    {
                        "clothingId": it["clothingId"],
                        "score": it["score"],
                    }
                    for it in bias_result["results"]
                ],
            })
        else:
            models.append({
                "modelType": "MATERIAL_ADAPTIVE",
                "modelVersion": "v.26.1.0m",
                "results": [],
            })

    except ValidationError:
        models.append({
            "modelType": "MATERIAL_ADAPTIVE",
            "modelVersion": "v.26.1.0m",
            "results": [],
        })

    # ---------- bias scale (router responsibility) ----------
    user_bias_scaled = int((raw_user_bias + 1.0) * 50)
    user_bias_scaled = max(0, min(100, user_bias_scaled))

    return {
        "feedbackId": feedback_id,
        "trained": trained,
        "usedSamples": used_samples,
        "userBias": user_bias_scaled,
        "models": models,
    }
