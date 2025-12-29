// src/main/java/com/team/backend/service/favorite/FavoriteService.java
package com.team.backend.service.favorite;

import com.team.backend.domain.Favorite;
import com.team.backend.repository.favorite.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    @Transactional(readOnly = true)
    public Set<Long> findFavoritedIds(String sessionKey, Collection<Long> clothingIds) {
        if (sessionKey == null || sessionKey.isBlank()) return Collections.emptySet();
        if (clothingIds == null || clothingIds.isEmpty()) return Collections.emptySet();

        return favoriteRepository.findAllBySessionKeyAndClothingIdIn(sessionKey, clothingIds)
                .stream()
                .map(Favorite::getClothingId)
                .collect(java.util.stream.Collectors.toSet());
    }

    @Transactional
    public boolean toggle(String sessionKey, Long clothingId) {
        if (sessionKey == null || sessionKey.isBlank()) {
            throw new IllegalArgumentException("X-Session-Key is required");
        }
        if (clothingId == null) throw new IllegalArgumentException("clothingId is required");

        Optional<Favorite> existing = favoriteRepository.findBySessionKeyAndClothingId(sessionKey, clothingId);
        if (existing.isPresent()) {
            favoriteRepository.deleteBySessionKeyAndClothingId(sessionKey, clothingId);
            return false;
        }

        favoriteRepository.save(Favorite.builder()
                .sessionKey(sessionKey.trim())
                .clothingId(clothingId)
                .build());

        return true;
    }

    @Transactional(readOnly = true)
    public boolean isFavorited(String sessionKey, Long clothingId) {
        if (sessionKey == null || sessionKey.isBlank()) return false;
        if (clothingId == null) return false;
        return favoriteRepository.existsBySessionKeyAndClothingId(sessionKey, clothingId);
    }
}