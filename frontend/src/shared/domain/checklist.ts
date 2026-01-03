// src/shared/domain/checklist.ts (추천: 여기로 고정)
export type UsageType = "INDOOR" | "OUTDOOR" | "BOTH";
export type ThicknessLevel = "THICK" | "NORMAL" | "THIN";
export type YesterdayFeedback = "HOT" | "OK" | "COLD" | "UNKNOWN";

export type ChecklistAnswer = {
    usageType: UsageType;
    thicknessLevel: ThicknessLevel;
    yesterdayFeedback: YesterdayFeedback;
};

export type ChecklistSubmitDto = ChecklistAnswer & {
    clientDateISO?: string;
};