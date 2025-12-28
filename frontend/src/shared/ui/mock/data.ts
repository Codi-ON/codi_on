import { ClosetItem, WeatherData, ChecklistItem } from './types';

export const MOCK_WEATHER: WeatherData = {
  temp: 18,
  feelsLike: 16,
  condition: '맑음 뒤 흐림',
  humidity: 45,
  windSpeed: 2.4,
  uvIndex: '보통',
  description: '오후 3시경 약한 비 예보가 있습니다. 가벼운 외투를 챙기세요.',
  signals: ['큰 일교차 주의', '오후 3시 비 소식'],
};

export const MOCK_CHECKLIST: ChecklistItem[] = [
  {
    id: 'c1',
    label: '일교차가 큰가?',
    description: '아침/저녁 체감온도 기준으로 겹쳐입기 필요 여부 확인',
    checked: false,
  },
  {
    id: 'c2',
    label: '비 올 가능성이 있나?',
    description: '우산/방수 아우터 필요 여부 확인',
    checked: false,
  },
  {
    id: 'c3',
    label: '바람이 센 날인가?',
    description: '체감온도 하락 고려',
    checked: false,
  },
  {
    id: 'c4',
    label: '실내 vs 실외 비중은?',
    description: '실내 중심이면 얇게, 실외 중심이면 보온/방풍',
    checked: false,
  },
];

export const MOCK_CLOSET: ClosetItem[] = [
  {
    id: '1',
    name: '네이비 가디건',
    category: '아우터',
    season: '가을',
    color: 'Navy',
    imageUrl:
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600',
    usageType: '둘다',
    thickness: 'NORMAL',
    material: '울 혼방',
    memo: '실내에서도 무난',
  },
  {
    id: '2',
    name: '오프화이트 긴팔 티',
    category: '상의',
    season: '봄',
    color: 'Off-White',
    imageUrl:
      'https://images.unsplash.com/photo-1520975958225-83fba3dfdb83?auto=format&fit=crop&q=80&w=600',
    usageType: '둘다',
    thickness: 'THIN',
    material: '코튼',
  },
  {
    id: '3',
    name: '블랙 슬랙스',
    category: '하의',
    season: '가을',
    color: 'Black',
    imageUrl:
      'https://images.unsplash.com/photo-1520975685030-79f2f8f06b9b?auto=format&fit=crop&q=80&w=600',
    usageType: '실외',
    thickness: 'NORMAL',
    material: '폴리',
  },
  {
    id: '4',
    name: '라이트 패딩 베스트',
    category: '아우터',
    season: '겨울',
    color: 'Light Gray',
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
    usageType: '실외',
    thickness: 'THICK',
    memo: '바람 강하면 레이어용',
  },
  {
    id: '5',
    name: '데님 팬츠',
    category: '하의',
    season: '봄',
    color: 'Blue',
    imageUrl:
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600',
    usageType: '둘다',
    thickness: 'NORMAL',
  },
];
// --- admin dashboard mock (minimal) ---
export const MOCK_ADMIN_KPI = {
  totalUsers: 1280,
  activeUsers: 342,
  newUsersToday: 25,
  recommendationRequestsToday: 410,
};

export const MOCK_ADMIN_STATS = {
  daily: [
    { date: '2025-12-24', value: 120 },
    { date: '2025-12-25', value: 180 },
    { date: '2025-12-26', value: 210 },
    { date: '2025-12-27', value: 160 },
    { date: '2025-12-28', value: 190 },
  ],
  topCategories: [
    { name: '아우터', value: 42 },
    { name: '상의', value: 31 },
    { name: '하의', value: 19 },
    { name: '원피스', value: 8 },
  ],
};

// --- user history mock (minimal) ---
export const MOCK_HISTORY = [
  {
    id: 'h1',
    date: '2025-12-28',
    weather: { temp: 18, condition: '맑음 뒤 흐림' },
    items: [
      { id: '2', name: '오프화이트 긴팔 티' },
      { id: '1', name: '네이비 가디건' },
      { id: '3', name: '블랙 슬랙스' },
    ],
  },
];


export type RecommendationClosetList = {
  top: ClosetItem[];
  bottom: ClosetItem[];
  outer: ClosetItem[];
};