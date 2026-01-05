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

    @EntityGraph(attributePaths = "seasons")
    List<ClothingItem> findAllByIdIn(List<Long> ids);

    List<ClothingItem> findAllByOrderByIdAsc(Pageable pageable);

    List<ClothingItem> findAllByOrderBySelectedCountDesc(Pageable pageable);

    List<ClothingItem> findAllByCategoryOrderBySelectedCountDesc(ClothingCategory category, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ClothingItem c set c.selectedCount = c.selectedCount + 1 where c.id = :id")
    int incrementSelectedCount(@Param("id") Long id);
}
