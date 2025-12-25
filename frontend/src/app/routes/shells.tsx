import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { UserLayout } from "@/shared/ui/layouts/UserLayout";
import { AdminLayout } from "@/app/layouts/AdminLayout";

const USER_KEY_TO_PATH: Record<string, string> = {
  today: "/today",
  closet: "/closet",
  "add-item": "/closet/new",
  checklist: "/checklist",
  reco: "/recommendation",
  history: "/history",
  calendar: "/calendar",
  dashboard: "/dashboard",
  mypage: "/mypage",
  settings: "/settings",
  help: "/help",
};

const ADMIN_KEY_TO_PATH: Record<string, string> = {
  "admin-dashboard": "/admin",
  "admin-users": "/admin/users",
  "admin-data": "/admin/data",
  "admin-funnel": "/admin/funnel",
  "admin-settings": "/admin/settings",
};

function pickKeyFromPath(map: Record<string, string>, pathname: string) {
  const entries = Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  const found = entries.find(([, p]) => pathname === p || pathname.startsWith(p + "/"));
  return found?.[0] ?? "";
}

export function UserShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activePage = pickKeyFromPath(USER_KEY_TO_PATH, pathname);
  const onNavigate = (key: string) => {
    const to = USER_KEY_TO_PATH[key];
    if (to) navigate(to);
  };

  return (
    <UserLayout activePage={activePage} onNavigate={onNavigate}>
      <Outlet />
    </UserLayout>
  );
}

export function AdminShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activePage = pickKeyFromPath(ADMIN_KEY_TO_PATH, pathname);
  const onNavigate = (key: string) => {
    const to = ADMIN_KEY_TO_PATH[key];
    if (to) navigate(to);
  };

  return (
    <AdminLayout activePage={activePage} onNavigate={onNavigate}>
      <Outlet />
    </AdminLayout>
  );
}