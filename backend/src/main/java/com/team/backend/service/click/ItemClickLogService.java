// src/main/java/com/team/backend/service/click/ItemClickLogService.java
package com.team.backend.service.click;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.backend.api.dto.log.ItemClickLogCreateRequestDto;
import com.team.backend.api.dto.log.ItemClickLogResponseDto;
import com.team.backend.repository.log.ItemClickLogWriterJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ItemClickLogService {
    private final ItemClickLogWriterJdbcRepository itemClickLogWriterJdbcRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public ItemClickLogResponseDto create(ItemClickLogCreateRequestDto req) {
        String payloadJson = null;

        if (req.getPayload() != null) {
            try {
                payloadJson = objectMapper.writeValueAsString(req.getPayload());
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("payload JSON 직렬화 실패", e);
            }
        }

        return itemClickLogWriterJdbcRepository.insert(
                req.getUserId(),
                req.getClothingItemId(),
                String.valueOf(req.getEventType()),
                payloadJson
        );
    }
}