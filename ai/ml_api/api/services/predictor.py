import os
import joblib
import numpy as np
import lightgbm

# 같은 폴더에 material_data.py가 있다고 가정
from .material_data import get_material_props


class WeatherRecommender:
    def __init__(self):
        self.model = None

        # 1. 환경변수 확인 (Docker: /app/models)
        docker_model_path = os.getenv("MODEL_BASE_PATH")
        model_path = None

        if docker_model_path:
            # 🐳 Docker 환경: artifacts 폴더가 풀려서 ml 폴더 바로 아래에 파일이 있음
            # 경로: /app/models/material_weather/ml/weather_material_model.pkl
            base_dir = os.path.join(docker_model_path, "material_weather", "ml")
            model_path = os.path.join(base_dir, "weather_material_pmv.pkl")
            print(f"🐳 Docker 환경 감지: {model_path}")
        else:
            # 📂 로컬 개발 환경 (경로가 다를 수 있으므로 유지)
            current_file_path = os.path.abspath(__file__)
            services_dir = os.path.dirname(current_file_path)
            api_dir = os.path.dirname(services_dir)
            ml_api_dir = os.path.dirname(api_dir)
            ai_dir = os.path.dirname(ml_api_dir)

            # 로컬에서는 artifacts 폴더 안에 있을 수 있음 (상황에 맞춰 조정)
            model_path = os.path.join(ai_dir, "material_weather", "ml", "artifacts", "weather_material_pmv.pkl")
            model_path = os.path.normpath(model_path)
            print(f"📂 로컬 경로 확인: {model_path}")

        # 2. 모델 로드
        try:
            self.model = joblib.load(model_path)
            print(f"🤖 ML 모델 로드 성공!: {model_path}")
        except Exception as e:
            print(f"⚠️ 모델 파일 로드 실패: {model_path}")
            print(f"에러 내용: {e}")

    def calculate_score(self, cloth_data, weather) -> float:
        """
        cloth_data: 백엔드에서 받은 옷 정보 객체 (name, thicknessLevel 등 포함)
        weather: 백엔드에서 받은 날씨 정보 객체 (temperature, windSpeed 등 포함)
        """
        # 모델이 없으면 0점 반환
        if self.model is None:
            print("❌ 모델이 로드되지 않아 점수 계산 불가")
            return 0.0

        # 1. 옷 정보 추출
        # cloth_data가 dict인지 객체인지에 따라 접근 방식이 다를 수 있음 (여기서는 객체 가정)
        # 만약 dict라면 cloth_data['name'] 방식으로 수정 필요
        item_name = getattr(cloth_data, 'name', 'Unknown')
        thickness = getattr(cloth_data, 'thicknessLevel', 'NORMAL')  # 기본값 NORMAL

        # 2. 고도화된 물성치 가져오기 (두께 반영)
        # 예: 면 + THICK -> 보온성 4 리턴
        feats = get_material_props(item_name, thickness)

        if feats is None:
            print(f"⚠️ '{item_name}' -> 물성치 조회 실패 (0점)")
            return 0.0

        # 3. 날씨 데이터 전처리 (모델 학습 Feature 생성)
        try:
            # 백엔드 데이터 필드명에 맞춰 접근
            input_temp = weather.temperature
            input_humidity = weather.humidity
            input_precip = weather.precipitationProbability
            input_wind = weather.windSpeed  # [추가된 필드]

            # [핵심] 일교차 계산 (Max - Min)
            input_temp_diff = weather.maxTemperature - weather.minTemperature
        except AttributeError as e:
            print(f"⚠️ 날씨 데이터 필드 누락: {e}")
            return 0.0

        # 4. 모델 입력 데이터 구성 (순서 중요!)
        # 학습 순서: [temp, humidity, precip, wind, temp_diff, warmth, breath, water]
        features = np.array([[
            input_temp,
            input_humidity,
            input_precip,
            input_wind,
            input_temp_diff,
            feats['warmth'],
            feats['breathability'],
            feats['water_res']
        ]])

        try:
            # 5. 예측 실행 (적합 확률 * 100)
            # LightGBM Classifier의 확률값 (Index 1 = 적합)
            predicted_score = self.model.predict(features)[0]

            # 혹시 모를 범위 초과 방지 (0~100 사이로 클리핑)
            final_score = max(0, min(100, predicted_score))
            return round(final_score * 100, 2)

        except Exception as e:
            print(f"🔥 예측 중 에러 발생: {e}")
            return 0.0


# 싱글톤 인스턴스 생성
recommender_service = WeatherRecommender()