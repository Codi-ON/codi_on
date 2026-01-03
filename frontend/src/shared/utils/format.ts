
export function toNumber(v: unknown): number | null {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
}

export function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

export function round1(n: number) {
    const out = Math.round(n * 10) / 10;
    return Object.is(out, -0) ? 0 : out;
}

export function round0(n: number) {
    const out = Math.round(n);
    return Object.is(out, -0) ? 0 : out;
}

// 소수 1자리 (ex. -7.6°)
export function fmtTemp1(v: unknown): string {
    const n = toNumber(v);
    if (n == null) return "—";
    return `${round1(n).toFixed(1)}°`;
}

export function fmtTempInt(v: unknown): string {
    const n = toNumber(v);
    if (n == null) return "—";
    return `${round0(n)}°`;
}

export function fmtTempIntMin(v: unknown): string {
    const n = toNumber(v);
    if (n == null) return "—";
    const out = Math.floor(n);
    return `${Object.is(out, -0) ? 0 : out}°`;
}

export function fmtTempIntMax(v: unknown): string {
    const n = toNumber(v);
    if (n == null) return "—";
    const out = Math.ceil(n);
    return `${Object.is(out, -0) ? 0 : out}°`;
}

export function fmtPercent(v: unknown): string {
    const n = toNumber(v);
    if (n == null) return "—";
    return `${Math.round(n)}%`;
}

export function fmtWind(v: unknown): string {
    const n = toNumber(v);
    if (n == null) return "—";
    return `${round1(n).toFixed(1)}m/s`;
}