package com.team.backend.api.dto.outfit;

import com.team.backend.domain.enums.recommendation.RecommendationModelType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

public class OutfitRequestDto {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaveToday {

        /**
         * V1 정책: 3슬롯 고정
         * - sortOrder: 1=TOP, 2=BOTTOM, 3=OUTER(옵션)
         * - items size: 2~3
         */
        @NotNull
        @Valid
        @Size(min = 2, max = 3)
        private List<Item> items;

        /**
         * 추천 모델/전략 (nullable)
         * - BLEND_RATIO | MATERIAL_RATIO | null
         */
        private RecommendationModelType recoStrategy;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Item {
        @NotNull
        private Long clothingId;

        @NotNull
        private Integer sortOrder;
    }
}