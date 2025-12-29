// src/main/java/com/team/backend/service/favorite/FavoriteService.java
package com.team.backend.service.favorite;

import com.team.backend.domain.FavoriteItem;
import com.team.backend.repository.favorite.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    /**
     * 특정 후보 목록(clothingIds) 안에서만 favorite 여부를 bulk로 조회 (N+1 방지)
     */
    @Transactional(readOnly = true)
    public Set<Long> findFavoritedIds(String sessionKey, Collection<Long> clothingIds) {
        if (sessionKey == null || sessionKey.isBlank()) return Collections.emptySet();
        if (clothingIds == null || clothingIds.isEmpty()) return Collections.emptySet();

        return favoriteRepository.findAllBySessionKeyAndClothingIdIn(sessionKey.trim(), clothingIds)
                .stream()
                .map(FavoriteItem::getClothingId)
                .collect(java.util.stream.Collectors.toSet());
    }

    /**
     * 세션 전체 즐겨찾기 목록 조회 (UI에서 마이페이지/즐겨찾기 탭용)
     * - 이 메서드가 네 코드에 이미 쓰이고 있음
     */
    @Transactional(readOnly = true)
    public List<Long> listFavoriteClothingIds(String sessionKey) {
        if (sessionKey == null || sessionKey.isBlank()) return List.of();

        return favoriteRepository.findAllBySessionKey(sessionKey.trim())
                .stream()
                .map(FavoriteItem::getClothingId)
                .distinct()
                .toList();
    }

    /**
     * (컨트롤러가 원하는 명칭) 즐겨찾기 추가
     */
    @Transactional
    public void add(String sessionKey, Long clothingId) {
        requireSession(sessionKey);
        requireClothingId(clothingId);

        // 이미 있으면 no-op (idempotent)
        if (favoriteRepository.existsBySessionKeyAndClothingId(sessionKey.trim(), clothingId)) return;

        favoriteRepository.save(FavoriteItem.builder()
                .sessionKey(sessionKey.trim())
                .clothingId(clothingId)
                .build());
    }

    /**
     * (컨트롤러가 원하는 명칭) 즐겨찾기 삭제
     */
    @Transactional
    public void remove(String sessionKey, Long clothingId) {
        requireSession(sessionKey);
        requireClothingId(clothingId);

        favoriteRepository.deleteBySessionKeyAndClothingId(sessionKey.trim(), clothingId);
    }

    /**
     * (컨트롤러가 원하는 명칭) 즐겨찾기 여부
     */
    @Transactional(readOnly = true)
    public boolean isFavorite(String sessionKey, Long clothingId) {
        if (sessionKey == null || sessionKey.isBlank()) return false;
        if (clothingId == null) return false;

        return favoriteRepository.existsBySessionKeyAndClothingId(sessionKey.trim(), clothingId);
    }

    /**
     * alias: 호출부가 isFavorited를 쓰면 여기로도 받음
     */
    @Transactional(readOnly = true)
    public boolean isFavorited(String sessionKey, Long clothingId) {
        return isFavorite(sessionKey, clothingId);
    }

    /**
     * alias: 호출부가 listFavoritedClothingIds를 쓰면 여기로도 받음
     */
    @Transactional(readOnly = true)
    public List<Long> listFavoritedClothingIds(String sessionKey) {
        return listFavoriteClothingIds(sessionKey);
    }

    private void requireSession(String sessionKey) {
        if (sessionKey == null || sessionKey.isBlank()) {
            throw new IllegalArgumentException("X-Session-Key is required");
        }
    }

    private void requireClothingId(Long clothingId) {
        if (clothingId == null) {
            throw new IllegalArgumentException("clothingId is required");
        }
    }
}