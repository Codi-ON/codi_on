import axios from "axios";
import type { ApiResponse } from "@/shared/api/apiResponse";
import { env } from "@/lib/env";
import { getSessionKey, setSessionKey } from "@/lib/session/sessionKey";

const baseURL = env.apiBaseUrl ?? "";

const sessionIssuer = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
});

export async function ensureSessionKey(): Promise<string> {
    const existing = getSessionKey();
    if (existing) return existing;

    const res = await sessionIssuer.post<ApiResponse<{ sessionKey: string }>>("/api/session");
    const key = res.data?.data?.sessionKey;

    if (!key) throw new Error("세션키 발급 실패: 응답에 sessionKey 없음");

    setSessionKey(key);
    return key;
}