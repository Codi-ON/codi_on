from typing import List, Optional
from pydantic import BaseModel, Field


class Context(BaseModel):
    temperature: float = Field(..., description="Air temperature")
    humidity: float = Field(..., description="Relative humidity")
    windSpeed: float = Field(..., description="Wind speed")
    cloudAmount: float = Field(..., description="Cloud amount")

    maxTemperature: float = Field(..., description="Daily max temperature")
    minTemperature: float = Field(..., description="Daily min temperature")

    sky: str = Field(..., description="Weather type (clear/cloudy/rain/snow)")

class Item(BaseModel):
    clothingId: int
    c_ratio: int = Field(..., ge=0, le=100)
    thickness: str

class ComfortBatchRequest(BaseModel):
    context: Context
    items: List[Item]

class Result(BaseModel):
    clothingId: int
    blendRatioScore: Optional[float] = None
    # error: Optional[str] = None

class ComfortBatchResult(BaseModel):
    results: List[Result]