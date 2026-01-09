import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checklistRepo } from "@/lib/repo/checklistRepo";
import type { ChecklistSubmitDto } from "@/shared/domain/checklist";

export function useChecklistToday() {
    return useQuery({
        queryKey: ["checklist", "today"],
        queryFn: () => checklistRepo.getToday(),
    });
}

export function useChecklistSubmit() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: ChecklistSubmitDto) => checklistRepo.submit(payload),
        onSuccess: async () => {

            await qc.invalidateQueries({ queryKey: ["checklist", "today"] });
        },
    });
}