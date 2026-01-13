from pydantic import BaseModel, Field
from typing import List, Literal
from datetime import datetime

class FeedbackRange(BaseModel):
    from_: str = Field(alias="from")
    to: str

class FeedbackInput(BaseModel):
    timestamp: datetime
    direction: int
    selectedClothingIds: List[int]

class MonthlyFeedbackRequest(BaseModel):
    feedbackId: str
    range: FeedbackRange
    prevBias: int = Field(ge=0, le=100)
    samples: List[FeedbackInput]
    requestModels: List[str]