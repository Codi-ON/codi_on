// src/main/java/com/team/backend/api/dto/outfit/OutfitResponseDto.java
package com.team.backend.api.dto.outfit;

import com.team.backend.domain.enums.feadback.FeedbackRating;
import com.team.backend.domain.enums.recommendation.RecommendationModelType;
import com.team.backend.domain.outfit.OutfitHistory;
import com.team.backend.domain.outfit.OutfitHistoryItem;
import lombok.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class OutfitResponseDto {

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Today {
        private LocalDate date;

        @Builder.Default
        private List<Item> items = new ArrayList<>();

        private Integer feedbackScore;

        private Double weatherTemp;
        private String condition;
        private Double weatherFeelsLike;
        private Integer weatherCloudAmount;

        private RecommendationModelType recoStrategy;

        public static Today from(OutfitHistory h) {
            if (h == null) return null;

            List<Item> items = new ArrayList<>();
            if (h.getItems() != null && !h.getItems().isEmpty()) {
                List<OutfitHistoryItem> sorted = new ArrayList<>(h.getItems());
                sorted.sort(Comparator.comparingInt(OutfitHistoryItem::getSortOrder));
                for (OutfitHistoryItem it : sorted) {
                    if (it == null) continue;
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
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyHistory {
        private int year;
        private int month;

        @Builder.Default
        private List<MonthlyDay> days = new ArrayList<>();

        public static MonthlyHistory of(YearMonth ym, List<OutfitHistory> rows) {
            if (ym == null) throw new IllegalArgumentException("ym is required");

            List<MonthlyDay> days = new ArrayList<>();
            if (rows != null && !rows.isEmpty()) {
                for (OutfitHistory h : rows) {
                    MonthlyDay d = MonthlyDay.of(h);
                    if (d != null) days.add(d);
                }
                days.sort(Comparator.comparing(MonthlyDay::getDate));
            }

            return MonthlyHistory.builder()
                    .year(ym.getYear())
                    .month(ym.getMonthValue())
                    .days(days)
                    .build();
        }
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyDay {
        private String date;

        @Builder.Default
        private List<Item> items = new ArrayList<>();

        private Integer feedbackScore;

        private Double weatherTemp;
        private String condition;
        private Double weatherFeelsLike;
        private Integer weatherCloudAmount;

        private RecommendationModelType recoStrategy;

        public static MonthlyDay of(OutfitHistory h) {
            if (h == null) return null;

            Today t = Today.from(h);
            if (t == null || t.getDate() == null) return null;

            return MonthlyDay.builder()
                    .date(t.getDate().toString())
                    .items(t.getItems())
                    .feedbackScore(t.getFeedbackScore())
                    .weatherTemp(t.getWeatherTemp())
                    .condition(t.getCondition())
                    .weatherFeelsLike(t.getWeatherFeelsLike())
                    .weatherCloudAmount(t.getWeatherCloudAmount())
                    .recoStrategy(t.getRecoStrategy())
                    .build();
        }
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private Long clothingId;
        private int sortOrder;
    }
}