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

type ApiResponse<T> = {
    success: boolean;
    code: string;
    message: string;
    data: T;
};

function isApiResponse(v: unknown): v is ApiResponse<unknown> {
    return !!v && typeof v === "object" && "data" in (v as any) && "success" in (v as any);
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

    const json = (await res.json()) as unknown;

    // 서버가 {success, code, message, data} 래핑이면 data만 언랩
    if (isApiResponse(json)) return (json as ApiResponse<T>).data;

    // 래핑 없이 내려오면 그대로
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
            const sp = new URLSearchParams();
            sp.set("from", params.from);
            sp.set("to", params.to);
            sp.set("topN", String(normalizeTopN(params.topN)));

            return await fetchJson<AdminDashboardOverviewDto>(`/api/admin/dashboard/overview?${sp.toString()}`);
        } catch (e) {
            throw new Error(getUserMessage(e));
        }
    },

    async getMonthly(params: AdminDashboardMonthlyQuery): Promise<AdminDashboardMonthlyDto> {
        try {
            // 서버 계약: fromMonth, toMonth (YYYY-MM)
            const sp = new URLSearchParams();
            sp.set("fromMonth", params.fromMonth);
            sp.set("toMonth", params.toMonth);
            sp.set("topN", String(normalizeTopN(params.topN)));

            return await fetchJson<AdminDashboardMonthlyDto>(`/api/admin/dashboard/monthly?${sp.toString()}`);
        } catch (e) {
            throw new Error(getUserMessage(e));
        }
    },

    async downloadMonthlyExcel(params: AdminDashboardMonthlyQuery): Promise<Blob> {
        try {
            const sp = new URLSearchParams();
            sp.set("fromMonth", params.fromMonth);
            sp.set("toMonth", params.toMonth);
            sp.set("topN", String(normalizeTopN(params.topN)));

            return await fetchBlob(`/api/admin/dashboard/monthly/excel?${sp.toString()}`);
        } catch (e) {
            throw new Error(getUserMessage(e));
        }
    },
} as const;

// ✅ “import adminDashboardApi from ...” 도 되게 해줌 (실수 방지)
export default adminDashboardApi;