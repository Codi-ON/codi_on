FROM python:3.11-slim

WORKDIR /app

# ✅ lightgbm 런타임 의존성 (libgomp)
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 build-essential cmake \
 && rm -rf /var/lib/apt/lists/*

# requirements
COPY ml_api/requirements.txt /app/requirements.txt
RUN pip install --default-timeout=1000 --no-cache-dir -r /app/requirements.txt -i http://mirror.kakao.com/pypi/simple --trusted-host mirror.kakao.com

# FastAPI app -> /app/api
COPY ml_api/api /app/api

# models
#COPY material_weather/ml /app/models/material_weather/ml
#COPY ratio_based/ml /app/models/ratio_based/ml

COPY material_weather /app/models/material_weather
COPY ratio_based /app/models/ratio_based

# ✅ 핵심: api / ml 모두 import 되게 + 모델 베이스 경로 고정
ENV PYTHONPATH=/app:/app/models/ratio_based:/app/models/material_weather
ENV MODEL_BASE_PATH=/app/models

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]