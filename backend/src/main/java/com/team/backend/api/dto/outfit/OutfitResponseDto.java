// src/main/java/com/team/backend/api/dto/outfit/OutfitResponseDto.java
package com.team.backend.api.dto.outfit;

import com.team.backend.domain.enums.outfit.FeedbackRating;
import com.team.backend.domain.outfit.OutfitHistory;
import com.team.backend.domain.outfit.OutfitHistoryItem;
import lombok.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class OutfitResponseDto {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Today {
        private String date;
        private List<Item> items;
        private Integer feedbackScore;

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