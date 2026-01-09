// src/shared/api/apiResponse.ts
import type { AxiosResponse } from "axios";

/**
 * 서버 표준 응답 포맷
 * - 모든 백엔드 API는 이 포맷을 리턴한다고 가정
 */
export type ApiResponse<T> = {
    success: boolean;
    code?: string;
    message?: string;
    data: T;
};

/**
 * AxiosResponse<ApiResponse<T>> -> T 로 unwrap
 * (주의) 이 유틸은 "응답 바디가 ApiResponse 포맷일 때만" 사용
 */
export function unwrapApiResponse<T>(res: AxiosResponse<ApiResponse<T>>): T {
    const body = res.data;

    if (!body || typeof body !== "object") {
        throw new Error("Invalid Response Format");
    }

    if (body.success) return body.data as T;

    throw new Error(body.message ?? "API 실패");
}

/**
 * axios를 거치지 않고도 payload만 unwrap 할 수 있게 제공
 * - sessionApi(lib/http.ts)처럼 res.data만 받는 구조에서 유용
 */
export function unwrapApiPayload<T>(payload: unknown): T {
    if (!payload || typeof payload !== "object") {
        throw new Error("Invalid Response Format");
    }

    const p = payload as ApiResponse<T>;
    if (typeof p.success !== "boolean") {
        throw new Error("Invalid Response Format");
    }

    if (p.success) return p.data as T;

    throw new Error(p.message ?? "API 실패");
}