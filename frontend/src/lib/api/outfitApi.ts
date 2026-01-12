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

/** ---------- Requests ---------- */
export type SaveTodayOutfitRequest = {
    items: Array<{ clothingId: number; sortOrder: number }>;
    recoStrategy?: RecoStrategy | string | null;
};

export type OutfitFeedbackRequest = {
    rating: 1 | 0 | -1;
};

/** ---------- API ---------- */
export const outfitApi = {
    async getToday(): Promise<TodayOutfitDto> {
        const res = await sessionApi.get<ApiEnvelope<TodayOutfitDto> | TodayOutfitDto>(
            "/api/outfits/today"
        );
        return unwrap(res);
    },

    async saveToday(body: SaveTodayOutfitRequest): Promise<TodayOutfitDto> {
        const res = await sessionApi.post<ApiEnvelope<TodayOutfitDto> | TodayOutfitDto>(
            "/api/outfits/today",
            body
        );
        return unwrap(res);
    },

    /** (레거시/호환) 오늘 피드백: POST /api/outfits/today/feedback */
    async postTodayFeedback(body: OutfitFeedbackRequest): Promise<TodayOutfitDto> {
        const res = await sessionApi.post<ApiEnvelope<TodayOutfitDto> | TodayOutfitDto>(
            "/api/outfits/today/feedback",
            body
        );
        return unwrap(res);
    },

    async postFeedbackByDate(dateISO: string, body: OutfitFeedbackRequest): Promise<TodayOutfitDto> {
        const res = await sessionApi.post<ApiEnvelope<TodayOutfitDto> | TodayOutfitDto>(
            `/api/outfits/${encodeURIComponent(dateISO)}/feedback`,
            body
        );
        return unwrap(res);
    },

    async getMonthly(q: { year: number; month: number }): Promise<MonthlyHistoryDto> {
        const res = await sessionApi.get<ApiEnvelope<MonthlyHistoryDto> | MonthlyHistoryDto>(
            "/api/outfits/monthly",
            { params: q }
        );
        return unwrap(res);
    },
} as const;