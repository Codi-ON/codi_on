from fastapi import Query, APIRouter
from typing import Any, Dict
from pydantic import ValidationError

from ..schemas.blend_ratio_schema import BlendRatioFeedbackRequest
from ..schemas.recommendation_schemas import RecommendationRequest
from ..services.compute_bias import apply_bias_and_rerank
from ..services.feedback_service import run_feedback_recommend
from ..services.predictor import recommender_service

router = APIRouter(prefix="/feedback", tags=["feedback"])


def _parse(schema, payload: Dict[str, Any]):
    if hasattr(schema, "model_validate"):
        return schema.model_validate(payload)
    return schema.parse_obj(payload)


@router.post("/")
def feedback(payload: Dict[str, Any]):
    feedback_id = None
    models = []

    try:
        blend_req = _parse(BlendRatioFeedbackRequest, payload)
        if blend_req.items:
            blend_result = run_feedback_recommend(blend_req)

            models.append({
                "modelType": "BLEND_ADAPTIVE",
                "results": [
                    {
                        "clothingId": it["clothingId"],
                        "score": int(it["score"] * 100 + 0.5)
                    }
                    for it in blend_result["results"]
                ]
            })
    except ValidationError:
        models.append({
            "modelType": "BLEND_ADAPTIVE",
            "results": []
        })

    try:
        material_req = _parse(RecommendationRequest, payload)

        scored_items = []
        for item in material_req.items:
            if not item.name or item.name.strip() == "":
                continue
            score = recommender_service.calculate_score(item, material_req.weather)
            scored_items.append({
                "clothingId": item.clothingId,
                "score": score,
            })

        if scored_items:
            reranked = apply_bias_and_rerank(
                model_type="MATERIAL_ADAPTIVE",
                scored_items=scored_items,
            )

            models.append({
                "modelType": "MATERIAL_ADAPTIVE",
                "results": [
                    {
                        "clothingId": it["clothingId"],
                        "score": it["score"],
                    }
                    for it in reranked
                ]
            })
    except ValidationError:
        models.append({
            "modelType": "MATERIAL_ADAPTIVE",
            "results": [],
        })

    return {
        "feedbackId": feedback_id,
        "models": models,
        "meta": {}
    }
