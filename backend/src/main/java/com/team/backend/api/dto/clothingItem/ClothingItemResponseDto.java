package com.team.backend.api.dto.clothingItem;

import com.team.backend.domain.ClothingCategory;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.SeasonType;
import com.team.backend.domain.ThicknessLevel;
import lombok.Builder;
import lombok.Getter;

import java.util.Set;

@Getter
@Builder
public class ClothingItemResponseDto {

    private Long id;
    private Long clothingId;
    private ClothingCategory category;
    private String name;
    private String imageUrl;

    private ThicknessLevel thicknessLevel;
    private Set<SeasonType> seasons;

    private Integer suitableMinTemp;
    private Integer suitableMaxTemp;

    private String color;
    private String styleTag;

    private int selectedCount;

    public static ClothingItemResponseDto from(ClothingItem item) {
        return ClothingItemResponseDto.builder()
                .id(item.getId())
                .clothingId(item.getClothingId())
                .category(item.getCategory())
                .name(item.getName())
                .imageUrl(item.getImageUrl())
                .thicknessLevel(item.getThicknessLevel())
                .seasons(item.getSeasons())
                .suitableMinTemp(item.getSuitableMinTemp())
                .suitableMaxTemp(item.getSuitableMaxTemp())
                .color(item.getColor())
                .styleTag(item.getStyleTag())
                .selectedCount(item.getSelectedCount())
                .build();
    }
}