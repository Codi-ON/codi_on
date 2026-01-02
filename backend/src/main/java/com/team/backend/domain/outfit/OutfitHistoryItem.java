package com.team.backend.domain.outfit;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "outfit_history_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class OutfitHistoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // DTO에서 clothingId를 받는 구조 유지 (clothing_item.clothing_id와 매칭)
    @Column(name = "clothing_id", nullable = false)
    private Long clothingId;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outfit_history_id", nullable = false)
    private OutfitHistory outfitHistory;

    public static OutfitHistoryItem of(OutfitHistory history, Long clothingId, int sortOrder) {
        return OutfitHistoryItem.builder()
                .outfitHistory(history)
                .clothingId(clothingId)
                .sortOrder(sortOrder)
                .build();
    }
}