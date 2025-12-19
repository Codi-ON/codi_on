from fastapi import FastAPI

from api.routers import predict

app = FastAPI()
app.include_router(predict.router)
