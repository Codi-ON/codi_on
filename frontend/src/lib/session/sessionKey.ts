// src/lib/session/sessionKey.ts
import.meta.env.VITE_SESSION_KEY
const STORAGE_KEY = "codion.sessionKey";

function getEnvSessionKey(): string | null {
    const v = import.meta.env.VITE_SESSION_KEY;
    if (!v) return null;
    const trimmed = String(v).trim();
    return trimmed.length > 0 ? trimmed : null;
}

// UUID v4 only (버전 4 + variant 8/9/a/b)
export function isUuidV4(v: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export function getSessionKey(): string | null {
    const envKey = getEnvSessionKey();
    if (envKey) return envKey;

    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v && v.trim().length > 0 ? v.trim() : null;
    } catch {
        return null;
    }
}

export function setSessionKey(key: string): void {
    try {
        localStorage.setItem(STORAGE_KEY, key);
    } catch {}
}

export function clearSessionKey(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {}
}

function uuidV4(): string {
    // crypto.randomUUID()가 있으면 그게 제일 안전
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return (crypto as any).randomUUID();
    }

    // fallback: RFC4122 v4 포맷 맞춤
    let dt = new Date().getTime();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = ((dt + Math.random() * 16) % 16) | 0;
        dt = Math.floor(dt / 16);
        const v = c === "x" ? r : (r & 0x3) | 0x8; // variant 8/9/a/b
        return v.toString(16);
    });
}

export function ensureSessionKey(): string {
    // 1) envKey 우선 + 검증
    const envKey = getEnvSessionKey();
    if (envKey) {
        if (!isUuidV4(envKey)) {
            // envKey가 잘못이면 백이 무조건 400/500 내므로, 여기서 막아야 함
            throw new Error("VITE_SESSION_KEY is not a valid UUID v4.");
        }
        setSessionKey(envKey);
        return envKey;
    }

    // 2) localStorage key 검증
    const existing = getSessionKey();
    if (existing && isUuidV4(existing)) return existing;

    // 3) 불량키면 제거 후 재발급
    if (existing && !isUuidV4(existing)) {
        clearSessionKey();
    }

    const key = uuidV4();
    setSessionKey(key);
    return key;
}