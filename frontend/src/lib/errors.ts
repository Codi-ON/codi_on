// src/lib/errors.ts
import { HttpError } from "@/lib/http";

export function toErrorMessage(err: unknown): string {
    if (err instanceof HttpError) {
        const body: any = err.body;

        if (body && typeof body === "object" && typeof body.message === "string") {
            return body.message;
        }

        return err.message || "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }

    if (err instanceof TypeError) {
        return "네트워크 상태를 확인해 주세요.";
    }

    return err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
}

/**
 * ✅ 레거시 호환: favoritesSlice.ts 등이 아직 이 이름을 import 중
 * - 앞으로는 toErrorMessage만 쓰고, 기존 코드는 천천히 갈아엎기
 */
export const getUserMessage = toErrorMessage;