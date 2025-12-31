// src/lib/repo/closetRepo.ts
import { clothesApi, type GetClothesParams } from "@/lib/api/closetApi";
import { clothesAdapter } from "@/lib/adapters/closetAdapter";
import { favoritesApi } from "@/lib/api/favoritesApi";
import type { ClothingItem } from "@/shared/domain/clothing";

export const closetRepo = {
  async getClothes(params: GetClothesParams = {}): Promise<ClothingItem[]> {
    const dtos = await clothesApi.getClothes(params);
    return clothesAdapter.toUiList(dtos ?? []);
  },

  async toggleFavorite(clothingId: number, next: boolean): Promise<void> {
    if (next) await favoritesApi.add(clothingId);
    else await favoritesApi.remove(clothingId);
  },
};