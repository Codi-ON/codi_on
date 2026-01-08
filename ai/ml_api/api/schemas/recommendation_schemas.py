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
    windSpeed: float = 0.0
    minTemperature: float = 0.0
    maxTemperature: float = 0.0


class ClothingItem(BaseModel):
    clothingId: int
    name: str
    color: Optional[str] = None
    thicknessLevel: str = "NORMAL"


class RecommendationRequest(BaseModel):
    items: List[ClothingItem]
    weather: WeatherData
