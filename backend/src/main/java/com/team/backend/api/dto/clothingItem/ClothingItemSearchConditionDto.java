package com.team.backend.api.dto.clothingItem;

import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.domain.enums.SeasonType;
import com.team.backend.domain.enums.ThicknessLevel;
import com.team.backend.domain.enums.UsageType;
import lombok.Builder;
import lombok.Getter;

import java.util.Set;

@Getter
@Builder
public class ClothingItemSearchConditionDto {
    private ClothingCategory category;
    private Integer temp;
    private Set<SeasonType> seasons;
    private UsageType usageType;
    private ThicknessLevel thicknessLevel;

    private String sort; // "popular" | "latest"
    private Integer limit;
}