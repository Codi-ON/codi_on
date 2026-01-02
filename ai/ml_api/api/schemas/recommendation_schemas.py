# Pydantic 데이터 모델 - backend 약속
# 데이터 검증

from typing import List, Optional

from pydantic import BaseModel


# 백엔드 데이터 구조 (CamelCase)
class WeatherData(BaseModel):
    temperature: float
    feelsLikeTemperature: float
    humidity: int
    precipitationProbability: int


class ClothingItem(BaseModel):
    clothingId: int
    name: str
    category: str
    color: Optional[str] = None


class RecommendationRequest(BaseModel):
    items: List[ClothingItem]
    weather: WeatherData
