import { createBrowserRouter, Navigate } from "react-router-dom";
import { USER_PATHS, ADMIN_PATHS } from "./paths";
import TodayRecommendPage from "@/pages/user/TodayRecommendPage";
import AdminHomePage from "@/pages/admin/AdminHomePage";
import ErrorState from "@/shared/ui/ErrorState";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to={USER_PATHS.MAIN} replace /> },

  {
    path: USER_PATHS.MAIN,
    element: <TodayRecommendPage />,
    errorElement: (
      <ErrorState title="페이지 오류" description="라우팅 처리 중 오류가 발생했습니다." />
    ),
  },

  {
    path: ADMIN_PATHS.HOME,
    element: <AdminHomePage />,
    errorElement: (
      <ErrorState title="페이지 오류" description="라우팅 처리 중 오류가 발생했습니다." />
    ),
  },
]);