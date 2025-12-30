// src/main/java/com/team/backend/api/dto/outfit/OutfitRequestDto.java
package com.team.backend.api.dto.outfit;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

public class OutfitRequestDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveToday {
        @NotEmpty(message = "clothingIds는 1개 이상 필요합니다.")
        private List<Long> clothingIds;
    }
}