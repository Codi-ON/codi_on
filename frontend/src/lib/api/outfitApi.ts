// src/lib/repo/outfitRepo.ts (or api/outfitApi.ts)
import { sessionApi } from "@/lib/http";

export const outfitRepo = {
    saveTodayOutfit(clothingIds: number[]) {
        return sessionApi.post<void>("/api/outfits/today", { clothingIds });
    },
};