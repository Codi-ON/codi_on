// api/dto/clothing/ClothingItemRequestDto.java
package com.team.backend.api.dto.clothingItem;

import com.team.backend.domain.ClothingCategory;
import com.team.backend.domain.ThicknessLevel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClothingItemRequestDto {
    private Long clothingId;   // 없으면 null 가능

    private String name;
    private ClothingCategory category;
    private ThicknessLevel thicknessLevel;

    private Integer cottonPercentage;
    private Integer polyesterPercentage;
    private Integer etcFiberPercentage;

    private Integer suitableMinTemp;
    private Integer suitableMaxTemp;

    private String color;
    private String styleTag;
    private String imageUrl;
}