from fastapi import FastAPI

from api.routers.health import router as health_router
from api.routers.comfort import router as comfort_router
from api.routers.recommend import router as recommend_router

app = FastAPI(title="CodiOn ML API")

app.include_router(health_router)
app.include_router(comfort_router)
app.include_router(recommend_router)