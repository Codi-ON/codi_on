// src/main/java/com/team/backend/service/clothing/ClothingItemService.java
package com.team.backend.service.clothing;

import com.team.backend.api.dto.clothingItem.ClothingItemRequestDto;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.repository.clothing.ClothingItemRepository;
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
        return ClothingItemResponseDto.from(saved);
    }

    // ==============================
    // Read: GET /api/clothes/{id}
    // ==============================
    @Transactional(readOnly = true)
    public ClothingItemResponseDto getById(Long id) {
        ClothingItem e = clothingItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ClothingItem을 찾을 수 없습니다. id=" + id));

        // LAZY 초기화 (seasons)
        e.getSeasons().size();

        return ClothingItemResponseDto.from(e);
    }

    // ==============================
    // Update: PATCH /api/clothes/{id}
    // ==============================
    public ClothingItemResponseDto update(Long id, @Valid ClothingItemRequestDto.Update req) {
        ClothingItem e = clothingItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ClothingItem을 찾을 수 없습니다. id=" + id));

        // 엔티티 메서드는 null이면 유지(PATCH) 전제로 구현되어 있어야 함
        e.updateCore(req.getName(), req.getCategory(), req.getThicknessLevel(), req.getUsageType());
        e.updateTempRange(req.getSuitableMinTemp(), req.getSuitableMaxTemp());
        e.updateMaterials(req.getCottonPercentage(), req.getPolyesterPercentage(), req.getEtcFiberPercentage());
        e.updateMeta(req.getColor(), req.getStyleTag(), req.getImageUrl());

        // 시즌: null이면 미변경, 값 있으면 전체 교체
        if (req.getSeasons() != null) {
            e.replaceSeasons(req.getSeasons());
        }

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
    //  - clothingId 있으면 단건 조회
    //  - 아니면 후보 id만 먼저(Custom) → seasons 포함 재조회(EntityGraph)
    // ==============================
    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> search(ClothingItemRequestDto.Search req) {

        // 1) clothingId 단건 조회 (비즈니스 키)
        if (req != null && req.getClothingId() != null) {
            Long clothingId = req.getClothingId();

            ClothingItem e = clothingItemRepository.findByClothingId(clothingId)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "ClothingItem을 찾을 수 없습니다. clothingId=" + clothingId
                    ));

            e.getSeasons().size();
            return List.of(ClothingItemResponseDto.from(e));
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
        return fetchOrderedDtos(ids);
    }

    private List<ClothingItemResponseDto> fetchOrderedDtos(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();

        List<ClothingItem> rows = clothingItemRepository.findAllWithSeasonsByIdIn(ids);

        Map<Long, ClothingItem> map = rows.stream()
                .collect(Collectors.toMap(ClothingItem::getId, Function.identity()));

        List<ClothingItemResponseDto> ordered = new ArrayList<>(ids.size());
        for (Long id : ids) {
            ClothingItem e = map.get(id);
            if (e != null) ordered.add(ClothingItemResponseDto.from(e));
        }
        return ordered;
    }

    // ==============================
    // Popular
    // ==============================
    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> getPopular(int limit) {
        int resolved = clamp(limit);
        Pageable pageable = PageRequest.of(0, resolved);
        return clothingItemRepository.findAllByOrderBySelectedCountDesc(pageable)
                .stream()
                .map(ClothingItemResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> getPopularByCategory(ClothingCategory category, int limit) {
        int resolved = clamp(limit);
        Pageable pageable = PageRequest.of(0, resolved);
        return clothingItemRepository.findAllByCategoryOrderBySelectedCountDesc(category, pageable)
                .stream()
                .map(ClothingItemResponseDto::from)
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