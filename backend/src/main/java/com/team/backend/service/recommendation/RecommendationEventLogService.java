// src/main/java/com/team/backend/service/recommendation/RecommendationEventLogService.java
package com.team.backend.service.recommendation;

import com.team.backend.api.dto.recommendation.RecommendationEventLogResponseDto;
import com.team.backend.domain.log.RecommendationEventLog;
import com.team.backend.repository.log.RecommendationEventLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationEventLogService {

    private final RecommendationEventLogRepository recommendationEventLogRepository;

    public List<RecommendationEventLogResponseDto> getRecent(int limit) {
        List<RecommendationEventLog> logs =
                recommendationEventLogRepository.findAll(PageRequest.of(0, limit)).getContent();

        return logs.stream()
                .map(RecommendationEventLogResponseDto::from)
                .toList();
    }

    public List<RecommendationEventLogResponseDto> getByCreatedAtBetween(
            OffsetDateTime from,
            OffsetDateTime to,
            int limit
    ) {
        List<RecommendationEventLog> logs =
                recommendationEventLogRepository.findLogs(from, to, PageRequest.of(0, limit));

        return logs.stream()
                .map(RecommendationEventLogResponseDto::from)
                .toList();
    }
}