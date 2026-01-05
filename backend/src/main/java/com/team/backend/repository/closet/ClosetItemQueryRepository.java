// src/main/java/com/team/backend/repository/closet/ClosetItemQueryRepository.java
package com.team.backend.repository.closet;

import java.util.List;

public interface ClosetItemQueryRepository {
    List<Long> findClothingIdsByClosetId(Long closetId);
}