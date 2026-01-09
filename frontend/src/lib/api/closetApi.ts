import { sessionApi } from "@/lib/http";

export type ClothesCategory = "TOP" | "BOTTOM" | "OUTER" | "ONE_PIECE" | "ACCESSORY";
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

export const closetApi = {
    async getClothes(params: GetClothesParams = {}): Promise<ClothesSearchItemDto[]> {
        return sessionApi.get<ClothesSearchItemDto[]>("/api/clothes/search", { params });
    },

    async createClothing(data: CreateClothingRequest) {
        return sessionApi.post<any>("/api/clothes", data);
    },
};