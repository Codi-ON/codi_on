package com.team.backend.api.dto.clothingItem;

import com.team.backend.domain.enums.*;
import lombok.*;

import java.util.Set;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClothingItemSearchRequestDto {

    private ClothingCategory category;
    private Integer temp;

    private Long clothingId;

    // 하나라도 겹치면 통과(OR)
    private Set<SeasonType> seasons;

    // UX: INDOOR/OUTDOOR 선택 시 BOTH 포함해서 조회하는 정책을 서버에서 처리
    private UsageType usageType;

    private ThicknessLevel thicknessLevel;

    // popular | latest (기본 popular)
    private String sort;

    // 기본 20, 최대 50 권장
    private Integer limit;

    public int resolvedLimit() {
        int v = (limit == null ? 20 : limit);
        return Math.min(Math.max(v, 1), 50);
    }

    public String resolvedSort() {
        return (sort == null || sort.isBlank()) ? "popular" : sort;
    }
}