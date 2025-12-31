import { sessionApi } from "@/lib/http";

export type SaveTodayOutfitItem = { clothingId: number; sortOrder: number };
export type SaveTodayOutfitRequest = { items: SaveTodayOutfitItem[] };

export const outfitApi = {
    saveToday: (body: SaveTodayOutfitRequest) =>
        sessionApi.post("/api/outfits/today", body),

    getToday: () =>
        sessionApi.get("/api/outfits/today"),
};