// src/main/java/com/team/backend/api/dto/feedback/FeedbackAdaptiveResponse.java
package com.team.backend.api.dto.feedback;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackAdaptiveResponse {

    /**
     * ✅ 요청 feedbackId echo (그대로 내려줌)
     */
    private UUID feedbackId;

    /**
     * ✅ 개인 체감 바이어스 (예: -0.48)
     * - “추위를 많이 탐 / 더위를 많이 탐”을 연속값으로 표현
     * - 프론트/대시보드/서빙 로직에서 그대로 사용 가능
     */
    private BigDecimal userBias;

    /**
     * ✅ 모델별 결과를 한 번에 반환
     */
    private List<ModelResult> models;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ModelResult {
        private String modelType;      // "BLEND_ADAPTIVE" | "MATERIAL_ADAPTIVE"
        private String modelVersion;   // "blend-adaptive-v1.0.0" 같은 버전 문자열
        private Boolean trained;       // 이번 요청에서 학습 실행 여부 (ML 정책에 따라 false 가능)
        private List<ScoredItem> results;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScoredItem {
        private Long clothingId;

        /**
         * 0~100 점수 (int로 박고 싶으면 Integer로 바꿔도 됨)
         * - 지금은 BigDecimal로 받아두면 소수/정수 변경에도 안전
         */
        private BigDecimal score;
    }
}