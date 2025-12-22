// src/main/java/com/team/backend/service/recommendation/RecommendationEventLogService.java
package com.team.backend.service.recommendation;

import com.team.backend.api.dto.recommendation.RecommendationEventLogRequestDto;
import com.team.backend.api.dto.recommendation.RecommendationEventLogResponseDto;
import com.team.backend.domain.enums.recommendation.RecommendationEventType;
import com.team.backend.repository.log.RecommendationEventLogJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendationEventLogService {

    private final RecommendationEventLogJdbcRepository repo;

    public void write(RecommendationEventLogRequestDto dto) {
        if (dto == null) throw new IllegalArgumentException("dto is null");
        if (dto.getEventType() == null) throw new IllegalArgumentException("eventType은 필수입니다.");

        boolean hasSessionId = dto.getSessionId() != null;
        boolean hasSessionKey = dto.getSessionKey() != null && !dto.getSessionKey().isBlank();
        if (!hasSessionId && !hasSessionKey) {
            throw new IllegalArgumentException("sessionId 또는 sessionKey 둘 중 하나는 필수입니다.");
        }

        repo.write(dto);
    }

    public List<RecommendationEventLogResponseDto> recent(Integer limit) {
        return repo.findRecent(limit);
    }

    public List<RecommendationEventLogResponseDto> range(
            OffsetDateTime from,
            OffsetDateTime to,
            List<RecommendationEventType> eventTypes,
            Integer limit
    ) {
        if (from == null || to == null) throw new IllegalArgumentException("from/to는 필수입니다.");
        if (!from.isBefore(to)) throw new IllegalArgumentException("from은 to보다 과거여야 합니다.");

        return repo.findRange(from, to, eventTypes, limit);
    }
}