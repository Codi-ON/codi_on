// src/lib/api/closetApi.ts
import { sessionApi } from "@/lib/http";

export type ClothesCategory = "TOP" | "BOTTOM" | "OUTER" | "ONE_PIECE";
export type SeasonType = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";

export interface GetClothesParams {
    category?: string;
    season?: string;
    limit?: number;
    sort?: string;
}

export type ClothesSearchItemDto = {
    id: number;
    clothingId: number;
    name: string;
    category: ClothesCategory;
    thicknessLevel: string;
    usageType: string;
    seasons: SeasonType[];
    suitableMinTemp: number;
    suitableMaxTemp: number;
    cottonPercentage?: number | null;
    polyesterPercentage?: number | null;
    etcFiberPercentage?: number | null;
    color?: string | null;
    styleTag?: string | null;
    imageUrl?: string | null;
    selectedCount: number;
    favorited: boolean;
};

export interface CreateClothingRequest {
    clothingId: number;
    name: string;
    category: ClothesCategory;
    thicknessLevel: string;
    usageType: string;
    seasons: SeasonType[];
    suitableMinTemp: number;
    suitableMaxTemp: number;
    cottonPercentage?: number;
    polyesterPercentage?: number;
    etcFiberPercentage?: number;
    color?: string;
    styleTag?: string;
    imageUrl?: string;
}

/**
 * ✅ 캘린더 merge용 summary DTO
 * - 백 응답 예시: { clothingId, name, imageUrl, category }
 */
export type ClothesSummaryItemDto = {
    clothingId: number;
    name: string;
    imageUrl?: string | null;
    category?: ClothesCategory | string | null;
};

export type ClothesSummaryRequest = {
    ids: number[];
};

export const closetApi = {
    async getClothes(params: GetClothesParams = {}): Promise<ClothesSearchItemDto[]> {
        return sessionApi.get<ClothesSearchItemDto[]>("/api/clothes/search", { params });
    },

    async createClothing(data: CreateClothingRequest) {
        return sessionApi.post<any>("/api/clothes", data);
    },

    /**
     * ✅ (추가) clothes summary 배치 조회
     * - POST /api/clothes/summary
     * - Body: { ids: number[] }
     * - Response: (서버가 success/data 래핑이면 http.ts에서 unwrap되도록 되어 있어야 함)
     */
    async getClothesSummary(ids: number[]): Promise<ClothesSummaryItemDto[]> {
        const uniq = Array.from(new Set((ids ?? []).filter((x) => Number.isFinite(x))));
        if (!uniq.length) return [];
        return sessionApi.post<ClothesSummaryItemDto[]>("/api/clothes/summary", { ids: uniq });
    },
} as const;