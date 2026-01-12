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

/**
 * ✅ sessionKey를 모든 호출에 명시적으로 주입하는 Repo
 * - 이유: “저장”과 “히스토리 조회”가 같은 세션키를 써야 최근 저장이 바로 보임
 * - 원칙: outfitRepo 레벨에서는 항상 sessionKey를 받는다
 *
 * 사용 예)
 *   const sessionKey = effectiveSessionKey;
 *   await outfitRepo.saveTodayOutfit(clothingIds, sessionKey);
 *   const today = await outfitRepo.getTodayOutfit(sessionKey);
 */
export const outfitRepo = {
    /**
     * 오늘 아웃핏 조회
     */
    getTodayOutfit(sessionKey: string): Promise<TodayOutfitDto> {
        return outfitApi.getToday({ sessionKey });
    },

    /**
     * 오늘 아웃핏 저장
     * - input은 number[]든 items든 다 받아서 adapter에서 payload로 통일
     */
    saveTodayOutfit(input: OutfitSaveInput, sessionKey: string): Promise<TodayOutfitDto> {
        const body = outfitSaveAdapter.toSaveTodayPayload(input);
        return outfitApi.saveToday(body, { sessionKey });
    },

    /**
     * 오늘 피드백 등록
     */
    postTodayFeedback(rating: 1 | 0 | -1, sessionKey: string): Promise<TodayOutfitDto> {
        return outfitApi.postTodayFeedback({ rating }, { sessionKey });
    },

    /**
     * 특정 날짜 피드백 등록
     */
    postOutfitFeedbackByDate(dateISO: string, rating: 1 | 0 | -1, sessionKey: string): Promise<TodayOutfitDto> {
        return outfitApi.postFeedbackByDate(dateISO, { rating }, { sessionKey });
    },

    /**
     * 월별 히스토리 조회
     */
    getMonthlyOutfits(year: number, month: number, sessionKey: string): Promise<MonthlyHistoryDto> {
        return outfitApi.getMonthly({ year, month }, { sessionKey });
    },

} as const;