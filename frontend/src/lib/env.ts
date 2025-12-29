// frontend/src/lib/env.ts
function toBool(v: unknown, fallback = false) {
  if (v === undefined || v === null) return fallback;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export const env = {
  // 개발에서는 Vite proxy로 /api → 백엔드로 보내므로 빈 문자열이 가장 안전
  // 운영에서 다른 도메인 직접 호출이면 VITE_API_BASE_URL 넣으면 됨
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string) ?? "",

  // mock 모드 토글
  useMock: toBool(import.meta.env.VITE_USE_MOCK, false),
};