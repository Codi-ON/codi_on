// src/shared/api/checklistApi.ts
import { sessionApi } from "@/lib/http";
import type {
    ChecklistSubmitDto,
    ChecklistTodayDto,
    ChecklistSubmitResponseDto,
} from "@/shared/domain/checklist";

export const checklistApi = {
    async getToday(): Promise<ChecklistTodayDto | null> {
        return sessionApi.get<ChecklistTodayDto | null>("/api/checklist/today");
    },

    async submit(body: ChecklistSubmitDto): Promise<ChecklistSubmitResponseDto> {
        return sessionApi.post<ChecklistSubmitResponseDto>("/api/checklist/submit", body);
    },
};