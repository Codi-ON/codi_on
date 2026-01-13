// src/lib/api/closetApi.ts
import { sessionApi } from "@/lib/http";

export type ClothesCategory = "TOP" | "BOTTOM" | "OUTER" | "ONE_PIECE";
export type SeasonType = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";

export interface GetClothesParams {
    category?: ClothesCategory | "ALL";
    season?: SeasonType | "ALL";
    limit?: number;
    sort?: string;
}

export interface GetClosetItemsParams {
    category?: ClothesCategory;
    limit?: number;
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

export type ClothesSummaryItemDto = {
    clothingId: number;
    name: string;
    imageUrl?: string | null;
    category?: ClothesCategory | string | null;
};

function unwrapList<T>(raw: any): T[] {
    // case A) http.ts에서 이미 배열만 반환
    if (Array.isArray(raw)) return raw as T[];

    // case B) axios response.data 형태로 한 번 더 감싸진 경우
    const maybe = raw?.data ?? raw;
    if (Array.isArray(maybe)) return maybe as T[];

    // case C) { success, ..., data: [...] }
    if (Array.isArray(maybe?.data)) return maybe.data as T[];

    return [];
}

export const closetApi = {
    /**
     * - server: { success, code, message, data: [...] } or [...]
     */
    async getClothes(params: GetClothesParams = {}): Promise<ClothesSearchItemDto[]> {
        const raw = await sessionApi.get<any>("/api/clothes", { params });
        return unwrapList<ClothesSearchItemDto>(raw);
    },

    /**
     * - Header: X-Session-Key 필수
     * - Query: category, limit
     */
    async getClosetItems(
        params: GetClosetItemsParams = {},
        sessionKey: string
    ): Promise<ClothesSearchItemDto[]> {
        const raw = await sessionApi.get<any>("/api/closet/items", {
            params,
            headers: { "X-Session-Key": sessionKey },
        });
        return unwrapList<ClothesSearchItemDto>(raw);
    },

    async createClothing(data: CreateClothingRequest) {
        return sessionApi.post<any>("/api/clothes", data);
    },

    async getClothesSummary(ids: number[]): Promise<ClothesSummaryItemDto[]> {
        const uniq = Array.from(new Set((ids ?? []).filter((x) => Number.isFinite(x))));
        if (!uniq.length) return [];
        const raw = await sessionApi.post<any>("/api/clothes/summary", { ids: uniq });
        return unwrapList<ClothesSummaryItemDto>(raw);
    },
} as const;