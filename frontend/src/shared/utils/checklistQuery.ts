// src/shared/utils/checklistQuery.ts
import type { ChecklistAnswer, UsageType, ThicknessLevel, YesterdayFeedback } from "@/shared/domain/checklist";

const USAGE: readonly UsageType[] = ["INDOOR", "OUTDOOR", "BOTH"] as const;
const THICKNESS: readonly ThicknessLevel[] = ["THICK", "NORMAL", "THIN"] as const;
const FEEDBACK: readonly YesterdayFeedback[] = ["HOT", "OK", "COLD", "UNKNOWN"] as const;

function pickOne<T extends string>(raw: string | null, allowed: readonly T[]): T | undefined {
    if (!raw) return undefined;
    const v = raw.trim().toUpperCase();
    return (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

export function encodeChecklistToQuery(a: ChecklistAnswer): string {
    const sp = new URLSearchParams();
    sp.set("usageType", a.usageType);
    sp.set("thicknessLevel", a.thicknessLevel);
    sp.set("yesterdayFeedback", a.yesterdayFeedback);
    return sp.toString();
}

/**
 * Query -> Partial (유효하지 않으면 undefined로 떨어뜨림)
 * UI에서 isChecklistComplete로 “3개 다 선택” 강제
 */
export function decodeChecklistFromQuery(search: string): Partial<ChecklistAnswer> {
    const sp = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);

    const usageType = pickOne(sp.get("usageType"), USAGE);
    const thicknessLevel = pickOne(sp.get("thicknessLevel"), THICKNESS);
    const yesterdayFeedback = pickOne(sp.get("yesterdayFeedback"), FEEDBACK);

    return { usageType, thicknessLevel, yesterdayFeedback };
}