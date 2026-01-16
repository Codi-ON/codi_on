// src/lib/session/sessionKey.ts

const STORAGE_KEY = "codion.sessionKey";

// 여기 값만 바꾸면 전체 앱의 세션키가 바뀜
const FIXED_SESSION_KEY = "f817a912-162f-474e-abe2-52dc5236c1a2";

// UUID v4 only (버전 4 + variant 8/9/a/b)
export function isUuidV4(v: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

// env/localStorage에서 읽는 함수들은 형식상만 남겨두고,
// 실제로는 FIXED_SESSION_KEY만 쓰게 만드는 구조로 둔다.
export function getSessionKey(): string | null {
    return FIXED_SESSION_KEY;
}

export function setSessionKey(_: string): void {
    // 호출은 그대로 두되, 굳이 localStorage에 쓸 필요 없으면 비워도 됨.
    try {
        localStorage.setItem(STORAGE_KEY, FIXED_SESSION_KEY);
    } catch {}
}

export function clearSessionKey(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {}
}

/**
 * 어떤 값이 들어와도 최종적으로는 FIXED_SESSION_KEY만 사용
 */
export function ensureSessionKey(): string {
    if (!isUuidV4(FIXED_SESSION_KEY)) {
        throw new Error("FIXED_SESSION_KEY is not a valid UUID v4.");
    }

    // 디버깅 편하게 하려면 localStorage에도 한 번 써 준다.
    setSessionKey(FIXED_SESSION_KEY);
    return FIXED_SESSION_KEY;
}