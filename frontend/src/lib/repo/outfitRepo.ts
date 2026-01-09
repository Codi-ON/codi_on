// src/lib/repo/outfitRepo.ts
import {
    outfitApi,
    type MonthlyHistoryDto,
    type SaveTodayOutfitRequest,
    type TodayOutfitDto,
} from "@/lib/api/outfitApi";
import { HttpError } from "@/lib/http";

type SaveInput =
    | number[]
    | { clothingIds: number[] }
    | SaveTodayOutfitRequest
    | unknown;

type SaveItem = SaveTodayOutfitRequest["items"][number];

function isSaveTodayRequest(v: any): v is SaveTodayOutfitRequest {
    return !!v && typeof v === "object" && Array.isArray(v.items);
}

function isInt(n: any): n is number {
    return Number.isInteger(n);
}

function normalizeClothingIds(input: SaveInput): number[] {
    if (Array.isArray(input)) return input.filter(isInt);

    if (input && typeof input === "object" && Array.isArray((input as any).clothingIds)) {
        return (input as any).clothingIds.filter(isInt);
    }

    if (isSaveTodayRequest(input)) {
        const items = (input.items ?? [])
            .filter((it: any) => it && isInt(it.clothingId))
            .slice()
            .sort((a: any, b: any) => {
                const ao = isInt(a.sortOrder) ? a.sortOrder : Number.MAX_SAFE_INTEGER;
                const bo = isInt(b.sortOrder) ? b.sortOrder : Number.MAX_SAFE_INTEGER;
                return ao - bo;
            });

        return items.map((it: any) => it.clothingId);
    }

    return [];
}

function toSaveTodayPayload(input: SaveInput): SaveTodayOutfitRequest {
    if (isSaveTodayRequest(input)) {
        const normalized: SaveItem[] = (input.items ?? [])
            .filter((it: any) => it && isInt(it.clothingId))
            .slice(0, 3)
            .map((it: any, idx: number) => ({
                clothingId: it.clothingId,
                sortOrder: idx + 1,
            }));
        return { items: normalized };
    }

    const clothingIds = normalizeClothingIds(input).slice(0, 3);
    return {
        items: clothingIds.map((clothingId, idx) => ({
            clothingId,
            sortOrder: idx + 1,
        })),
    };
}

export const outfitRepo = {
    // ✅ 핵심: 오늘 저장 없으면 null (정상 케이스)
    getTodayOutfit: async (): Promise<TodayOutfitDto | null> => {
        try {
            return await outfitApi.getToday();
        } catch (e) {
            if (e instanceof HttpError && e.status === 404 && e.code === "NOT_FOUND") {
                return null;
            }
            throw e;
        }
    },

    getMonthlyOutfits: async (year: number, month: number): Promise<MonthlyHistoryDto> => {
        if (!Number.isInteger(year) || year < 2000) throw new Error("year 파라미터가 올바르지 않습니다.");
        if (!Number.isInteger(month) || month < 1 || month > 12)
            throw new Error("month 파라미터가 올바르지 않습니다. (1~12)");
        return outfitApi.getMonthly(year, month);
    },

    saveTodayOutfit: async (input: SaveInput): Promise<TodayOutfitDto> => {
        const payload = toSaveTodayPayload(input);
        if (!payload.items?.length) throw new Error("저장할 clothingId가 없습니다. (items는 1개 이상 필요)");
        return outfitApi.saveToday(payload);
    },
};