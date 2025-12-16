package com.team.backend.repository;

import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClothingItemRepository extends JpaRepository<ClothingItem, Long>, ClothingItemRepositoryCustom {

    // ==============================
    // 0) 외부 비즈니스 키
    // ==============================
    Optional<ClothingItem> findByClothingId(Long clothingId);

    boolean existsByClothingId(Long clothingId);

    // ==============================
    // 1) 인기순 (Top N을 Pageable로 유연하게)
    // ==============================
    List<ClothingItem> findAllByOrderBySelectedCountDesc(Pageable pageable);

    List<ClothingItem> findAllByCategoryOrderBySelectedCountDesc(ClothingCategory category, Pageable pageable);

    // ==============================
    // 2) seasons까지 한 번에 로딩 (N+1 방지)
    // - searchCandidateIds로 ID 먼저 뽑고 여기로 재조회하는 패턴에서 사용
    // ==============================
    @EntityGraph(attributePaths = "seasons")
    @Query("select c from ClothingItem c where c.id in :ids")
    List<ClothingItem> findAllWithSeasonsByIdIn(@Param("ids") List<Long> ids);

    // ==============================
    // 3) 선택 카운트 원자 증가 (동시성 안전)
    // ==============================
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ClothingItem c set c.selectedCount = c.selectedCount + 1 where c.id = :id")
    int incrementSelectedCount(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ClothingItem c set c.selectedCount = c.selectedCount + 1 where c.clothingId = :clothingId")
    int incrementSelectedCountByClothingId(@Param("clothingId") Long clothingId);
}