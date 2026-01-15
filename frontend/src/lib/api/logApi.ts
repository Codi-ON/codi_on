// src/lib/api/logApi.ts
import { sessionApi } from "@/lib/http";

export type ItemClickEventType = "ITEM_CLICKED" | "RECO_SHOWN";

export type ItemClickLogRequest = {
    sessionKey: string;              // ✅ 필수 (@NotBlank)
    eventType: ItemClickEventType;   // ✅ 필수 (@NotBlank)
    clothingItemId: number;          // ✅ 필수 (@NotNull)
    payload?: Record<string, any>;   // optional
    recommendationId?: number | null;
    recommendationUuid?: string | null;
};

export const logApi = {
    postClick(body: ItemClickLogRequest) {
        return sessionApi.post("/api/logs/click", body);
    },
} as const;