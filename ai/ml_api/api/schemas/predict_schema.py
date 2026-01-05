from typing import List, Optional
from pydantic import BaseModel, Field

class Context(BaseModel):
    Ta: float = Field(..., description="Air temperature")
    RH: float = Field(..., description="Relative humidity")
    Va: float = Field(..., description="Wind speed")
    cloud: float = Field(..., description="Cloud amount")

    temp_max: float = Field(..., description="Daily max temperature")
    temp_min: float = Field(..., description="Daily min temperature")

    weather_type: str = Field(..., description="Weather type (clear/cloudy/rain/snow)")

class Item(BaseModel):
    clothingId: int
    c_ratio: int = Field(..., ge=0, le=100)
    thickness: str

class ComfortBatchRequest(BaseModel):
    context: Context
    items: List[Item]

class Result(BaseModel):
    clothingId: int
    blendRatioScore: Optional[int] = None
    error: Optional[str] = None

class ComfortBatchResult(BaseModel):
    results: List[Result]