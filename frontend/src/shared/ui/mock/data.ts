// src/shared/mock/data.ts
import type { ClosetItem, WeatherData } from "../types";

export const MOCK_WEATHER: WeatherData = {
  temp: 18,
  feelsLike: 16,
  condition: "맑음 뒤 흐림",
  humidity: 45,
  windSpeed: 2.4,
  uvIndex: "보통",
  description: "오후 3시경 약한 비 예보가 있습니다. 가벼운 외투를 챙기세요.",
  signals: ["큰 일교차 주의", "오후 3시 비 소식"],
};

export const MOCK_CLOSET: ClosetItem[] = [
  {
    id: "1",
    name: "네이비 가디건",
    category: "아우터",
    season: "가을",
    color: "Navy",
    imageUrl:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=300",
    favoriteCount: 12,
    brand: "CODION Basic",
  },
  {
    id: "2",
    name: "화이트 옥스포드 셔츠",
    category: "상의",
    season: "사계절",
    color: "White",
    imageUrl:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=300",
    favoriteCount: 8,
  },
  {
    id: "3",
    name: "베이지 치노 팬츠",
    category: "하의",
    season: "사계절",
    color: "Beige",
    imageUrl:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=300",
    favoriteCount: 15,
  },
  {
    id: "4",
    name: "워싱 데님 팬츠",
    category: "하의",
    season: "사계절",
    color: "Blue",
    imageUrl:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=300",
    favoriteCount: 5,
  },
  {
    id: "5",
    name: "린넨 셔츠",
    category: "상의",
    season: "여름",
    color: "White",
    imageUrl:
      "https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&q=80&w=300",
    favoriteCount: 3,
  },
];