from datetime import datetime, timezone
from collections import defaultdict
from typing import List, Dict

from .config import ALPHA
from .blend_ratio_service import predict_comfort_batch
from ..schemas.blend_ratio_schema import BlendRatioFeedbackRequest


def run_blend_ratio(req: BlendRatioFeedbackRequest):
    raw_results = predict_comfort_batch(
        context=req.weather,
        items=req.items,
    )

    return [
        {
            "clothingId": r.clothingId,
            "score": r.blendRatioScore,
        }
        for r in raw_results
        if r.blendRatioScore is not None
    ]

def apply_bias_and_rerank(
    scored_items: List[Dict],
    samples: List[Dict],
    min_samples: int = 5,
):
    if len(samples) < min_samples:
        return {
            "trained": False,
            "usedSamples": len(samples),
            "userBias": 0.0,
            "results": scored_items,
        }

    logs = [
        {
            "timestamp": s["timestamp"],
            "direction": s["direction"],
            "items": s["selectedClothingIds"],
        }
        for s in samples
    ]

    user_bias, item_bias_map = compute_time_decay_bias(logs)

    items_for_rerank = [
        {
            "clothingId": it["clothingId"],
            "score": it["score"],
            "itemBias": item_bias_map.get(it["clothingId"], 0.0),
        }
        for it in scored_items
    ]

    reranked = rerank_items(
        user_bias=user_bias,
        items=items_for_rerank,
    )

    return {
        "trained": True,
        "usedSamples": len(samples),
        "userBias": user_bias,
        "results": reranked,
    }

def compute_time_decay_bias(logs: List[Dict]):
    user_num = 0.0
    user_den = 0.0

    item_num = defaultdict(float)
    item_den = defaultdict(float)

    def _parse_ts(ts: str) -> datetime:
        dt = datetime.fromisoformat(ts)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

    logs_sorted = sorted(
        logs,
        key=lambda x: _parse_ts(x["timestamp"])
    )

    total = len(logs_sorted)
    if total == 0:
        return 0.0, {}

    for idx, log in enumerate(logs_sorted):
        direction = log.get("direction")
        if direction not in (-1, 0, 1):
            continue

        time_weight = 1.0 - (total - idx - 1) / total

        user_num += direction * time_weight
        user_den += time_weight

        for cid in log.get("items", []):
            item_num[cid] += direction * time_weight
            item_den[cid] += time_weight

    user_bias = user_num / user_den if user_den > 0 else 0.0

    item_bias_map = {
        cid: item_num[cid] / item_den[cid]
        for cid in item_num
        if item_den[cid] > 0
    }

    return user_bias, item_bias_map


def rerank_items(user_bias: float, items: list[dict]) -> list[dict]:
    scored = []
    for it in items:
        rank_score = it["score"] + ALPHA * user_bias * it["itemBias"]
        scored.append((rank_score, it))

    scored.sort(key=lambda x: x[0], reverse=True)

    return [
        {
            "clothingId": it["clothingId"],
            "score": it["score"],
        }
        for _, it in scored
    ]