import { publicApi } from "@/lib/http";

export type RecommendCategory = "TOP" | "BOTTOM" | "OUTER";

export type RecommendTodayByCategoryParams = {
  category: RecommendCategory;
  region: string;
  lat: number;
  lon: number;
  limit: number;
};

export type RecommendTodayItemDto = {
  id: number;
  clothingId: number;
  name: string;
  category: "TOP" | "BOTTOM" | "OUTER" | "ONE_PIECE";
  thicknessLevel: string;
  usageType: string;
  seasons: string[];
  suitableMinTemp: number;
  suitableMaxTemp: number;
  cottonPercentage: number | null;
  polyesterPercentage: number | null;
  etcFiberPercentage: number | null;
  color: string;
  styleTag: string;
  imageUrl: string | null;
  selectedCount: number;
  favorited: boolean;
};

export type RecommendationItemDto = {
  clothingId: number;
  name: string;
  brand?: string;
  imageUrl?: string;
  inCloset?: boolean;
};

export type RecommendationResponseDto = {
  top: RecommendationItemDto[];
  bottom: RecommendationItemDto[];
  outer: RecommendationItemDto[];
};

function qs(params: Record<string, string | number>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => sp.set(k, String(v)));
  return `?${sp.toString()}`;
}

function toItemDto(x: RecommendTodayItemDto): RecommendationItemDto {
  return {
    clothingId: x.clothingId,
    name: x.name,
    brand: x.styleTag ?? "CODION",
    imageUrl: x.imageUrl ?? undefined,
    inCloset: true, // 서버 필드 없으면 정책으로 true (추후 closet 연결 시 교체)
  };
}

export const recoApi = {
  // ✅ 백엔드 실제 엔드포인트로 변경
  getTodayByCategory(params: RecommendTodayByCategoryParams) {
    return publicApi.get<RecommendTodayItemDto[]>(
        `/api/recommend/today/by-category${qs(params)}`
    );
  },


  async getRecommendation(payload?: Partial<Omit<RecommendTodayByCategoryParams, "category">>) {
    const base = {
      region: payload?.region ?? "Seoul",
      lat: payload?.lat ?? 37.5665,
      lon: payload?.lon ?? 126.978,
      limit: payload?.limit ?? 50,
    };

    const [top, bottom, outer] = await Promise.all([
      recoApi.getTodayByCategory({ category: "TOP", ...base }),
      recoApi.getTodayByCategory({ category: "BOTTOM", ...base }),
      recoApi.getTodayByCategory({ category: "OUTER", ...base }),
    ]);

    return {
      top: top.map(toItemDto),
      bottom: bottom.map(toItemDto),
      outer: outer.map(toItemDto),
    } as RecommendationResponseDto;
  },
};