// src/main/java/com/team/backend/api/dto/recommendation/TodayOutfitFeedbackRequestDto.java
package com.team.backend.api.dto.recommendation;

import com.team.backend.domain.enums.feadback.OutfitTempFeedback;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodayOutfitFeedbackRequestDto {

    @NotNull
    private UUID recommendationId;

    @NotNull
    private OutfitTempFeedback tempFeedback; // HOT/OK/COLD/UNKNOWN
}