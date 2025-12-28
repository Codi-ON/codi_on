export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
  useMock: String(import.meta.env.VITE_USE_MOCK).toLowerCase() === "true",
  devRoutes: String(import.meta.env.VITE_DEV_ROUTES).toLowerCase() === "true",
};