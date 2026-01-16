// src/shared/domain/checklist.ts

export type UsageType = "INDOOR" | "OUTDOOR" | "BOTH";
export type ThicknessLevel = "THICK" | "NORMAL" | "THIN";
export type YesterdayFeedback = "HOT" | "OK" | "COLD" | "UNKNOWN";

export type ActivityLevel = "STATIC" | "NORMAL" | "HIGH";

/**
 * UI/세션/리덕스에서 쓰는 "선택 3개" 답변 형태
 * - 컴포넌트/세션 저장 포맷
 */
export type ChecklistAnswer = {
    usageType: UsageType;
    thicknessLevel: ThicknessLevel;
    yesterdayFeedback: YesterdayFeedback;
};

/**
 * 백 제출용 Request DTO
 * - /api/checklist/submit POST body
 * - 여기에는 recommendationId 안 들어감 (백에서 새로 생성)
 */
export type ChecklistSubmitRequestDto = {
    usageType: UsageType;
    thicknessLevel: ThicknessLevel;
    activityLevel: ActivityLevel;
    yesterdayFeedback: YesterdayFeedback;
};

/**
 * 프론트에서 체크리스트 한 번 제출할 때 쓰는 DTO
 * - UI + activityLevel + (선택) clientDateISO
 * - "체크리스트 내용" 본체
 */
export type ChecklistSubmitDto = ChecklistAnswer & {
    activityLevel: ActivityLevel;
    clientDateISO?: string;
};

/**
 * 리덕스에서 쓸 상태 타입 (추천 ID 포함)
 * - 여기서는 recommendationId를 "무조건" 들고 있게 강제
 * - fetchRecommendation 등에서 이 타입을 기대하고 recommendationId 사용
 */
export type ChecklistState = ChecklistSubmitDto & {
    recommendationId: string;
};

/**
 * 오늘 체크리스트 상태 조회 응답 DTO
 * - /api/checklist/today GET 응답
 * - 백엔드 ChecklistSubmitResponseDto와 동일 구조
 */
export type ChecklistTodayDto = {
    recommendationId: string;
    date: string;    // YYYY-MM-DD
    created: boolean;
} | null;

/**
 * 체크리스트 제출 응답 DTO
 * - /api/checklist/submit POST 응답
 * - today와 동일한 스펙
 */
export type ChecklistSubmitResponseDto = {
    recommendationId: string;
    date: string;    // YYYY-MM-DD
    created: boolean;
};