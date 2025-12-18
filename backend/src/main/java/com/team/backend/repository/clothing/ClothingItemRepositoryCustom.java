// src/main/java/com/team/backend/repository/clothing/ClothingItemRepositoryCustom.java
package com.team.backend.repository.clothing;

import com.team.backend.api.dto.clothingItem.ClothingItemRequestDto;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ClothingItemRepositoryCustom {
    List<Long> searchCandidateIds(ClothingItemRequestDto.SearchCondition cond, Pageable pageable);
}