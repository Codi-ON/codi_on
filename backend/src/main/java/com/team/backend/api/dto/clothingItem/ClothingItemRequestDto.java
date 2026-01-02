// src/main/java/com/team/backend/api/dto/clothingItem/ClothingItemRequestDto.java
package com.team.backend.api.dto.clothingItem;

import com.team.backend.domain.enums.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.Set;

public class ClothingItemRequestDto {

    private ClothingItemRequestDto() {}

    // ==============================
    // Create: POST /api/clothes
    // ==============================
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Create {

        @NotNull
        private Long clothingId;

        @NotBlank
        private String name;

        @NotNull
        private ClothingCategory category;

        @NotNull
        private ThicknessLevel thicknessLevel;

        @NotNull
        private UsageType usageType;

        @NotEmpty
        private Set<SeasonType> seasons;

        @NotNull
        private Integer suitableMinTemp;

        @NotNull
        private Integer suitableMaxTemp;

        // optional
        @Min(0) @Max(100) private Integer cottonPercentage;
        @Min(0) @Max(100) private Integer polyesterPercentage;
        @Min(0) @Max(100) private Integer etcFiberPercentage;

        private String color;
        private String styleTag;
        private String imageUrl;
    }

    // ==============================
    // Update: PATCH /api/clothes/{id}
    // ==============================
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Update {

        // null이면 그대로 유지(PATCH)
        private String name;
        private ClothingCategory category;
        private ThicknessLevel thicknessLevel;
        private UsageType usageType;

        // 시즌은 "전체 교체 전략"
        // - null이면 미변경
        // - 값 오면 replaceSeasons()로 통째로 교체
        private Set<SeasonType> seasons;

        private Integer suitableMinTemp;
        private Integer suitableMaxTemp;

        // optional
        @Min(0) @Max(100) private Integer cottonPercentage;
        @Min(0) @Max(100) private Integer polyesterPercentage;
        @Min(0) @Max(100) private Integer etcFiberPercentage;

        private String color;
        private String styleTag;
        private String imageUrl;
    }

    // ==============================
    // Search: GET /api/clothes/search
    // ==============================
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Search {

        private ClothingCategory category;
        private Integer temp;

        // business key 단건 조회용(있으면 검색 대신 단건)
        private Long clothingId;

        // 하나라도 겹치면 통과(OR)
        private Set<SeasonType> seasons;

        // UX 정책: INDOOR/OUTDOOR 선택 시 BOTH 포함해서 조회(서버에서)
        private UsageType usageType;

        private ThicknessLevel thicknessLevel;

        // popular | latest (기본 popular)
        private String sort;

        // 기본 20, 최대 50
        private Integer limit;

        public int resolvedLimit() {
            int v = (limit == null ? 20 : limit);
            if (v < 1) return 1;
            return Math.min(v, 50);
        }

        public String resolvedSort() {
            return (sort == null || sort.isBlank()) ? "popular" : sort;
        }

        // INDOOR/OUTDOOR면 BOTH 포함해서 조회
        public Set<UsageType> resolvedUsageTypes() {
            if (usageType == null) return null;
            if (usageType == UsageType.BOTH) return Set.of(UsageType.BOTH);
            return Set.of(usageType, UsageType.BOTH);
        }

        public SearchCondition toCondition() {
            return SearchCondition.builder()
                    .category(category)
                    .temp(temp)
                    .clothingId(clothingId)
                    .seasons(seasons)
                    .usageTypes(resolvedUsageTypes())
                    .thicknessLevel(thicknessLevel)
                    .sort(resolvedSort())
                    .limit(resolvedLimit())
                    .build();
        }
    }

    // ==============================
    // Repository 전용 Condition
    // ==============================
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SearchCondition {
        private ClothingCategory category;
        private Integer temp;
        private Long clothingId;
        private Set<SeasonType> seasons;
        private Set<UsageType> usageTypes;
        private ThicknessLevel thicknessLevel;
        private String sort;
        private Integer limit;
    }
}