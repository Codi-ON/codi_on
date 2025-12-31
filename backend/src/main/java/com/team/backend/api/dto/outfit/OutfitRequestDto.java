// src/main/java/com/team/backend/api/dto/outfit/OutfitRequestDto.java
package com.team.backend.api.dto.outfit;

import lombok.*;

import java.util.List;

public class OutfitRequestDto {

    @Getter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SaveToday {
        private List<Item> items;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Item {
        private Long clothingId;
        private int sortOrder;
    }
}