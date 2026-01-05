package com.team.backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.time.ZoneId;

@Entity
@Table(
        name = "closet",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_closet_session_key", columnNames = "session_key")
        },
        indexes = {
                @Index(name = "idx_closet_session_key", columnList = "session_key")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Closet {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_key", nullable = false, length = 64)
    private String sessionKey;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now(KST);
        }
        if (this.sessionKey == null || this.sessionKey.isBlank()) {
            throw new IllegalArgumentException("sessionKey는 필수입니다.");
        }
    }
}