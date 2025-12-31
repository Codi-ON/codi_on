// src/lib/api/favoritesApi.ts
import { sessionApi } from "@/lib/http";

export const favoritesApi = {
    getFavorites() {
        return sessionApi.get<number[]>("/api/favorites");
    },
    add(clothingId: number) {
        return sessionApi.post<unknown>(`/api/favorites/${clothingId}`);
    },
    remove(clothingId: number) {
        return sessionApi.delete<unknown>(`/api/favorites/${clothingId}`);
    },
};