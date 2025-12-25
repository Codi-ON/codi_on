// src/shared/types.ts
export type Category = "상의" | "하의" | "아우터" | "신발" | "액세서리";
export type Season = "봄" | "여름" | "가을" | "겨울" | "사계절";

export interface ClosetItem {
  id: string;
  name: string;
  category: Category;
  season: Season;
  color: string;
  imageUrl: string;
  favoriteCount: number;
  brand?: string;
}

export type DailyForecast = {
  date: string;
  dayLabel?: string;
  minTemp: number;
  maxTemp: number;
  condition: string;
  icon?: string;
  rainProb?: number;
};

export type WeeklyForecastItem = {
  dayLabel: string;
  icon?: string;
  min: number;
  max: number;
  pop?: number;
};

export interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: string;
  description: string;
  signals: string[];
  weekly?: WeeklyForecastItem[];
}

export interface HistoryEntry {
  date: string;
  weatherTemp: number;
  weatherIcon: string;
  images: string[];
  styleName: string;
}

export interface KpiData {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
}

export type RecommendationClosetList = {
  top: ClosetItem[];
  bottom: ClosetItem[];
  outer: ClosetItem[];
};