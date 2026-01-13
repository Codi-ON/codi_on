# ai/ml_api/ml/pipeline/train_model_pmv.py
# Zhang 2020, Schiavon 2025 기반 PMV 모델 학습

import os
import math
import random
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# LightGBM & Scikit-learn
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split, learning_curve, cross_val_score

from optuna.samplers import TPESampler

random.seed(42)
np.random.seed(42)

try:
    import optuna
    OPTUNA_AVAILABLE = True
except ImportError:
    OPTUNA_AVAILABLE = False
    print("⚠️ Optuna가 설치되지 않았습니다. 기본 파라미터로 학습합니다.")

# --- 1. 환경 설정 ---
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['axes.unicode_minus'] = False

# [기준표]
DEFAULT_MET = 1.5  # 활동량 (걷기/통학 기준)


# --- 2. PMV 계산 함수 정의 ---
def calculate_pmv_standard(ta, tr, vel, rh, met, clo, wme=0):
    """표준 ISO 7730 PMV 계산식 (Overflow 방지 적용)"""
    try:
        # 1. 입력값 방어 로직 (극단적 값 보정)
        if ta < -50 or ta > 50: return 999  # 절대적인 온도 범위 초과
        if vel < 0: vel = 0.1
        if rh < 0: rh = 0

        try:
            pa = rh * 10 * math.exp(16.6536 - 4030.183 / (ta + 235))
        except Exception:
            return 999  # 에러 발생 시 999 리턴

        icl = 0.155 * clo
        m = met * 58.15
        w = wme * 58.15
        mw = m - w
        if icl <= 0.078:
            fcl = 1 + 1.29 * icl
        else:
            fcl = 1.05 + 0.645 * icl

        # 열평형 반복 계산
        tcl = ta
        for _ in range(30):
            hc = 12.1 * math.sqrt(vel)
            if hc < 2.38 * abs(tcl - ta) ** 0.25: hc = 2.38 * abs(tcl - ta) ** 0.25

            # [핵심 수정] 계산 폭발(Overflow) 감지 구간을 try로 감싸기
            tcl_new = 35.7 - 0.028 * mw - icl * (
                    3.96 * 10 ** -8 * fcl * ((tcl + 273) ** 4 - (tr + 273) ** 4) + fcl * hc * (tcl - ta))

            tcl = 0.8 * tcl + 0.2 * tcl_new

        # PMV 최종 산출

        ts = 0.303 * math.exp(-0.036 * m) + 0.028
        pmv = ts * (mw - 3.05 * 0.001 * (5733 - 6.99 * mw - pa) - 0.42 * (mw - 58.15)
                    - 1.7 * 10 ** -5 * m * (5867 - pa) - 0.0014 * m * (34 - ta)
                    - 3.96 * 10 ** -8 * fcl * ((tcl + 273) ** 4 - (tr + 273) ** 4) - fcl * hc * (tcl - ta))


        if abs(pmv) > 10:
            return 999

        return pmv

    except Exception as e:
        # 수학적 계산 에러(Overflow, DivZero 등) 발생 시 무조건 999 반환
        return 999


def get_corrected_pmv(raw_pmv, vel):
    """논문 기반 PMV 편향 보정 (Zhang 2020, Schiavon 2025)"""
    if raw_pmv == 999: return 999  # 에러 값은 그대로 전달

    corrected_pmv = raw_pmv
    # 1. 중립에서 멀어질수록 과대평가 경향 완화 (Damping)
    if abs(raw_pmv) > 0.5:
        corrected_pmv = raw_pmv * 0.8
    # 2. 강풍 시 추위 과대평가 보정
    if vel > 0.2 and raw_pmv < 0:
        corrected_pmv += 0.2
    return corrected_pmv


# --- 3. 데이터 생성 (Data Generation) ---
print("🧪 [Level 5] ISO 7730 + 논문 보정 기반 데이터 30만개 생성 중...")
data = []

def get_clo_from_warmth(w):
    # 정수 구간별 선형 보간 (Linear Interpolation)
    if w <= 1: return 0.15
    if w <= 2: return 0.15 + (0.4 - 0.15) * (w - 1)  # 1~2 사이
    if w <= 3: return 0.4 + (0.7 - 0.4) * (w - 2)    # 2~3 사이
    if w <= 4: return 0.7 + (1.5 - 0.7) * (w - 3)    # 3~4 사이
    return 1.5 + (2.8 - 1.5) * (w - 4)               # 4~5 사이

for _ in range(300000):
    # 날씨
    temp = random.uniform(-20, 35)
    humidity = random.uniform(0, 95)
    wind_speed = random.uniform(0.1, 10)

    # 일교차 (API temp_min/max 시뮬레이션)
    if 10 <= temp <= 25:
        temp_diff = random.uniform(5, 15)
    else:
        temp_diff = random.uniform(2, 8)

    # 소재
    warmth = round(random.uniform(1.0, 5.0), 1)
    breathability = round(random.uniform(1.0, 5.0), 1)
    water_res = round(random.uniform(1.0, 5.0), 1)
    precip_prob = random.randint(0, 100)
    fabric_clo_map = {1: 0.15, 2: 0.4, 3: 0.7, 4: 1.5, 5: 2.8}
    base_clo = get_clo_from_warmth(warmth)
    fabric_clo = base_clo * random.uniform(0.95, 1.05)  # 보온력 ±10% 변동

    # 로직 판별
    raw_pmv = calculate_pmv_standard(temp, temp, wind_speed, humidity, DEFAULT_MET, fabric_clo)

    # 이상치 제거
    if raw_pmv == 999:
        score = 10  # 계산 불가 시 기본 점수
    else:
        # PMV 보정 및 거리 계산
        final_pmv = get_corrected_pmv(raw_pmv, wind_speed)
        dist = abs(final_pmv)  # 0에 가까울수록 쾌적

        # =================================================================
        # 🎯 [Part 1] 열적 쾌적성 점수 (Max 60점)
        # =================================================================
        # 정규분포 곡선(Bell Curve) 사용: 0점일 때 60점 만점, 멀어질수록 부드럽게 감소
        thermal_score = 60 * math.exp(-0.3 * (dist ** 2))

        # [보정] 더운 것(양수)은 추운 것보다 참기 힘드므로 점수를 더 깎음
        if final_pmv > 0:
            thermal_score *= 0.8

        # 너무 극단적인 온도(PMV > 3.5)는 쾌적 점수 0점 처리
        if dist > 3.5:
            thermal_score = 0

        # =================================================================
        # 🛡️ [Part 2] 기능성/보호 점수 (Max 25점)
        # =================================================================
        protection_score = 25  # 기본 만점 시작

        # 비 올 확률이 40% 이상일 때
        if precip_prob > 40:
            if water_res == 1.5:  # 완전 비방수 (린넨, 얇은 면)
                protection_score = 5  # 크게 깎지만 0점은 아님
            elif water_res == 2.5:  # 약한 방수 (울, 데님)
                protection_score = 15  # 적당히 깎음
            # water_res 3 이상은 만점(25점) 유지

        # =================================================================
        # 🍃 [Part 3] 상황/쾌적 점수 (Max 15점)
        # =================================================================
        comfort_score = 15  # 기본 만점 시작

        # 습도가 높은데(80%+) 통기성이 나쁨
        if humidity > 80 and breathability < 2.5:
            comfort_score -= 5

        # 일교차가 큰데(10도+) 옷이 너무 얇거나 두꺼움
        if temp_diff >= 10:
            if warmth == 1: comfort_score -= 5  # 밤에 추움
            if warmth == 5: comfort_score -= 5  # 낮에 더움

        # =================================================================
        # 🔥 [Part 4] 절대 규칙 (Hard Veto) - 곱하기 방식
        # =================================================================
        multiplier = 1.0

        # 겨울(5도 미만)에 얇은 옷(Warmth 1~2) 절대 금지
        if temp < 5.0 and warmth <= 2.5:
            multiplier = 0.0

        # 여름(28도 이상)에 두꺼운 옷(Warmth 4~5) 절대 금지
        if temp > 28.0 and warmth >= 3.5:
            multiplier = 0.0

        # 최종 합산
        score = (thermal_score + protection_score + comfort_score) * multiplier

        # 5. 점수 정리 및 데이터 추가
    score += random.uniform(-3, 3)  # 약간의 노이즈 추가
    score = max(0, min(100, score))  # 0~100 사이로 고정

    # 노이즈가 섞인 Feature 생성
    noise_temp = temp + random.normalvariate(0, 0.5)
    noise_hum = humidity + random.normalvariate(0, 2.0)
    data.append([noise_temp, noise_hum, precip_prob, wind_speed, temp_diff, warmth, breathability, water_res, score])

# DataFrame 생성
columns = ['temp', 'humidity', 'precip_prob', 'wind_speed', 'temp_diff', 'warmth', 'breathability', 'water_res',
           'score']
df = pd.DataFrame(data, columns=columns)

X = df.drop('score', axis=1)
y = df['score']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- 4. Optuna 하이퍼파라미터 튜닝 ---
best_params = {
    'n_estimators': 557,
    'learning_rate': 0.016686714196678172,
    'num_leaves': 50,
    'max_depth': 9,
    'min_child_samples': 50,
    'objective': 'regression',
    'metric': 'rmse',
    'random_state': 42,
    'n_jobs': 4,
    'verbose': -1
}

print(f"🚀 LightGBM Final 학습 시작 (Best Params 적용)")

model = LGBMRegressor(**best_params)
model.fit(X_train, y_train)

# --- 5. 최종 평가 ---
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print("="*40)
print(f"🏆 최종 모델 평균 오차(MAE): {mae:.2f}점")
print(f"✅ 결정 계수(R2) : {r2:.4f}")
print("="*40)


# 교차 검증
cv_scores = cross_val_score(model, X, y, cv=5, scoring='neg_mean_absolute_error')
# neg_mae는 음수값이므로 양수로 변환
mae_scores = -cv_scores
print(f"✅ 교차 검증 평균 오차(MAE): {mae_scores.mean():.2f}점 (±{mae_scores.std():.2f})")

# --- 6. 특성 중요도 (Feature Importance) ---
importances = model.feature_importances_
feature_names = X.columns
sorted_idx = np.argsort(importances)[::-1]

print("-" * 30)
print("🔍 PMV 모델이 중요하게 생각한 요소 (Top 3):")
for i in range(3):
    print(f"{i + 1}위: {feature_names[sorted_idx[i]]} (Score: {importances[sorted_idx[i]]:.1f})")
print("-" * 30)

# --- 7. 학습 곡선 (Scoring 버그 수정됨) ---
print("\n🖼️ 학습 곡선(Learning Curve) 생성 중...")
train_sizes, train_scores, valid_scores = learning_curve(
    model, X, y, cv=5,
    scoring='neg_mean_absolute_error', # [수정됨] accuracy -> neg_mae
    train_sizes=np.linspace(0.1, 1.0, 5)
)

# 음수 MAE를 양수로 변환
train_mean = -np.mean(train_scores, axis=1)
valid_mean = -np.mean(valid_scores, axis=1)

plt.figure(figsize=(10, 6))
plt.plot(train_sizes, train_mean, 'o-', color="purple", label="Training Error (MAE)")
plt.plot(train_sizes, valid_mean, 'o-', color="teal", label="Validation Error (MAE)")
plt.title("Learning Curve (Regression MAE) - Lower is Better") # 제목 수정
plt.xlabel("Training Examples")
plt.ylabel("Mean Absolute Error") # 축 이름 수정
plt.legend(loc="best")
plt.grid()

# 저장
current_dir = os.path.dirname(os.path.abspath(__file__))
artifacts_dir = os.path.join(current_dir, "..", "artifacts")
os.makedirs(artifacts_dir, exist_ok=True)
save_img_path = os.path.join(artifacts_dir, "learning_curve_regression.png")
plt.savefig(save_img_path)
print(f"   -> 시각화 저장됨: {save_img_path}")

# 모델 저장
save_model_path = os.path.join(artifacts_dir, "weather_material_pmv.pkl")
joblib.dump(model, save_model_path)
print(f"💾 모델 저장 완료: {save_model_path}")