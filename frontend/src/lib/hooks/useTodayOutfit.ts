import { useCallback, useEffect, useState } from "react";
import { outfitRepo } from "@/lib/repo/outfitRepo";
import type { TodayOutfit } from "@/shared/domain/outfit";

type Status = "idle" | "loading" | "saving" | "error";

export function useTodayOutfit() {
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);
    const [todayOutfit, setTodayOutfit] = useState<TodayOutfit | null>(null);

    const refresh = useCallback(async () => {
        setStatus("loading");
        setError(null);
        try {
            const data = await outfitRepo.getTodayOutfit();
            setTodayOutfit(data);
            setStatus("idle");
        } catch (e: any) {
            setStatus("error");
            setError(e?.message ?? "Unknown Error");
        }
    }, []);

    const save = useCallback(async (clothingIds: number[]) => {
        if (!clothingIds.length) return;
        setStatus("saving");
        setError(null);
        try {
            const saved = await outfitRepo.saveTodayOutfit(clothingIds);
            setTodayOutfit(saved); // 저장 응답을 정본으로 사용
            setStatus("idle");
        } catch (e: any) {
            setStatus("error");
            setError(e?.message ?? "Unknown Error");
            throw e;
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        todayOutfit,
        isLoading: status === "loading",
        isSaving: status === "saving",
        error,
        refresh,
        save,
    };
}