const STORAGE_KEY = "codion.sessionKey";

export function getSessionKey(): string | null {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v && v.trim().length > 0 ? v : null;
    } catch {
        return null;
    }
}

export function setSessionKey(key: string): void {
    localStorage.setItem(STORAGE_KEY, key);
}

export function clearSessionKey(): void {
    localStorage.removeItem(STORAGE_KEY);
}

function uuidV4(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return (crypto as any).randomUUID();
    }

    let dt = new Date().getTime();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = ((dt + Math.random() * 16) % 16) | 0;
        dt = Math.floor(dt / 16);
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * 단일 진실(SSOT)
 * - 있으면 그대로 반환
 * - 없으면 UUID v4 생성 → 저장 → 반환
 */
export function ensureSessionKey(): string {
    const existing = getSessionKey();
    if (existing) return existing;

    const key = uuidV4();
    setSessionKey(key);
    return key;
}