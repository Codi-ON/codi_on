// src/main/java/com/team/backend/api/dto/recommendation/TodayRecommendationResponseDto.java
package com.team.backend.api.dto.recommendation;

import lombok.*;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodayRecommendationResponseDto {
    private String recommendationId;
    private List<Long> itemIds;
}