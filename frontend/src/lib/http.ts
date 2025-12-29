// frontend/src/lib/http.ts
import { env } from "./env";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code?: string,
    public body?: unknown
  ) {
    super(code ? `HTTP ${status} (${code})` : `HTTP ${status}`);
  }
}

type ApiResponse<T> = {
  data?: T;
  code?: string;
  message?: string;
};

type RequestOptions = Omit<RequestInit, "headers" | "body"> & {
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  // path는 "/api/..." 형태로 들어오는 걸 권장
  const base = env.apiBaseUrl || "";
  const url = new URL(path, base || window.location.origin);

  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined) return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function safeRead(res: Response) {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ✅ ApiResponse<T> 언랩: 성공이면 data 반환, 실패면 throw
function unwrapApiResponse<T>(status: number, body: unknown): T {
  const b = body as ApiResponse<T> | undefined;

  // fail 케이스
  if (b && typeof b === "object" && b.code && !("data" in b && b.data !== undefined)) {
    throw new HttpError(status, b.code, body);
  }

  // success 케이스(데이터 필수)
  if (b && typeof b === "object" && "data" in b && b.data !== undefined) {
    return b.data as T;
  }

  // 계약 위반 or 예상치 못한 형태
  throw new HttpError(status, "INVALID_RESPONSE", body);
}

async function request<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, options: RequestOptions = {}) {
  const res = await fetch(buildUrl(path, options.query), {
    method,
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const body = await safeRead(res);

  // HTTP 자체가 실패면: ApiResponse 형태면 unwrap에서 code 잡고, 아니면 그대로 던짐
  if (!res.ok) {
    // ApiResponse.fail 형태일 수도 있으니 unwrap 시도
    try {
      unwrapApiResponse<T>(res.status, body);
      // 위에서 return 안 됨
    } catch (e) {
      if (e instanceof HttpError) throw e;
    }
    throw new HttpError(res.status, "HTTP_ERROR", body);
  }

  return unwrapApiResponse<T>(res.status, body);
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...(options ?? {}), body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...(options ?? {}), body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...(options ?? {}), body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};