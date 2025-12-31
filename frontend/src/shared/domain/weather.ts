// src/shared/domain/weather.ts
export type Sky = "CLEAR" | "CLOUDS" | "RAIN" | "SNOW";

export type WeeklyForecastItem = {
    date: string;
    dayLabel: string;
    icon: string;
    min: number;
    max: number;
    pop: number;       // precipitationProbability (0~100)
    sky: Sky;
};

export type WeatherData = {
    region: string;

    date: string;
    temp: number;
    feelsLike: number;
    minTemp: number;
    maxTemp: number;
    humidity: number;
    windSpeed: number;
    precipitationProbability: number;
    sky: Sky;

    condition: string;
    description: string;
    signals: string[];

    weekly: WeeklyForecastItem[];
};

export const skyLabelKo = (sky?: string) => {
    switch (sky) {
        case "CLEAR":
            return "맑음";
        case "CLOUDS":
            return "흐림";
        case "RAIN":
            return "비";
        case "SNOW":
            return "눈";
        default:
            return sky ?? "—";
    }
};

export const skyEmoji = (sky?: string) => {
    switch (sky) {
        case "CLEAR":
            return "☀️";
        case "CLOUDS":
            return "☁️";
        case "RAIN":
            return "🌧️";
        case "SNOW":
            return "❄️";
        default:
            return "—";
    }
};

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const addDaysISO = (baseISO: string, offset: number) => {
    const d = new Date(baseISO);
    d.setDate(d.getDate() + offset);
    return toISODate(d);
};

const dayLabelFromISO = (iso: string) => {
    const todayISO = toISODate(new Date());
    const diff =
        Math.floor(
            (new Date(iso).getTime() - new Date(todayISO).getTime()) / (1000 * 60 * 60 * 24)
        );

    if (diff === 0) return "오늘";
    if (diff === 1) return "내일";

    const day = new Date(iso).getDay(); // 0..6
    const map = ["일", "월", "화", "수", "목", "금", "토"];
    return map[day] ?? "—";
};

const num = (v: unknown, fallback: number) => {
    const n = typeof v === "string" ? Number(v) : (v as number);
    return Number.isFinite(n) ? n : fallback;
};

const getMinMax = (d: any) => {
    const min = d?.min ?? d?.minTemperature ?? d?.minTemp ?? d?.min_temperature;
    const max = d?.max ?? d?.maxTemperature ?? d?.maxTemp ?? d?.max_temperature;
    return { min, max };
};

const getPop = (d: any) => {
    return d?.pop ?? d?.precipitationProbability ?? d?.precipProb ?? d?.precip_prob;
};

/**
 * 백 weekly=5일이어도 UI는 7일이 필요함
 * - 없는 날짜는 "마지막 날씨" 값으로 채움(요구사항)
 * - date/dayLabel은 실제 날짜로 늘려줌
 */
export const normalizeWeeklyTo7 = (weather: WeatherData): WeeklyForecastItem[] => {
    const raw = Array.isArray(weather.weekly) ? weather.weekly : [];

    // date 기준 정렬(혹시 뒤섞여 오면 정리)
    const sorted = [...raw].sort((a, b) => String(a.date).localeCompare(String(b.date)));

    // 기준일: weekly 첫날 > weather.date > today
    const baseDate =
        sorted[0]?.date ||
        weather.date ||
        toISODate(new Date());

    // 마지막 값(= fallback 원본)
    const lastSrc = sorted[sorted.length - 1];

    // 원본을 date -> item으로 빠르게 찾기
    const byDate = new Map<string, WeeklyForecastItem>();
    sorted.forEach((d) => byDate.set(String(d.date), d));

    const fallbackSky = (lastSrc?.sky ?? weather.sky) as Sky;

    const fallbackMin = num((lastSrc as any)?.min ?? weather.minTemp, weather.minTemp);
    const fallbackMax = num((lastSrc as any)?.max ?? weather.maxTemp, weather.maxTemp);
    const fallbackPop = num((lastSrc as any)?.pop ?? weather.precipitationProbability, weather.precipitationProbability);

    return Array.from({ length: 7 }, (_, i) => {
        const date = addDaysISO(baseDate, i);
        const found = byDate.get(date);

        if (found) {
            // icon/dayLabel 누락 대비 보정
            return {
                ...found,
                dayLabel: found.dayLabel ?? dayLabelFromISO(found.date),
                icon: found.icon ?? skyEmoji(found.sky),
                min: num(found.min, fallbackMin),
                max: num(found.max, fallbackMax),
                pop: num(found.pop, fallbackPop),
            };
        }

        return {
            date,
            dayLabel: dayLabelFromISO(date),
            sky: fallbackSky,
            icon: skyEmoji(fallbackSky),
            min: fallbackMin,
            max: fallbackMax,
            pop: fallbackPop,
        };
    });
};

export const pickTomorrow = (weekly7: WeeklyForecastItem[]) => weekly7?.[1] ?? null;
export const lastWeekly = (weekly7: WeeklyForecastItem[]) => weekly7?.[weekly7.length - 1] ?? null;