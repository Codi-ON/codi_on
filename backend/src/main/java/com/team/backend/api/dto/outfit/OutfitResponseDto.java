// src/main/java/com/team/backend/api/dto/outfit/OutfitResponseDto.java
package com.team.backend.api.dto.outfit;

import com.team.backend.domain.enums.feadback.FeedbackRating;
import com.team.backend.domain.enums.recommendation.RecommendationModelType;
import com.team.backend.domain.outfit.OutfitHistory;
import com.team.backend.domain.outfit.OutfitHistoryItem;
import lombok.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

public class OutfitResponseDto {

    @Getter
    @Builder
    public static class Today {
        private LocalDate date;
        private List<Item> items;

        private Integer feedbackScore;

        private Double weatherTemp;
        private String condition;
        private Double weatherFeelsLike;
        private Integer weatherCloudAmount;

        private RecommendationModelType recoStrategy;

        public static Today from(OutfitHistory h) {
            List<Item> items = new ArrayList<>();
            if (h.getItems() != null) {
                List<OutfitHistoryItem> sorted = new ArrayList<>(h.getItems());
                sorted.sort(Comparator.comparingInt(OutfitHistoryItem::getSortOrder));
                for (OutfitHistoryItem it : sorted) {
                    items.add(Item.builder()
                            .clothingId(it.getClothingId())
                            .sortOrder(it.getSortOrder())
                            .build());
                }
            }

            Integer score = null;
            FeedbackRating r = h.getFeedbackRating();
            if (r != null) score = r.toScore();

            return Today.builder()
                    .date(h.getOutfitDate())
                    .items(items)
                    .feedbackScore(score)
                    .weatherTemp(h.getWeatherTemp())
                    .condition(h.getWeatherCondition())
                    .weatherFeelsLike(h.getWeatherFeelsLike())
                    .weatherCloudAmount(h.getWeatherCloudAmount())
                    .recoStrategy(h.getRecoStrategy())
                    .build();
        }
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyHistory {
        private int year;
        private int month;

        @Builder.Default
        private List<MonthlyDay> days = new ArrayList<>();

        public static MonthlyHistory of(java.time.YearMonth ym, List<OutfitHistory> rows) {
            List<MonthlyDay> days = new ArrayList<>();
            if (rows != null) {
                for (OutfitHistory h : rows) {
                    days.add(MonthlyDay.of(h));
                }
            }
            return MonthlyHistory.builder()
                    .year(ym.getYear())
                    .month(ym.getMonthValue())
                    .days(days)
                    .build();
        }
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyDay {
        private String date;

        @Builder.Default
        private List<Item> items = new ArrayList<>(); // ✅ List<Item>로 통일

        private Integer feedbackScore;

        private Double weatherTemp;
        private String condition;

        private RecommendationModelType recoStrategy;

        public static MonthlyDay of(OutfitHistory h) {
            Today t = Today.from(h);
            return MonthlyDay.builder()
                    .date(t.getDate().toString())
                    .items(t.getItems())
                    .feedbackScore(t.getFeedbackScore())
                    .weatherTemp(t.getWeatherTemp())
                    .condition(t.getCondition())
                    .recoStrategy(t.getRecoStrategy())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class Item {
        private Long clothingId;
        private int sortOrder;
    }
}