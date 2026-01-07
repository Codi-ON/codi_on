// src/main/java/com/team/backend/api/dto/checklist/ChecklistSubmitResponseDto.java
package com.team.backend.api.dto.checklist;

import lombok.*;
import java.time.LocalDate;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistSubmitResponseDto {
    private String recommendationId;
    private LocalDate date;
    private boolean created;
}