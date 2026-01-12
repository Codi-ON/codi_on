// src/lib/hooks/useTodayOutfit.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { outfitRepo, type OutfitSaveInput } from "@/lib/repo/outfitRepo";
import type { TodayOutfitDto } from "@/lib/api/outfitApi";

type Status = "idle" | "loading" | "saving" | "error";

export type UseTodayOutfitOptions = {
    /**
     * mount 시 자동 조회 여부 (default: true)
     */
    autoFetch?: boolean;

    /**
     * 초기값 주입 (캘린더 navigation state 등으로 받은 recentlySaved를 먼저 보여줄 때)
     */
    initialData?: TodayOutfitDto | null;

    /**
     * 네트워크/서버 오류 발생 시 후킹(선택)
     */
    onError?: (message: string, raw: unknown) => void;
};

/**
 * axios 기반 에러 메시지 추출(우리 sessionApi 기준)
 */
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

/**
 * Today Outfit 전용 훅
 * - 상태: idle/loading/saving/error
 * - 레이스 가드: refresh/save 연속 호출 시 마지막 요청만 반영
 */
export function useTodayOutfit(options: UseTodayOutfitOptions = {}) {
    const { autoFetch = true, initialData = null, onError } = options;

    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);
    const [todayOutfit, setTodayOutfit] = useState<TodayOutfitDto | null>(initialData);

    // 마지막 요청만 UI 반영하도록 가드
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
            const data = await outfitRepo.getTodayOutfit();

            // 레이스 가드: 최신 호출만 반영
            if (reqSeqRef.current !== seq) return data;

            safeSet(() => {
                setTodayOutfit(data);
                setStatus("idle");
            });

            return data;
        } catch (e) {
            const msg = toErrorMessage(e);

            // 레이스 가드
            if (reqSeqRef.current !== seq) throw e;

            safeSet(() => {
                setStatus("error");
                setError(msg);
            });

            onError?.(msg, e);
            throw e;
        }
    }, [onError, safeSet]);

    const save = useCallback(
        async (input: OutfitSaveInput): Promise<TodayOutfitDto> => {
            const seq = ++reqSeqRef.current;

            safeSet(() => {
                setStatus("saving");
                setError(null);
            });

            try {
                const saved = await outfitRepo.saveTodayOutfit(input);

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
        [onError, safeSet]
    );

    /**
     * 캘린더에서 navigation state(recentlySaved 등)로 받은 DTO 주입
     * - 서버 호출 없이 화면만 갱신할 때 사용
     */
    const setLocal = useCallback((dto: TodayOutfitDto | null) => {
        safeSet(() => setTodayOutfit(dto));
    }, [safeSet]);

    const clearError = useCallback(() => {
        safeSet(() => setError(null));
    }, [safeSet]);

    /**
     * 상태 초기화(원하면 사용)
     */
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
        // initialData가 바뀌는 케이스도 반영 (선택)
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
        }),
        [
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
        ]
    );
}