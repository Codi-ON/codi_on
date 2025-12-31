// src/main/java/com/team/backend/repository/outfit/OutfitHistoryRepository.java
package com.team.backend.repository.outfit;

import com.team.backend.domain.outfit.OutfitHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface OutfitHistoryRepository extends JpaRepository<OutfitHistory, Long> {

    Optional<OutfitHistory> findBySessionKeyAndOutfitDate(String sessionKey, LocalDate outfitDate);

    @EntityGraph(attributePaths = "items")
    Optional<OutfitHistory> findWithItemsBySessionKeyAndOutfitDate(String sessionKey, LocalDate outfitDate);
}