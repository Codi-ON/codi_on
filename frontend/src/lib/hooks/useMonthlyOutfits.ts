// src/lib/hooks/useMonthlyOutfits.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sessionApi } from "@/lib/http";
import { outfitRepo } from "@/lib/repo/outfitRepo";
import type { MonthlyHistoryDayDto, TodayOutfitDto } from "@/lib/api/outfitApi";

/** ===== Clothes Summary DTO (백 예시 기준) ===== */
export type ClothesSummaryItemDto = {
    clothingId: number;
    name: string;
    imageUrl?: string | null;
    category?: string | null; // "TOP" | "BOTTOM" | "OUTER" ...
};

/** ===== Monthly Raw (백 예시 기준) ===== */
type MonthlyOutfitsData = {
    year: number;
    month: number;
    days: MonthlyHistoryDayDto[];
};

/** ===== Wrapped Response (success/data) ===== */
type Wrapped<T> = {
    success: boolean;
    code?: string;
    message?: string;
    data: T;
};

/** ===== Calendar UI가 쓰기 쉬운 Enriched Day ===== */
export type MonthlyOutfitItemUI = {
    clothingId: number;
    sortOrder: number;

    name?: string | null;
    imageUrl?: string | null;
    category?: string | null;

    favorited: boolean;
};

export type MonthlyOutfitDayUI = {
    date: string; // YYYY-MM-DD
    items: MonthlyOutfitItemUI[];

    feedbackScore: number | null;
    weatherTemp: number | null;
    condition: string | null;
    weatherFeelsLike: number | null;
    weatherCloudAmount: number | null;
    recoStrategy: string | null;
};

type Status = (typeof STATUS)[keyof typeof STATUS];
const STATUS = {
    idle: "idle",
    loading: "loading",
    error: "error",
} as const;

function toErrorMessage(e: unknown): string {
    const anyE = e as any;
    return (
        anyE?.response?.data?.message ||
        anyE?.message ||
        (typeof anyE === "string" ? anyE : null) ||
        "Unknown Error"
    );
}

function unwrap<T>(raw: any): T {
    if (raw && typeof raw === "object" && "success" in raw && "data" in raw) {
        return (raw as Wrapped<T>).data;
    }
    return raw as T;
}

function normalizeISO(dateLike: unknown): string {
    const s = String(dateLike ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    return "1970-01-01";
}

function uniqNumbers(arr: number[]): number[] {
    const set = new Set<number>();
    for (const n of arr) if (Number.isFinite(n)) set.add(n);
    return Array.from(set);
}

function buildSummaryMap(summary: ClothesSummaryItemDto[] | null | undefined) {
    const map = new Map<number, ClothesSummaryItemDto>();
    const arr = Array.isArray(summary) ? summary : [];
    for (const s of arr) {
        if (typeof s?.clothingId === "number") map.set(s.clothingId, s);
    }
    return map;
}

/**
 * ✅ 사용 예 (캘린더 페이지)
 * const favoritesIds = useAppSelector(s => s.favorites.ids);
 * const { daysUI, refresh } = useMonthlyOutfits({ year, month, favoritesIds });
 */
export function useMonthlyOutfits(options: {
    year: number;
    month: number; // 1~12
    favoritesIds?: number[];
    /** 저장 직후 네비 state의 recentlySaved를 월 데이터에 덮어쓰기 하고 싶으면 사용 */
    recentlySaved?: TodayOutfitDto | null;
}) {
    const { year, month, favoritesIds = [], recentlySaved = null } = options;

    const [status, setStatus] = useState<Status>(STATUS.idle);
    const [error, setError] = useState<string | null>(null);

    const [raw, setRaw] = useState<MonthlyOutfitsData | null>(null);
    const [daysUI, setDaysUI] = useState<MonthlyOutfitDayUI[]>([]);

    // 경쟁 상태 방지(빠르게 월 이동할 때)
    const reqSeq = useRef(0);

    const favoritesSet = useMemo(() => new Set(favoritesIds), [favoritesIds]);

    const fetchClothesSummary = useCallback(async (ids: number[]): Promise<ClothesSummaryItemDto[]> => {
        // ✅ 백 예시: POST /api/clothes/summary { ids: [...] } -> { success, data: [...] }
        const res = await sessionApi.post<Wrapped<ClothesSummaryItemDto[]>>("/api/clothes/summary", { ids });
        return unwrap<ClothesSummaryItemDto[]>(res);
    }, []);

    const buildUI = useCallback(
        async (monthly: MonthlyOutfitsData): Promise<MonthlyOutfitDayUI[]> => {
            const days = Array.isArray(monthly?.days) ? monthly.days : [];

            // 1) clothingIds 수집
            const allIds = uniqNumbers(
                days.flatMap((d) =>
                    Array.isArray((d as any)?.items)
                        ? (d as any).items
                            .map((it: any) => it?.clothingId)
                            .filter((x: any) => typeof x === "number")
                        : []
                )
            );

            // 2) clothes summary 배치 조회 (1회)
            const summaryArr = allIds.length ? await fetchClothesSummary(allIds) : [];
            const summaryMap = buildSummaryMap(summaryArr);

            // 3) days -> UI merge (summary + favorited)
            const merged: MonthlyOutfitDayUI[] = days.map((d) => {
                const dateISO = normalizeISO((d as any)?.date);

                const itemsRaw = Array.isArray((d as any)?.items) ? (d as any).items : [];
                const itemsMerged: MonthlyOutfitItemUI[] = itemsRaw
                    .filter((it: any) => typeof it?.clothingId === "number")
                    .map((it: any) => {
                        const clothingId = it.clothingId as number;
                        const sortOrder = typeof it?.sortOrder === "number" ? it.sortOrder : 0;
                        const s = summaryMap.get(clothingId);

                        return {
                            clothingId,
                            sortOrder,
                            name: s?.name ?? null,
                            imageUrl: s?.imageUrl ?? null,
                            category: s?.category ?? null,
                            favorited: favoritesSet.has(clothingId),
                        };
                    })
                    // sortOrder는 캘린더 표시 순서의 SoT
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

                return {
                    date: dateISO,
                    items: itemsMerged,

                    feedbackScore: typeof (d as any)?.feedbackScore === "number" ? (d as any).feedbackScore : null,
                    weatherTemp: typeof (d as any)?.weatherTemp === "number" ? (d as any).weatherTemp : null,
                    condition: typeof (d as any)?.condition === "string" ? (d as any).condition : null,
                    weatherFeelsLike: typeof (d as any)?.weatherFeelsLike === "number" ? (d as any).weatherFeelsLike : null,
                    weatherCloudAmount: typeof (d as any)?.weatherCloudAmount === "number" ? (d as any).weatherCloudAmount : null,
                    recoStrategy: typeof (d as any)?.recoStrategy === "string" ? (d as any).recoStrategy : null,
                };
            });

            // 4) 저장 직후 recentlySaved가 있으면 해당 날짜 덮어쓰기(옵션 A)
            if (recentlySaved?.date) {
                const dateISO = normalizeISO(recentlySaved.date);
                const idx = merged.findIndex((x) => x.date === dateISO);

                // recentlySaved에는 items가 clothingId/sortOrder만 있을 수 있으니, summaryMap 재사용해서 최대한 채움
                const rsItemsRaw = Array.isArray((recentlySaved as any)?.items) ? (recentlySaved as any).items : [];
                const rsItems: MonthlyOutfitItemUI[] = rsItemsRaw
                    .filter((it: any) => typeof it?.clothingId === "number")
                    .map((it: any) => {
                        const clothingId = it.clothingId as number;
                        const sortOrder = typeof it?.sortOrder === "number" ? it.sortOrder : 0;
                        const s = summaryMap.get(clothingId);
                        return {
                            clothingId,
                            sortOrder,
                            name: (it as any)?.name ?? s?.name ?? null,
                            imageUrl: (it as any)?.imageUrl ?? s?.imageUrl ?? null,
                            category: (it as any)?.category ?? s?.category ?? null,
                            favorited: favoritesSet.has(clothingId),
                        };
                    })
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

                const patched: MonthlyOutfitDayUI = {
                    date: dateISO,
                    items: rsItems,
                    feedbackScore: typeof (recentlySaved as any)?.feedbackScore === "number" ? (recentlySaved as any).feedbackScore : null,
                    weatherTemp: typeof (recentlySaved as any)?.weatherTemp === "number" ? (recentlySaved as any).weatherTemp : null,
                    condition: typeof (recentlySaved as any)?.condition === "string" ? (recentlySaved as any).condition : null,
                    weatherFeelsLike: typeof (recentlySaved as any)?.weatherFeelsLike === "number" ? (recentlySaved as any).weatherFeelsLike : null,
                    weatherCloudAmount: typeof (recentlySaved as any)?.weatherCloudAmount === "number" ? (recentlySaved as any).weatherCloudAmount : null,
                    recoStrategy: typeof (recentlySaved as any)?.recoStrategy === "string" ? (recentlySaved as any).recoStrategy : null,
                };

                if (idx >= 0) merged[idx] = { ...merged[idx], ...patched };
                else merged.push(patched);
            }

            // 날짜 정렬 (UI 안정성)
            merged.sort((a, b) => a.date.localeCompare(b.date));
            return merged;
        },
        [fetchClothesSummary, favoritesSet, recentlySaved]
    );

    const refresh = useCallback(async () => {
        const seq = ++reqSeq.current;
        setStatus(STATUS.loading);
        setError(null);

        try {
            // ✅ 중요: outfitRepo.getMonthlyOutfits()가 래핑된 응답을 그대로 줄 수 있으니 unwrap
            const rawRes = await outfitRepo.getMonthlyOutfits(year, month);
            const monthly = unwrap<MonthlyOutfitsData>(rawRes);

            // stale 응답 방지
            if (seq !== reqSeq.current) return;

            setRaw(monthly);

            const ui = await buildUI(monthly);
            if (seq !== reqSeq.current) return;

            setDaysUI(ui);
            setStatus(STATUS.idle);
            return ui;
        } catch (e) {
            if (seq !== reqSeq.current) return;
            setStatus(STATUS.error);
            setError(toErrorMessage(e));
            throw e;
        }
    }, [year, month, buildUI]);

    // year/month/favorites 변경 시 재계산
    useEffect(() => {
        refresh();
    }, [refresh]);

    // favoritesIds만 바뀌었을 때도 favorited만 즉시 반영하고 싶으면:
    // - raw가 있으면 buildUI(raw) 다시 돌려도 됨 (API 재호출 X)
    useEffect(() => {
        if (!raw) return;
        let alive = true;

        (async () => {
            try {
                const ui = await buildUI(raw);
                if (!alive) return;
                setDaysUI(ui);
            } catch {
                // favorites 변경으로 실패할 건 거의 없어서 무시
            }
        })();

        return () => {
            alive = false;
        };
    }, [favoritesSet, raw, buildUI]);

    return {
        status,
        error,
        isLoading: status === STATUS.loading,

        year,
        month,

        // raw(monthly)와 UI(daysUI) 둘 다 제공
        rawMonthly: raw,
        daysUI,

        refresh,
    } as const;
}