# main.py (최상위 위치)
# API 연결

from api.routers import recommendation  # 라우터 등록
from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

app = FastAPI(title="CodiOn AI API")

# 라우터 연결
app.include_router(recommendation.router)

# 실행 명령어: uvicorn api.main:app --reload
