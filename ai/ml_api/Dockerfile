FROM python:3.11-slim

WORKDIR /app

# requirements (ml_api의 requirements 사용)
COPY ml_api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# FastAPI app (ml_api/api를 /app/api 로)
COPY ml_api/api ./api

# model artifacts (ai 컨텍스트 안이므로 정상 COPY 가능)
COPY ratio_based/ml ./models/ratio_based/ml
COPY material_weather/ml ./models/material_weather/ml

ENV PYTHONPATH=/app

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]