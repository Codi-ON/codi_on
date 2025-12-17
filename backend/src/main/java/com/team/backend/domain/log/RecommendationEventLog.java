// src/main/java/com/team/backend/domain/log/RecommendationEventLog.java
package com.team.backend.domain.log;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "recommendation_event_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RecommendationEventLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 파티션 키(부모+자식 공통)
     * - DDL에서 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
     */
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "session_key", length = 64)
    private String sessionKey;

    /**
     * 어떤 이벤트인지(예: RECO_SHOWN, RECO_CLICKED 등)
     */
    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    /**
     * 추천 퍼널 단계(예: LIST, DETAIL, CONFIRM)
     * - 없다면 null 가능
     */
    @Column(name = "funnel_step", length = 50)
    private String funnelStep;

    /**
     * 자유 형식 메타데이터(JSON)
     * - 어떤 추천 전략이었는지
     * - 추천된 옷 ID 목록
     * - 날씨 스냅샷 등
     */
    @Column(name = "payload", columnDefinition = "jsonb")
    private String payload;

    @PrePersist
    void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }
}