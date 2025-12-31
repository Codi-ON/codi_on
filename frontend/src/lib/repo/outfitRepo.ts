// src/lib/repo/outfitRepo.ts
import { sessionApi } from "@/lib/http";

export const outfitRepo = {
    saveTodayOutfit(clothingIds: number[]) {
        return sessionApi.post<void>("/api/outfits/today", { clothingIds });
    },
};