// src/main/java/com/team/backend/repository/clothing/ClothingItemRepositoryImpl.java
package com.team.backend.repository.clothing;

import com.team.backend.api.dto.clothingItem.ClothingItemRequestDto;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.SeasonType;
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
    public List<Long> searchCandidateIds(ClothingItemRequestDto.SearchCondition cond, Pageable pageable) {

        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);

        Root<ClothingItem> c = cq.from(ClothingItem.class);
        cq.select(c.get("id")); // distinct 제거(중복은 groupBy로 정리)

        List<Predicate> predicates = new ArrayList<>();

        if (cond != null) {

            // 0) clothingId (business key)
            if (cond.getClothingId() != null) {
                predicates.add(cb.equal(c.get("clothingId"), cond.getClothingId()));
            }

            // 1) temp: suitableMinTemp <= temp <= suitableMaxTemp
            if (cond.getTemp() != null) {
                Integer temp = cond.getTemp();
                predicates.add(cb.lessThanOrEqualTo(c.get("suitableMinTemp"), temp));
                predicates.add(cb.greaterThanOrEqualTo(c.get("suitableMaxTemp"), temp));
            }

            // 2) category
            if (cond.getCategory() != null) {
                predicates.add(cb.equal(c.get("category"), cond.getCategory()));
            }

            // 3) thicknessLevel
            if (cond.getThicknessLevel() != null) {
                predicates.add(cb.equal(c.get("thicknessLevel"), cond.getThicknessLevel()));
            }

            // 4) usageTypes (Search에서 INDOOR/OUTDOOR면 BOTH 포함해서 넘어옴)
            if (cond.getUsageTypes() != null && !cond.getUsageTypes().isEmpty()) {
                predicates.add(c.get("usageType").in(cond.getUsageTypes()));
            }

            // 5) seasons: 하나라도 겹치면 통과(OR)
            if (cond.getSeasons() != null && !cond.getSeasons().isEmpty()) {
                Join<ClothingItem, SeasonType> s = c.join("seasons", JoinType.INNER);
                predicates.add(s.in(cond.getSeasons()));
            }
        }

        cq.where(predicates.toArray(new Predicate[0]));

        // Postgres 대응: ORDER BY 컬럼은 GROUP BY에 포함(조인 중복도 정리됨)
        cq.groupBy(
                c.get("id"),
                c.get("createdAt"),
                c.get("selectedCount")
        );

        // 6) sort
        String sort = (cond == null ? "popular" : cond.getSort());
        if ("latest".equalsIgnoreCase(sort)) {
            cq.orderBy(cb.desc(c.get("createdAt")), cb.desc(c.get("id")));
        } else {
            cq.orderBy(cb.desc(c.get("selectedCount")), cb.desc(c.get("id")));
        }

        TypedQuery<Long> query = em.createQuery(cq);

        if (pageable != null) {
            query.setFirstResult((int) pageable.getOffset());
            query.setMaxResults(pageable.getPageSize());
        }

        return query.getResultList();
    }
}