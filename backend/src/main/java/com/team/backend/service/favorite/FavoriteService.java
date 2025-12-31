// src/main/java/com/team/backend/service/favorite/FavoriteService.java
package com.team.backend.service.favorite;

import com.team.backend.domain.FavoriteItem;
import com.team.backend.repository.favorite.FavoriteRepository;
import com.team.backend.service.session.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class FavoriteService {

    private final SessionService sessionService;
    private final FavoriteRepository favoriteRepository;

    // WRITE
    public void add(String sessionKey, Long clothingId) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        if (clothingId == null) throw new IllegalArgumentException("clothingId는 필수입니다.");
        if (favoriteRepository.existsBySessionKeyAndClothingId(key, clothingId)) return;

        favoriteRepository.save(FavoriteItem.builder().sessionKey(key).clothingId(clothingId).build());
    }

    public void remove(String sessionKey, Long clothingId) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        if (clothingId == null) throw new IllegalArgumentException("clothingId는 필수입니다.");
        favoriteRepository.deleteBySessionKeyAndClothingId(key, clothingId);
    }

    // READ
    @Transactional(readOnly = true)
    public List<Long> listFavoriteClothingIds(String sessionKey) {
        String key = sessionService.validateOnly(sessionKey);
        return favoriteRepository.findClothingIdsBySessionKey(key);
    }

    @Transactional(readOnly = true)
    public boolean isFavorite(String sessionKey, Long clothingId) {
        String key = sessionService.validateOnly(sessionKey);
        if (clothingId == null) throw new IllegalArgumentException("clothingId는 필수입니다.");
        return favoriteRepository.existsBySessionKeyAndClothingId(key, clothingId);
    }

    @Transactional(readOnly = true)
    public Set<Long> findFavoritedIds(String sessionKey, Collection<Long> clothingIds) {
        if (sessionKey == null || sessionKey.isBlank()) return Collections.emptySet();
        if (clothingIds == null || clothingIds.isEmpty()) return Collections.emptySet();

        String key = sessionKey.trim();
        List<FavoriteItem> rows = favoriteRepository.findAllBySessionKeyAndClothingIdIn(key, clothingIds);

        Set<Long> out = new HashSet<>(rows.size());
        for (FavoriteItem r : rows) out.add(r.getClothingId());
        return out;
    }
}