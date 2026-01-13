// src/lib/hooks/useTodayOutfit.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { outfitRepo, type OutfitSaveInput } from "@/lib/repo/outfitRepo";
import type { TodayOutfitDto } from "@/lib/api/outfitApi";

type Status = "idle" | "loading" | "saving" | "error";

export type UseTodayOutfitOptions = {
    autoFetch?: boolean;
    initialData?: TodayOutfitDto | null;
    onError?: (message: string, raw: unknown) => void;

    /**
     * ✅ repo가 sessionKey를 "필수"로 받는 구조라면 여기도 사실상 필수
     */
    sessionKey: string;
};

function toErrorMessage(e: unknown): string {
    const anyE = e as any;
    return (
        anyE?.response?.data?.message ||
        anyE?.response?.data?.error ||
        anyE?.message ||
        (typeof anyE === "string" ? anyE : null) ||
        "Unknown Error"
    );
}

export function useTodayOutfit(options: UseTodayOutfitOptions) {
    const { autoFetch = true, initialData = null, onError, sessionKey } = options;

    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);
    const [todayOutfit, setTodayOutfit] = useState<TodayOutfitDto | null>(initialData);

    const reqSeqRef = useRef(0);
    const mountedRef = useRef(true);

    const isLoading = status === "loading";
    const isSaving = status === "saving";

    const safeSet = useCallback((fn: () => void) => {
        if (!mountedRef.current) return;
        fn();
    }, []);

    const refresh = useCallback(async (): Promise<TodayOutfitDto> => {
        const seq = ++reqSeqRef.current;

        safeSet(() => {
            setStatus("loading");
            setError(null);
        });

        try {
            // ✅ 2번째 인자로 sessionKey 전달
            const data = await outfitRepo.getTodayOutfit(sessionKey);

            if (reqSeqRef.current !== seq) return data;

            safeSet(() => {
                setTodayOutfit(data);
                setStatus("idle");
            });

            return data;
        } catch (e) {
            const msg = toErrorMessage(e);
            if (reqSeqRef.current !== seq) throw e;

            safeSet(() => {
                setStatus("error");
                setError(msg);
            });

            onError?.(msg, e);
            throw e;
        }
    }, [onError, safeSet, sessionKey]);

    const save = useCallback(
        async (input: OutfitSaveInput): Promise<TodayOutfitDto> => {
            const seq = ++reqSeqRef.current;

            safeSet(() => {
                setStatus("saving");
                setError(null);
            });

            try {
                // ✅ 2번째 인자로 sessionKey 전달
                const saved = await outfitRepo.saveTodayOutfit(input, sessionKey);

                if (reqSeqRef.current !== seq) return saved;

                safeSet(() => {
                    setTodayOutfit(saved);
                    setStatus("idle");
                });

                return saved;
            } catch (e) {
                const msg = toErrorMessage(e);
                if (reqSeqRef.current !== seq) throw e;

                safeSet(() => {
                    setStatus("error");
                    setError(msg);
                });

                onError?.(msg, e);
                throw e;
            }
        },
        [onError, safeSet, sessionKey]
    );

    const setLocal = useCallback((dto: TodayOutfitDto | null) => {
        safeSet(() => setTodayOutfit(dto));
    }, [safeSet]);

    const clearError = useCallback(() => {
        safeSet(() => setError(null));
    }, [safeSet]);

    const reset = useCallback(() => {
        safeSet(() => {
            setStatus("idle");
            setError(null);
            setTodayOutfit(initialData ?? null);
        });
    }, [initialData, safeSet]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        safeSet(() => setTodayOutfit(initialData ?? null));
    }, [initialData, safeSet]);

    useEffect(() => {
        if (!autoFetch) return;
        void refresh();
    }, [autoFetch, refresh]);

    return useMemo(
        () => ({
            todayOutfit,
            status,
            error,
            isLoading,
            isSaving,
            refresh,
            save,
            setLocal,
            clearError,
            reset,
            sessionKey,
        }),
        [todayOutfit, status, error, isLoading, isSaving, refresh, save, setLocal, clearError, reset, sessionKey]
    );
}