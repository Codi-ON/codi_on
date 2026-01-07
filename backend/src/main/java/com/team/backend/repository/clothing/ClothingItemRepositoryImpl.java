// src/main/java/com/team/backend/repository/clothing/ClothingItemRepositoryImpl.java
package com.team.backend.repository.clothing;

import com.team.backend.api.dto.clothingItem.ClothingItemRequestDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class ClothingItemRepositoryImpl implements ClothingItemRepositoryCustom {

    @PersistenceContext
    private EntityManager em;

    @Override
    public List<Long> searchCandidateIds(ClothingItemRequestDto.SearchCondition cond, Pageable pageable) {
        return searchNative(null, cond, pageable);
    }

    @Override
    public List<Long> searchCandidateIdsInCloset(Long closetId, ClothingItemRequestDto.SearchCondition cond, Pageable pageable) {
        if (closetId == null) return List.of();
        return searchNative(closetId, cond, pageable);
    }

    /**
     * closetId가 null이면 전역 후보, 있으면 closet-only 후보
     * 반환: ClothingItem PK(id)
     */
    private List<Long> searchNative(Long closetId, ClothingItemRequestDto.SearchCondition cond, Pageable pageable) {
        StringBuilder sql = new StringBuilder();
        sql.append("""
                    SELECT ci.id
                    FROM clothing_item ci
                    WHERE 1=1
                """);

        // (A) closet-only 제한
        if (closetId != null) {
            sql.append("""
                        AND ci.id IN (
                            SELECT cci.clothing_item_id
                            FROM closet_item cci
                            WHERE cci.closet_id = :closetId
                        )
                    """);
        }

        // (B) 조건
        if (cond != null) {
            if (cond.getClothingId() != null) {
                sql.append(" AND ci.clothing_id = :clothingId ");
            }
            if (cond.getTemp() != null) {
                sql.append(" AND ci.suitable_min_temp <= :temp AND ci.suitable_max_temp >= :temp ");
            }
            if (cond.getCategory() != null) {
                sql.append(" AND ci.category = :category ");
            }
            if (cond.getThicknessLevel() != null) {
                sql.append(" AND ci.thickness_level = :thicknessLevel ");
            }
            if (cond.getUsageTypes() != null && !cond.getUsageTypes().isEmpty()) {
                sql.append(" AND ci.usage_type IN (:usageTypes) ");
            }
            if (cond.getSeasons() != null && !cond.getSeasons().isEmpty()) {
                // ★중요: clothing_item_season은 clothing_item_id(PK) 기준
                sql.append("""
                            AND EXISTS (
                                SELECT 1
                                FROM clothing_item_season cis
                                WHERE cis.clothing_item_id = ci.id
                                  AND cis.season IN (:seasons)
                            )
                        """);
            }
        }

        // (C) 정렬
        String sort = (cond == null || cond.getSort() == null) ? "popular" : cond.getSort();
        if ("latest".equalsIgnoreCase(sort)) {
            sql.append(" ORDER BY ci.created_at DESC, ci.id DESC ");
        } else {
            sql.append(" ORDER BY ci.selected_count DESC, ci.id DESC ");
        }

        var q = em.createNativeQuery(sql.toString());

        if (closetId != null) q.setParameter("closetId", closetId);

        if (cond != null) {
            if (cond.getClothingId() != null) q.setParameter("clothingId", cond.getClothingId());
            if (cond.getTemp() != null) q.setParameter("temp", cond.getTemp());
            if (cond.getCategory() != null) q.setParameter("category", cond.getCategory().name());
            if (cond.getThicknessLevel() != null) q.setParameter("thicknessLevel", cond.getThicknessLevel().name());

            if (cond.getUsageTypes() != null && !cond.getUsageTypes().isEmpty()) {
                q.setParameter("usageTypes", cond.getUsageTypes().stream().map(Enum::name).toList());
            }
            if (cond.getSeasons() != null && !cond.getSeasons().isEmpty()) {
                q.setParameter("seasons", cond.getSeasons().stream().map(Enum::name).toList());
            }
        }

        if (pageable != null) {
            q.setFirstResult((int) pageable.getOffset());
            q.setMaxResults(pageable.getPageSize());
        }

        @SuppressWarnings("unchecked")
        List<Number> rows = q.getResultList();

        List<Long> out = new ArrayList<>(rows.size());
        for (Number n : rows) out.add(n.longValue());
        return out;
    }
}