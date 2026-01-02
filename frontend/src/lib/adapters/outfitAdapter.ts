import type {
    MonthlyHistoryDto,
    MonthlyHistoryDayDto,
    TodayOutfitDto,
    TodayOutfitItemDto,
} from "@/lib/api/outfitApi";
import type { RecommendationItemDto } from "@/lib/api/recoApi";

/** Calendar UI에서 쓰는 “단일 표준 모델” */
export type HistoryEntryUI = {
    id: string;
    dateISO: string; // YYYY-MM-DD
    title: string;
    weatherTemp: number | null;
    weatherIcon: string; // emoji
    feedback: string | null;
    images: string[]; // 최대 3장
};

export type SelectedOutfit = {
    top?: RecommendationItemDto;
    bottom?: RecommendationItemDto;
    outer?: RecommendationItemDto;
};

function normalizeISO(dateLike: unknown): string {
    const s = String(dateLike ?? "").trim();
    // LocalDate.toString() => YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // ISO datetime => 앞 10자리
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    // 최후 fallback(깨지지 않게)
    return "1970-01-01";
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

function imagesFromItems(items?: TodayOutfitItemDto[] | null): string[] {
    const arr = Array.isArray(items) ? items : [];
    return arr
        .map((it) => it?.imageUrl ?? null)
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .slice(0, 3);
}

function titleFromSelected(selected?: SelectedOutfit | null): string {
    const t = selected?.top?.name;
    const b = selected?.bottom?.name;
    const o = selected?.outer?.name;
    const parts = [t, b, o].filter(Boolean);
    return parts.length ? parts.join(" · ") : "오늘의 아웃핏";
}

/** monthly day -> HistoryEntryUI */
function dayToEntry(day: MonthlyHistoryDayDto): HistoryEntryUI {
    const dateISO = normalizeISO(day.date);

    // monthly는 서버가 item.imageUrl 줄 수도/안 줄 수도 있음 -> 없으면 빈 배열
    const images = Array.isArray(day.items)
        ? day.items
            .map((it) => it?.imageUrl ?? null)
            .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
            .slice(0, 3)
        : [];

    return {
        id: `day-${dateISO}`,
        dateISO,
        title: "선택된 옷", // monthly는 상세 title이 없으니 고정(원하면 여기만 바꾸면 됨)
        weatherTemp: typeof day.weatherTemp === "number" ? day.weatherTemp : null,
        weatherIcon: weatherIconFromCondition(day.condition),
        feedback: feedbackLabel(day.feedbackScore),
        images,
    };
}

/** today(저장 직후) -> HistoryEntryUI (recentlySaved 배너/모달용) */
function todayToEntry(today: TodayOutfitDto, selected?: SelectedOutfit | null): HistoryEntryUI {
    const dateISO = normalizeISO(today.date);
    return {
        id: `today-${dateISO}`,
        dateISO,
        title: titleFromSelected(selected),
        weatherTemp: typeof today.weatherTemp === "number" ? today.weatherTemp : null,
        weatherIcon: weatherIconFromCondition(today.condition),
        feedback: feedbackLabel(today.feedbackScore),
        images: imagesFromItems(today.items),
    };
}

export const outfitAdapter = {
    normalizeISO,
    dayToEntry,
    todayToEntry,

    /** monthly dto -> Map<YYYY-MM-DD, entry> */
    monthlyToMap(monthly: MonthlyHistoryDto): Map<string, HistoryEntryUI> {
        const map = new Map<string, HistoryEntryUI>();
        const days = Array.isArray(monthly?.days) ? monthly.days : [];
        for (const d of days) {
            const e = dayToEntry(d);
            map.set(e.dateISO, e);
        }
        return map;
    },

    /** recentlySaved를 monthly map에 “덮어쓰기”로 합치기 */
    mergeRecentlySaved(
        base: Map<string, HistoryEntryUI>,
        today?: TodayOutfitDto | null,
        selected?: SelectedOutfit | null
    ): Map<string, HistoryEntryUI> {
        if (!today) return base;
        const next = new Map(base);
        const e = todayToEntry(today, selected);
        next.set(e.dateISO, e);
        return next;
    },
};