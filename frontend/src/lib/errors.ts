// src/lib/errors.ts
import { HttpError } from "@/lib/http";

export function getUserMessage(err: unknown): string {
    if (err instanceof HttpError) {
        const body: any = err.body;

        if (body && typeof body === "object" && typeof body.message === "string") {
            return body.message;
        }

        return "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }

    if (err instanceof TypeError) {
        return "네트워크 상태를 확인해 주세요.";
    }

    return "알 수 없는 오류가 발생했습니다.";
}