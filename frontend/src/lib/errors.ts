// src/lib/errors.ts
import { HttpError } from "@/lib/http";

export function getUserMessage(err: unknown): string {
  if (err instanceof HttpError) {
    // 백엔드 fail 구조면 code/message를 쓸 수 있음
    const body: any = err.body;

    // ApiResponse.fail 케이스: { code, message }
    if (body && typeof body === "object" && typeof body.message === "string") {
      return body.message;
    }

    // 응답은 왔는데 형태가 이상함(계약 위반)
    if (err.code === "INVALID_RESPONSE") {
      return "서버 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.";
    }

    // 그 외 HttpError
    return "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }

  // fetch 자체 실패(네트워크)
  if (err instanceof TypeError) {
    return "네트워크 상태를 확인해 주세요.";
  }

  return "알 수 없는 오류가 발생했습니다.";
}