package com.team.backend.api.dto.outfit;

import com.team.backend.domain.enums.feadback.FeedbackRating;
import com.team.backend.domain.outfit.OutfitHistory;
import com.team.backend.domain.outfit.OutfitHistoryItem;
import lombok.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class OutfitResponseDto {

    // =========================
    // Today (저장/조회 공통)
    // =========================
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Today {
        private String date;
        private List<Item> items;
        private Integer feedbackScore;

        // ✅ weather snapshot (outfit_history 기준)
        private Double weatherTemp;
        private String condition;
        private Double weatherFeelsLike;
        private Integer weatherCloudAmount;

        public static Today from(OutfitHistory history) {
            List<OutfitHistoryItem> src = new ArrayList<>(history.getItems());
            src.sort(Comparator.comparing(OutfitHistoryItem::getSortOrder));

            List<Item> items = new ArrayList<>(src.size());
            for (OutfitHistoryItem it : src) {
                items.add(Item.builder()
                        .clothingId(it.getClothingId())
                        .sortOrder(it.getSortOrder())
                        .build());
            }

            FeedbackRating fr = history.getFeedbackRating();
            Integer score = (fr == null) ? null : fr.toScore();

            return Today.builder()
                    .date(history.getOutfitDate().toString())
                    .items(items)
                    .feedbackScore(score)
                    .weatherTemp(history.getWeatherTemp())
                    .condition(history.getWeatherCondition())
                    .weatherFeelsLike(history.getWeatherFeelsLike())
                    .weatherCloudAmount(history.getWeatherCloudAmount())
                    .build();
        }

        @Getter
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class Item {
            private Long clothingId;
            private Integer sortOrder;
        }
    }

    // =========================
    // Monthly History (캘린더용)
    // =========================
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyHistory {
        private int year;
        private int month;
        private List<MonthlyDay> days;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyDay {
        private String date;
        private List<MonthlyItem> items;
        private Integer feedbackScore;

        // ✅ weather snapshot
        private Double weatherTemp;
        private String condition;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyItem {
        private Long clothingId;
        private Integer sortOrder;
        private String imageUrl;
    }
}