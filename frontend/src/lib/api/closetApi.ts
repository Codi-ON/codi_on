// src/lib/api/closetApi.ts
import { publicApi } from "@/lib/http";

export type ClothesCategory = "TOP" | "BOTTOM" | "OUTER" | "ONE_PIECE";
export type SeasonType = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";

export type RecommendTodayItemDto = {
  id: number;
  clothingId: number;
  name: string;
  category: ClothesCategory;
  thicknessLevel: string;
  usageType: string;
  seasons: SeasonType[];
  suitableMinTemp: number;
  suitableMaxTemp: number;
  cottonPercentage: number | null;
  polyesterPercentage: number | null;
  etcFiberPercentage: number | null;
  color: string | null;
  styleTag: string | null;
  imageUrl: string | null;
  selectedCount: number;
  favorited: boolean;
};

export type GetClothesParams = {
  limit?: number;
};

export const clothesApi = {
  getClothes: (params: GetClothesParams = {}) =>
      publicApi.get<RecommendTodayItemDto[]>("/api/clothes", {
        params: { limit: params.limit ?? 30 },
      }),
};