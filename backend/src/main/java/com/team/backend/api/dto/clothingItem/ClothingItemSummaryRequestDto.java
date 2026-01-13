package com.team.backend.api.dto.clothingItem;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ClothingItemSummaryRequestDto {

    @NotEmpty(message = "ids is required")
    private List<Long> ids;

    public ClothingItemSummaryRequestDto(List<Long> ids) {
        this.ids = ids;
    }
}