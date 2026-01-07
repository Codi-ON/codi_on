// src/lib/api/closetApi.ts
import { apiClient } from "@/shared/api/apiResponse";

export type ClothesCategory = "TOP" | "BOTTOM" | "OUTER" | "ONE_PIECE" | "ACCESSORY";
export type SeasonType = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";

export interface GetClothesParams {
    category?: string;
    season?: string;
    limit?: number;
    sort?: string;
    // 필요한 검색 조건들 추가
}

// 📝 백엔드 DTO (ClothingItemRequestDto.Create) 완벽 매칭
export interface CreateClothingRequest {
    clothingId: number;          // 필수 (@NotNull)
    name: string;                // 필수 (@NotBlank)
    category: string;            // 필수 (TOP, BOTTOM, OUTER, ONE_PIECE, ACCESSORY)
    thicknessLevel: string;      // 필수 (THIN, NORMAL, THICK) - 이름 주의!
    usageType: string;           // 필수 (INDOOR, OUTDOOR, BOTH)
    seasons: string[];           // 필수 (SPRING, SUMMER, AUTUMN, WINTER)
    suitableMinTemp: number;     // 필수
    suitableMaxTemp: number;     // 필수

    // 선택값 (Optional)
    cottonPercentage?: number;
    polyesterPercentage?: number;
    etcFiberPercentage?: number;
    color?: string;
    styleTag?: string;
    imageUrl?: string;
}

export const clothesApi = {
    //  옷 목록 가져오기
    getClothes: async (params: GetClothesParams = {}) => {
        const response = await apiClient.get("/api/clothes/search", { params });
        return response.data;
    },

    // 옷 등록 함수
    createClothing: async (data: CreateClothingRequest) => {
        const response = await apiClient.post("/api/clothes", data);
        return response.data;
    },
};