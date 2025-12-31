// src/shared/api/apiResponse.ts
import type { AxiosResponse } from "axios";

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