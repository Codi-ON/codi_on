package com.team.backend.service.clothing;

import com.team.backend.api.dto.clothingItem.*;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.repository.clothing.ClothingItemRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
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
    // Create
    // ==============================
    public ClothingItemResponseDto create(ClothingItemCreateRequestDto req) {
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
    // Read
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
    // Update (PATCH)
    // ==============================
    public ClothingItemResponseDto update(Long id, ClothingItemUpdateRequestDto req) {
        ClothingItem e = clothingItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ClothingItem을 찾을 수 없습니다. id=" + id));

        e.updateCore(req.getName(), req.getCategory(), req.getThicknessLevel(), req.getUsageType());
        e.updateTempRange(req.getSuitableMinTemp(), req.getSuitableMaxTemp());
        e.updateMaterials(req.getCottonPercentage(), req.getPolyesterPercentage(), req.getEtcFiberPercentage());
        e.updateMeta(req.getColor(), req.getStyleTag(), req.getImageUrl());

        if (req.getSeasons() != null) {
            e.replaceSeasons(req.getSeasons());
        }

        return ClothingItemResponseDto.from(e);
    }

    // ==============================
    // Delete
    // ==============================
    public void delete(Long id) {
        if (!clothingItemRepository.existsById(id)) {
            throw new EntityNotFoundException("삭제할 옷을 찾을 수 없습니다. id=" + id);
        }
        clothingItemRepository.deleteById(id);
    }

    // ==============================
    // Search (옵션 A: clothingId를 search로 흡수)
    // - clothingId 있으면 단건 조회
    // - 아니면 후보 id만 먼저(Custom) → seasons 포함 재조회(EntityGraph)
    // ==============================
    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> search(ClothingItemSearchRequestDto req) {

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

        // 2) 기존 검색 흐름 유지
        int limit = (req == null ? DEFAULT_LIMIT : req.resolvedLimit());
        Pageable pageable = PageRequest.of(0, clamp(limit));

        List<Long> ids = clothingItemRepository.searchCandidateIds(req, pageable);
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
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> getPopularByCategory(ClothingCategory category, int limit) {
        int resolved = clamp(limit);
        Pageable pageable = PageRequest.of(0, resolved);
        return clothingItemRepository.findAllByCategoryOrderBySelectedCountDesc(category, pageable)
                .stream()
                .map(ClothingItemResponseDto::from)
                .collect(Collectors.toList());
    }

    // ==============================
    // SelectedCount (동시성 안전: update 쿼리)
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