// src/pages/admin/AdminLayout.tsx
import React, { useMemo, useState } from "react";
import { Badge, cn } from "../DesignSystem";

interface AdminLayoutProps {
    children: React.ReactNode;
    activePage?: string;
    onNavigate?: (page: string) => void;
}

type NavId = "admin-dashboard" | "admin-data";

type NavItem = {
    id: NavId;
    label: string;
    desc: string;
    icon: React.ReactNode;
};

const IconDashboard = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
            d="M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-9h7V4h-7v7Z"
            fill="currentColor"
        />
    </svg>
);

const IconReport = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
            d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1v5h5"
            fill="currentColor"
        />
        <path d="M7 13h10v2H7v-2Zm0 4h10v2H7v-2Zm0-8h6v2H7V9Z" fill="currentColor" />
    </svg>
);

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activePage, onNavigate }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const navItems: NavItem[] = useMemo(
        () => [
            { id: "admin-dashboard", label: "대시보드", desc: "KPI/트렌드/TopN", icon: <IconDashboard /> },
            { id: "admin-data", label: "데이터 리포트", desc: "월별 추이/엑셀", icon: <IconReport /> },
        ],
        []
    );

    // activePage가 이상한 값이면 기본 라벨로
    const activeLabel = navItems.find((x) => x.id === (activePage as NavId))?.label ?? "관리자";

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-80",
                    "bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white",
                    "border-r border-white/5",
                    "transition-transform duration-300",
                    "md:translate-x-0 md:static",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Brand */}
                <div className="px-7 pt-7 pb-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/95 flex items-center justify-center font-black tracking-tight">
                                CO
                            </div>
                            <div className="leading-tight">
                                <div className="text-base font-extrabold">CodiON</div>
                                <div className="text-xs text-slate-300 font-semibold">관리자 콘솔</div>
                            </div>
                        </div>
                        <Badge variant="success">운영</Badge>
                    </div>
                </div>

                {/* Nav */}
                <div className="px-4">
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = (activePage as NavId) === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        onNavigate?.(item.id);
                                        setSidebarOpen(false);
                                    }}
                                    className={cn(
                                        "group w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left",
                                        "transition-colors",
                                        isActive ? "bg-white/10 border border-white/10" : "hover:bg-white/5"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            isActive ? "bg-orange-500 text-white" : "bg-white/5 text-slate-200"
                                        )}
                                    >
                                        {item.icon}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className={cn("text-sm font-extrabold", isActive ? "text-white" : "text-slate-100")}>
                                                {item.label}
                                            </div>
                                            <div
                                                className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    isActive ? "bg-orange-400" : "bg-transparent group-hover:bg-white/20"
                                                )}
                                            />
                                        </div>
                                        <div className={cn("text-xs mt-0.5", isActive ? "text-slate-200" : "text-slate-400")}>
                                            {item.desc}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer */}
                <div className="mt-auto px-7 py-6">
                    <div className="text-xs text-slate-400">Logs 기반 KPI/월별 리포트</div>
                </div>
            </aside>

            {/* Backdrop (mobile) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main */}
            <main className="flex-1 min-w-0">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
                    <div className="h-16 px-6 md:px-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="md:hidden w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600"
                                onClick={() => setSidebarOpen((v) => !v)}
                                aria-label="사이드바 열기/닫기"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>

                            <div className="leading-tight">
                                <div className="text-sm text-slate-500 font-semibold">Admin</div>
                                <div className="text-lg font-extrabold text-slate-900">{activeLabel}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            시스템 정상
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="p-6 md:p-8 max-w-screen-2xl mx-auto w-full">{children}</div>
            </main>
        </div>
    );
};