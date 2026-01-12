from datetime import datetime, timezone
from collections import defaultdict

from .config import ALPHA
from .blend_ratio_service import predict_comfort_batch
from ..schemas.blend_ratio_schema import BlendRatioRecommendRequest

def run_blend_ratio(req: BlendRatioRecommendRequest):
    raw_results = predict_comfort_batch(
        context=req.context,
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


def apply_bias_and_rerank(model_type: str, scored_items: list):
    logs = [
        { "timestamp": "2026-01-10T21:00:00+00:00", "direction": -1, "items": [101, 105] },
        { "timestamp": "2026-01-09T21:00:00+00:00", "direction": -1, "items": [102, 108] },
        { "timestamp": "2026-01-08T21:00:00+00:00", "direction":  0, "items": [103, 104] },
        { "timestamp": "2026-01-07T21:00:00+00:00", "direction": -1, "items": [101, 107] },
        { "timestamp": "2026-01-06T21:00:00+00:00", "direction":  1, "items": [108, 110] },
        { "timestamp": "2026-01-05T21:00:00+00:00", "direction":  1, "items": [102, 103] },
        { "timestamp": "2026-01-04T21:00:00+00:00", "direction":  0, "items": [104, 109] },
        { "timestamp": "2026-01-03T21:00:00+00:00", "direction": -1, "items": [105, 106] },
        { "timestamp": "2026-01-02T21:00:00+00:00", "direction": -1, "items": [101, 108] },
        { "timestamp": "2026-01-01T21:00:00+00:00", "direction":  1, "items": [107, 110] }
    ]

    if len(logs) < 10:
        print("[DEBUG][BIAS] skip rerank (not enough logs)")
        return scored_items

    user_bias, item_bias_map = compute_time_decay_bias(logs)

    print("[DEBUG][BIAS] userBias:", user_bias)
    print("[DEBUG][BIAS] itemBias:", item_bias_map)

    items_for_rerank = [
        {
            "clothingId": it["clothingId"],
            "score": it["score"],
            "itemBias": item_bias_map.get(it["clothingId"], 0.0),
        }
        for it in scored_items
    ]

    ordered = rerank_items(
        user_bias=user_bias,
        items=items_for_rerank,
    )

    score_map = {it["clothingId"]: it["score"] for it in scored_items}

    return [
        {
            "clothingId": r["clothingId"],
            "score": score_map[r["clothingId"]],
        }
        for r in ordered
    ]


def compute_time_decay_bias(logs: list):
    now = datetime.now(timezone.utc)

    user_num = 0.0
    user_den = 0.0

    item_num = defaultdict(float)
    item_den = defaultdict(float)

    for day_log in logs:
        direction = day_log.get("direction")
        if direction not in (-1, 0, 1):
            continue

        ts = datetime.fromisoformat(day_log["timestamp"])
        days_ago = max((now - ts).days, 0)

        # 최근 30일 선형 decay
        time_weight = max(0.0, 1.0 - days_ago / 10.0)
        if time_weight == 0:
            continue

        # userBias
        user_num += direction * time_weight
        user_den += time_weight

        # itemBias
        for cid in day_log.get("items", []):
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
    print("\n[DEBUG][API2] ===== Rerank Start =====")
    print("[DEBUG][API2] userBias:", user_bias)
    print("[DEBUG][API2] alpha:", ALPHA)
    print("[DEBUG][API2] items (input):")

    for it in items:
        print(
            f"  - id={it['clothingId']} "
            f"score={it['score']} "
            f"itemBias={it['itemBias']}"
        )

    for it in items:
        rank_score = it["score"] + ALPHA * user_bias * it["itemBias"]
        print(
            f"[DEBUG][API2] rank_score "
            f"(id={it['clothingId']}): {rank_score}"
    )

    print("[DEBUG][API2] ===== Rerank End =====\n")

    return [
        {
            "clothingId": it["clothingId"],
            "score": it["score"],
        }
        for it in items
    ]