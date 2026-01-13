export let YesterdayTempFeedback;
// src/shared/domain/checklist.ts

export type UsageType = "INDOOR" | "OUTDOOR" | "BOTH";
export type ThicknessLevel = "THICK" | "NORMAL" | "THIN";
export type YesterdayFeedback = "HOT" | "OK" | "COLD" | "UNKNOWN";

export type ActivityLevel = "STATIC" | "NORMAL" | "HIGH";

/**
 * UI/세션/리덕스에서 쓰는 "선택 3개" 답변 형태
 * - 이건 네 말대로 존재해야 함. (컴포넌트/세션 저장 포맷)
 */
export type ChecklistAnswer = {
    usageType: UsageType;
    thicknessLevel: ThicknessLevel;     // UI 2번에서 선택한 값(단수)
    yesterdayFeedback: YesterdayFeedback;
};

/**
 * 백 제출용 Request DTO (Swagger 기준)
 * - 중요: 키 이름이 UI와 다름 (yesterdayTempFeedback)
 * - 중요: clientDateISO 제거 (백에 없으면 보내지 말 것)
 */
export type ChecklistSubmitRequestDto = {
    usageType: UsageType;
    thicknessLevel: ThicknessLevel;
    activityLevel: ActivityLevel;
    yesterdayTempFeedback: YesterdayFeedback;
};

/**
 * 앱 내부에서 "제출 후"에도 유지하고 싶으면(추천 페이지 등)
 * - UI Answer + 백 Request를 모두 커버하는 형태로 별도 타입 유지
 * - 굳이 필요없으면 삭제해도 됨.
 */
export type ChecklistSubmitDto = ChecklistAnswer & {
    activityLevel: ActivityLevel;
    clientDateISO?: string;
    yesterdayTempFeedback: YesterdayFeedback;

};

export type ChecklistTodayDto = {
    recommendationId: string;
    date: string; // YYYY-MM-DD
    created: boolean;
} | null;

export type ChecklistSubmitResponseDto = {
    recommendationId: string;
    date: string; // YYYY-MM-DD
    created: boolean;
};


