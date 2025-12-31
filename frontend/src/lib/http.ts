import axios, {
    AxiosError,
    AxiosHeaders,
    AxiosInstance,
    AxiosRequestConfig,
} from "axios";
import type { ApiResponse } from "@/shared/api/apiResponse";
import {env} from "@/lib/env.ts";
import { ensureSessionKey } from "@/lib/session/sessionKey"
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

type HttpClient = {
    get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
};

const baseURL = env.apiBaseUrl ?? "";

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
    return !!payload && typeof payload === "object" && "success" in (payload as any);
}

function unwrapPayload<T>(payload: unknown, status?: number): T {
    if (isApiResponse<T>(payload)) {
        const p = payload as ApiResponse<T>;
        if (p.success) return p.data as T;
        throw new HttpError(p.message ?? "요청에 실패했습니다.", status, p.code, payload);
    }
    return payload as T;
}

function normalizeAxiosError(err: unknown): never {
    if (axios.isAxiosError(err)) {
        const e = err as AxiosError;
        const status = e.response?.status;
        const body = e.response?.data;

        if (!e.response) throw new HttpError("Network Error", undefined, "NETWORK_ERROR");

        if (body && typeof body === "object") {
            const maybe: any = body;
            if (typeof maybe.message === "string") {
                throw new HttpError(maybe.message, status, maybe.code, body);
            }
        }

        throw new HttpError(e.message || "요청 처리 중 오류가 발생했습니다.", status, undefined, body);
    }
    throw err instanceof Error ? err : new Error("Unknown Error");
}

function createHttpClient(instance: AxiosInstance): HttpClient {
    const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
        try {
            const res = await instance.request(config);
            return unwrapPayload<T>(res.data, res.status);
        } catch (e) {
            normalizeAxiosError(e);
        }
    };

    return {
        get: (url, config) => request({ ...(config ?? {}), url, method: "GET" }),
        post: (url, data, config) => request({ ...(config ?? {}), url, data, method: "POST" }),
        put: (url, data, config) => request({ ...(config ?? {}), url, data, method: "PUT" }),
        patch: (url, data, config) => request({ ...(config ?? {}), url, data, method: "PATCH" }),
        delete: (url, config) => request({ ...(config ?? {}), url, method: "DELETE" }),
    };
}

const publicAxios = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
});

const sessionAxios = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
});

sessionAxios.interceptors.request.use((config) => {
    const key = ensureSessionKey(); // sync string
    const headers = AxiosHeaders.from(config.headers);
    headers.set("X-Session-Key", key);
    config.headers = headers;
    return config;
});

export const publicApi: HttpClient = createHttpClient(publicAxios);
export const sessionApi: HttpClient = createHttpClient(sessionAxios);