// src/lib/repo/checklistRepo.ts
import { sessionApi } from "@/lib/http";
import type {
    ChecklistSubmitDto,
    ChecklistSubmitRequestDto,
    ChecklistSubmitResponseDto,
    ChecklistTodayDto,
    ChecklistState,
} from "@/shared/domain/checklist";

export const checklistRepo = {
    /**
     * 체크리스트 제출
     * POST /api/checklist/submit
     */
    async submit(input: ChecklistSubmitDto): Promise<ChecklistState> {
        const body: ChecklistSubmitRequestDto = {
            usageType: input.usageType,
            thicknessLevel: input.thicknessLevel,
            activityLevel: input.activityLevel,
            // 백엔드 필드명에 맞추기
            yesterdayTempFeedback: input.yesterdayFeedback,
        };

        // sessionApi.post<T>() 는 T(= ChecklistSubmitResponseDto)를 바로 리턴한다고 가정
        const apiData = await sessionApi.post<ChecklistSubmitResponseDto>(
            "/api/checklist/submit",
            body,
        );

        // 리덕스/화면에서 쓸 최종 상태로 변환
        const state: ChecklistState = {
            usageType: input.usageType,
            thicknessLevel: input.thicknessLevel,
            activityLevel: input.activityLevel,
            yesterdayFeedback: input.yesterdayFeedback,
            clientDateISO: apiData.date,
            recommendationId: apiData.recommendationId,
            created: apiData.created,
        };

        return state;
    },

    /**
     * 오늘 체크리스트 조회
     * GET /api/checklist/today
     */
    async getToday(): Promise<ChecklistTodayDto | null> {
        // 없으면 null 내려오는 스펙
        const apiData = await sessionApi.get<ChecklistSubmitResponseDto | null>(
            "/api/checklist/today",
        );

        if (!apiData) return null;

        // 지금은 백에서 usageType 같은 내용은 안 내려주니 임시 값 넣어둠
        const state: ChecklistTodayDto = {
            usageType: "INDOOR",      // TODO: 백 응답 확장되면 교체
            thicknessLevel: "NORMAL", // TODO
            activityLevel: "NORMAL",  // TODO
            yesterdayFeedback: "UNKNOWN",
            clientDateISO: apiData.date,
            recommendationId: apiData.recommendationId,
            created: apiData.created,
        };

        return state;
    },
} as const;