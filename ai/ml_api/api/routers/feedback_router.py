from fastapi import APIRouter, Query
from typing import Any, Dict, List
from pydantic import ValidationError
import logging

from ..schemas.blend_ratio_schema import BlendRatioFeedbackRequest
from ..schemas.recommendation_schemas import RecommendationRequest
from ..services.compute_bias import apply_bias_and_rerank, run_blend_ratio
from ..services.predictor import recommender_service

logger = logging.getLogger(__name__)

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
    logger.info("===== [feedback_adaptive] START =====")
    logger.info("payload_keys=%s", list(payload.keys()))
    logger.info("year=%d month=%d", year, month)

    feedback_id = payload.get("feedbackId")
    samples: List[Dict] = payload.get("samples", [])

    logger.info("feedbackId=%s", feedback_id)
    logger.info("samples_count=%d", len(samples))

    if samples:
        logger.info("first_sample=%s", samples[0])
    else:
        logger.warning("samples is empty")

    models = []

    trained = False
    used_samples = len(samples)
    raw_user_bias = 0.0

    # ---------- BLEND_ADAPTIVE ----------
    try:
        logger.info("--- [BLEND_ADAPTIVE] START ---")

        blend_req = _parse(BlendRatioFeedbackRequest, payload)
        logger.info("[BLEND] parse success")
        logger.info("[BLEND] items=%s", getattr(blend_req, "items", None))
        logger.info("[BLEND] weather=%s", getattr(blend_req, "weather", None))

        blend_scored = run_blend_ratio(blend_req)
        logger.info("[BLEND] blend_scored_count=%d", len(blend_scored))

        if blend_scored:
            blend_bias_result = apply_bias_and_rerank(
                scored_items=blend_scored,
                samples=samples,
            )

            logger.info("[BLEND] trained=%s", blend_bias_result["trained"])
            logger.info("[BLEND] usedSamples=%d", blend_bias_result["usedSamples"])
            logger.info("[BLEND] userBias=%.4f", blend_bias_result["userBias"])
            logger.info("[BLEND] results_count=%d", len(blend_bias_result["results"]))

            trained = blend_bias_result["trained"]
            used_samples = blend_bias_result["usedSamples"]
            raw_user_bias = blend_bias_result["userBias"]

            models.append({
                "modelType": "BLEND_ADAPTIVE",
                "modelVersion": "blend-adaptive-v0",
                "results": [
                    {
                        "clothingId": it["clothingId"],
                        "score": clamp_score(it["score"] * 100),
                    }
                    for it in blend_bias_result["results"]
                ],
            })
        else:
            logger.warning("[BLEND] blend_scored is empty")
            models.append({
                "modelType": "BLEND_ADAPTIVE",
                "modelVersion": "v.26.1.0b",
                "results": [],
            })

    except ValidationError as e:
        logger.error("[BLEND] ValidationError", exc_info=e)
        models.append({
            "modelType": "BLEND_ADAPTIVE",
            "modelVersion": "v.26.1.0b",
            "results": [],
        })


    # ---------- MATERIAL_ADAPTIVE ----------
    try:
        logger.info("--- [MATERIAL_ADAPTIVE] START ---")

        material_req = _parse(RecommendationRequest, payload)
        logger.info("[MATERIAL] items_count=%d", len(material_req.items))
        logger.info("[MATERIAL] weather=%s", getattr(material_req, "weather", None))

        scored_items = []
        for idx, item in enumerate(material_req.items):
            logger.info("[MATERIAL] item[%d] name=%s", idx, item.name)

            if not item.name or item.name.strip() == "":
                logger.warning("[MATERIAL] item[%d] skipped (empty name)", idx)
                continue

            score = recommender_service.calculate_score(
                item, material_req.weather
            )

            scored_items.append({
                "clothingId": item.clothingId,
                "score": score,
            })

        logger.info("[MATERIAL] scored_items_count=%d", len(scored_items))

        if scored_items:
            bias_result = apply_bias_and_rerank(
                scored_items=scored_items,
                samples=samples,
            )

            logger.info("[MATERIAL] trained=%s", bias_result["trained"])
            logger.info("[MATERIAL] usedSamples=%d", bias_result["usedSamples"])
            logger.info("[MATERIAL] userBias=%.4f", bias_result["userBias"])
            logger.info("[MATERIAL] results_count=%d", len(bias_result["results"]))

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
            logger.warning("[MATERIAL] scored_items is empty")
            models.append({
                "modelType": "MATERIAL_ADAPTIVE",
                "modelVersion": "v.26.1.0m",
                "results": [],
            })

    except ValidationError as e:
        logger.error("[MATERIAL] ValidationError", exc_info=e)
        models.append({
            "modelType": "MATERIAL_ADAPTIVE",
            "modelVersion": "v.26.1.0m",
            "results": [],
        })


    # ---------- bias scale (router responsibility) ----------
    user_bias_scaled = int((raw_user_bias + 1.0) * 50)
    user_bias_scaled = max(0, min(100, user_bias_scaled))

    logger.info("===== [feedback_adaptive] END =====")
    logger.info("trained=%s", trained)
    logger.info("usedSamples=%d", used_samples)
    logger.info("raw_user_bias=%.4f", raw_user_bias)
    logger.info("user_bias_scaled=%d", user_bias_scaled)
    logger.info(
        "models_summary=%s",
        [(m["modelType"], len(m["results"])) for m in models]
    )

    return {
        "feedbackId": feedback_id,
        "trained": trained,
        "usedSamples": used_samples,
        "userBias": user_bias_scaled,
        "models": models,
    }
