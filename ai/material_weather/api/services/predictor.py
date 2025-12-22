# artifacts의 모델을 불러와서 예측

import os
import joblib
import numpy as np

from .material_data import MATERIAL_FEATURES, MATERIAL_MAPPER


class WeatherRecommender:
    def __init__(self):
        # 1. 현재 파일(predictor.py)의 절대 경로를 구합니다.
        current_file_path = os.path.abspath(__file__)
        # 2. 부모 폴더들을 타고 올라가서 'material_weather' 폴더 위치를 잡습니다.
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_file_path)))
        # 3. 거기서 ml/artifacts 폴더로 내려가서 모델 파일을 찾습니다.
        model_path = os.path.join(project_root, "ml", "artifacts", "weather_material_model.pkl")

        model_path = os.path.abspath(model_path)  # 절대 경로로 변환

        # 경로 정규화 (윈도우/맥 호환성용)
        # model_path = os.path.normpath(model_path)

        print(f"📂 모델 경로 확인: {model_path}")

        try:
            self.model = joblib.load(model_path)
            print(f"🤖 서비스용 ML 모델 로드 성공: {model_path}")
        except FileNotFoundError:
            print(f"⚠️ 모델 파일을 찾을 수 없음: {model_path}")
            self.model = None

    def _get_material_features(self, material_name_kr):
        key = MATERIAL_MAPPER.get(material_name_kr, "Unknown")
        return MATERIAL_FEATURES.get(key, MATERIAL_FEATURES["Unknown"])

    def calculate_score(self, item_name: str, weather) -> float:
        if self.model is None: return 0.0

        feats = self._get_material_features(item_name)

        features = np.array([[
            weather.feelsLikeTemperature,
            weather.humidity,
            weather.precipitationProbability,
            feats['warmth'],
            feats['breathability'],
            feats['water_res']
        ]])

        probability = self.model.predict_proba(features)[0][1]
        return round(probability * 100, 2)


# 싱글톤 인스턴스 생성 (이걸 Router에서 갖다 씀)
recommender_service = WeatherRecommender()
