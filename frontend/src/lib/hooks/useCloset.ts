// src/lib/hooks/useCloset.ts
import { useCallback, useEffect, useState } from "react";
import { closetRepo } from "@/lib/repo/closetRepo";
import { getUserMessage } from "@/lib/errors";
import type { ClothingItem } from "@/shared/domain/clothing";

export function useClothes(limit = 100) {
    const [items, setItems] = useState<ClothingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await closetRepo.getClothes({ limit });
            setItems(Array.isArray(list) ? list : []);
        } catch (e) {
            setItems([]);
            setError(getUserMessage(e));
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const toggleFavorite = useCallback(
        async (clothingId: number) => {
            const current = items.find((x) => x.clothingId === clothingId);
            if (!current) return;

            const next = !current.favorited;
            setItems((prev) => prev.map((x) => (x.clothingId === clothingId ? { ...x, favorited: next } : x)));

            try {
                await closetRepo.toggleFavorite(clothingId, next);
            } catch (e) {
                setItems((prev) => prev.map((x) => (x.clothingId === clothingId ? { ...x, favorited: !next } : x)));
                setError(getUserMessage(e));
            }
        },
        [items]
    );

    return { items, loading, error, refresh, toggleFavorite };
}