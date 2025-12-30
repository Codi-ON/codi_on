package com.team.backend.domain.outfit;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "outfit_history",
        uniqueConstraints = @UniqueConstraint(name = "uq_outfit_history", columnNames = {"session_key", "outfit_date"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class OutfitHistory {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_key", nullable = false, length = 64)
    private String sessionKey;

    @Column(name = "outfit_date", nullable = false)
    private LocalDate outfitDate;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "outfitHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OutfitHistoryItem> items = new ArrayList<>();

    @PrePersist
    void prePersist() {
        OffsetDateTime now = OffsetDateTime.now(KST);
        this.createdAt = now;
        this.updatedAt = now;
        if (this.sessionKey != null) this.sessionKey = this.sessionKey.trim();
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = OffsetDateTime.now(KST);
        if (this.sessionKey != null) this.sessionKey = this.sessionKey.trim();
    }

    public void replaceItems(List<OutfitHistoryItem> newItems, OffsetDateTime now) {
        this.items.clear();
        this.items.addAll(newItems);
        this.updatedAt = now;
    }
}