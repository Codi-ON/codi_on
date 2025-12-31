// src/main/java/com/team/backend/api/dto/outfit/OutfitResponseDto.java
package com.team.backend.api.dto.outfit;

import com.team.backend.domain.outfit.OutfitHistory;
import com.team.backend.domain.outfit.OutfitHistoryItem;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class OutfitResponseDto {

    @Getter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Today {
        private Long id;
        private String sessionKey;
        private LocalDate outfitDate;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
        private List<Item> items;

        public static Today from(OutfitHistory h) {
            return Today.builder()
                    .id(h.getId())
                    .sessionKey(h.getSessionKey())
                    .outfitDate(h.getOutfitDate())
                    .createdAt(h.getCreatedAt())
                    .updatedAt(h.getUpdatedAt())
                    .items(h.getItems().stream().map(Item::from).toList())
                    .build();
        }
    }

    @Getter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Item {
        private Long clothingId;
        private Integer sortOrder;

        public static Item from(OutfitHistoryItem it) {
            return Item.builder()
                    .clothingId(it.getClothingId())
                    .sortOrder(it.getSortOrder())
                    .build();
        }
    }
}