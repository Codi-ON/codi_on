// src/lib/repo/outfitRepo.ts
import { outfitApi } from "@/lib/api/outfitApi";
import type { MonthlyHistoryDto, TodayOutfitDto } from "@/lib/api/outfitApi";
import { outfitSaveAdapter } from "@/lib/adapters/outfitAdapter";
import { getSessionKey } from "@/lib/session/sessionKey.ts";

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

/**
 * ✅ sessionKey는 Repo 내부에서 getSessionKey()로 일관되게 주입
 * - 호출부는 sessionKey 신경 안 쓰고 `outfitRepo.*()`만 사용
 */
export const outfitRepo = {
    /**
     * 오늘 아웃핏 조회
     */
    async getTodayOutfit(): Promise<TodayOutfitDto> {
        const sessionKey = getSessionKey();
        if (!sessionKey) throw new Error("세션키가 없습니다.");

        return outfitApi.getToday({ sessionKey });
    },

    /**
     * 오늘 아웃핏 저장
     * - input은 number[]든 items든 다 받아서 adapter에서 payload로 통일
     */
    async saveTodayOutfit(input: OutfitSaveInput): Promise<TodayOutfitDto> {
        const sessionKey = getSessionKey();
        if (!sessionKey) throw new Error("세션키가 없습니다.");

        const body = outfitSaveAdapter.toSaveTodayPayload(input);
        return outfitApi.saveToday(body, { sessionKey });
    },

    /**
     * 오늘 피드백 등록
     */
    async postTodayFeedback(rating: 1 | 0 | -1): Promise<TodayOutfitDto> {
        const sessionKey = getSessionKey();
        if (!sessionKey) throw new Error("세션키가 없습니다.");

        return outfitApi.postTodayFeedback({ rating }, { sessionKey });
    },

    /**
     * 특정 날짜 피드백 등록
     */
    async postOutfitFeedbackByDate(
        dateISO: string,
        rating: 1 | 0 | -1
    ): Promise<TodayOutfitDto> {
        const sessionKey = getSessionKey();
        if (!sessionKey) throw new Error("세션키가 없습니다.");

        return outfitApi.postFeedbackByDate(dateISO, { rating }, { sessionKey });
    },

    /**
     * 월별 히스토리 조회
     */
    async getMonthlyOutfits(year: number, month: number): Promise<MonthlyHistoryDto> {
        const sessionKey = getSessionKey();
        if (!sessionKey) throw new Error("세션키가 없습니다.");

        return outfitApi.getMonthly({ year, month }, { sessionKey });
    },
} as const;