from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from api.routers.health import router as health_router
from api.routers.blend_ratio_router import router as blend_router
from api.routers.recommend import router as recommend_router
from api.routers.feedback_router import router as feedback_router

app = FastAPI(title="CodiOn ML API")

app.include_router(health_router)
app.include_router(blend_router)
app.include_router(recommend_router)
app.include_router(feedback_router)