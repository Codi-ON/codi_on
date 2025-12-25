export let DailyForecast;
export type Category = '상의' | '하의' | '아우터' | '신발' | '액세서리';
export type Season = '봄' | '여름' | '가을' | '겨울' | '사계절';

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
// src/shared/types.ts

export type DailyForecast = {
  date: string;            // "2024-05-15"
  dayLabel?: string;       // "오늘" | "내일" | "수" 같은 표시용
  minTemp: number;
  maxTemp: number;
  condition: string;       // "맑음" / "흐림" 등
  icon?: string;           // "☀️" 같은 UI용
  rainProb?: number;       // 0~100
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

// Fix: Added KpiData interface
export interface KpiData {
    label: string;
    value: string;
    trend: string;
    trendUp: boolean;
}

export type WeeklyForecastItem = {
    dayLabel: string;      // "월", "화"...
    icon?: string;         // "☀️" "☁️" "🌧️" 등 (없으면 텍스트만)
    min: number;
    max: number;
    pop?: number;          // 강수확률(%) optional
};

type RecommendationClosetList = {
  top: ClosetItem[];     // 3개
  bottom: ClosetItem[];  // 3개
  outer: ClosetItem[];   // 3개
};

