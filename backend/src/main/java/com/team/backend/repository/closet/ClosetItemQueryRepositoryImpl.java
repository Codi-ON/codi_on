// src/main/java/com/team/backend/repository/closet/ClosetItemQueryRepositoryImpl.java
package com.team.backend.repository.closet;

import com.team.backend.domain.enums.ClothingCategory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class ClosetItemQueryRepositoryImpl implements ClosetItemQueryRepository {

    private static final int LIMIT_MAX = 200;

    @PersistenceContext
    private EntityManager em;

    @Override
    public List<Long> findClothingIdsByClosetId(Long closetId) {
        if (closetId == null) return List.of();

        var q = em.createNativeQuery("""
                SELECT ci.clothing_item_id
                FROM public.closet_item ci
                WHERE ci.closet_id = :closetId
                ORDER BY ci.id ASC
                """);
        q.setParameter("closetId", closetId);

        @SuppressWarnings("unchecked")
        List<Number> rows = q.getResultList(); // ✅ 여기 getResultList("limit") 아님

        List<Long> out = new ArrayList<>(rows.size());
        for (Number n : rows) out.add(n.longValue());
        return out;
    }

    @Override
    public List<Long> findClothingIdsByClosetId(Long closetId, ClothingCategory category, int limit) {
        if (closetId == null) return List.of();
        int safeLimit = Math.max(1, Math.min(limit, LIMIT_MAX));

        var q = em.createNativeQuery("""
                SELECT ci.clothing_item_id
                FROM public.closet_item ci
                JOIN public.clothing_item c ON c.id = ci.clothing_item_id
                WHERE ci.closet_id = :closetId
                  AND (:category IS NULL OR c.category = :category)
                ORDER BY ci.id ASC
                LIMIT :limit
                """);

        q.setParameter("closetId", closetId);
        q.setParameter("category", category == null ? null : category.name());
        q.setParameter("limit", safeLimit);

        @SuppressWarnings("unchecked")
        List<Number> rows = q.getResultList();

        List<Long> out = new ArrayList<>(rows.size());
        for (Number n : rows) out.add(n.longValue());
        return out;
    }
}