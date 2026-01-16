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
 * - userDashboardApi.getOverview()는 "DTO만" 반환(unwrap 처리) 전제
 * - abort(signal) 전달 가능하면 전달하고, 아니면 무시되도록 any로 처리
 */
export function useDashboardOverview(query: DashboardOverviewQuery): UseDashboardResult {
    const [raw, setRaw] = useState<DashboardOverviewDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);

    const fetchOnce = useCallback(async () => {
        if (!query?.year || !query?.month) return;

        // 이전 요청 취소
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setLoading(true);
        setError(null);

        try {
            const params = {
                year: query.year,
                month: query.month,
                ...(query.section ? { section: query.section } : {}),
            };

            /**
             * axios 기반이면 보통 2번째 인자로 config를 받고, fetch 기반이면 무시될 수 있음.
             * 타입 충돌은 any로 흡수.
             */
            const dto = await (userDashboardApi.getOverview as any)(params, { signal: ac.signal });

            // signal로 취소된 뒤 뒤늦게 resolve되는 케이스 방지
            if (ac.signal.aborted) return;

            setRaw(dto as DashboardOverviewDto);
        } catch (e: any) {
            if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
            if (ac.signal.aborted) return;

            setError(toUserMessage(e));
            setRaw(null);
        } finally {
            if (!ac.signal.aborted) setLoading(false);
        }
    }, [query.year, query.month, query.section]);

    useEffect(() => {
        void fetchOnce();
        return () => abortRef.current?.abort();
    }, [fetchOnce]);

    const ui = useMemo(() => (raw ? userDashboardAdapter.toOverviewUI(raw) : null), [raw]);

    return { raw, ui, loading, error, refetch: fetchOnce };
}