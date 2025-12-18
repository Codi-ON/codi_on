// src/main/java/com/team/backend/api/dto/click/ItemClickLogCreateRequestDto.java
package com.team.backend.api.dto.log;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ItemClickLogCreateRequestDto {

    private Long userId; // nullable OK

    @NotNull
    private Long clothingItemId;

    @NotBlank
    private String eventType; // 예: RECO_ITEM_CLICK / SEARCH_ITEM_CLICK / CLOSET_ITEM_CLICK

    private JsonNode payload; // 어떤 키가 오든 그대로 저장(유연성 유지)
}