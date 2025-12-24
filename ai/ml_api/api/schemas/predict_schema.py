from typing import List, Optional
from pydantic import BaseModel, Field

class Context(BaseModel):
    Ta: float = Field(..., description="Temperature")
    RH: float = Field(..., description="Humidity (0~100)")
    Va: float = Field(..., description="Wind speed")
    cloud: float = Field(..., description="Cloud amount (0~100)")

class Item(BaseModel):
    item_id: int
    c_ratio: int = Field(..., ge=0, le=100)
    p_ratio: int = Field(..., ge=0, le=100)

class ComfortBatchRequest(BaseModel):
    context: Context
    items: List[Item]

class Result(BaseModel):
    item_id: int
    comfort_score: Optional[float] = None
    error: Optional[str] = None

class ComfortBatchResult(BaseModel):
    results: List[Result]