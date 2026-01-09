// src/main/java/com/team/backend/repository/closet/ClosetItemQueryRepository.java
package com.team.backend.repository.closet;

import com.team.backend.domain.enums.ClothingCategory;

import java.util.List;

public interface ClosetItemQueryRepository {
    List<Long> findClothingIdsByClosetId(Long closetId);
    List<Long> findClothingIdsByClosetId(Long closetId, ClothingCategory category, int limit);
}