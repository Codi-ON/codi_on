package com.team.backend.api.dto.clothingItem;

import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.domain.enums.SeasonType;
import com.team.backend.domain.enums.ThicknessLevel;
import com.team.backend.domain.enums.UsageType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.Set;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClothingItemCreateRequestDto {

    @NotNull
    private Long clothingId;

    @NotBlank
    private String name;

    @NotNull
    private ClothingCategory category;

    @NotNull
    private ThicknessLevel thicknessLevel;

    @NotNull
    private UsageType usageType;

    @NotEmpty
    private Set<SeasonType> seasons;

    @NotNull
    private Integer suitableMinTemp;

    @NotNull
    private Integer suitableMaxTemp;

    // ==============================
    // optional(있으면 저장/활용)
    // ==============================
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