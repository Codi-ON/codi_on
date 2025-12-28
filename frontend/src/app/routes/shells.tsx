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

// Sidebar/메뉴에서 들어오는 key가 프로젝트마다 흔히 달라져서(예: user-history, USER_HISTORY 등)
// 여기서 흡수해주면 “사이드바는 key만 던지고, Shell이 라우팅 책임” 구조가 견고해짐.
const USER_KEY_ALIASES: Record<string, string> = {
  "user-today": "today",
  "user-closet": "closet",
  "user-add-item": "add-item",
  "user-checklist": "checklist",
  "user-reco": "reco",
  "user-recommendation": "reco",
  "user-history": "history",
  "user-calendar": "calendar",
  "user-dashboard": "dashboard",
  "user-mypage": "mypage",
  "user-settings": "settings",
  "user-help": "help",
};

const ADMIN_KEY_ALIASES: Record<string, string> = {
  dashboard: "admin-dashboard",
  "admin-dashboard": "admin-dashboard",
  "admin-users": "admin-users",
  "admin-data": "admin-data",
  "admin-funnel": "admin-funnel",
  "admin-settings": "admin-settings",
};

function pickKeyFromPath(map: Record<string, string>, pathname: string) {
  const entries = Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  const found = entries.find(([, p]) => pathname === p || pathname.startsWith(p + "/"));
  return found?.[0] ?? "";
}

function normalizeKey(raw: string) {
  const key = String(raw ?? "").trim();
  // path를 직접 던지는 구현도 흡수 (/history 같은)
  if (key.startsWith("/")) return key;

  // 대소문자/구분자 흔들림 흡수: USER_HISTORY -> user-history
  return key
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
}

function resolvePath(
  map: Record<string, string>,
  aliases: Record<string, string>,
  rawKey: string
) {
  const k = normalizeKey(rawKey);

  // 1) rawKey가 path면 그대로 이동
  if (k.startsWith("/")) return k;

  // 2) alias 적용
  const aliased = aliases[k] ?? k;

  // 3) 최종 매핑
  return map[aliased];
}

export function UserShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activePage = pickKeyFromPath(USER_KEY_TO_PATH, pathname);

  const onNavigate = (key: string) => {
    const to = resolvePath(USER_KEY_TO_PATH, USER_KEY_ALIASES, key);
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
    const to = resolvePath(ADMIN_KEY_TO_PATH, ADMIN_KEY_ALIASES, key);
    if (to) navigate(to);
  };

  return (
    <AdminLayout activePage={activePage} onNavigate={onNavigate}>
      <Outlet />
    </AdminLayout>
  );
}