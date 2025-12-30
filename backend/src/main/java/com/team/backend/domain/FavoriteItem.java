// src/main/java/com/team/backend/domain/FavoriteItem.java
package com.team.backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Entity
@Table(
        name = "favorite_item",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_favorite_session_clothing", columnNames = {"session_key", "clothing_id"})
        },
        indexes = {
                @Index(name = "idx_favorite_session_key", columnList = "session_key"),
                @Index(name = "idx_favorite_clothing_id", columnList = "clothing_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class FavoriteItem {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_key", nullable = false, length = 64)
    private String sessionKey;

    @Column(name = "clothing_id", nullable = false)
    private Long clothingId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (this.updatedAt == null) {
            this.updatedAt = OffsetDateTime.now(KST);
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = OffsetDateTime.now(KST);
    }
}