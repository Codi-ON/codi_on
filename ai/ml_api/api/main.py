# main.py (최상위 위치)
# API 연결

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from dotenv import load_dotenv

# 라우터 가져오기
# from ai.ml_api.api.routers import recommend
from ai.ml_api.api.routers.health import router as health_router
from ai.ml_api.api.routers.comfort import router as comfort_router
from ai.ml_api.api.routers.recommend import router as recommend_router

load_dotenv()

app = FastAPI(title="CodiOn AI API")

# @app.get("/health")
# def health_check():
#     """Docker Healthcheck용 엔드포인트"""
#     return {"status": "ok"}

# 라우터 연결
app.include_router(recommend_router)
app.include_router(health_router)
app.include_router(comfort_router)

# ✅ 보호하고 싶은 경로 설정 (작성자님의 엔드포인트)
TARGET_PATH = "/recommend"


# ---------------------------------------------------------
# 🛡️ 1. 데이터 검증 에러 처리 (입력값이 이상할 때)
# ---------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # 만약 /recommend 요청에서 에러가 났다면? -> 200 OK인 척 하면서 에러 메시지 보냄
    if request.url.path == TARGET_PATH:
        return JSONResponse(
            status_code=200,
            content={
                "status": "fail",
                "message": "입력 데이터 형식이 잘못되었습니다.",
                "details": jsonable_encoder(exc.errors())
            },
        )

    # 다른 곳에서 난 에러는 그냥 422(Unprocessable Entity) 리턴
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder({"detail": exc.errors()}),
    )


# ---------------------------------------------------------
# 🛡️ 2. 서버 내부 에러 처리 (코드가 터졌을 때)
# ---------------------------------------------------------
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    print(f"🔥 서버 에러 발생: {exc}")  # 터미널에 로그 남기기

    # 만약 /recommend 요청에서 터졌다면? -> 200 OK인 척 하면서 에러 메시지 보냄
    if request.url.path == TARGET_PATH:
        return JSONResponse(
            status_code=200,
            content={
                "status": "error",
                "message": "서버 내부에서 문제가 발생했습니다.",
                "error_type": str(type(exc).__name__)
            },
        )

    # 다른 곳에서 난 에러는 500 리턴
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# 실행 명령어: uvicorn ai.ml_api.api.main:app --reload
