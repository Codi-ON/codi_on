# ai/data/material_weather/train_model.py
# 모델링 학습 코드

import os
import random

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
# ✅ 고도화 1: Tree 모델 및 검증 도구 import
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split, learning_curve, cross_val_score

# --- 1. 한글 폰트 설정 (깨짐 방지) ---
# OS에 따라 폰트 설정이 다르지만, 영어로 출력되게 설정하거나 기본 폰트 사용
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['axes.unicode_minus'] = False

# --- 1. 데이터 생성 (체감온도 & 강수확률 적용) ---
# X(입력): [체감온도, 습도, 강수확률, 보온성, 통기성, 방수성]
# y(정답): 0(부적합) or 1(적합)

print("📊 데이터 생성 중...")
data = []
for _ in range(50000):  # 데이터 5000개로 증가
    temp = random.uniform(-10, 35)
    feels_like = temp + random.uniform(-5, 3)
    humidity = random.uniform(20, 90)
    precip_prob = random.randint(0, 100)

    warmth = random.randint(1, 5)
    breathability = random.randint(1, 5)
    water_res = random.randint(1, 5)

    # --- 정답 생성 규칙 (선생님) ---
    score = 0
    # 체감온도 규칙
    if feels_like < 10:
        score += warmth * 30  # 가중치 증가
    elif feels_like > 25:
        score -= warmth * 20
        score += breathability * 20
    else:
        score += (3 - abs(warmth - 3)) * 10

        # 습도/강수 규칙
    if humidity > 70: score += breathability * 15
    if precip_prob > 30:
        rain_risk = precip_prob / 100.0
        if water_res < 3:
            score -= 60 * rain_risk  # 벌점 강화
        else:
            score += water_res * 25 * rain_risk

    # 약간의 노이즈 추가
    final_score = score + random.uniform(-5, 5)

    # 0(부적합) vs 1(적합) 기준
    label = 1 if final_score > 60 else 0

    data.append([feels_like, humidity, precip_prob, warmth, breathability, water_res, label])

df = pd.DataFrame(data,
                  columns=['feels_like', 'humidity', 'precip_prob', 'warmth', 'breathability', 'water_res', 'label'])

# --- 2. 검증 준비 (Train/Test Split) ---
# 전체 데이터의 80%는 학습에 쓰고, 20%는 나중에 "진짜 맞나?" 테스트용으로 숨겨둠
X = df[['feels_like', 'humidity', 'precip_prob', 'warmth', 'breathability', 'water_res']]
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- 3. 모델 학습 (Random Forest) ---
print("🌲 Random Forest 모델 학습 중...")
# n_estimators=100: 나무 100그루 심기
model = RandomForestClassifier(n_estimators=300, max_depth=10, random_state=42)
model.fit(X_train, y_train)

# --- 4. 검증 및 평가 (Verification) ---
# 숨겨둔 20% 데이터(X_test)로 시험 보기
y_pred = model.predict(X_test)
print("\n" + "=" * 40)
print("📢 [1] 상세 성능 리포트")
print("=" * 40)
print(classification_report(y_test, y_pred, target_names=['부적합(0)', '적합(1)']))

# --- 5. [검증 2] 교차 검증 (Cross Validation) ---
# 데이터를 5등분해서 5번 시험 봄 -> 평균 점수가 진짜 실력
scores = cross_val_score(model, X, y, cv=5)
print("=" * 40)
print("📢 [2] 교차 검증 (신뢰도 테스트)")
print(f"   - 5번 테스트 점수: {scores}")
print(f"   - ✅ 최종 평균 신뢰도: {scores.mean() * 100:.2f}% (±{scores.std() * 100:.2f}%)")
print("=" * 40)

# ✅ 특성 중요도 (Feature Importance) - 검증의 핵심!
# 모델이 어떤 정보를 가장 중요하게 봤는지 알려줌
importances = model.feature_importances_
feature_names = X.columns
sorted_idx = np.argsort(importances)[::-1]

print("🔍 모델이 중요하게 생각한 요소 (Top 3):")
for i in range(3):
    print(f"{i + 1}위: {feature_names[sorted_idx[i]]} ({importances[sorted_idx[i]] * 100:.1f}%)")
print("-" * 30)

# --- 6. 저장 경로 설정 ---
current_dir = os.path.dirname(os.path.abspath(__file__))
artifacts_dir = os.path.join(current_dir, "..", "artifacts")
os.makedirs(artifacts_dir, exist_ok=True)

# 모델 저장
joblib.dump(model, os.path.join(artifacts_dir, "weather_material_model.pkl"))
print(f"💾 모델 저장 완료: {model}")

# --- 7. [검증 3] 학습 곡선 (Learning Curve) 시각화 ---
# 딥러닝의 Loss Curve 대용. 데이터가 늘어날수록 똑똑해지는지 확인
print("\n🖼️ [3] 학습 곡선 그래프 생성 중...")

train_sizes, train_scores, valid_scores = learning_curve(
    model, X, y, cv=5, scoring='accuracy',
    train_sizes=np.linspace(0.1, 1.0, 5)  # 데이터 10% ~ 100% 쓸 때 점수 변화
)

train_mean = np.mean(train_scores, axis=1)
valid_mean = np.mean(valid_scores, axis=1)

plt.figure(figsize=(10, 6))
plt.plot(train_sizes, train_mean, 'o-', color="r", label="Training Score")  # 훈련 점수
plt.plot(train_sizes, valid_mean, 'o-', color="g", label="Validation Score")  # 검증 점수 (중요!)

plt.title("Learning Curve (Is the model overfitting?)")
plt.xlabel("Training Examples (Data Count)")
plt.ylabel("Accuracy Score")
plt.legend(loc="best")
plt.grid()

save_path = os.path.join(artifacts_dir, "learning_curve.png")
plt.savefig(save_path)
print(f"   -> learning_curve.png 저장됨: {save_path}")

print("\n✨ 모든 검증 완료!")

# print("🖼️ 시각화 자료 생성 중...")
#
# # 1. 특성 중요도 (Feature Importance)
# plt.figure(figsize=(10, 6))
# importances = model.feature_importances_
# indices = np.argsort(importances)[::-1]
# sns.barplot(x=importances[indices], y=X.columns[indices], palette="viridis")
# plt.title("Feature Importance (What matters most?)")
# plt.xlabel("Importance Score")
# plt.tight_layout()
# plt.savefig(os.path.join(artifacts_dir, "feature_importance.png"))
# print("   -> feature_importance.png 저장됨")
#
# # 2. 오차 행렬 (Confusion Matrix)
# plt.figure(figsize=(6, 5))
# cm = confusion_matrix(y_test, y_pred)
# sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
#             xticklabels=['Not Suitable', 'Suitable'],
#             yticklabels=['Not Suitable', 'Suitable'])
# plt.title("Confusion Matrix")
# plt.ylabel("Actual Label")
# plt.xlabel("Predicted Label")
# plt.tight_layout()
# plt.savefig(os.path.join(artifacts_dir, "confusion_matrix.png"))
# print("   -> confusion_matrix.png 저장됨")
#
# # 3. 의사결정 나무 하나 뜯어보기 (Tree Visualization)
# # 랜덤 포레스트의 나무 100개 중 첫 번째 나무만 시각화해서 로직 확인
# plt.figure(figsize=(20, 10))
# plot_tree(model.estimators_[0],
#           feature_names=X.columns,
#           class_names=['Not Suitable', 'Suitable'],
#           filled=True, rounded=True, max_depth=3, fontsize=10)
# plt.title("Single Tree Logic (Depth 3)")
# plt.savefig(os.path.join(artifacts_dir, "tree_logic.png"))
# print("   -> tree_logic.png 저장됨")
#
# print("✨ 모든 작업 완료!")
