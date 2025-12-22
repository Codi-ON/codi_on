from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from api.routers.predict import router as comfort_router

app = FastAPI(title="CodiON AI API")
app.include_router(comfort_router)

BATCH_PATH = "/comfort/batch"

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # /comfort/batch는 "응답 200 유지" 정책
    if request.url.path == BATCH_PATH:
        return JSONResponse(
            status_code=200,
            content={"results": [{"item_id": 0, "comfort_score": None, "error": "VALIDATION_ERROR"}]},
        )

    # 그 외는 일반적으로 400/422로 내려도 되는데, 네 요구가 "터지지 않게"가 핵심이면 400 고정
    return JSONResponse(status_code=400, content=jsonable_encoder({"detail": exc.errors()}))

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # /comfort/batch는 어떤 예외도 200으로 봉합
    if request.url.path == BATCH_PATH:
        return JSONResponse(
            status_code=200,
            content={"results": [{"item_id": 0, "comfort_score": None, "error": "INTERNAL_ERROR"}]},
        )

    # 다른 엔드포인트는 정상적으로 500
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})