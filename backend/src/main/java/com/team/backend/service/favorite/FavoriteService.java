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

    // =========================
    // Write (세션 보장 필수)
    // =========================

    public void add(String sessionKey, Long clothingId) {
        String key = sessionService.ensureSession(sessionKey); // ✅ WRITE에서만 touch/upsert

        if (clothingId == null) throw new IllegalArgumentException("clothingId는 필수입니다.");

        if (favoriteRepository.existsBySessionKeyAndClothingId(key, clothingId)) return;

        favoriteRepository.save(
                FavoriteItem.builder()
                        .sessionKey(key)
                        .clothingId(clothingId)
                        .build()
        );
    }

    public void remove(String sessionKey, Long clothingId) {
        String key = sessionService.ensureSession(sessionKey); // ✅ WRITE에서만 touch/upsert

        if (clothingId == null) throw new IllegalArgumentException("clothingId는 필수입니다.");

        favoriteRepository.deleteBySessionKeyAndClothingId(key, clothingId);
    }

    // =========================
    // Read (절대 ensureSession 호출 금지)
    // =========================

    @Transactional(readOnly = true)
    public List<Long> listFavoriteClothingIds(String sessionKey) {
        String key = sessionService.requireUuidV4(sessionKey); // ✅ 검증만 (DB write 없음)
        return favoriteRepository.findClothingIdsBySessionKey(key);
    }

    @Transactional(readOnly = true)
    public boolean isFavorite(String sessionKey, Long clothingId) {
        String key = sessionService.requireUuidV4(sessionKey); // ✅ 검증만

        if (clothingId == null) throw new IllegalArgumentException("clothingId는 필수입니다.");

        return favoriteRepository.existsBySessionKeyAndClothingId(key, clothingId);
    }

    // =========================
    // Bulk 조회 (merge용, optional)
    // - 세션키가 옵션인 경우: 없으면 emptySet
    // - 형식이 이상하면 emptySet (프론트 merge 안전)
    // =========================

    @Transactional(readOnly = true)
    public Set<Long> findFavoritedIds(String sessionKey, Collection<Long> clothingIds) {
        if (sessionKey == null || sessionKey.isBlank()) return Collections.emptySet();
        if (clothingIds == null || clothingIds.isEmpty()) return Collections.emptySet();

        final String key;
        try {
            key = sessionService.requireUuidV4(sessionKey);
        } catch (IllegalArgumentException e) {
            return Collections.emptySet();
        }

        List<FavoriteItem> rows = favoriteRepository.findAllBySessionKeyAndClothingIdIn(key, clothingIds);

        Set<Long> out = new HashSet<>(rows.size());
        for (FavoriteItem r : rows) out.add(r.getClothingId());
        return out;
    }
}