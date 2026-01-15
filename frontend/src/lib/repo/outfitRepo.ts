// src/lib/repo/outfitRepo.ts
import { outfitApi } from "@/lib/api/outfitApi";
import type { MonthlyHistoryDto, TodayOutfitDto } from "@/lib/api/outfitApi";
import { outfitSaveAdapter } from "@/lib/adapters/outfitAdapter";
import { getSessionKey } from "@/lib/session/sessionKey";

/**
 * 저장 입력 허용 범위(프론트 편의용):
 * - number[]
 * - { clothingIds: number[] }
 * - { items: [{ clothingId, sortOrder? }] }
 * - ✅ 확장: { items: [...], recoStrategy?: string|null, recommendationId?: string|null }
 *
 * NOTE: recommendationId는 UUID "문자열"로만 다룬다. (node:crypto UUID 금지)
 */
export type OutfitSaveInput =
    | number[]
    | { clothingIds: number[] }
    | { items: Array<{ clothingId: number; sortOrder?: number }> }
    | {
    items: Array<{ clothingId: number; sortOrder?: number }>;
    recoStrategy?: string | null;
    recommendationId?: string | null; // ✅ UUID는 string으로 받는다
};

type SessionKeyOptions = { sessionKey?: string };

function requireSessionKey(opts?: SessionKeyOptions): string {
    const key = opts?.sessionKey ?? getSessionKey();
    if (!key) throw new Error("세션키가 없습니다.");
    return key;
}

/**
 * ✅ Repo
 * - 기본: 내부에서 getSessionKey() 사용 (기존 호출 안 깨짐)
 * - 필요 시: opts.sessionKey로 override 가능
 */
export const outfitRepo = {
    /** 오늘 아웃핏 조회 */
    getTodayOutfit(opts?: SessionKeyOptions): Promise<TodayOutfitDto> {
        const sessionKey = requireSessionKey(opts);
        return outfitApi.getToday({ sessionKey });
    },

    /** 오늘 아웃핏 저장 */
    saveTodayOutfit(input: OutfitSaveInput, opts?: SessionKeyOptions): Promise<TodayOutfitDto> {
        const sessionKey = requireSessionKey(opts);
        const body = outfitSaveAdapter.toSaveTodayPayload(input);
        return outfitApi.saveToday(body, { sessionKey });
    },

    /** 오늘 피드백 등록 */
    postTodayFeedback(rating: 1 | 0 | -1, opts?: SessionKeyOptions): Promise<TodayOutfitDto> {
        const sessionKey = requireSessionKey(opts);
        return outfitApi.postTodayFeedback({ rating }, { sessionKey });
    },

    /** 특정 날짜 피드백 등록 */
    postOutfitFeedbackByDate(
        dateISO: string,
        rating: 1 | 0 | -1,
        opts?: SessionKeyOptions
    ): Promise<TodayOutfitDto> {
        const sessionKey = requireSessionKey(opts);
        return outfitApi.postFeedbackByDate(dateISO, { rating }, { sessionKey });
    },

    /** 월별 히스토리 조회 */
    getMonthlyOutfits(year: number, month: number, opts?: SessionKeyOptions): Promise<MonthlyHistoryDto> {
        const sessionKey = requireSessionKey(opts);
        return outfitApi.getMonthly({ year, month }, { sessionKey });
    },
} as const;