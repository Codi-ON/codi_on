package com.team.backend.repository;

import com.team.backend.api.dto.clothingItem.ClothingItemSearchRequestDto;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ClothingItemRepositoryCustom {

    /**
     * ✅ 동적 필터 기반 후보 ID 조회
     * - null 조건은 무시
     * - seasons는 하나라도 겹치면 통과(OR)
     * - temp는 suitableMinTemp <= temp <= suitableMaxTemp
     * - 정렬은 sort(popular/latest)에 따라 분기
     *
     * ⚠️ seasons(join) + paging 안정성을 위해 ID만 먼저 조회
     */
    List<Long> searchCandidateIds(ClothingItemSearchRequestDto req, Pageable pageable);
}