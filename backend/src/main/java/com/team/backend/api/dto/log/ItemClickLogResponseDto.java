// src/main/java/com/team/backend/api/dto/click/ItemClickLogResponseDto.java
package com.team.backend.api.dto.log;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@AllArgsConstructor
public class ItemClickLogResponseDto {
    private Long id;
    private OffsetDateTime createdAt;
}