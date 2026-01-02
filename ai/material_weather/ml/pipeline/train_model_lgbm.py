# ai/ml_api/ml/pipeline/train_model_lgbm.py
# LightGBM 모델링 학습 코드 (비교 실험용)

import os
import random
import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# ✅ 고도화: LightGBM import
from lightgbm import LGBMClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split, learning_curve, cross_val_score

# --- 1. 한글 폰트 설정 (시각화용) ---
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['axes.unicode_minus'] = False

# --- 2. 데이터 생성 (기존 로직과 100% 동일하게 유지하여 공정 비교) ---
# X(입력): [체감온도, 습도, 강수확률, 보온성, 통기성, 방수성]
# y(정답): 0(부적합) or 1(적합)

print("📊 데이터 생성 중 (Random Forest와 동일 로직)...")
data = []
# 비교를 위해 시드값 고정 권장 (random.seed(42) 등)
# 하지만 원본 코드 특성을 살려 그대로 진행합니다.
for _ in range(500000):
    temp = random.uniform(-10, 35)
    feels_like = temp + random.uniform(-5, 3)
    humidity = random.uniform(20, 90)
    precip_prob = random.randint(0, 100)

    warmth = random.randint(1, 5)
    breathability = random.randint(1, 5)
    water_res = random.randint(1, 5)

    # --- 정답 생성 규칙 ---
    score = 0
    if feels_like < 10:
        score += warmth * 30
    elif feels_like > 25:
        score -= warmth * 20
        score += breathability * 20
    else:
        score += (3 - abs(warmth - 3)) * 10

    if humidity > 70: score += breathability * 15
    if precip_prob > 30:
        rain_risk = precip_prob / 100.0
        if water_res < 3:
            score -= 60 * rain_risk
        else:
            score += water_res * 25 * rain_risk

    final_score = score + random.uniform(-5, 5)
    label = 1 if final_score > 60 else 0

    data.append([feels_like, humidity, precip_prob, warmth, breathability, water_res, label])

df = pd.DataFrame(data,
                  columns=['feels_like', 'humidity', 'precip_prob', 'warmth', 'breathability', 'water_res', 'label'])

# --- 3. 검증 준비 ---
X = df[['feels_like', 'humidity', 'precip_prob', 'warmth', 'breathability', 'water_res']]
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- 4. 모델 학습 (LightGBM 변경 부분) ---
print("🚀 LightGBM 모델 학습 중...")

# LGBMClassifier 설정
model = LGBMClassifier(
    n_estimators=1000,      # 반복 횟수 (RF보다 많아도 빠름)
    learning_rate=0.05,     # 학습률
    num_leaves=31,          # 트리의 복잡도
    random_state=42,
    n_jobs=4,              # 코어 4개만 사용
    verbose=-1              # 로그 숨김
)

model.fit(X_train, y_train)

# --- 5. 검증 및 평가 ---
y_pred = model.predict(X_test)
print("\n" + "=" * 40)
print("📢 [LightGBM] 상세 성능 리포트")
print("=" * 40)
print(classification_report(y_test, y_pred, target_names=['부적합(0)', '적합(1)']))

# --- 6. 교차 검증 ---
scores = cross_val_score(model, X, y, cv=5)
print("=" * 40)
print("📢 [LightGBM] 교차 검증 (신뢰도 테스트)")
print(f"   - 5번 테스트 점수: {scores}")
print(f"   - ✅ 최종 평균 신뢰도: {scores.mean() * 100:.2f}% (±{scores.std() * 100:.2f}%)")
print("=" * 40)

# --- 7. 특성 중요도 ---
importances = model.feature_importances_
feature_names = X.columns
sorted_idx = np.argsort(importances)[::-1]

print("🔍 LightGBM이 중요하게 생각한 요소 (Top 3):")
for i in range(3):
    # LightGBM의 feature_importances_는 분기 횟수 등을 의미하여 합이 1이 아닐 수 있음 (상대적 비교용)
    print(f"{i + 1}위: {feature_names[sorted_idx[i]]} (Score: {importances[sorted_idx[i]]:.1f})")
print("-" * 30)

# --- 8. 저장 경로 설정 (파일명 변경 중요!) ---
current_dir = os.path.dirname(os.path.abspath(__file__))
artifacts_dir = os.path.join(current_dir, "..", "artifacts")
os.makedirs(artifacts_dir, exist_ok=True)

# 모델 저장 (.pkl 이름 변경)
save_model_path = os.path.join(artifacts_dir, "weather_material_lgbm.pkl")
joblib.dump(model, save_model_path)
print(f"💾 LightGBM 모델 저장 완료: {save_model_path}")

# --- 9. 학습 곡선 시각화 (파일명 변경) ---
print("\n🖼️ [LightGBM] 학습 곡선 그래프 생성 중...")

train_sizes, train_scores, valid_scores = learning_curve(
    model, X, y, cv=5, scoring='accuracy',
    train_sizes=np.linspace(0.1, 1.0, 5)
)

train_mean = np.mean(train_scores, axis=1)
valid_mean = np.mean(valid_scores, axis=1)

plt.figure(figsize=(10, 6))
plt.plot(train_sizes, train_mean, 'o-', color="b", label="Training Score") # 색상 변경 (Blue)
plt.plot(train_sizes, valid_mean, 'o-', color="orange", label="Validation Score") # 색상 변경 (Orange)

plt.title("Learning Curve (LightGBM)")
plt.xlabel("Training Examples")
plt.ylabel("Accuracy Score")
plt.legend(loc="best")
plt.grid()

# 이미지 파일명 변경
save_img_path = os.path.join(artifacts_dir, "learning_curve_lgbm.png")
plt.savefig(save_img_path)
print(f"   -> learning_curve_lgbm.png 저장됨: {save_img_path}")

print("\n✨ LightGBM 실험 완료!")