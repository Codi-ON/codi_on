// src/lib/repo/outfitRepo.ts
import { outfitApi } from "@/lib/api/outfitApi";
import type { TodayOutfitDto } from "@/lib/api/outfitApi";
import { outfitSaveAdapter } from "@/lib/adapters/outfitSaveAdapter";

export const outfitRepo = {
    saveTodayOutfit: async (input: unknown): Promise<TodayOutfitDto> => {
        const payload = outfitSaveAdapter.toSaveTodayPayload(input);

        if (!payload.items.length) {
            // ✅ 문법: message: 붙이면 안됨
            throw new Error("저장할 clothingId가 없습니다. (items는 1개 이상 필요)");
        }

        return outfitApi.saveToday(payload);
    },
};