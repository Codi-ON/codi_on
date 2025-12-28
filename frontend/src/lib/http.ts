import { env } from "./env";

export class HttpError extends Error {
  constructor(public status: number, public body?: unknown) {
    super(`HTTP Error: ${status}`);
  }
}

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(path, env.apiBaseUrl);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined) return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(buildUrl(path, options.query), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  const body = text ? safeJson(text) : undefined;

  if (!res.ok) throw new HttpError(res.status, body);
  return body as T;
}

/**
 * ✅ 기존 http<T>(...) 사용하던 코드 호환 유지
 */
export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, options);
}

/**
 * ✅ 앞으로 repo에서 이렇게 쓰려고 추가
 */
http.get = function <T>(path: string, query?: RequestOptions["query"], options: Omit<RequestOptions, "query" | "method"> = {}) {
  return request<T>(path, { ...options, method: "GET", query });
};

http.post = function <T>(path: string, body?: unknown, options: Omit<RequestOptions, "body" | "method"> = {}) {
  return request<T>(path, {
    ...options,
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
};

http.put = function <T>(path: string, body?: unknown, options: Omit<RequestOptions, "body" | "method"> = {}) {
  return request<T>(path, {
    ...options,
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
};

http.delete = function <T>(path: string, body?: unknown, options: Omit<RequestOptions, "body" | "method"> = {}) {
  return request<T>(path, {
    ...options,
    method: "DELETE",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
};