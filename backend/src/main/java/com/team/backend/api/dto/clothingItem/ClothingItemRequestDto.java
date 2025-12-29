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

        // optional (들어오면 정합성 강제)
        @Min(0) @Max(100) private Integer cottonPercentage;
        @Min(0) @Max(100) private Integer polyesterPercentage;
        @Min(0) @Max(100) private Integer etcFiberPercentage;

        private String color;
        private String styleTag;
        private String imageUrl;

        @AssertTrue(message = "suitableMinTemp는 suitableMaxTemp보다 클 수 없습니다.")
        public boolean isTempRangeValid() {
            if (suitableMinTemp == null || suitableMaxTemp == null) return true; // @NotNull이 잡음
            return suitableMinTemp <= suitableMaxTemp;
        }

        @AssertTrue(message = "소재율은 입력 시 3개를 모두 주고, 합이 100이어야 합니다. (cotton+polyester+etc=100)")
        public boolean isMaterialRatioValid() {
            return MaterialRules.isValid(cottonPercentage, polyesterPercentage, etcFiberPercentage, true);
        }
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

        // optional (들어오면 정합성 강제)
        @Min(0) @Max(100) private Integer cottonPercentage;
        @Min(0) @Max(100) private Integer polyesterPercentage;
        @Min(0) @Max(100) private Integer etcFiberPercentage;

        private String color;
        private String styleTag;
        private String imageUrl;

        @AssertTrue(message = "suitableMinTemp는 suitableMaxTemp보다 클 수 없습니다.")
        public boolean isTempRangeValid() {
            // PATCH 특성상 둘 중 하나만 오면 여기서 판단 불가 → true
            if (suitableMinTemp == null || suitableMaxTemp == null) return true;
            return suitableMinTemp <= suitableMaxTemp;
        }

        @AssertTrue(message = "소재율을 수정하려면 3개를 모두 주고, 합이 100이어야 합니다. (cotton+polyester+etc=100)")
        public boolean isMaterialRatioValid() {
            // PATCH에서 소재율을 건드릴 때만 강제(부분 수정 금지)
            return MaterialRules.isValid(cottonPercentage, polyesterPercentage, etcFiberPercentage, false);
        }
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

    // ==============================
    // 내부 룰: 소재율 검증
    // ==============================
    private static final class MaterialRules {
        private MaterialRules() {}

        /**
         * createStrict=true  : Create는 (입력 시) 3개 모두 + 합 100 강제
         * createStrict=false : Update도 (입력 시) 3개 모두 + 합 100 강제 (부분 PATCH 금지)
         */
        static boolean isValid(Integer cotton, Integer poly, Integer etc, boolean createStrict) {
            boolean anyProvided = cotton != null || poly != null || etc != null;
            if (!anyProvided) return true; // 선택사항

            // 하나라도 넣으면 3개를 다 받는 정책(부분 수정/부분 입력 금지)
            if (cotton == null || poly == null || etc == null) return false;

            int sum = cotton + poly + etc;
            return sum == 100;
        }
    }
}