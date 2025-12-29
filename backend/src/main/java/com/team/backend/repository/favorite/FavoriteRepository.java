// src/main/java/com/team/backend/repository/favorite/FavoriteRepository.java
package com.team.backend.repository.favorite;

import com.team.backend.domain.FavoriteItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<FavoriteItem, Long> {

    Optional<FavoriteItem> findBySessionKeyAndClothingId(String sessionKey, Long clothingId);

    boolean existsBySessionKeyAndClothingId(String sessionKey, Long clothingId);

    List<FavoriteItem> findAllBySessionKeyAndClothingIdIn(String sessionKey, Collection<Long> clothingIds);

    void deleteBySessionKeyAndClothingId(String sessionKey, Long clothingId);
}