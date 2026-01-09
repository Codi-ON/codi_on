// src/main/java/com/team/backend/service/closet/ClosetQueryService.java
package com.team.backend.service.closet;

import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.domain.Closet;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.repository.closet.ClosetItemQueryRepository;
import com.team.backend.repository.closet.ClosetRepository;
import com.team.backend.repository.clothing.ClothingItemRepository;
import com.team.backend.service.favorite.FavoriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClosetService {

    private static final int LIMIT_DEFAULT = 30;
    private static final int LIMIT_MAX = 200;

    private final ClosetRepository closetRepository;
    private final ClosetItemQueryRepository closetItemQueryRepository;
    private final ClothingItemRepository clothingItemRepository;
    private final FavoriteService favoriteService;

    /**
     * 세션키 기반 옷장 아이템 목록 조회
     * - sessionKey 없으면 400
     * - closet 없으면 생성(운영 편의)
     * - category optional
     * - limit default=30, max=200
     */
    public List<ClothingItemResponseDto> listClosetItems(String sessionKey, ClothingCategory category, Integer limit) {
        requireSessionKey(sessionKey);

        int safeLimit = normalizeLimit(limit);

        Long closetId = resolveOrCreateClosetId(sessionKey);

        List<Long> ids = closetItemQueryRepository.findClothingIdsByClosetId(closetId, category, safeLimit);
        if (ids == null || ids.isEmpty()) {
            log.info("[CLOSET] empty. sessionKeyPresent=true closetId={} category={} limit={}", closetId, category, safeLimit);
            return List.of();
        }

        List<ClothingItem> loaded = clothingItemRepository.findAllByIdIn(ids);
        List<ClothingItem> ordered = orderByIds(ids, loaded);

        Set<Long> favSet = new HashSet<>(favoriteService.listFavoriteClothingIds(sessionKey));

        log.info("[CLOSET] ok. closetId={} category={} limit={} returned={}", closetId, category, safeLimit, ordered.size());

        return ordered.stream()
                .map(it -> ClothingItemResponseDto.from(it, favSet.contains(it.getClothingId())))
                .toList();
    }

    private void requireSessionKey(String sessionKey) {
        if (sessionKey == null || sessionKey.isBlank()) {
            throw new IllegalArgumentException("X-Session-Key is required");
        }
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null) return LIMIT_DEFAULT;
        return Math.max(1, Math.min(limit, LIMIT_MAX));
    }

    private Long resolveOrCreateClosetId(String sessionKey) {
        Optional<Closet> found = closetRepository.findBySessionKey(sessionKey);
        if (found.isPresent()) return found.get().getId();

        Closet created = closetRepository.save(
                Closet.builder()
                        .sessionKey(sessionKey)
                        .build()
        );

        log.info("[CLOSET] created. closetId={} sessionKeyPresent=true", created.getId());
        return created.getId();
    }

    private List<ClothingItem> orderByIds(List<Long> ids, List<ClothingItem> loaded) {
        Map<Long, ClothingItem> map = loaded.stream()
                .collect(Collectors.toMap(ClothingItem::getId, Function.identity(), (a, b) -> a));

        List<ClothingItem> ordered = new ArrayList<>(ids.size());
        for (Long id : ids) {
            ClothingItem it = map.get(id);
            if (it != null) ordered.add(it);
        }
        return ordered;
    }
}