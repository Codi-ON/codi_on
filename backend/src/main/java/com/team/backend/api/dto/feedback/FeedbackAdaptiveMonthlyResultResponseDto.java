// src/main/java/com/team/backend/api/dto/feedback/FeedbackAdaptiveMonthlyResultResponseDto.java
package com.team.backend.api.dto.feedback;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackAdaptiveMonthlyResultResponseDto {

    private UUID feedbackId;          // run 테이블 feedback_id (latest row)
    private String status;            // REQUESTED | SUCCEEDED | FAILED
    private Long latencyMs;

    private OffsetDateTime requestedAt;
    private OffsetDateTime succeededAt;
    private OffsetDateTime failedAt;

    // ML 결과(JSON) 그대로
    private JsonNode result;
}