// src/app/routes/router.tsx
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { UserShell, AdminShell } from "@/app/routes/shells";
import RouteErrorState from "@/shared/ui/states/RouteErrorState"; // ✅ 추가

// ✅ 기존 ErrorState 대신 "실제 에러(스택/메시지)"를 화면에 찍는 컴포넌트로 교체
const err = <RouteErrorState />;

export const router = createBrowserRouter([
  // plain(레이아웃 없이) 페이지
  {
    path: "/dev",
    errorElement: err,
    lazy: async () => {
      const m = await import("@/pages/dev/DevRoutesPage");
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