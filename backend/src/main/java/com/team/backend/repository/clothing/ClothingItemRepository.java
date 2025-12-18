// src/main/java/com/team/backend/repository/clothing/ClothingItemRepository.java
package com.team.backend.repository.clothing;

import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClothingItemRepository extends JpaRepository<ClothingItem, Long>, ClothingItemRepositoryCustom {

    boolean existsByClothingId(Long clothingId);

    Optional<ClothingItem> findByClothingId(Long clothingId);

    // seasons까지 같이 로딩(정렬 유지용: id in 후 map으로 재정렬)
    @EntityGraph(attributePaths = "seasons")
    List<ClothingItem> findAllByIdIn(List<Long> ids);

    // 너가 서비스에서 쓰던 이름 유지하려면 이걸로 고정
    default List<ClothingItem> findAllWithSeasonsByIdIn(List<Long> ids) {
        return findAllByIdIn(ids);
    }

    List<ClothingItem> findAllByOrderBySelectedCountDesc(Pageable pageable);

    List<ClothingItem> findAllByCategoryOrderBySelectedCountDesc(ClothingCategory category, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ClothingItem c set c.selectedCount = c.selectedCount + 1 where c.id = :id")
    int incrementSelectedCount(@Param("id") Long id);
}