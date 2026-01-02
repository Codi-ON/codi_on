// src/main/java/com/team/backend/repository/outfit/OutfitHistoryRepository.java
package com.team.backend.repository.outfit;

import com.team.backend.domain.outfit.OutfitHistory;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OutfitHistoryRepository extends JpaRepository<OutfitHistory, Long> {

    Optional<OutfitHistory> findBySessionKeyAndOutfitDate(String sessionKey, LocalDate outfitDate);

    @Query("""
            select distinct h
            from OutfitHistory h
            left join fetch h.items i
            where h.sessionKey = :sessionKey
              and h.outfitDate >= :from
              and h.outfitDate <  :toExclusive
            order by h.outfitDate asc
        """)
    List<OutfitHistory> findMonthlyWithItems(
            @Param("sessionKey") String sessionKey,
            @Param("from") LocalDate from,
            @Param("toExclusive") LocalDate toExclusive
    );
}