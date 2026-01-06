// src/main/java/com/team/backend/service/log/ItemClickLogService.java
package com.team.backend.service.log;

import com.team.backend.api.dto.log.ItemClickLogCreateRequestDto;
import com.team.backend.service.session.SessionService;
import com.team.backend.repository.log.ItemClickLogJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ItemClickLogService {

    private final SessionService sessionService;
    private final ItemClickLogJdbcRepository repo;

    public void write(ItemClickLogCreateRequestDto dto) {
        if (dto == null) throw new IllegalArgumentException("dto is null");
        if (dto.getSessionKey() == null || dto.getSessionKey().isBlank())
            throw new IllegalArgumentException("sessionKey is required");
        if (dto.getEventType() == null || dto.getEventType().isBlank())
            throw new IllegalArgumentException("eventType is required");
        if (dto.getClothingItemId() == null)
            throw new IllegalArgumentException("clothingItemId is required");

        String key = sessionService.validateOnly(dto.getSessionKey());
        sessionService.ensureSession(key);

        ItemClickLogCreateRequestDto fixed = ItemClickLogCreateRequestDto.builder()
                .createdAt(dto.getCreatedAt())
                .userId(dto.getUserId())
                .sessionKey(key)
                .recommendationId(dto.getRecommendationId())
                .clothingItemId(dto.getClothingItemId())
                .eventType(dto.getEventType())
                .payload(dto.getPayload())
                .build();

        repo.insert(fixed);
    }
}