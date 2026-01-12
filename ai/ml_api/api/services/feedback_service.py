from datetime import date

from .compute_bias  import apply_bias_and_rerank, run_blend_ratio


def run_feedback_recommend(req):
    # 1차 score 계산
    scored_items = run_blend_ratio(req)
    # 2차 feedback 기반 rerank
    final_items = apply_bias_and_rerank(
        model_type="BLEND_RATIO",
        scored_items=scored_items,
    )
    return {
        "date": date.today().strftime("%Y-%m-%d"),
        "results": final_items,
    }