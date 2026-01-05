// src/main/java/com/team/backend/api/dto/recommendation/RecommendationCandidatesResponseDto.java
package com.team.backend.api.dto.recommendation;

import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.domain.enums.recommendation.RecommendationModelType;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RecommendationCandidatesResponseDto {

    private String recommendationKey; // 요청값 echo

    private List<ModelCandidatesDto> models;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ModelCandidatesDto {
        private RecommendationModelType RecommendationModelType;
        private List<CategoryCandidatesDto> categories;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class CategoryCandidatesDto {
        private ClothingCategory category;
        private List<CandidateDto> candidates; // TopN
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class CandidateDto {
        private Long clothingId;     // business id
        private String name;
        private String color;
        private String imageUrl;

        private Boolean favorited;

        private Double score;        // ML score
        private String analysis;     // ML analysis(optional)
    }
}