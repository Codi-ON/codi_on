from datetime import datetime, timezone
from collections import defaultdict
from typing import List, Dict
import logging

from .config import ALPHA
from .blend_ratio_service import predict_comfort_batch
from ..schemas.blend_ratio_schema import BlendRatioFeedbackRequest

logger = logging.getLogger(__name__)

THICKNESS_LOWER = {
    "THIN": "thin",
    "NORMAL": "normal",
    "THICK": "thick",
}

def normalize_thickness(thickness: str) -> str:
    return THICKNESS_LOWER[thickness.upper()]


def run_blend_ratio(req: BlendRatioFeedbackRequest):
    logger.error("=== [run_blend_ratio] START ===")
    logger.error("items_count=%d", len(req.items))
    logger.error("weather=%s", req.weather)

    for idx, item in enumerate(req.items):
        logger.error("item[%d] thickness_before=%s", idx, item.thickness)

        if item.thickness:
            item.thickness = normalize_thickness(item.thickness)
            logger.error("item[%d] thickness_after=%s", idx, item.thickness)

    raw_results = predict_comfort_batch(
        context=req.weather,
        items=req.items,
    )

    logger.error("raw_results_count=%d", len(raw_results))

    if raw_results:
        logger.error("first_raw_result=%s", raw_results[0])
    else:
        logger.error("raw_results is empty")

    results = [
        {
            "clothingId": r.clothingId,
            "score": r.blendRatioScore,
        }
        for r in raw_results
        if r.blendRatioScore is not None
    ]

    logger.error("filtered_results_count=%d", len(results))
    logger.error("=== [run_blend_ratio] END ===")

    return results


def apply_bias_and_rerank(
    scored_items: List[Dict],
    samples: List[Dict],
    min_samples: int = 5,
):
    logger.error("=== [apply_bias_and_rerank] START ===")
    logger.error("scored_items_count=%d", len(scored_items))
    logger.error("samples_count=%d", len(samples))
    logger.error("min_samples=%d", min_samples)

    if len(samples) < min_samples:
        logger.error(
            "not enough samples: %d < %d, skip training",
            len(samples),
            min_samples,
        )
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

    logger.error("logs_count=%d", len(logs))
    if logs:
        logger.error("first_log=%s", logs[0])

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

    logger.error("=== [apply_bias_and_rerank] END ===")

    return {
        "trained": True,
        "usedSamples": len(samples),
        "userBias": user_bias,
        "results": reranked,
    }


def compute_time_decay_bias(logs: List[Dict]):
    logger.error("=== [compute_time_decay_bias] START ===")
    logger.error("logs_count=%d", len(logs))

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

    logger.error("logs_sorted_count=%d", len(logs_sorted))

    total = len(logs_sorted)
    if total == 0:
        logger.error("no logs after sorting")
        return 0.0, {}

    for idx, log in enumerate(logs_sorted):
        direction = log.get("direction")
        logger.error("log[%d] direction=%s", idx, direction)

        if direction not in (-1, 0, 1):
            logger.error("log[%d] invalid direction, skipped", idx)
            continue

        time_weight = 1.0 - (total - idx - 1) / total
        logger.error("log[%d] time_weight=%.4f", idx, time_weight)

        user_num += direction * time_weight
        user_den += time_weight

        for cid in log.get("items", []):
            item_num[cid] += direction * time_weight
            item_den[cid] += time_weight

    user_bias = user_num / user_den if user_den > 0 else 0.0
    logger.error(
        "user_bias=%.4f (num=%.4f, den=%.4f)",
        user_bias,
        user_num,
        user_den,
    )

    item_bias_map = {
        cid: item_num[cid] / item_den[cid]
        for cid in item_num
        if item_den[cid] > 0
    }

    logger.error("item_bias_map_size=%d", len(item_bias_map))
    logger.error("=== [compute_time_decay_bias] END ===")

    return user_bias, item_bias_map


def rerank_items(user_bias: float, items: list[dict]) -> list[dict]:
    logger.error("=== [rerank_items] START ===")
    logger.error("user_bias=%.4f", user_bias)
    logger.error("items_count=%d", len(items))

    scored = []
    for idx, it in enumerate(items):
        rank_score = it["score"] + ALPHA * user_bias * it["itemBias"]

        logger.error(
            "item[%d] base_score=%.4f itemBias=%.4f rank_score=%.4f",
            idx,
            it["score"],
            it["itemBias"],
            rank_score,
        )

        scored.append({
            "clothingId": it["clothingId"],
            "score": rank_score,
        })
    scored.sort(key=lambda x: x["score"], reverse=True)

    logger.error("=== [rerank_items] END ===")
    return scored
