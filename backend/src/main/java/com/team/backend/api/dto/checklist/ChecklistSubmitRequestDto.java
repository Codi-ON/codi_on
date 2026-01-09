package com.team.backend.api.dto.checklist;

import com.team.backend.domain.enums.ThicknessLevel;
import com.team.backend.domain.enums.UsageType;
import com.team.backend.domain.enums.feadback.OutfitTempFeedback;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistSubmitRequestDto {

    @NotNull
    private UsageType usageType;

    @NotNull
    private ThicknessLevel thicknessLevel;

    private String activityLevel;

    @NotNull
    private OutfitTempFeedback yesterdayTempFeedback;

    public Map<String, Object> toPayload() {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("usageType", usageType.name());

        p.put("thicknessLevel", thicknessLevel.name());

        if (activityLevel != null && !activityLevel.isBlank()) {
            p.put("activityLevel", activityLevel);
        }

        p.put("yesterdayTempFeedback", yesterdayTempFeedback.name());
        p.put("directionScore", yesterdayTempFeedback.toDirectionScore());
        p.put("satisfactionScore", yesterdayTempFeedback.toSatisfactionScore());

        p.put("schemaVersion", "v2.0");
        return p;
    }
}