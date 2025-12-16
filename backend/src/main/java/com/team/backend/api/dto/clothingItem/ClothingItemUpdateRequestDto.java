package com.team.backend.api.dto.clothingItem;

import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.domain.enums.SeasonType;
import com.team.backend.domain.enums.ThicknessLevel;
import com.team.backend.domain.enums.UsageType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.util.Set;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClothingItemUpdateRequestDto {

    // null이면 그대로 유지(PATCH)
    private String name;
    private ClothingCategory category;
    private ThicknessLevel thicknessLevel;
    private UsageType usageType;

    // 시즌은 "전체 교체 전략" 권장
    // - null이면 미변경
    // - 값 오면 replaceSeasons()로 통째로 교체
    private Set<SeasonType> seasons;

    private Integer suitableMinTemp;
    private Integer suitableMaxTemp;

    // optional
    @Min(0) @Max(100)
    private Integer cottonPercentage;

    @Min(0) @Max(100)
    private Integer polyesterPercentage;

    @Min(0) @Max(100)
    private Integer etcFiberPercentage;

    private String color;
    private String styleTag;
    private String imageUrl;
}