package com.team.backend.api.dto.clothingItem;

import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.domain.enums.SeasonType;
import com.team.backend.domain.enums.ThicknessLevel;
import com.team.backend.domain.enums.UsageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.Set;

// src/main/java/com/team/backend/api/dto/clothingItem/ClothingItemResponseDto.java
@Getter
@Builder
@AllArgsConstructor
public class ClothingItemResponseDto {

    private Long id;
    private Long clothingId;
    private String name;

    private ClothingCategory category;
    private ThicknessLevel thicknessLevel;
    private UsageType usageType;
    private Set<SeasonType> seasons;

    private Integer suitableMinTemp;
    private Integer suitableMaxTemp;

    private Integer cottonPercentage;
    private Integer polyesterPercentage;
    private Integer etcFiberPercentage;

    private String color;
    private String styleTag;
    private String imageUrl;

    private Integer selectedCount;

    private boolean favorited;
    public static ClothingItemResponseDto from(ClothingItem e) {
        return from(e, false);
    }

    public static ClothingItemResponseDto from(ClothingItem e, boolean favorited) {
        return ClothingItemResponseDto.builder()
                .id(e.getId())
                .clothingId(e.getClothingId())
                .name(e.getName())
                .category(e.getCategory())
                .thicknessLevel(e.getThicknessLevel())
                .usageType(e.getUsageType())
                .seasons(e.getSeasons())
                .suitableMinTemp(e.getSuitableMinTemp())
                .suitableMaxTemp(e.getSuitableMaxTemp())
                .cottonPercentage(e.getCottonPercentage())
                .polyesterPercentage(e.getPolyesterPercentage())
                .etcFiberPercentage(e.getEtcFiberPercentage())
                .color(e.getColor())
                .styleTag(e.getStyleTag())
                .imageUrl(e.getImageUrl())
                .selectedCount(e.getSelectedCount())
                .favorited(favorited)
                .build();
    }
}