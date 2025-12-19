from pydantic import BaseModel, Field

# Field는 단순 주석이 아닌 입력 검증 로직
class ComfortRequest(BaseModel):
    c_ratio: float = Field(..., ge=0, le=100, description="면 혼방률(%)")
    Ta: float = Field(..., description="기온(℃)")
    RH: float = Field(..., ge=0, le=100, description="상대 습도(%)")
    Va: float = Field(..., ge=0.5, description="풍속(m/s)")
    cloud: float = Field(..., ge=0, le=100, description="구름량(%)")

class ComfortResponse(BaseModel):
    comfort_score: float = Field(..., description="comfort score(0~1)")