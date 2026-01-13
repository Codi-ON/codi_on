from datetime import datetime, timezone
from collections import defaultdict
from typing import List, Dict

from .config import ALPHA
from .blend_ratio_service import predict_comfort_batch
from ..schemas.blend_ratio_schema import BlendRatioFeedbackRequest

THICKNESS_LOWER = {
    "THIN": "thin",
    "NORMAL": "normal",
    "THICK": "thick",
}

def normalize_thickness(thickness: str) -> str:
    return THICKNESS_LOWER[thickness.upper()]

def run_blend_ratio(req: BlendRatioFeedbackRequest):
    print("\n[DEBUG][run_blend_ratio] start")
    print("[DEBUG][run_blend_ratio] items count:", len(req.items))
    print("[DEBUG][run_blend_ratio] weather:", req.weather)

    for idx, item in enumerate(req.items):
        print(f"[DEBUG][run_blend_ratio] item {idx} thickness before:", item.thickness)
        if item.thickness:
            item.thickness = normalize_thickness(item.thickness)
            print(f"[DEBUG][run_blend_ratio] item {idx} thickness after:", item.thickness)

    raw_results = predict_comfort_batch(
        context=req.weather,
        items=req.items,
    )

    print("[DEBUG][run_blend_ratio] raw_results count:", len(raw_results))
    if raw_results:
        print("[DEBUG][run_blend_ratio] first raw_result:", raw_results[0])
    else:
        print("[DEBUG][run_blend_ratio] raw_results is empty")

    results = [
        {
            "clothingId": r.clothingId,
            "score": r.blendRatioScore,
        }
        for r in raw_results
        if r.blendRatioScore is not None
    ]

    print("[DEBUG][run_blend_ratio] filtered results count:", len(results))
    print("[DEBUG][run_blend_ratio] end")

    return results


def apply_bias_and_rerank(
    scored_items: List[Dict],
    samples: List[Dict],
    min_samples: int = 5,
):
    print("\n[DEBUG][apply_bias_and_rerank] start")
    print("[DEBUG][apply_bias_and_rerank] scored_items count:", len(scored_items))
    print("[DEBUG][apply_bias_and_rerank] samples count:", len(samples))
    print("[DEBUG][apply_bias_and_rerank] min_samples:", min_samples)

    if len(samples) < min_samples:
        print("[DEBUG][apply_bias_and_rerank] not enough samples, skip training")
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

    print("[DEBUG][apply_bias_and_rerank] logs count:", len(logs))
    if logs:
        print("[DEBUG][apply_bias_and_rerank] first log:", logs[0])


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
    print("\n[DEBUG][compute_time_decay_bias] start")
    print("[DEBUG][compute_time_decay_bias] logs count:", len(logs))

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

    print("[DEBUG][compute_time_decay_bias] logs_sorted count:", len(logs_sorted))

    total = len(logs_sorted)
    if total == 0:
        return 0.0, {}

    for idx, log in enumerate(logs_sorted):
        direction = log.get("direction")
        print(f"[DEBUG][compute_time_decay_bias] log {idx} direction:", direction)

        if direction not in (-1, 0, 1):
            print("[DEBUG][compute_time_decay_bias] invalid direction, skipped")
            continue

        time_weight = 1.0 - (total - idx - 1) / total
        print(f"[DEBUG][compute_time_decay_bias] log {idx} time_weight:", time_weight)

        user_num += direction * time_weight
        user_den += time_weight

        for cid in log.get("items", []):
            item_num[cid] += direction * time_weight
            item_den[cid] += time_weight

    print("[DEBUG][compute_time_decay_bias] user_num:", user_num)
    print("[DEBUG][compute_time_decay_bias] user_den:", user_den)

    user_bias = user_num / user_den if user_den > 0 else 0.0
    print("[DEBUG][compute_time_decay_bias] user_bias:", user_bias)

    print("[DEBUG][compute_time_decay_bias] item_bias_map size:", len(item_bias_map))


    item_bias_map = {
        cid: item_num[cid] / item_den[cid]
        for cid in item_num
        if item_den[cid] > 0
    }

    return user_bias, item_bias_map


def rerank_items(user_bias: float, items: list[dict]) -> list[dict]:
    print("\n[DEBUG][rerank_items] start")
    print("[DEBUG][rerank_items] user_bias:", user_bias)
    print("[DEBUG][rerank_items] items count:", len(items))

    scored = []
    for idx, it in enumerate(items):
        rank_score = it["score"] + ALPHA * user_bias * it["itemBias"]
        print(f"[DEBUG][rerank_items] item {idx} base_score:", it["score"])
        print(f"[DEBUG][rerank_items] item {idx} itemBias:", it["itemBias"])
        print(f"[DEBUG][rerank_items] item {idx} rank_score:", rank_score)

        scored.append((rank_score, it))

    return [
        {
            "clothingId": it["clothingId"],
            "score": it["score"],
        }
        for _, it in scored
    ]