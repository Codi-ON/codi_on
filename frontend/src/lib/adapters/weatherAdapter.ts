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

// ✅ 백엔드 "Clear/Clouds/Rain/Snow" -> 프론트 enum "CLEAR/..."
const normalizeSky = (raw: unknown): Sky => {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "clear") return "CLEAR";
  if (s === "clouds" || s === "cloud") return "CLOUDS";
  if (s === "rain") return "RAIN";
  if (s === "snow") return "SNOW";
  return "CLOUDS";
};

const dayLabelOf = (dateISO: string) => {
  const d = new Date(`${dateISO}T00:00:00`);
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
    const todaySky = normalizeSky((today as any).sky);

    const weeklyItems: WeeklyForecastItem[] =
        weekly?.days?.map((d: any) => {
          const sky = normalizeSky(d.sky);
          return {
            date: d.date,
            dayLabel: dayLabelOf(d.date),
            sky,
            icon: skyToIcon[sky],
            min: d.minTemperature,
            max: d.maxTemperature,
            pop: d.precipitationProbability,
          };
        }) ?? [];


    const signals = buildSignals(today);

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
      sky: todaySky,

      condition: skyToLabel[todaySky],
      description: signals.length ? signals.join(" · ") : "오늘은 무난한 날씨입니다.",
      signals,

      weekly: weeklyItems,
    };
  },
};


export type HistoryEntryUI = {
  id: string;
  dateISO: string; // YYYY-MM-DD
  title: string;
  weatherTemp: number | null;
  weatherIcon: React.ReactNode;
  images: string[];


  feedback?: string | null; // 예: "HOT" | "OK" | "COLD" | "UNKNOWN" 또는 서버 메시지
};