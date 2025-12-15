package com.team.backend.repository;

import com.team.backend.domain.ClothingCategory;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.ThicknessLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClothingItemRepository extends JpaRepository<ClothingItem, Long> {

    // 특정 ML/외부 시스템 ID로 조회 (필요 시)
    Optional<ClothingItem> findByClothingId(Long clothingId);

    // 카테고리별 옷 리스트
    List<ClothingItem> findByCategory(ClothingCategory category);

    // 두께별 옷 리스트
    List<ClothingItem> findByThicknessLevel(ThicknessLevel thicknessLevel);

    // 온도 범위에 맞는 옷 (예: 오늘 기온이 10도면, 5~15도 사이 옷 추천)
    List<ClothingItem> findBySuitableMinTempLessThanEqualAndSuitableMaxTempGreaterThanEqual(
            Integer currentTempMin,
            Integer currentTempMax
    );

    // 카테고리 + 온도 조건 같이 쓰고 싶을 때
    List<ClothingItem> findByCategoryAndSuitableMinTempLessThanEqualAndSuitableMaxTempGreaterThanEqual(
            ClothingCategory category,
            Integer currentTempMin,
            Integer currentTempMax
    );

    // 많이 선택된 순으로 상위 N개 (N은 Service 단에서 PageRequest로 자를 수도 있음)
    List<ClothingItem> findTop10ByOrderBySelectedCountDesc();

    // 카테고리별 인기순
    List<ClothingItem> findTop10ByCategoryOrderBySelectedCountDesc(ClothingCategory category);

}