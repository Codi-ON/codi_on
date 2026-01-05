package com.team.backend.repository.closet;

import jakarta.persistence.*;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class ClosetItemQueryRepositoryImpl implements ClosetItemQueryRepository {

    @PersistenceContext
    private EntityManager em;

    @Override
    public List<Long> findClothingIdsByClosetId(Long closetId) {
        if (closetId == null) return List.of();

        var q = em.createNativeQuery("""
            SELECT ci.clothing_id
            FROM closet_item ci
            WHERE ci.closet_id = :closetId
            ORDER BY ci.id ASC
        """);
        q.setParameter("closetId", closetId);

        @SuppressWarnings("unchecked")
        List<Number> rows = q.getResultList();

        List<Long> out = new ArrayList<>(rows.size());
        for (Number n : rows) out.add(n.longValue());
        return out;
    }
}