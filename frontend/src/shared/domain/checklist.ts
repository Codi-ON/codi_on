// src/shared/domain/checklist.ts

export type UsageType = "INDOOR" | "OUTDOOR" | "BOTH";
export type ThicknessLevel = "THICK" | "NORMAL" | "THIN";
export type YesterdayFeedback = "HOT" | "OK" | "COLD" | "UNKNOWN";
export type ActivityLevel = "STATIC" | "NORMAL" | "HIGH";

/** UI에서 사용하는 기본 답변 3개 */
export type ChecklistAnswer = {
    usageType: UsageType;
    thicknessLevel: ThicknessLevel;
    yesterdayFeedback: YesterdayFeedback;
};

/** 백엔드 POST body용 (recommendationId 없음) */
export type ChecklistSubmitRequestDto = {
    usageType: UsageType;
    thicknessLevel: ThicknessLevel;
    activityLevel: ActivityLevel;
    // 백 스펙: yesterdayTempFeedback
    yesterdayTempFeedback: YesterdayFeedback;
};

/** 프론트에서 들고 다니는 “오늘 체크리스트” 기본 값 */
export type ChecklistSubmitDto = ChecklistAnswer & {
    activityLevel: ActivityLevel;
    clientDateISO?: string;          // “오늘 날짜” (YYYY-MM-DD)
    recommendationId?: string;       // 백에서 생성한 UUID (옵션)
};

/** /api/checklist/submit, /today 의 data payload */
export type ChecklistSubmitResponseDto = {
    recommendationId: string;
    date: string;    // "2026-01-15"
    created: boolean;
};

/** 오늘 체크리스트 전체 상태 (리덕스/화면 공통) */
export type ChecklistTodayDto = ChecklistSubmitDto & {
    recommendationId: string;   // 이제 필수
    created: boolean;
};

/** 리덕스에서 쓰는 상태 타입 alias */
export type ChecklistState = ChecklistTodayDto;