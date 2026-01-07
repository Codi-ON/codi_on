// src/shared/api/apiResponse.ts
import axios, { AxiosResponse } from "axios";

// 1. API Client 설정
export const apiClient = axios.create({
    baseURL: "", // vite.config.ts의 proxy가 /api를 처리하므로 비워둠
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Request Failed:", error);
        return Promise.reject(error);
    }
);

// 2. API Response 타입 및 유틸
export type ApiResponse<T> = {
    success: boolean;
    code: string;
    message: string;
    data: T;
};

function isAxiosResponse<T>(v: unknown): v is AxiosResponse<T> {
    return (
        typeof v === "object" &&
        v !== null &&
        "data" in v &&
        "status" in v &&
        "headers" in v &&
        "config" in v
    );
}

export function unwrapApiResponse<T>(
    res: AxiosResponse<ApiResponse<T>> | ApiResponse<T>
): T {
    const body: ApiResponse<T> = isAxiosResponse<ApiResponse<T>>(res) ? res.data : res;

    if (!body.success) {
        throw new Error(body.message ?? "API 실패");
    }

    return body.data;
}