// src/lib/repo/outfitRepo.ts
import { outfitApi } from "@/lib/api/outfitApi";
import type { MonthlyHistoryDto, TodayOutfitDto } from "@/lib/api/outfitApi";
import { outfitSaveAdapter } from "@/lib/adapters/outfitAdapter";

/**
 * 저장 입력 허용 범위(프론트 편의용):
 * - number[]
 * - { clothingIds: number[] }
 * - { items: [{ clothingId, sortOrder? }] }
 * - ✅ 확장: { items: [...], recoStrategy?: string|null, recommendationKey?: string|null }
 */
export type OutfitSaveInput =
    | number[]
    | { clothingIds: number[] }
    | { items: Array<{ clothingId: number; sortOrder?: number }> }
    | {
    items: Array<{ clothingId: number; sortOrder?: number }>;
    recoStrategy?: string | null;
    recommendationKey?: string | null;
};

export const outfitRepo = {
    getTodayOutfit(): Promise<TodayOutfitDto> {
        return outfitApi.getToday();
    },

    saveTodayOutfit(input: OutfitSaveInput): Promise<TodayOutfitDto> {
        const body = outfitSaveAdapter.toSaveTodayPayload(input);
        return outfitApi.saveToday(body);
    },

    postTodayFeedback(rating: 1 | 0 | -1): Promise<TodayOutfitDto> {
        return outfitApi.postTodayFeedback({ rating });
    },

    postOutfitFeedbackByDate(dateISO: string, rating: 1 | 0 | -1): Promise<TodayOutfitDto> {
        return outfitApi.postFeedbackByDate(dateISO, { rating });
    },

    getMonthlyOutfits(year: number, month: number): Promise<MonthlyHistoryDto> {
        return outfitApi.getMonthly({ year, month });
    },
} as const;