from fastapi import APIRouter, Query
from typing import Any, Dict, List
from pydantic import ValidationError

from ..schemas.blend_ratio_schema import BlendRatioFeedbackRequest
from ..schemas.recommendation_schemas import RecommendationRequest
from ..services.compute_bias import apply_bias_and_rerank, run_blend_ratio
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
    print("\n[DEBUG] ===== feedback_adaptive start =====")
    print("[DEBUG] payload keys:", list(payload.keys()))
    print("[DEBUG] year, month:", year, month)

    feedback_id = payload.get("feedbackId")
    samples: List[Dict] = payload.get("samples", [])

    print("[DEBUG] feedbackId:", feedback_id)
    print("[DEBUG] samples count:", len(samples))
    if samples:
        print("[DEBUG] first sample:", samples[0])
    else:
        print("[DEBUG] samples is empty")

    models = []

    trained = False
    used_samples = len(samples)
    raw_user_bias = 0.0

        # ---------- BLEND_ADAPTIVE ----------
    try:
        print("\n[DEBUG] --- BLEND_ADAPTIVE start ---")

        # 1. 요청 파싱
        blend_req = _parse(BlendRatioFeedbackRequest, payload)
        print("[DEBUG][BLEND] parse success")
        print("[DEBUG][BLEND] items:", getattr(blend_req, "items", None))
        print("[DEBUG][BLEND] weather:", getattr(blend_req, "weather", None))

        # 2. 1차 BLEND score 계산
        blend_scored = run_blend_ratio(blend_req)
        print("[DEBUG][BLEND] blend_scored count:", len(blend_scored))

        if blend_scored:
            # 3. bias + rerank
            blend_bias_result = apply_bias_and_rerank(
                scored_items=blend_scored,
                samples=samples,
            )

            print("[DEBUG][BLEND] bias trained:", blend_bias_result["trained"])
            print("[DEBUG][BLEND] usedSamples:", blend_bias_result["usedSamples"])
            print("[DEBUG][BLEND] userBias:", blend_bias_result["userBias"])
            print("[DEBUG][BLEND] results count:", len(blend_bias_result["results"]))

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
            print("[DEBUG][BLEND] blend_scored is empty")
            models.append({
                "modelType": "BLEND_ADAPTIVE",
                "modelVersion": "v.26.1.0b",
                "results": [],
            })

    except ValidationError as e:
        print("[DEBUG][BLEND] ValidationError:", repr(e))
        models.append({
            "modelType": "BLEND_ADAPTIVE",
            "modelVersion": "v.26.1.0b",
            "results": [],
        })



        # ---------- MATERIAL_ADAPTIVE ----------
    try:
        print("\n[DEBUG] --- MATERIAL_ADAPTIVE start ---")

        material_req = _parse(RecommendationRequest, payload)
        print("[DEBUG][MATERIAL] items count:", len(material_req.items))
        print("[DEBUG][MATERIAL] weather:", getattr(material_req, "weather", None))

        scored_items = []
        for idx, item in enumerate(material_req.items):
            print(f"[DEBUG][MATERIAL] item {idx} name:", item.name)
            if not item.name or item.name.strip() == "":
                print(f"[DEBUG][MATERIAL] item {idx} skipped due to empty name")
                continue

            score = recommender_service.calculate_score(
                item, material_req.weather
            )
            scored_items.append({
                "clothingId": item.clothingId,
                "score": score,
            })

        print("[DEBUG][MATERIAL] scored_items count:", len(scored_items))

        if scored_items:
            bias_result = apply_bias_and_rerank(
                scored_items=scored_items,
                samples=samples,
            )

            print("[DEBUG][MATERIAL] bias trained:", bias_result["trained"])
            print("[DEBUG][MATERIAL] usedSamples:", bias_result["usedSamples"])
            print("[DEBUG][MATERIAL] userBias:", bias_result["userBias"])
            print("[DEBUG][MATERIAL] results count:", len(bias_result["results"]))

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
            print("[DEBUG][MATERIAL] scored_items is empty")
            models.append({
                "modelType": "MATERIAL_ADAPTIVE",
                "modelVersion": "v.26.1.0m",
                "results": [],
            })

    except ValidationError as e:
        print("[DEBUG][MATERIAL] ValidationError:", repr(e))
        models.append({
            "modelType": "MATERIAL_ADAPTIVE",
            "modelVersion": "v.26.1.0m",
            "results": [],
        })

    # ---------- bias scale (router responsibility) ----------
    user_bias_scaled = int((raw_user_bias + 1.0) * 50)
    user_bias_scaled = max(0, min(100, user_bias_scaled))

    print("\n[DEBUG] ===== feedback_adaptive end =====")
    print("[DEBUG] trained:", trained)
    print("[DEBUG] usedSamples:", used_samples)
    print("[DEBUG] raw_user_bias:", raw_user_bias)
    print("[DEBUG] user_bias_scaled:", user_bias_scaled)
    print("[DEBUG] models summary:", [
        (m["modelType"], len(m["results"])) for m in models
    ])

    return {
        "feedbackId": feedback_id,
        "trained": trained,
        "usedSamples": used_samples,
        "userBias": user_bias_scaled,
        "models": models,
    }

