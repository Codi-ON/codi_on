// src/main/java/com/team/backend/api/dto/user/UserDashboardResponse.java
package com.team.backend.api.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Setter
@Getter
@AllArgsConstructor
@Builder
public class UserDashboardResponse {

    private final Range range;

    private final Summary summary;

    private final Funnel funnel;

    private final CategoryDonut categoryDonut;

    private final List<TopItem> topClickedItems;

    private final List<TopItem> topFavoritedClickedItems;

    @Getter
    @AllArgsConstructor
    @Builder
    public static class Range {
        private final String from; // YYYY-MM-DD
        private final String to;   // YYYY-MM-DD
    }

    @Getter
    @AllArgsConstructor
    @Builder
    public static class Summary {
        private final long monthlyOutfitCount;
        private final long feedbackCount;
        private final long feedbackRate; // 0~100 (정수)

        private final String mostUsedRecoStrategy; // e.g. "BLEND_RATIO" | "MATERIAL_RATIO" | null
        private final String mostCommonCondition;  // e.g. "Snow" | "Clouds" | null
        private final Double avgTemp;              // nullable
        private final Double avgFeelsLike;         // nullable
    }

    @Getter
    @AllArgsConstructor
    @Builder
    public static class Funnel {
        private final long saved;
        private final long feedback;
    }

    @Getter
    @AllArgsConstructor
    @Builder
    public static class CategoryDonut {
        private final String basis;
        private final long totalClicks;
        private final List<CategoryDonutItem> items;
    }

    @Getter
    @AllArgsConstructor
    @Builder
    public static class CategoryDonutItem {
        private final String category;
        private final long count;
        private final BigDecimal ratio; // 0~1, 소수 4자리
    }

    @Getter
    @AllArgsConstructor
    @Builder
    public static class TopItem {
        private final long clothingId;
        private final String name;
        private final String category;
        private final long count;
        private final String imageUrl; // nullable
    }
}