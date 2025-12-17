package com.team.backend.service;

import com.team.backend.api.dto.recommendation.RecommendationEventLogResponseDto;
import com.team.backend.api.dto.recommendation.RecommendationEventLogRequestDto;
import com.team.backend.repository.log.RecommendationEventLogJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationEventLogService {

    private final RecommendationEventLogJdbcRepository recommendationEventLogQuery;

    /**
     * 최근 로그 N개 조회 (관리자용)
     */
    public List<RecommendationEventLogResponseDto> getRecent(int limit) {
        List<RecommendationEventLogRequestDto> rows = recommendationEventLogQuery.findRecent(limit);
        return rows.stream()
                .map(RecommendationEventLogResponseDto::from)
                .toList();
    }

    /**
     * 기간 필터 기반 로그 조회
     * - from <= created_at < to
     */
    public List<RecommendationEventLogResponseDto> getByCreatedAtBetween(
            OffsetDateTime from,
            OffsetDateTime to,
            int limit
    ) {
        List<RecommendationEventLogRequestDto> rows =
                recommendationEventLogQuery.findByCreatedAtBetween(from, to, limit);

        return rows.stream()
                .map(RecommendationEventLogResponseDto::from)
                .toList();
    }
}