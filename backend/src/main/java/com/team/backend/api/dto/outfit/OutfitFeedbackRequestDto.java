package com.team.backend.api.dto.outfit;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutfitFeedbackRequestDto {

    @NotNull
    @Min(-1)
    @Max(1)
    private Integer rating; // -1 / 0 / 1
}