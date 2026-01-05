package com.team.backend.repository.clothing;

import com.team.backend.api.dto.clothingItem.ClothingItemRequestDto;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ClothingItemRepositoryCustom {

    List<Long> searchCandidateIds(ClothingItemRequestDto.SearchCondition cond, Pageable pageable);

    /**
     * closet_item 기반 후보 검색 (추천 후보풀은 “옷장”만 사용)
     * 반환: clothing_item PK(id)
     */
    List<Long> searchCandidateIdsInCloset(Long closetId, ClothingItemRequestDto.SearchCondition cond, Pageable pageable);
}