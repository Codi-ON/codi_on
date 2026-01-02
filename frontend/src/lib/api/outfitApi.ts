// src/lib/api/outfitApi.ts
import { sessionApi } from "@/lib/http";

export type TodayOutfitItemDto = {
    clothingId: number;
    sortOrder: number;
    imageUrl?: string | null;
};

export type TodayOutfitDto = {
    date: string; // YYYY-MM-DD
    items: TodayOutfitItemDto[];
    feedbackScore?: number | null; // -1/0/1
    weatherTemp?: number | null;
    condition?: string | null;
};

export type MonthlyHistoryDayDto = {
    date: string; // YYYY-MM-DD
    items: TodayOutfitItemDto[];
    feedbackScore?: number | null;
    weatherTemp?: number | null;
    condition?: string | null;
};

export type MonthlyHistoryDto = {
    year: number;
    month: number;
    days: MonthlyHistoryDayDto[];
};

// ✅ Swagger 계약: { items: [{ clothingId, sortOrder }] }
export type SaveTodayOutfitRequest = {
    items: Array<{ clothingId: number; sortOrder: number }>;
};

export type SubmitTodayFeedbackRequest = {
    rating: -1 | 0 | 1;
};

export const outfitApi = {
    saveToday(body: SaveTodayOutfitRequest): Promise<TodayOutfitDto> {
        return sessionApi.post<TodayOutfitDto>("/api/outfits/today", body);
    },

    getToday(): Promise<TodayOutfitDto> {
        return sessionApi.get<TodayOutfitDto>("/api/outfits/today");
    },

    getMonthly(year: number, month: number): Promise<MonthlyHistoryDto> {
        return sessionApi.get<MonthlyHistoryDto>("/api/outfits/monthly", { params: { year, month } });
    },

    submitTodayFeedback(body: SubmitTodayFeedbackRequest): Promise<TodayOutfitDto> {
        return sessionApi.post<TodayOutfitDto>("/api/outfits/today/feedback", body);
    },
};