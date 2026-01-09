package com.team.backend.domain.outfit;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "outfit_history_item",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_outfit_history_item_history_sort",
                        columnNames = {"outfit_history_id", "sort_order"}
                )
        },
        indexes = {
                @Index(name = "ix_outfit_history_item_history", columnList = "outfit_history_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class OutfitHistoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clothing_id", nullable = false)
    private Long clothingId;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outfit_history_id", nullable = false)
    private OutfitHistory outfitHistory;

    public static OutfitHistoryItem of(OutfitHistory history, Long clothingId, int sortOrder) {
        if (history == null) throw new IllegalArgumentException("history 값은 필수입니다");
        if (clothingId == null) throw new IllegalArgumentException("clothingId 는 필수입니다");
        if (sortOrder < 1) throw new IllegalArgumentException("sortOrder must be >= 1");
        return OutfitHistoryItem.builder()
                .outfitHistory(history)
                .clothingId(clothingId)
                .sortOrder(sortOrder)
                .build();
    }
}