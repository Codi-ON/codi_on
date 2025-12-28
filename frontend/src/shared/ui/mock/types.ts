export type Season = '봄' | '여름' | '가을' | '겨울';
export type ClothingCategory = '상의' | '하의' | '원피스' | '아우터';
export type UsageType = '실내' | '실외' | '둘다';
export type ThicknessLevel = 'THIN' | 'NORMAL' | 'THICK';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: number;      // %
  windSpeed: number;     // m/s
  uvIndex: '낮음' | '보통' | '높음' | '매우높음';
  description: string;
  signals: string[];     // UI 배지/알림용
}

export interface ClosetItem {
  id: string;
  name: string;
  category: ClothingCategory;
  season: Season;
  color: string;
  imageUrl?: string;

  usageType?: UsageType;
  thickness?: ThicknessLevel;
  material?: string;
  memo?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  checked?: boolean;
}

export interface RecommendationResult {
  id: string;
  weatherDate: string;      // YYYY-MM-DD
  strategy: 'RULE' | 'ML' | 'HYBRID';
  reason: string;
  checklist: ChecklistItem[];
  items: ClosetItem[];
}

export type RecoCategory = 'TOP' | 'BOTTOM' | 'OUTER';

export type RecoClosetItem = {
  id: string;
  category: RecoCategory;
  name: string;
  brand?: string;
  imageUrl?: string | null;
};

export type RecommendationClosetList = {
  top: RecoClosetItem[];     // 3개
  bottom: RecoClosetItem[];  // 3개
  outer: RecoClosetItem[];   // 3개
};