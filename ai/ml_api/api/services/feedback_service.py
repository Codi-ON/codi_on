from datetime import date

from .compute_bias  import apply_bias_and_rerank, run_blend_ratio


def run_feedback_recommend(scored_items, samples):
    return apply_bias_and_rerank(
        scored_items=scored_items,
        samples=samples,
    )
