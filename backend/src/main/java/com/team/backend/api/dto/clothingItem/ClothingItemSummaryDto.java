package com.team.backend.api.dto.clothingItem;

import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ClothingItemSummaryDto {

    private Long clothingId;
    private String name;
    private String imageUrl;
    private ClothingCategory category;

    public static ClothingItemSummaryDto from(ClothingItem e) {
        return ClothingItemSummaryDto.builder()
                .clothingId(e.getClothingId())
                .name(e.getName())
                .imageUrl(e.getImageUrl())
                .category(e.getCategory())
                .build();
    }
}