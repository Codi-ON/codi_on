// src/shared/api/checklistApi.ts
import { sessionApi } from "@/lib/http";
import type {
    ChecklistSubmitRequestDto,
    ChecklistSubmitResponseDto,
} from "@/shared/domain/checklist";

export const checklistApi = {
    async getToday(): Promise<ChecklistSubmitResponseDto | null> {
        const res = await sessionApi.get<{
            success: boolean;
            data: ChecklistSubmitResponseDto | null;
        }>("/api/checklist/today");

        // swagger 응답: { success, code, message, data: {...} }
        return res.data ?? null;
    },

    async submit(body: ChecklistSubmitRequestDto): Promise<ChecklistSubmitResponseDto> {
        const res = await sessionApi.post<{
            success: boolean;
            data: ChecklistSubmitResponseDto;
        }>("/api/checklist/submit", body);

        return res.data; // ChecklistSubmitResponseDto
    },
};