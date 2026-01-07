// src/main/java/com/team/backend/api/dto/checklist/ChecklistSubmitRequestDto.java
package com.team.backend.api.dto.checklist;

import com.team.backend.domain.enums.ThicknessLevel;
import com.team.backend.domain.enums.UsageType;
import com.team.backend.domain.enums.feadback.OutfitTempFeedback;
import jakarta.validation.constraints.NotEmpty;
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

    @NotEmpty
    private List<ThicknessLevel> thicknessLevels;

    private String activityLevel;

    @NotNull
    private OutfitTempFeedback yesterdayTempFeedback;

    public Map<String, Object> toPayload() {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("usageType", usageType.name());

        List<String> levels = (thicknessLevels == null ? List.of()
                : thicknessLevels.stream().filter(Objects::nonNull).map(Enum::name).toList());
        p.put("thicknessLevels", levels);

        if (activityLevel != null && !activityLevel.isBlank()) {
            p.put("activityLevel", activityLevel);
        }

        p.put("yesterdayTempFeedback", yesterdayTempFeedback.name());
        p.put("directionScore", yesterdayTempFeedback.toDirectionScore());
        p.put("satisfactionScore", yesterdayTempFeedback.toSatisfactionScore());

        // 호환/진화용
        p.put("schemaVersion", "v1.1");
        return p;
    }
}