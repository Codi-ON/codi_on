FROM python:3.11-slim

WORKDIR /app

# ✅ lightgbm 런타임 의존성 (libgomp)
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 \
 && rm -rf /var/lib/apt/lists/*

# requirements
COPY ml_api/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# FastAPI app -> /app/api
COPY ml_api/api /app/api

# models
COPY ratio_based/ml /app/models/ratio_based/ml
COPY material_weather/ml /app/models/material_weather/ml

# ✅ 핵심: api / ml 모두 import 되게 + 모델 베이스 경로 고정
ENV PYTHONPATH=/app:/app/models/ratio_based:/app/models/material_weather
ENV MODEL_BASE_PATH=/app/models

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]