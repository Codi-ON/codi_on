// src/lib/http.ts
import axios, {
    AxiosError,
    AxiosHeaders,
    type AxiosInstance,
    type AxiosRequestConfig,
    type InternalAxiosRequestConfig,
} from "axios";

import type { ApiResponse } from "@/shared/api/apiResponse";
import { env } from "@/lib/env";
import { ensureSessionKey } from "@/lib/session/sessionKey";

/**
 * 최종본 (Vite proxy 기준 안정)
 * - baseURL: env.apiBaseUrl ?? ""  (dev: "" 권장)
 * - publicApi: 세션키 없음
 * - sessionApi: X-Session-Key 자동 주입
 * - 서버 응답은 ApiResponse<T>만 허용 (안전)
 */

export class HttpError extends Error {
    status?: number;
    code?: string;
    body?: unknown;

    constructor(message: string, status?: number, code?: string, body?: unknown) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.code = code;
        this.body = body;
    }
}

export type HttpClient = {
    get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
};

const baseURL = env.apiBaseUrl ?? ""; // dev: ""(vite proxy), prod: "https://api.xxx.com"

// ---------- Response unwrap (ApiResponse 강제) ----------
function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
    if (!payload || typeof payload !== "object") return false;
    return typeof (payload as any).success === "boolean";
}

function unwrapApiResponse<T>(payload: unknown, status?: number): T {
    if (!isApiResponse<T>(payload)) {
        throw new HttpError("Invalid Response Format", status, "INVALID_RESPONSE", payload);
    }

    const p = payload as ApiResponse<T>;
    if (p.success) return p.data as T; // null도 허용

    throw new HttpError(p.message ?? "요청에 실패했습니다.", status, p.code, payload);
}

// ---------- Error normalize ----------
function toHttpError(err: unknown): never {
    if (axios.isAxiosError(err)) {
        const e = err as AxiosError;
        const status = e.response?.status;
        const body = e.response?.data;

        // 서버 응답 자체가 없는 경우
        if (!e.response) {
            throw new HttpError("Network Error", undefined, "NETWORK_ERROR");
        }

        // 서버가 표준 에러 포맷(ApiResponse 형태)을 줄 수도 있으니 message/code 우선 사용
        if (body && typeof body === "object") {
            const b: any = body;
            if (typeof b.message === "string") {
                throw new HttpError(b.message, status, b.code, body);
            }
        }

        throw new HttpError(e.message || "요청 처리 중 오류가 발생했습니다.", status, undefined, body);
    }

    throw err instanceof Error ? err : new Error("Unknown Error");
}

// ---------- Client factory ----------
function createHttpClient(instance: AxiosInstance): HttpClient {
    const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
        try {
            const res = await instance.request(config);
            return unwrapApiResponse<T>(res.data, res.status);
        } catch (e) {
            toHttpError(e);
        }
    };

    return {
        get: <T>(url, config) => request<T>({ ...(config ?? {}), url, method: "GET" }),
        post: <T>(url, data, config) => request<T>({ ...(config ?? {}), url, data, method: "POST" }),
        put: <T>(url, data, config) => request<T>({ ...(config ?? {}), url, data, method: "PUT" }),
        patch: <T>(url, data, config) => request<T>({ ...(config ?? {}), url, data, method: "PATCH" }),
        delete: <T>(url, config) => request<T>({ ...(config ?? {}), url, method: "DELETE" }),
    };
}

// ---------- Axios instances ----------
const publicAxios = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
});

const sessionAxios = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
});

// 세션키는 sessionApi에서만 자동 주입
sessionAxios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const key = ensureSessionKey();

    // Axios v1 안전 처리
    const headers = AxiosHeaders.from(config.headers);
    headers.set("X-Session-Key", key);

    config.headers = headers;
    return config;
});

// ---------- Exports ----------
export const publicApi: HttpClient = createHttpClient(publicAxios);
export const sessionApi: HttpClient = createHttpClient(sessionAxios);