// src/lib/api/favoritesApi.ts
import { sessionApi } from "@/lib/http";

export const favoritesApi = {
    async getFavorites(): Promise<number[]> {
        return sessionApi.get<number[]>("/api/favorites");
    },

    async add(clothingId: number): Promise<void> {
        await sessionApi.post<null>(`/api/favorites/${clothingId}`);
    },

    async remove(clothingId: number): Promise<void> {
        await sessionApi.delete<null>(`/api/favorites/${clothingId}`);
    },
};