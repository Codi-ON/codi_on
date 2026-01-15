// src/lib/adapters/outfitAdapter.ts
import type {
    MonthlyHistoryDto,
    MonthlyHistoryDayDto,
    TodayOutfitDto,
    TodayOutfitItemDto,
    SaveTodayOutfitRequest,
    RecoStrategy as ApiRecoStrategy,
} from "@/lib/api/outfitApi";
import type { RecommendationItemDto } from "@/lib/api/recoApi";

/**
 * 서버 계약상 문자열로 올 수 있음 (검증 후 좁힘)
 * - api 타입을 재사용해서 중복 제거
 */
export type RecoStrategy = ApiRecoStrategy;

/**
 * Calendar UI에서 쓰는 “단일 표준 모델”
 */
export type HistoryEntryUI = {
    id: string;
    dateISO: string; // YYYY-MM-DD
    title: string;

    weatherTemp: number | null;
    condition: string | null;
    weatherIcon: string;

    feedbackScore: number | null; // -1/0/1
    feedbackLabel: string | null;

    recoStrategy: RecoStrategy | null;
    machineIcon: string;

    images: string[]; // 최대 3
};

export type SelectedOutfit = {
    top?: RecommendationItemDto;
    bottom?: RecommendationItemDto;
    outer?: RecommendationItemDto;
};

/** ---------- primitives ---------- */
export function normalizeISO(dateLike: unknown): string {
    const s = String(dateLike ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    return "1970-01-01";
}

function toRecoStrategy(v: unknown): RecoStrategy | null {
    return v === "BLEND_RATIO" || v === "MATERIAL_RATIO" ? (v as RecoStrategy) : null;
}

function weatherIconFromCondition(cond?: string | null): string {
    const c = (cond ?? "").toLowerCase();
    if (c.includes("rain") || c.includes("비")) return "🌧️";
    if (c.includes("snow") || c.includes("눈")) return "❄️";
    if (c.includes("cloud") || c.includes("흐림") || c.includes("구름")) return "☁️";
    if (c.includes("sun") || c.includes("맑")) return "☀️";
    return "🌤️";
}

function feedbackLabel(score?: number | null): string | null {
    if (score === 1) return "좋았어요";
    if (score === 0) return "괜찮았어요";
    if (score === -1) return "별로였어요";
    return null;
}

export function feedbackEmoji(score: -1 | 0 | 1 | null | undefined): string | null {
    if (score === 1) return "👍";
    if (score === 0) return "😐";
    if (score === -1) return "👎";
    return null;
}

function machineIconFromStrategy(strategy?: RecoStrategy | null): string {
    if (strategy === "MATERIAL_RATIO") return "🧵";
    if (strategy === "BLEND_RATIO") return "⚖️";
    return "🤖";
}

function imagesFromItems(items?: TodayOutfitItemDto[] | null): string[] {
    const arr = Array.isArray(items) ? items : [];
    return arr
        .map((it) => it?.imageUrl ?? null)
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .slice(0, 3);
}

function titleFromSelected(selected?: SelectedOutfit | null): string {
    const parts = [selected?.top?.name, selected?.bottom?.name, selected?.outer?.name].filter(Boolean);
    return parts.length ? parts.join(" · ") : "오늘의 아웃핏";
}

function imagesFromAnyItems(items: any[] | undefined | null): string[] {
    const arr = Array.isArray(items) ? items : [];
    return arr
        .map((it) => (it && typeof it === "object" ? (it as any).imageUrl : null))
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .slice(0, 3);
}

/** ---------- transformers ---------- */
function dayToEntry(day: MonthlyHistoryDayDto): HistoryEntryUI {
    const dateISO = normalizeISO(day.date);

    const cond = typeof day.condition === "string" ? day.condition : null;
    const score = typeof day.feedbackScore === "number" ? day.feedbackScore : null;
    const strategy = toRecoStrategy(day.recoStrategy);

    return {
        id: `day-${dateISO}`,
        dateISO,
        title: "선택된 옷",

        weatherTemp: typeof day.weatherTemp === "number" ? day.weatherTemp : null,
        condition: cond,
        weatherIcon: weatherIconFromCondition(cond),

        feedbackScore: score,
        feedbackLabel: feedbackLabel(score),

        recoStrategy: strategy,
        machineIcon: machineIconFromStrategy(strategy),

        images: imagesFromAnyItems((day as any).items),
    };
}

function todayToEntry(
    today: TodayOutfitDto,
    selected?: SelectedOutfit | null,
    overrideStrategy?: RecoStrategy | null
): HistoryEntryUI {
    const dateISO = normalizeISO(today.date);

    const cond = typeof today.condition === "string" ? today.condition : null;
    const score = typeof today.feedbackScore === "number" ? today.feedbackScore : null;
    const strategy = overrideStrategy ?? toRecoStrategy(today.recoStrategy);

    return {
        id: `today-${dateISO}`,
        dateISO,
        title: titleFromSelected(selected),

        weatherTemp: typeof today.weatherTemp === "number" ? today.weatherTemp : null,
        condition: cond,
        weatherIcon: weatherIconFromCondition(cond),

        feedbackScore: score,
        feedbackLabel: feedbackLabel(score),

        recoStrategy: strategy,
        machineIcon: machineIconFromStrategy(strategy),

        images: imagesFromItems(today.items),
    };
}

/** ---------- save payload builder ---------- */
function isNumberArray(v: unknown): v is number[] {
    return Array.isArray(v) && v.every((x) => typeof x === "number" && Number.isFinite(x));
}

function extractIds(input: unknown): number[] {
    if (isNumberArray(input)) return input;

    if (input && typeof input === "object" && "clothingIds" in (input as any)) {
        const arr = (input as any).clothingIds;
        if (isNumberArray(arr)) return arr;
    }

    if (input && typeof input === "object" && "items" in (input as any)) {
        const items = (input as any).items;
        if (Array.isArray(items)) {
            return items
                .map((it) => (it && typeof it === "object" ? (it as any).clothingId : undefined))
                .filter((x): x is number => typeof x === "number" && Number.isFinite(x));
        }
    }

    return [];
}

function uniqNumbers(ids: number[]): number[] {
    const seen = new Set<number>();
    const out: number[] = [];
    for (const id of ids) {
        if (!seen.has(id)) {
            seen.add(id);
            out.push(id);
        }
    }
    return out;
}

/** uuid v4/v1 등 대부분 커버 (대소문자 허용) */
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v: unknown): v is string {
    return typeof v === "string" && UUID_RE.test(v);
}

/**
 * ✅ 저장 시 함께 보낼 메타
 * - SaveTodayOutfitRequest에는 recoStrategy만 정의되어 있어도,
 *   payload는 구조적 타이핑으로 recommendationId(UUID string)까지 확장 가능.
 */
function extractSaveMeta(input: unknown): {
    recoStrategy?: RecoStrategy | null;
    recommendationId?: string | null;
} {
    if (!input || typeof input !== "object") return {};
    const obj = input as any;

    const recoStrategy = "recoStrategy" in obj ? toRecoStrategy(obj.recoStrategy) : undefined;

    // ✅ UUID면 넣고, 아니면 무시(안전)
    const recommendationId =
        "recommendationId" in obj && isUuid(obj.recommendationId) ? obj.recommendationId : undefined;

    return { recoStrategy, recommendationId };
}

export const outfitSaveAdapter = {
    /**
     * ✅ SaveTodayOutfitRequest + (옵션) recommendationId 포함
     */
    toSaveTodayPayload(input: unknown): SaveTodayOutfitRequest {
        const clothingIds = uniqNumbers(extractIds(input));
        const meta = extractSaveMeta(input);

        const payload: any = {
            items: clothingIds.map((clothingId, idx) => ({
                clothingId,
                sortOrder: idx + 1,
            })),
        };

        if (meta.recoStrategy) payload.recoStrategy = meta.recoStrategy;
        if (meta.recommendationId) payload.recommendationId = meta.recommendationId;

        return payload as SaveTodayOutfitRequest;
    },

    // 기존 호출명 호환 alias
    toSaveTodayOutfitRequest(input: unknown): SaveTodayOutfitRequest {
        return this.toSaveTodayPayload(input);
    },
} as const;

/** ---------- public adapter ---------- */
export const outfitAdapter = {
    normalizeISO,
    dayToEntry,
    todayToEntry,

    monthlyToMap(monthly: MonthlyHistoryDto): Map<string, HistoryEntryUI> {
        const map = new Map<string, HistoryEntryUI>();
        const days = Array.isArray(monthly?.days) ? monthly.days : [];
        for (const d of days) {
            const e = dayToEntry(d);
            map.set(e.dateISO, e);
        }
        return map;
    },

    mergeRecentlySaved(
        base: Map<string, HistoryEntryUI>,
        today?: TodayOutfitDto | null,
        selected?: SelectedOutfit | null,
        overrideStrategy?: RecoStrategy | null
    ): Map<string, HistoryEntryUI> {
        if (!today) return base;
        const next = new Map(base);
        const e = todayToEntry(today, selected, overrideStrategy);
        next.set(e.dateISO, e);
        return next;
    },

    applyFeedback(base: Map<string, HistoryEntryUI>, dateISO: string, score: -1 | 0 | 1): Map<string, HistoryEntryUI> {
        const next = new Map(base);
        const prev = next.get(dateISO);
        if (!prev) return next;

        next.set(dateISO, {
            ...prev,
            feedbackScore: score,
            feedbackLabel: feedbackLabel(score),
        });

        return next;
    },
} as const;