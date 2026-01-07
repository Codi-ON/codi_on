package com.team.backend.api.dto.recommendation;

import com.team.backend.domain.enums.feadback.OutfitTempFeedback;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodayRecommendationRequestDto {
    @NotBlank
    private String recommendationId;
    @NotNull
    private OutfitTempFeedback tempFeedback; //
}