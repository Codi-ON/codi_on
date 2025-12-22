# api 경로 설정

from api.schemas.recommendation_schemas import RecommendationRequest
from api.services.predictor import recommender_service  # 서비스 가져오기
from fastapi import APIRouter, Depends
# from api.dependencies import verify_api_key # 문지기 데려오기

# 라우터 전체에 문지기 배치 (이제 이 라우터의 모든 기능은 키가 있어야 함)
router = APIRouter()
# dependencies=[Depends(verify_api_key)]

@router.post("/recommend")
async def recommend_clothing(req: RecommendationRequest):
    current_weather = req.weather
    results = []

    for item in req.items:
        # 서비스 로직 호출
        score = recommender_service.calculate_score(item.name, current_weather)

        results.append({
            "clothingId": item.clothingId,
            "material_name": item.name,
            "score": score,
            "analysis": f"체감온도 {current_weather.feelsLikeTemperature}도 기준 적합도 {score}점"
        })

    sorted_results = sorted(results, key=lambda x: x['score'], reverse=True)

    return {
        "status": "success",
        "recommendations": sorted_results
    }
