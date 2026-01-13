// src/lib/adapters/todayPreviewAdapter.ts
import type { TodayOutfitDto } from "@/lib/api/outfitApi";
import type { ClothesSummaryItemDto } from "@/lib/api/closetApi";
export type TodayWeatherMiniDto = {
    temperature?: number | null;
    feelsLikeTemperature?: number | null;
    sky?: string | null;
};

export type TodayPreviewVM = {
    dateLine: string;
    slotLine: string;
};

function fmtDateKR(iso?: string) {
    if (!iso) return "-";
    return `${iso.slice(0, 4)}.${iso.slice(5, 7)}.${iso.slice(8, 10)}`;
}

function weatherEmoji(sky?: string | null) {
    const c = String(sky ?? "").toLowerCase();
    if (c.includes("rain") || c.includes("drizzle")) return "🌧️";
    if (c.includes("snow")) return "❄️";
    if (c.includes("cloud")) return "☁️";
    if (c.includes("clear")) return "☀️";
    return "🌤️";
}

function feedbackEmoji(score?: number | null) {
    if (score === 1) return "👍";
    if (score === 0) return "😐";
    if (score === -1) return "👎";
    return "—";
}

function roundTemp(v: unknown): string {
    return typeof v === "number" && Number.isFinite(v) ? `${Math.round(v)}°` : "-";
}

/**
 * sortOrder 고정 슬롯 매핑:
 * 1=TOP(👕) / 2=BOTTOM(👖) / 3=OUTER(🧥, optional)
 */
export function buildTodayPreviewVM(params: {
    today: TodayOutfitDto | null;
    weather: TodayWeatherMiniDto | null;
    summary: ClothesSummaryItemDto[];
}): TodayPreviewVM {
    const { today, weather, summary } = params;

    const map = new Map<number, ClothesSummaryItemDto>();
    for (const s of summary ?? []) map.set(s.clothingId, s);

    const items = Array.isArray(today?.items) ? today!.items : [];
    const byOrder = (order: number) => items.find((x) => x?.sortOrder === order)?.clothingId;

    const topId = byOrder(1);
    const bottomId = byOrder(2);
    const outerId = byOrder(3);

    const topName = topId ? map.get(topId)?.name ?? null : null;
    const bottomName = bottomId ? map.get(bottomId)?.name ?? null : null;
    const outerName = outerId ? map.get(outerId)?.name ?? null : null;

    const date = fmtDateKR(today?.date);
    const wEmoji = weatherEmoji(weather?.sky ?? null);
    const t = roundTemp(weather?.temperature);
    const fl = roundTemp(weather?.feelsLikeTemperature);
    const fb = feedbackEmoji(today?.feedbackScore ?? null);

    const dateLine = `${date} • ${wEmoji} ${t} / 체감 ${fl} • 피드백 ${fb}`;

    const slotText = (icon: string, name: string | null, exists: boolean) => {
        if (!exists) return `${icon} 미선택`;
        // 이름이 있어도 화면이 작으면 그냥 "선택완료"가 더 깔끔하면 아래 줄을 바꿔도 됨
        return name && name.trim().length > 0 ? `${icon} ${name}` : `${icon} 선택완료`;
    };

    const slotLine = [
        slotText("👕", topName, !!topId),
        slotText("👖", bottomName, !!bottomId),
        slotText("🧥", outerName, !!outerId),
    ].join("  |  ");

    return { dateLine, slotLine };
}