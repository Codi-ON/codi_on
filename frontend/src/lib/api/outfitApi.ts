// src/lib/api/outfitApi.ts
import { sessionApi } from "@/lib/http";

/** 백엔드에서 쓰는 추천 전략 (nullable 허용) */
export type RecoStrategy = "BLEND_RATIO" | "MATERIAL_RATIO";

/** 공통 응답 래퍼(백이 success/data로 감싸는 경우 대응) */
export type ApiEnvelope<T> = {
    success: boolean;
    code: string;
    message: string;
    data: T;
};

function unwrap<T>(res: T | ApiEnvelope<T>): T {
    if (res && typeof res === "object" && "data" in (res as any)) {
        return (res as ApiEnvelope<T>).data;
    }
    return res as T;
}

/** ---------- DTOs ---------- */
export type TodayOutfitItemDto = {
    clothingId: number;
    sortOrder: number;
    name?: string;
    imageUrl?: string;
    category?: string;
};

export type TodayOutfitDto = {
    date: string; // YYYY-MM-DD
    items: TodayOutfitItemDto[];

    feedbackScore?: number | null; // -1/0/1
    weatherTemp?: number | null;
    condition?: string | null;
    weatherFeelsLike?: number | null;
    weatherCloudAmount?: number | null;

    // 서버가 null 또는 문자열로 내려줄 수도 있음
    recoStrategy?: RecoStrategy | string | null;
};

export type MonthlyHistoryDayDto = {
    date: string;
    items?: TodayOutfitItemDto[];

    feedbackScore?: number | null;
    weatherTemp?: number | null;
    condition?: string | null;
    weatherFeelsLike?: number | null;
    weatherCloudAmount?: number | null;

    recoStrategy?: RecoStrategy | string | null;
};

export type MonthlyHistoryDto = {
    year: number; // 2026
    month: number; // 1~12
    days: MonthlyHistoryDayDto[];
};

/** (옵션) recent history DTO: 서버 응답 스펙에 맞춰 필요한 필드만 */
export type RecentOutfitHistoryDto = {
    id: number;
    outfitDate?: string; // YYYY-MM-DD
    title?: string | null;
    thumbnailUrl?: string | null;
    items?: Array<{
        category?: string;
        clothingId?: number;
        name?: string;
        imageUrl?: string | null;
        sortOrder?: number;
    }>;
};

/** ---------- Requests ---------- */
export type SaveTodayOutfitRequest = {
    items: Array<{ clothingId: number; sortOrder: number }>;
    recoStrategy?: RecoStrategy | string | null;
};

export type OutfitFeedbackRequest = {
    rating: 1 | 0 | -1;
};

/**
 * ✅ sessionKey 주입 옵션
 * - sessionApi가 Axios 인스턴스라면 config.headers로 주입 가능
 * - 백 정책: X-Session-Key 헤더 필수(없으면 400)
 */
type SessionKeyOptions = {
    sessionKey?: string;
};

function withSessionKey(opts?: SessionKeyOptions) {
    const key = opts?.sessionKey;
    if (!key) return {};
    return {
        headers: {
            "X-Session-Key": key,
        },
    };
}

/** ---------- API ---------- */
export const outfitApi = {
    /**
     * GET /api/outfits/today
     */
    async getToday(opts?: SessionKeyOptions): Promise<TodayOutfitDto> {
        const res = await sessionApi.get<ApiEnvelope<TodayOutfitDto> | TodayOutfitDto>(
            "/api/outfits/today",
            withSessionKey(opts)
        );
        return unwrap(res as any);
    },

    /**
     * POST /api/outfits/today
     */
    async saveToday(body: SaveTodayOutfitRequest, opts?: SessionKeyOptions): Promise<TodayOutfitDto> {
        const res = await sessionApi.post<ApiEnvelope<TodayOutfitDto> | TodayOutfitDto>(
            "/api/outfits/today",
            body,
            withSessionKey(opts)
        );
        return unwrap(res as any);
    },

    /**
     * (레거시/호환) POST /api/outfits/today/feedback
     */
    async postTodayFeedback(body: OutfitFeedbackRequest, opts?: SessionKeyOptions): Promise<TodayOutfitDto> {
        const res = await sessionApi.post<ApiEnvelope<TodayOutfitDto> | TodayOutfitDto>(
            "/api/outfits/today/feedback",
            body,
            withSessionKey(opts)
        );
        return unwrap(res as any);
    },

    /**
     * POST /api/outfits/{date}/feedback
     */
    async postFeedbackByDate(
        dateISO: string,
        body: OutfitFeedbackRequest,
        opts?: SessionKeyOptions
    ): Promise<TodayOutfitDto> {
        const res = await sessionApi.post<ApiEnvelope<TodayOutfitDto> | TodayOutfitDto>(
            `/api/outfits/${encodeURIComponent(dateISO)}/feedback`,
            body,
            withSessionKey(opts)
        );
        return unwrap(res as any);
    },

    /**
     * GET /api/outfits/monthly?year=YYYY&month=M
     */
    async getMonthly(q: { year: number; month: number }, opts?: SessionKeyOptions): Promise<MonthlyHistoryDto> {
        const res = await sessionApi.get<ApiEnvelope<MonthlyHistoryDto> | MonthlyHistoryDto>(
            "/api/outfits/monthly",
            {
                params: q,
                ...withSessionKey(opts),
            }
        );
        return unwrap(res as any);
    },
} as const;