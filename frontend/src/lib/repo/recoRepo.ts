import { publicApi } from "@/lib/http";

export type RecommendCategory = "TOP" | "BOTTOM" | "OUTER";
export type ClothingCategory = RecommendCategory | "ONE_PIECE";

export type RecommendTodayByCategoryParams = {
  category: RecommendCategory;
  region: string;
  lat: number;
  lon: number;
  limit?: number;
};

export type RecommendTodayItemDto = {
  id: number;
  clothingId: number;
  name: string;
  category: ClothingCategory;
  imageUrl: string | null;
  favorited: boolean;

  thicknessLevel?: string;
  usageType?: string;
  seasons?: string[];
  suitableMinTemp?: number;
  suitableMaxTemp?: number;

  cottonPercentage?: number | null;
  polyesterPercentage?: number | null;
  etcFiberPercentage?: number | null;

  color?: string;
  styleTag?: string;
  selectedCount?: number;
};

export const recoRepo = {
  async getTodayByCategory(
      params: RecommendTodayByCategoryParams
  ): Promise<RecommendTodayItemDto[]> {
    // ✅ publicApi는 "unwrap 후 data(T)"를 리턴한다는 전제
    // - 백엔드가 ApiResponse 래핑이면: T = RecommendTodayItemDto[]
    // - 백엔드가 배열 직접이면: T = RecommendTodayItemDto[]
    // 둘 다 동작하게 만든다.
    const payload = await publicApi.get<unknown>("/api/recommend/today/by-category", {
      params: { ...params, limit: params.limit ?? 10 },
    });


    if (Array.isArray(payload)) return payload as RecommendTodayItemDto[];

    if (payload && typeof payload === "object" && Array.isArray((payload as any).data)) {
      return (payload as any).data as RecommendTodayItemDto[];
    }

    // 계약 위반이면 빈 배열로 반환(페이지에서 empty 처리)
    return [];
  },
};