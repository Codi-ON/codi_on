package com.team.backend.api.dto.clothingItem;

import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.*;
import lombok.*;

import java.util.Set;

@Getter
@Builder
public class ClothingItemResponseDto {

    private final Long id;
    private final Long clothingId;
    private final String name;

    private final ClothingCategory category;
    private final ThicknessLevel thicknessLevel;
    private final UsageType usageType;
    private final Set<SeasonType> seasons;

    private final Integer suitableMinTemp;
    private final Integer suitableMaxTemp;

    private final Integer cottonPercentage;
    private final Integer polyesterPercentage;
    private final Integer etcFiberPercentage;

    private final String color;
    private final String styleTag;
    private final String imageUrl;

    private final Integer selectedCount;

    public static ClothingItemResponseDto from(ClothingItem e) {
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
                .build();
    }
}