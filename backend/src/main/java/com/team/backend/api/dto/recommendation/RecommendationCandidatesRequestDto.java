package com.team.backend.api.dto.recommendation;

import com.team.backend.domain.enums.UsageType;
import com.team.backend.domain.enums.ThicknessLevel;
import com.team.backend.domain.enums.feadback.OutfitTempFeedback;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RecommendationCandidatesRequestDto {

    @Builder.Default
    private String region = "Seoul";

    @Builder.Default
    private Double lat = 37.5665;

    @Builder.Default
    private Double lon = 126.9780;


    @Min(1) @Max(30)
    @Builder.Default
    private Integer topNPerCategory = 10;


    private String recommendationKey;

    @Valid
    @NotNull
    private ChecklistSubmitDto checklist;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ChecklistSubmitDto {
        @NotNull
        private UsageType usageType;

        @NotNull
        private ThicknessLevel thicknessLevel;

        @NotNull
        private OutfitTempFeedback yesterdayFeedback;

        @NotNull
        private LocalDate clientDateISO;
    }
}