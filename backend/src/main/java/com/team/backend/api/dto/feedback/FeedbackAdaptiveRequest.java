// src/main/java/com/team/backend/api/dto/feedback/FeedbackAdaptiveRequest.java
package com.team.backend.api.dto.feedback;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackAdaptiveRequest {

    /**
     * ✅ 반드시 UUID v4 (null 금지)
     * - 백엔드가 생성해도 되지만(쉬움), 현재 정책은 "클라이언트가 생성해서 전달"로 고정
     */
    private UUID feedbackId;

    /**
     * ✅ 누적된 체감 피드백 로그
     * - ML이 "15개 미만이면 학습 안 함" 같은 정책을 갖고 있으면, 그대로 넘기면 됨
     */
    private List<TempFeedbackLog> logs;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TempFeedbackLog {
        private String timestamp;

        /**
         * -1: COLD / 0: OK / 1: HOT
         */
        private Integer direction;

        /**
         * 사용자가 "선택한" clothingId 목록
         */
        private List<Long> selectedClothingIds;
    }
}