package com.team.backend.api.dto.outfit;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class OutfitFeedbackRequestDto {
	private String recommendationId;
    /**
     * -1/0/1 정책 그대로
     */
    @NotNull
    private Integer rating;
}