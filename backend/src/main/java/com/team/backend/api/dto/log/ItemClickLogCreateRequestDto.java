// src/main/java/com/team/backend/api/dto/log/ItemClickLogCreateRequestDto.java
package com.team.backend.api.dto.log;

import com.fasterxml.jackson.databind.JsonNode;
import com.team.backend.domain.enums.log.ItemClickEventType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ItemClickLogCreateRequestDto {

    private Long userId; // nullable OK

    @NotNull
    private Long clothingItemId;

    @NotNull
    private ItemClickEventType eventType; // 고정: ITEM_CLICK

    private JsonNode payload; // source/position/region 등은 여기로
}