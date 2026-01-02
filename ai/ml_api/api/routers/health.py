from fastapi import APIRouter

router = APIRouter(tags=["health"])

@router.get("/health")
def health():
    return {"status": "ok"}

# 선택: 사람 헷갈림 방지 alias
@router.get("/comfort/health")
def comfort_health_alias():
    return {"status": "ok"}

@router.get("/recommend/health")
def recommend_health_alias():
    return {"status": "ok"}