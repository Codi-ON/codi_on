// src/lib/adapters/weatherAdapter.ts
import type { WeatherTodayDto, WeatherWeeklyResponseDto } from "@/lib/api/weatherApi";
import type { Sky, WeatherData, WeeklyForecastItem } from "@/shared/domain/weather";

const skyToIcon: Record<Sky, string> = {
  CLEAR: "☀️",
  CLOUDS: "☁️",
  RAIN: "🌧️",
  SNOW: "❄️",
};

const skyToLabel: Record<Sky, string> = {
  CLEAR: "맑음",
  CLOUDS: "흐림",
  RAIN: "비",
  SNOW: "눈",
};

const dayLabelOf = (dateISO: string) => {
  const d = new Date(dateISO);
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((d0.getTime() - t0.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "내일";
  return ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
};

const buildSignals = (today: WeatherTodayDto) => {
  const signals: string[] = [];
  const diff = today.maxTemperature - today.minTemperature;

  if (diff >= 8) signals.push("큰 일교차 주의");
  if (today.precipitationProbability >= 50) signals.push("우산 챙기기");
  if (today.windSpeed >= 6) signals.push("강풍 주의");
  if (today.feelsLikeTemperature <= today.temperature - 2) signals.push("체감 온도 낮음");

  return signals;
};

export const weatherAdapter = {
  toWeatherData(today: WeatherTodayDto, weekly?: WeatherWeeklyResponseDto): WeatherData {
    const weeklyItems: WeeklyForecastItem[] =
        weekly?.days?.map((d) => ({
          date: d.date,
          dayLabel: dayLabelOf(d.date),
          icon: skyToIcon[d.sky],
          min: d.minTemperature,
          max: d.maxTemperature,
          pop: d.precipitationProbability,
          sky: d.sky,
        })) ?? [];

    const condition = skyToLabel[today.sky];
    const signals = buildSignals(today);

    const description =
        signals.length > 0
            ? signals.join(" · ")
            : "오늘은 무난한 날씨입니다.";

    return {
      region: today.region,
      date: today.date,
      temp: today.temperature,
      feelsLike: today.feelsLikeTemperature,
      minTemp: today.minTemperature,
      maxTemp: today.maxTemperature,
      humidity: today.humidity,
      windSpeed: today.windSpeed,
      precipitationProbability: today.precipitationProbability,
      sky: today.sky,

      condition,
      description,
      signals,

      weekly: weeklyItems, // ✅ 항상 배열
    };
  },
};