// src/shared/domain/outfit.ts (예시)

export type TodayOutfitItem = {
    clothingId: number;
    sortOrder: number;

    // UI enrichment(선택): 서버가 안주면 null로 유지
    name?: string | null;
    imageUrl?: string | null;
    category?: string | null;
};

export type TodayOutfit = {
    date: string; // YYYY-MM-DD
    items: TodayOutfitItem[];
};