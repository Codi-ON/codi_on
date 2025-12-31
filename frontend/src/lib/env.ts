function toBool(v: unknown, fallback = false) {
  if (v === undefined || v === null) return fallback;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export const env = {

  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "",
  useMock: toBool(import.meta.env.VITE_USE_MOCK, false),


  proxyTarget: (import.meta.env.VITE_PROXY_TARGET as string | undefined) ?? "http://localhost:8080",
};