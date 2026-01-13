// src/lib/repo/closetRepo.ts
import { closetApi, type GetClothesParams } from "@/lib/api/closetApi";
import { favoritesApi } from "@/lib/api/favoritesApi";
import { closetAdapter } from "@/lib/adapters/closetAdapter";
import { getSessionKey } from "@/lib/session/sessionKey";
import type { ClothingItem } from "@/shared/domain/clothing";

export const closetRepo = {
  async getClothes(params: GetClothesParams = {}): Promise<ClothingItem[]> {
    // 1) 옷 목록은 세션키 없어도 된다
    const listDto = await closetApi.getClothes(params);
    const items = listDto.map(closetAdapter.toDomain);

    // 2) favorited merge는 "세션키가 있을 때만" 한다
    const sessionKey = getSessionKey();
    if (!sessionKey) return items;

    try {
      const favoriteIds = await favoritesApi.getFavorites();
      const set = new Set<number>(favoriteIds ?? []);
      return items.map((it) => ({ ...it, favorited: set.has(it.clothingId) }));
    } catch {
      return items;
    }
  },

  async toggleFavorite(clothingId: number, next: boolean): Promise<void> {
    const sessionKey = getSessionKey();
    if (!sessionKey) throw new Error("세션키가 없습니다. (즐겨찾기는 세션 필요)");

    if (next) await favoritesApi.add(clothingId);
    else await favoritesApi.remove(clothingId);
  },
};