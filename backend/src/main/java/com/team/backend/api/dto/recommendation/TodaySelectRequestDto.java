// src/main/java/com/team/backend/api/dto/recommendation/TodaySelectRequestDto.java
package com.team.backend.api.dto.recommendation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodaySelectRequestDto {

    @NotNull
    private UUID recommendationId;

    @NotEmpty
    @Valid
    private List<SelectedItemDto> selectedItems;

    // optional
    private String modelType;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SelectedItemDto {
        @NotNull
        private Long clothingId;

        private String category;
    }
}