// src/lib/repo/checklistRepo.ts
import type {
    ChecklistSubmitRequestDto,
    ChecklistTodayDto,
    ChecklistSubmitResponseDto,
} from "@/shared/domain/checklist";
import { checklistApi } from "@/lib/api/checklistApi.ts";

export const checklistRepo = {
    getToday(): Promise<ChecklistTodayDto | null> {
        return checklistApi.getToday();
    },

    submit(payload: ChecklistSubmitRequestDto): Promise<ChecklistSubmitResponseDto> {
        return checklistApi.submit(payload);
    },
};