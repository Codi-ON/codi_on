// src/main/java/com/team/backend/repository/favorite/FavoriteRepository.java
package com.team.backend.repository.favorite;

import com.team.backend.domain.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Optional<Favorite> findBySessionKeyAndClothingId(String sessionKey, Long clothingId);

    boolean existsBySessionKeyAndClothingId(String sessionKey, Long clothingId);

    List<Favorite> findAllBySessionKeyAndClothingIdIn(String sessionKey, Collection<Long> clothingIds);

    void deleteBySessionKeyAndClothingId(String sessionKey, Long clothingId);
}