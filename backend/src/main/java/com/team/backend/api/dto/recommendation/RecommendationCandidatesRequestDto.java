// src/main/java/com/team/backend/api/dto/recommendation/RecommendationCandidatesRequestDto.java
package com.team.backend.api.dto.recommendation;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RecommendationCandidatesRequestDto {

    private String recommendationId; // ✅ 클라이언트가 보내는 id (없으면 서버에서 생성)

    private String region;
    private Double lat;
    private Double lon;

    private Integer topNPerCategory;

    private ChecklistDto checklist;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ChecklistDto {
        private java.time.LocalDate clientDateISO;
        private com.team.backend.domain.enums.UsageType usageType;
        private com.team.backend.domain.enums.ThicknessLevel thicknessLevel; // 너 프로젝트 enum에 맞춰
    }
}