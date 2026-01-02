from typing import List
from ..schemas.predict_schema import Context, Item, Result

def _clamp_0_100(x: int) -> int:
    if x < 0:
        return 0
    if x > 100:
        return 100
    return x

def _normalize_to_100(c: int, p: int) -> tuple[int, int]:
    c = _clamp_0_100(int(c))
    p = _clamp_0_100(int(p))
    s = c + p
    if s == 100:
        return c, p
    if s <= 0:
        return 50, 50
    c2 = round((c * 100.0) / s)
    c2 = max(0, min(100, int(c2)))
    p2 = 100 - c2
    return c2, p2

def _score(context: Context, item: Item) -> float:
    ta = float(context.Ta)
    rh = float(context.RH)
    va = float(context.Va)
    cloud = float(context.cloud)

    base = 100.0
    base -= abs(22.0 - ta) * 1.5
    base -= (rh / 100.0) * 10.0
    base -= va * 1.0
    base -= (cloud / 100.0) * 5.0

    c, p = _normalize_to_100(item.c_ratio, item.p_ratio)
    weighted = (base * (c / 100.0)) + (base * (p / 100.0) * 0.9)
    return round(max(0.0, min(100.0, weighted)), 3)

def predict_comfort_batch(context: Context, items: List[Item]) -> List[Result]:
    results: List[Result] = []

    for it in items:
        try:
            s = _score(context, it)
            results.append(Result(item_id=it.item_id, comfort_score=s, error=None))
        except Exception as e:
            results.append(Result(item_id=getattr(it, "item_id", 0), comfort_score=None, error=str(e)))

    return results