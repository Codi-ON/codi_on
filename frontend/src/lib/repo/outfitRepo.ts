import { outfitApi, SaveTodayOutfitRequest } from "@/lib/api/outfitApi";

export const outfitRepo = {
    saveTodayOutfit: async (clothingIds: number[]) => {
        const items = clothingIds.map((id, idx) => ({
            clothingId: id,
            sortOrder: idx + 1,
        }));

        const body: SaveTodayOutfitRequest = { items };
        return outfitApi.saveToday(body);
    },
};