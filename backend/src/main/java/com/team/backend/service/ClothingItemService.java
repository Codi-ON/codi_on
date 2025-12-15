package com.team.backend.service;

import com.team.backend.domain.ClothingCategory;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.ThicknessLevel;
import com.team.backend.repository.ClothingItemRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ClothingItemService {

    private final ClothingItemRepository clothingItemRepository;

    // ==============================
    // 1. 기본 CRUD / 조회
    // ==============================

    @Transactional(readOnly = true)
    public ClothingItem getById(Long id) {
        return clothingItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ClothingItem을 찾을 수 없습니다. id=" + id));
    }

    @Transactional(readOnly = true)
    public ClothingItem getByClothingId(Long clothingId) {
        return clothingItemRepository.findByClothingId(clothingId)
                .orElseThrow(() -> new EntityNotFoundException("ClothingItem을 찾을 수 없습니다. clothingId=" + clothingId));
    }

    @Transactional(readOnly = true)
    public List<ClothingItem> findAll() {
        return clothingItemRepository.findAll();
    }

    public ClothingItem save(ClothingItem clothingItem) {
        return clothingItemRepository.save(clothingItem);
    }

    public void delete(Long id) {
        if (!clothingItemRepository.existsById(id)) {
            throw new EntityNotFoundException("옷을 찾을 수 없습니다. id=" + id);
        }
        clothingItemRepository.deleteById(id);
    }

    // ==============================
    // 2. 조건별 조회 (카테고리 / 두께 / 온도)
    // ==============================

    @Transactional(readOnly = true)
    public List<ClothingItem> findByCategory(ClothingCategory category) {
        return clothingItemRepository.findByCategory(category);
    }

    @Transactional(readOnly = true)
    public List<ClothingItem> findByThickness(ThicknessLevel thicknessLevel) {
        return clothingItemRepository.findByThicknessLevel(thicknessLevel);
    }

    /**
     * 현재 기온 하나만 넣어서, 그 기온에 맞는 옷 추천
     * 예: currentTemp = 10 이면
     *     suitableMinTemp <= 10 AND suitableMaxTemp >= 10 인 옷들
     */
    @Transactional(readOnly = true)
    public List<ClothingItem> recommendByTemperature(Integer currentTemp) {
        if (currentTemp == null) {
            throw new IllegalArgumentException("currentTemp 는 null 일 수 없습니다.");
        }

        log.info("🔥 [recommendByTemperature] currentTemp={}", currentTemp);

        List<ClothingItem> items =
                clothingItemRepository
                        .findBySuitableMinTempLessThanEqualAndSuitableMaxTempGreaterThanEqual(
                                currentTemp, currentTemp
                        );

        log.info("🔥 [recommendByTemperature] DB 결과 개수 = {}", items.size());

        return items;
    }
    /**
     * 카테고리 + 현재 기온 기준 추천
     * 예: 상의 중에서 10도에 맞는 옷만.
     */
    @Transactional(readOnly = true)
    public List<ClothingItem> recommendByCategoryAndTemperature(
            ClothingCategory category,
            Integer currentTemp
    ) {
        if (currentTemp == null) {
            throw new IllegalArgumentException("currentTemp 는 null 일 수 없습니다.");
        }
        return clothingItemRepository
                .findByCategoryAndSuitableMinTempLessThanEqualAndSuitableMaxTempGreaterThanEqual(
                        category,
                        currentTemp,
                        currentTemp
                );
    }

    // ==============================
    // 3. 선택 횟수 증가 (인기/선호도 트래킹)
    // ==============================

    public void markSelected(Long clothingItemId) {
        ClothingItem item = clothingItemRepository.findById(clothingItemId)
                .orElseThrow(() -> new EntityNotFoundException("ClothingItem을 찾을 수 없습니다. id=" + clothingItemId));

        item.increaseSelectedCount(); // JPA 변경 감지로 UPDATE
    }

    public void markSelectedByClothingId(Long clothingId) {
        ClothingItem item = clothingItemRepository.findByClothingId(clothingId)
                .orElseThrow(() -> new EntityNotFoundException("ClothingItem을 찾을 수 없습니다. clothingId=" + clothingId));

        item.increaseSelectedCount();
    }

    // ==============================
    // 4. 인기순 조회
    // ==============================

    @Transactional(readOnly = true)
    public List<ClothingItem> getTopPopularItems(int limit) {
        PageRequest pageRequest = PageRequest.of(
                0,
                limit,
                Sort.by(Sort.Direction.DESC, "selectedCount")
        );
        return clothingItemRepository.findAll(pageRequest).getContent();
    }

    @Transactional(readOnly = true)
    public List<ClothingItem> getTopPopularItemsByCategory(ClothingCategory category, int limit) {
        return clothingItemRepository.findTop10ByCategoryOrderBySelectedCountDesc(category)
                .stream()
                .limit(limit)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClothingItem> getTop10PopularItems() {
        return clothingItemRepository.findTop10ByOrderBySelectedCountDesc();
    }
}