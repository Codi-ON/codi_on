// src/main/java/com/team/backend/service/clothing/ClothingItemService.java
package com.team.backend.service.clothing;

import com.team.backend.api.dto.clothingItem.ClothingItemRequestDto;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.repository.clothing.ClothingItemRepository;
import com.team.backend.service.favorite.FavoriteService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClothingItemService {

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    private final ClothingItemRepository clothingItemRepository;
    private final FavoriteService favoriteService; // ✅ 추가

    // ==============================
    // Create: POST /api/clothes
    // ==============================
    public ClothingItemResponseDto create(@Valid ClothingItemRequestDto.Create req) {
        if (req.getClothingId() == null) throw new IllegalArgumentException("clothingId는 필수입니다.");
        if (clothingItemRepository.existsByClothingId(req.getClothingId())) {
            throw new IllegalArgumentException("이미 존재하는 clothingId 입니다. clothingId=" + req.getClothingId());
        }

        ClothingItem entity = ClothingItem.builder()
                .clothingId(req.getClothingId())
                .name(req.getName())
                .category(req.getCategory())
                .thicknessLevel(req.getThicknessLevel())
                .usageType(req.getUsageType())
                .suitableMinTemp(req.getSuitableMinTemp())
                .suitableMaxTemp(req.getSuitableMaxTemp())
                .cottonPercentage(req.getCottonPercentage())
                .polyesterPercentage(req.getPolyesterPercentage())
                .etcFiberPercentage(req.getEtcFiberPercentage())
                .seasons(req.getSeasons() == null ? new HashSet<>() : new HashSet<>(req.getSeasons()))
                .color(req.getColor())
                .styleTag(req.getStyleTag())
                .imageUrl(req.getImageUrl())
                .selectedCount(0)
                .build();

        ClothingItem saved = clothingItemRepository.save(entity);
        return ClothingItemResponseDto.from(saved); // favorited는 생성시 의미 없으니 false
    }

    // ==============================
    // Read: GET /api/clothes/{id}
    // ==============================
    @Transactional(readOnly = true)
    public ClothingItemResponseDto getById(String sessionKey, Long id) {
        ClothingItem e = clothingItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ClothingItem을 찾을 수 없습니다. id=" + id));

        e.getSeasons().size();

        boolean fav = favoriteService.isFavorited(sessionKey, e.getClothingId());
        return ClothingItemResponseDto.from(e, fav);
    }

    // ==============================
    // Update: PATCH /api/clothes/{id}
    // ==============================
    public ClothingItemResponseDto update(Long id, @Valid ClothingItemRequestDto.Update req) {
        ClothingItem e = clothingItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ClothingItem을 찾을 수 없습니다. id=" + id));

        e.updateCore(req.getName(), req.getCategory(), req.getThicknessLevel(), req.getUsageType());
        e.updateTempRange(req.getSuitableMinTemp(), req.getSuitableMaxTemp());
        e.updateMaterials(req.getCottonPercentage(), req.getPolyesterPercentage(), req.getEtcFiberPercentage());
        e.updateMeta(req.getColor(), req.getStyleTag(), req.getImageUrl());

        if (req.getSeasons() != null) {
            e.replaceSeasons(req.getSeasons());
        }

        // favorited는 sessionKey가 없으니 false로 반환(컨트롤러에서 getById 다시 호출해도 됨)
        return ClothingItemResponseDto.from(e);
    }

    // ==============================
    // Delete: DELETE /api/clothes/{id}
    // ==============================
    public void delete(Long id) {
        if (!clothingItemRepository.existsById(id)) {
            throw new EntityNotFoundException("삭제할 옷을 찾을 수 없습니다. id=" + id);
        }
        clothingItemRepository.deleteById(id);
    }

    // ==============================
    // Search: GET /api/clothes/search
    // ==============================
    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> search(String sessionKey, ClothingItemRequestDto.Search req) {

        // 1) clothingId 단건 조회 (비즈니스 키)
        if (req != null && req.getClothingId() != null) {
            Long clothingId = req.getClothingId();

            ClothingItem e = clothingItemRepository.findByClothingId(clothingId)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "ClothingItem을 찾을 수 없습니다. clothingId=" + clothingId
                    ));

            e.getSeasons().size();

            boolean fav = favoriteService.isFavorited(sessionKey, e.getClothingId());
            return List.of(ClothingItemResponseDto.from(e, fav));
        }

        // 2) 검색 흐름
        int resolvedLimit = (req == null ? DEFAULT_LIMIT : req.resolvedLimit());
        Pageable pageable = PageRequest.of(0, clamp(resolvedLimit));

        ClothingItemRequestDto.SearchCondition cond =
                (req == null)
                        ? ClothingItemRequestDto.SearchCondition.builder()
                        .sort("popular")
                        .limit(clamp(DEFAULT_LIMIT))
                        .build()
                        : req.toCondition();

        List<Long> ids = clothingItemRepository.searchCandidateIds(cond, pageable);
        return fetchOrderedDtosWithFavorites(sessionKey, ids);
    }

    private List<ClothingItemResponseDto> fetchOrderedDtosWithFavorites(String sessionKey, List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();

        List<ClothingItem> rows = clothingItemRepository.findAllWithSeasonsByIdIn(ids);

        Map<Long, ClothingItem> map = rows.stream()
                .collect(Collectors.toMap(ClothingItem::getId, Function.identity()));

        // ✅ favorites bulk 조회 (N+1 금지)
        List<Long> clothingIds = rows.stream().map(ClothingItem::getClothingId).toList();
        Set<Long> favoritedIds = favoriteService.findFavoritedIds(sessionKey, clothingIds);

        List<ClothingItemResponseDto> ordered = new ArrayList<>(ids.size());
        for (Long id : ids) {
            ClothingItem e = map.get(id);
            if (e == null) continue;

            boolean fav = favoritedIds.contains(e.getClothingId());
            ordered.add(ClothingItemResponseDto.from(e, fav));
        }
        return ordered;
    }

    // ==============================
    // Popular
    // ==============================
    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> getPopular(String sessionKey, int limit) {
        int resolved = clamp(limit);
        Pageable pageable = PageRequest.of(0, resolved);

        List<ClothingItem> rows = clothingItemRepository.findAllByOrderBySelectedCountDesc(pageable);

        Set<Long> favoritedIds = favoriteService.findFavoritedIds(
                sessionKey,
                rows.stream().map(ClothingItem::getClothingId).toList()
        );

        return rows.stream()
                .map(e -> ClothingItemResponseDto.from(e, favoritedIds.contains(e.getClothingId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> getPopularByCategory(String sessionKey, ClothingCategory category, int limit) {
        int resolved = clamp(limit);
        Pageable pageable = PageRequest.of(0, resolved);

        List<ClothingItem> rows = clothingItemRepository.findAllByCategoryOrderBySelectedCountDesc(category, pageable);

        Set<Long> favoritedIds = favoriteService.findFavoritedIds(
                sessionKey,
                rows.stream().map(ClothingItem::getClothingId).toList()
        );

        return rows.stream()
                .map(e -> ClothingItemResponseDto.from(e, favoritedIds.contains(e.getClothingId())))
                .toList();
    }

    // ==============================
    // SelectedCount
    // ==============================
    public void markSelected(Long id) {
        int updated = clothingItemRepository.incrementSelectedCount(id);
        if (updated == 0) throw new EntityNotFoundException("ClothingItem을 찾을 수 없습니다. id=" + id);
    }

    private int clamp(int v) {
        int x = (v <= 0 ? DEFAULT_LIMIT : v);
        return Math.min(x, MAX_LIMIT);
    }
}