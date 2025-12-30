package com.team.backend.repository.outfit;

import com.team.backend.domain.outfit.OutfitHistoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutfitHistoryItemRepository extends JpaRepository<OutfitHistoryItem, Long> {
}