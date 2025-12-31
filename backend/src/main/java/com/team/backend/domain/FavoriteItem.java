// src/main/java/com/team/backend/domain/FavoriteItem.java
package com.team.backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "favorite_item",
        uniqueConstraints = @UniqueConstraint(name = "uk_favorite_session_clothing", columnNames = {"session_key", "clothing_id"}),
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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="session_key", nullable = false, length = 64)
    private String sessionKey;

    @Column(name="clothing_id", nullable = false)
    private Long clothingId;

    @Column(name="created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.sessionKey != null) this.sessionKey = this.sessionKey.trim();
    }
}