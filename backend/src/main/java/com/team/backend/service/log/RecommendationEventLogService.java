// src/main/java/com/team/backend/service/log/RecommendationEventLogService.java
package com.team.backend.service.log;

import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import com.team.backend.repository.log.RecommendationEventLogJdbcRepository;
import com.team.backend.service.session.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class RecommendationEventLogService {

    private final SessionService sessionService;
    private final RecommendationEventLogJdbcRepository repo;

    public void write(RecommendationEventLogRequestDto dto) {
        if (dto == null) throw new IllegalArgumentException("dto is null");
        if (dto.getEventType() == null || dto.getEventType().isBlank()) {
            throw new IllegalArgumentException("eventType is required");
        }
        if (dto.getSessionKey() == null || dto.getSessionKey().isBlank()) {
            throw new IllegalArgumentException("sessionKey is required");
        }

        // 1) 세션키 검증/정규화
        String normalizedKey = sessionService.validateOnly(dto.getSessionKey());

        // 2) 세션 ensure
        sessionService.ensureSession(normalizedKey);

        // 3) 정규화된 세션키로 저장 DTO 구성 + insert
        RecommendationEventLogRequestDto toSave = RecommendationEventLogRequestDto.builder()
                .createdAt(dto.getCreatedAt())
                .userId(dto.getUserId())
                .sessionKey(normalizedKey)
                .recommendationId(dto.getRecommendationId())
                .funnelStep(dto.getFunnelStep())
                .eventType(dto.getEventType())
                .payload(dto.getPayload())
                .build();

        repo.insert(toSave);
    }
}