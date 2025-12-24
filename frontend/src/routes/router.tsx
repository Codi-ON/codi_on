import { createBrowserRouter, Navigate } from "react-router-dom";
import { PATHS } from "./paths";

import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import MainPage from "@/pages/MainPage";
import ClosetPage from "@/pages/ClosetPage";
import HistoryPage from "@/pages/HistoryPage";
import AdminPage from "@/pages/AdminPage";

/**
 * Guest Mode 라우팅 전략
 * - "/"에서 최초 랜딩 → 온보딩/메인으로 분기 가능하게 설계
 * - 나중에 로그인 붙일 때도 "/"만 수정하면 전체 흐름 유지
 */
export const router = createBrowserRouter([
  { path: PATHS.home, element: <HomePage /> },
  { path: PATHS.onboarding, element: <OnboardingPage /> },
  { path: PATHS.main, element: <MainPage /> },
  { path: PATHS.closet, element: <ClosetPage /> },
  { path: PATHS.history, element: <HistoryPage /> },
  { path: PATHS.admin, element: <AdminPage /> },

  // 존재하지 않는 경로는 홈으로
  { path: "*", element: <Navigate to={PATHS.home} replace /> },
]);