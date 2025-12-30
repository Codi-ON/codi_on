package com.team.backend.api.dto.outfit;

import com.team.backend.domain.outfit.OutfitHistory;
import com.team.backend.domain.outfit.OutfitHistoryItem;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

public class OutfitResponseDto {

    @Getter
    @Builder
    public static class Today {
        private LocalDate date;
        private List<Item> items;

        public static Today from(OutfitHistory history) {
            return Today.builder()
                    .date(history.getOutfitDate())
                    .items(history.getItems().stream().map(Item::from).toList())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class Item {
        private Long clothingId;
        private Integer sortOrder;

        public static Item from(OutfitHistoryItem e) {
            return Item.builder()
                    .clothingId(e.getClothingId())
                    .sortOrder(e.getSortOrder())
                    .build();
        }
    }
}