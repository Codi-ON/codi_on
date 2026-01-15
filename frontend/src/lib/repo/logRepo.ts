// src/lib/repo/logRepo.ts
import { logApi } from "@/lib/api/logApi";
import { getSessionKey } from "@/lib/session/sessionKey";

const CLICK_DEBOUNCE_MS = 350;
const lastSentAt = new Map<string, number>();

function canSend(key: string) {
    const now = Date.now();
    const prev = lastSentAt.get(key) ?? 0;
    if (now - prev < CLICK_DEBOUNCE_MS) return false;
    lastSentAt.set(key, now);
    return true;
}

export const logRepo = {
    async itemClicked(clothingItemId: number, payload: Record<string, any> = {}) {
        const sessionKey = getSessionKey();
        if (!sessionKey) {
            // 정책 선택지:
            // 1) 조용히 무시(로그는 선택)
            // 2) throw 해서 개발 중 강제
            return;
        }

        const dedupeKey = `ITEM_CLICKED:${clothingItemId}`;
        if (!canSend(dedupeKey)) return;

        await logApi.postClick({
            sessionKey,                 // ✅ Body에 반드시 포함
            eventType: "ITEM_CLICKED",
            clothingItemId,             // ✅ DTO 필드명 정확히
            payload: {
                page: "recommendation",
                ui: "item_card",
                ...payload,
            },
        });
    },
} as const;