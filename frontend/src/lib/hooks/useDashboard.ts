// src/hooks/useDashboard.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DashboardOverviewDto, DashboardOverviewUI } from "@/lib/adapters/userDashboardAdapter";
import { userDashboardAdapter } from "@/lib/adapters/userDashboardAdapter";
import { userDashboardApi, type UserDashboardSection } from "@/lib/api/userDashboardApi";

export type DashboardOverviewQuery = {
    year: number;
    month: number;
    section?: UserDashboardSection;
};

export type UseDashboardResult = {
    raw: DashboardOverviewDto | null;
    ui: DashboardOverviewUI | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};

function toUserMessage(e: any) {
    return e?.message || "대시보드 데이터를 불러오지 못했습니다.";
}

/**
 * - userDashboardApi.getOverview()는 "DTO만" 반환 (sessionApi가 unwrap 처리)
 * - 여기서 unwrapApiPayload 같은 거 쓰면 다시 깨짐
 */
export function useDashboardOverview(query: DashboardOverviewQuery): UseDashboardResult {
    const [raw, setRaw] = useState<DashboardOverviewDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);

    const fetchOnce = useCallback(async () => {
        if (!query?.year || !query?.month) return;

        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setLoading(true);
        setError(null);

        try {
            // NOTE: sessionApi는 axios config를 받아 signal도 통과 가능
            const dto = await userDashboardApi.getOverview({
                year: query.year,
                month: query.month,
                ...(query.section ? { section: query.section } : {}),
            });

            setRaw(dto);
        } catch (e: any) {
            if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
            setError(toUserMessage(e));
            setRaw(null);
        } finally {
            setLoading(false);
        }
    }, [query.year, query.month, query.section]);

    useEffect(() => {
        fetchOnce();
        return () => abortRef.current?.abort();
    }, [fetchOnce]);

    const ui = useMemo(() => (raw ? userDashboardAdapter.toOverviewUI(raw) : null), [raw]);

    return { raw, ui, loading, error, refetch: fetchOnce };
}