import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import ErrorState from "@/shared/ui/states/ErrorState";
import { UserShell, AdminShell } from "@/app/routes/shells";

const err = (
  <ErrorState
    title="페이지 오류"
    description="라우팅 처리 중 오류가 발생했습니다."
  />
);

export const router = createBrowserRouter([
  // plain(레이아웃 없이) 페이지
  {
  path: '/dev',
  errorElement: err,
  lazy: async () => {
    const m = await import('@/pages/dev/DevRoutesPage');
    return { Component: m.default };
  },
},

  {
    path: "/",
    errorElement: err,
    lazy: async () => {
      const m = await import("@/pages/landing/LandingPage");
      return { Component: m.default };
    },
  },
  {
    path: "/auth",
    errorElement: err,
    lazy: async () => {
      const m = await import("@/pages/auth/AuthPage");
      return { Component: m.default };
    },
  },

  // UI Kit / Showcase
  {
    path: "/kit",
    errorElement: err,
    lazy: async () => {
      const m = await import("@/pages/kit/ShowcaseHubPage");
      return { Component: m.default };
    },
  },
  {
    path: "/kit/uikit",
    errorElement: err,
    lazy: async () => {
      const m = await import("@/pages/kit/UiKitPage");
      return { Component: m.default };
    },
  },

  // USER 영역 (UserLayout 적용)
  {
    element: <UserShell />,
    errorElement: err,
    children: [
      { path: "/main", element: <Navigate to="/today" replace /> },
      {
        path: "/today",
        lazy: async () => {
          const m = await import("@/pages/user/TodayPage");
          return { Component: m.default };
        },
      },
      {
        path: "/closet",
        lazy: async () => {
          const m = await import("@/pages/user/ClosetPage");
          return { Component: m.default };
        },
      },
      {
        path: "/closet/new",
        lazy: async () => {
          const m = await import("@/pages/user/ClosetAddItemPage");
          return { Component: m.default };
        },
      },
      {
        path: "/closet/item/:id",
        lazy: async () => {
          const m = await import("@/pages/user/ItemDetailPage");
          return { Component: m.default };
        },
      },
      {
        path: "/checklist",
        lazy: async () => {
          const m = await import("@/pages/user/ChecklistPage");
          return { Component: m.default };
        },
      },
      {
        path: "/recommendation",
        lazy: async () => {
          const m = await import("@/pages/user/RecommendationPage");
          return { Component: m.default };
        },
      },
      {
        path: "/history",
        lazy: async () => {
          const m = await import("@/pages/user/HistoryPage");
          return { Component: m.default };
        },
      },
      {
        path: "/calendar",
        lazy: async () => {
          const m = await import("@/pages/user/CalendarPage");
          return { Component: m.default };
        },
      },
      {
        path: "/dashboard",
        lazy: async () => {
          const m = await import("@/pages/user/UserDashboardPage");
          return { Component: m.default };
        },
      },
      {
        path: "/mypage",
        lazy: async () => {
          const m = await import("@/pages/user/MyPage");
          return { Component: m.default };
        },
      },
      {
        path: "/settings",
        lazy: async () => {
          const m = await import("@/pages/user/SettingsPage");
          return { Component: m.default };
        },
      },
      {
        path: "/help",
        lazy: async () => {
          const m = await import("@/pages/user/HelpFaqPage");
          return { Component: m.default };
        },
      },
    ],
  },

  // ADMIN 영역 (AdminLayout 적용)
  {
    path: "/admin",
    element: <AdminShell />,
    errorElement: err,
    children: [
      {
        index: true,
        lazy: async () => {
          const m = await import("@/pages/admin/AdminDashboardPage");
          return { Component: m.default };
        },
      },
      {
        path: "users",
        lazy: async () => {
          const m = await import("@/pages/admin/AdminUsersPage");
          return { Component: m.default };
        },
      },
      {
        path: "data",
        lazy: async () => {
          const m = await import("@/pages/admin/AdminDataPage");
          return { Component: m.default };
        },
      },
      {
        path: "funnel",
        lazy: async () => {
          const m = await import("@/pages/admin/AdminRecoFunnelPage");
          return { Component: m.default };
        },
      },
      {
        path: "settings",
        lazy: async () => {
          const m = await import("@/pages/admin/AdminSettingsPage");
          return { Component: m.default };
        },
      },
    ],
  },
]);