// src/lib/adapters/outfitSaveAdapter.ts
import type { SaveTodayOutfitRequest } from "@/lib/api/outfitApi";

function isNumberArray(v: unknown): v is number[] {
    return Array.isArray(v) && v.every((x) => typeof x === "number" && Number.isFinite(x));
}

function extractIds(input: unknown): number[] {
    // 1) number[]
    if (isNumberArray(input)) return input;

    // 2) { clothingIds: number[] }
    if (input && typeof input === "object" && "clothingIds" in (input as any)) {
        const arr = (input as any).clothingIds;
        if (isNumberArray(arr)) return arr;
    }

    // 3) { items: [{ clothingId, sortOrder }] } 형태가 이미 들어온 경우
    if (input && typeof input === "object" && "items" in (input as any)) {
        const items = (input as any).items;
        if (Array.isArray(items)) {
            const ids = items
                .map((it) => (it && typeof it === "object" ? (it as any).clothingId : undefined))
                .filter((x): x is number => typeof x === "number" && Number.isFinite(x));
            return ids;
        }
    }

    return [];
}

export const outfitSaveAdapter = {
    toSaveTodayPayload(input: unknown): SaveTodayOutfitRequest {
        const clothingIds = extractIds(input);

        // ✅ sortOrder는 1부터
        const items = clothingIds.map((id, idx) => ({
            clothingId: id,
            sortOrder: idx + 1,
        }));

        return { items };
    },
};