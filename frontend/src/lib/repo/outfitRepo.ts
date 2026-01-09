// src/lib/repo/outfitRepo.ts
import { outfitApi, type TodayOutfitDto, type MonthlyHistoryDto, type SaveTodayOutfitRequest } from "@/lib/api/outfitApi";

type SaveInput =
    | number[] // [topId, bottomId, outerId?]
    | { clothingIds: number[] }
    | SaveTodayOutfitRequest
    | unknown;

function isSaveTodayRequest(v: any): v is SaveTodayOutfitRequest {
    return v && typeof v === "object" && Array.isArray(v.items);
}

function normalizeClothingIds(input: SaveInput): number[] {
    // 1) number[]
    if (Array.isArray(input)) return input.filter((n): n is number => Number.isInteger(n));

    // 2) { clothingIds: number[] }
    if (input && typeof input === "object" && Array.isArray((input as any).clothingIds)) {
        return (input as any).clothingIds.filter((n: any): n is number => Number.isInteger(n));
    }

    // 3) { items: [{ clothingId, sortOrder }] }
    if (isSaveTodayRequest(input)) {
        return input.items
            .map((it) => it?.clothingId)
            .filter((n): n is number => Number.isInteger(n));
    }

    return [];
}

function toSaveTodayPayload(input: SaveInput): SaveTodayOutfitRequest {
    // 이미 계약 형태면 sortOrder 정렬만 보장
    if (isSaveTodayRequest(input)) {
        const items = input.items
            .filter((it) => Number.isInteger(it?.clothingId))
            .map((it, idx) => ({
                clothingId: it.clothingId,
                sortOrder: Number.isInteger(it.sortOrder) ? it.sortOrder : idx + 1,
            }));

        return { items };
    }

    // number[] / clothingIds -> items 로 변환
    const clothingIds = normalizeClothingIds(input);
    const uniq = Array.from(new Set(clothingIds)).slice(0, 3); // 3슬롯 가정(상의/하의/아우터 옵션)

    return {
        items: uniq.map((clothingId, i) => ({
            clothingId,
            sortOrder: i + 1,
        })),
    };
}

export const outfitRepo = {
    getTodayOutfit: async (): Promise<TodayOutfitDto> => {
        return outfitApi.getToday();
    },

    getMonthlyOutfits: async (year: number, month: number): Promise<MonthlyHistoryDto> => {
        if (!Number.isInteger(year) || year < 2000) throw new Error("year 파라미터가 올바르지 않습니다.");
        if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error("month 파라미터가 올바르지 않습니다. (1~12)");
        return outfitApi.getMonthly(year, month);
    },

    saveTodayOutfit: async (input: SaveInput): Promise<TodayOutfitDto> => {
        const payload = toSaveTodayPayload(input);

        if (!payload.items.length) {
            throw new Error("저장할 clothingId가 없습니다. (items는 1개 이상 필요)");
        }

        return outfitApi.saveToday(payload);
    },
};