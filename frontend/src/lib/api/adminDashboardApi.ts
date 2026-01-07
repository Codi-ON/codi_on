// src/lib/api/adminDashboardApi.ts
import { getUserMessage } from "@/lib/errors";
import type {
    AdminDashboardMonthlyDto,
    AdminDashboardMonthlyQuery,
    AdminDashboardOverviewDto,
    AdminDashboardOverviewQuery,
} from "@/shared/domain/adminDashboard";

const TOPN_DEFAULT = 10;

function normalizeTopN(v: unknown) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return TOPN_DEFAULT;
    return Math.max(1, Math.min(50, Math.floor(n)));
}

function getAdminAuthHeader(): string | undefined {
    const b64 = import.meta.env.VITE_ADMIN_BASIC_B64 as string | undefined;
    if (b64 && b64.trim()) return `Basic ${b64.trim()}`;

    const raw = import.meta.env.VITE_ADMIN_BASIC as string | undefined;
    if (raw && raw.includes(":")) {
        try {
            return `Basic ${btoa(raw)}`;
        } catch {
            return undefined;
        }
    }
    return undefined;
}

async function fetchJson<T>(url: string): Promise<T> {
    const auth = getAdminAuthHeader();

    const res = await fetch(url, {
        method: "GET",
        headers: {
            ...(auth ? { Authorization: auth } : {}),
            Accept: "application/json",
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json && typeof json === "object" && "data" in json) return (json as any).data as T;
    return json as T;
}

async function fetchBlob(url: string): Promise<Blob> {
    const auth = getAdminAuthHeader();

    const res = await fetch(url, {
        method: "GET",
        headers: {
            ...(auth ? { Authorization: auth } : {}),
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
    }

    return await res.blob();
}

export const adminDashboardApi = {
    async getOverview(params: AdminDashboardOverviewQuery): Promise<AdminDashboardOverviewDto> {
        try {
            const sp = new URLSearchParams({
                from: params.from,
                to: params.to,
            });
            sp.set("topN", String(normalizeTopN(params.topN)));

            return await fetchJson<AdminDashboardOverviewDto>(`/api/admin/dashboard/overview?${sp.toString()}`);
        } catch (e) {
            throw new Error(getUserMessage(e));
        }
    },

    async getMonthly(params: AdminDashboardMonthlyQuery): Promise<AdminDashboardMonthlyDto> {
        try {
            const sp = new URLSearchParams({
                fromMonth: params.fromMonth,
                toMonth: params.toMonth,
            });
            sp.set("topN", String(normalizeTopN(params.topN)));

            return await fetchJson<AdminDashboardMonthlyDto>(`/api/admin/dashboard/monthly?${sp.toString()}`);
        } catch (e) {
            throw new Error(getUserMessage(e));
        }
    },

    async downloadMonthlyExcel(params: AdminDashboardMonthlyQuery): Promise<Blob> {
        try {
            const sp = new URLSearchParams({
                fromMonth: params.fromMonth,
                toMonth: params.toMonth,
            });
            sp.set("topN", String(normalizeTopN(params.topN)));

            return await fetchBlob(`/api/admin/dashboard/monthly/excel?${sp.toString()}`);
        } catch (e) {
            throw new Error(getUserMessage(e));
        }
    },
};