package com.team.backend.repository;

import com.team.backend.api.dto.clothingItem.ClothingItemSearchRequestDto;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.SeasonType;
import com.team.backend.domain.enums.UsageType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class ClothingItemRepositoryImpl implements ClothingItemRepositoryCustom {

    @PersistenceContext
    private EntityManager em;

    @Override
    public List<Long> searchCandidateIds(ClothingItemSearchRequestDto req, Pageable pageable) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);

        Root<ClothingItem> c = cq.from(ClothingItem.class);
        cq.select(c.get("id")); // ✅ distinct 제거

        List<Predicate> predicates = new ArrayList<>();

        // 1) temp: suitableMinTemp <= temp <= suitableMaxTemp
        if (req.getTemp() != null) {
            Integer temp = req.getTemp();
            predicates.add(cb.lessThanOrEqualTo(c.get("suitableMinTemp"), temp));
            predicates.add(cb.greaterThanOrEqualTo(c.get("suitableMaxTemp"), temp));
        }

        // 2) category
        if (req.getCategory() != null) {
            predicates.add(cb.equal(c.get("category"), req.getCategory()));
        }

        // 3) thicknessLevel
        if (req.getThicknessLevel() != null) {
            predicates.add(cb.equal(c.get("thicknessLevel"), req.getThicknessLevel()));
        }

        // 4) usageType (INDOOR/OUTDOOR면 BOTH 포함)
        if (req.getUsageType() != null) {
            UsageType u = req.getUsageType();
            if (u == UsageType.INDOOR || u == UsageType.OUTDOOR) {
                predicates.add(c.get("usageType").in(u, UsageType.BOTH));
            } else {
                predicates.add(cb.equal(c.get("usageType"), UsageType.BOTH));
            }
        }

        // 5) seasons: 하나라도 겹치면 통과(OR)
        //    seasons join 때문에 row가 중복될 수 있으므로 -> GROUP BY로 정리할 것
        if (req.getSeasons() != null && !req.getSeasons().isEmpty()) {
            Join<ClothingItem, SeasonType> s = c.join("seasons", JoinType.INNER);
            predicates.add(s.in(req.getSeasons()));
        }

        cq.where(predicates.toArray(new Predicate[0]));

        // ✅ Postgres 대응: ORDER BY에 쓰는 컬럼을 GROUP BY에 포함
        // (seasons 조인으로 중복도 정리됨)
        cq.groupBy(
                c.get("id"),
                c.get("createdAt"),
                c.get("selectedCount")
        );

        // 6) sort
        String sort = req.resolvedSort();
        if ("latest".equalsIgnoreCase(sort)) {
            cq.orderBy(cb.desc(c.get("createdAt")), cb.desc(c.get("id")));
        } else {
            cq.orderBy(cb.desc(c.get("selectedCount")), cb.desc(c.get("id")));
        }

        TypedQuery<Long> query = em.createQuery(cq);

        // pageable 적용
        if (pageable != null) {
            query.setFirstResult((int) pageable.getOffset());
            query.setMaxResults(pageable.getPageSize());
        }

        return query.getResultList();
    }
}