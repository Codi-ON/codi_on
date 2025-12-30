// src/main/java/com/team/backend/repository/favorite/FavoriteRepository.java
package com.team.backend.repository.favorite;

import com.team.backend.domain.FavoriteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface FavoriteRepository extends JpaRepository<FavoriteItem, Long> {

    boolean existsBySessionKeyAndClothingId(String sessionKey, Long clothingId);

    void deleteBySessionKeyAndClothingId(String sessionKey, Long clothingId);

    List<FavoriteItem> findAllBySessionKeyAndClothingIdIn(String sessionKey, Collection<Long> clothingIds);

    @Query("""
        select f.clothingId
        from FavoriteItem f
        where f.sessionKey = :sessionKey
        order by f.id desc
    """)
    List<Long> findClothingIdsBySessionKey(@Param("sessionKey") String sessionKey);
}