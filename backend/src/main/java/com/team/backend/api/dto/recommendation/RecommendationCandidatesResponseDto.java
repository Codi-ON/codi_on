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

        /**
         * 어떤 모델의 결과인지 (의도/선택)
         * ex) BLEND_RATIO, MATERIAL_RATIO
         */
        private RecommendationModelType modelType;

        private List<CategoryCandidatesDto> categories;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class CategoryCandidatesDto {

        private ClothingCategory category;

        /**
         * AI 호출이 실제로 성공했는지 (실행/결과)
         * - true : AI 응답 기반 정렬/스코어 반영
         * - false: fallback(기본 정렬)로 내려감
         */
        private boolean aiUsed;

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

        private Double score;        // ML score (fallback이면 null 가능)
        private String analysis;     // ML analysis(optional) (fallback이면 "fallback" 등)
    }
}