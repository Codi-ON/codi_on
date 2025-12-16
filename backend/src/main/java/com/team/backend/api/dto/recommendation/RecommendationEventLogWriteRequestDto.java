package com.team.backend.api.dto.recommendation;

import lombok.*;

import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationEventLogWriteRequestDto {

    private Long userId;              // nullable
    private UUID sessionId;           // nullable
    private Long recommendationId;    // nullable

    // 예: "RECO_GENERATED", "ITEM_CLICK", "DISMISS", "SAVE"
    @NonNull
    private String eventType;

    // JSON 문자열로 받는 걸 추천 (없으면 null 가능)
    // 예: {"category":"TOP","limit":20,"region":"Seoul"}
    private String payloadJson;
}