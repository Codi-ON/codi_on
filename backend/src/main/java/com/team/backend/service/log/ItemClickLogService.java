package com.team.backend.service.log;

import com.team.backend.api.dto.log.ItemClickLogCreateRequestDto;
import com.team.backend.domain.enums.log.ItemClickEventType;
import com.team.backend.repository.log.ItemClickLogJdbcRepository;
import com.team.backend.service.session.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Objects;

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

        ItemClickEventType type;
        try {
            type = ItemClickEventType.valueOf(dto.getEventType());
        } catch (Exception e) {
            throw new IllegalArgumentException("invalid eventType. allowed=" + java.util.Arrays.toString(ItemClickEventType.values()));
        }

        // ✅ session normalize + ensure
        String key = sessionService.validateOnly(dto.getSessionKey());
        sessionService.ensureSession(key);

        // ✅ feedbackId(UUID) 없으면 클릭을 추천과 묶을 수 없음 -> 400
        if (dto.getRecommendationUuid() == null) {
            throw new IllegalArgumentException("recommendationUuid(feedbackId) is required");
        }

        // ✅ payload 최소 키 강제: funnelStep, page, ui
        Map<String, Object> payload = dto.payloadOrEmpty();
        Object funnelStepObj = payload.get("funnelStep");
        Object pageObj = payload.get("page");
        Object uiObj = payload.get("ui");

        if (funnelStepObj == null || Objects.toString(funnelStepObj, "").isBlank())
            throw new IllegalArgumentException("payload.funnelStep is required");
        if (pageObj == null || Objects.toString(pageObj, "").isBlank())
            throw new IllegalArgumentException("payload.page is required");
        if (uiObj == null || Objects.toString(uiObj, "").isBlank())
            throw new IllegalArgumentException("payload.ui is required");

        String funnelStep = Objects.toString(funnelStepObj);

        if (type == ItemClickEventType.RECO_SHOWN) {

        }
        if (type == ItemClickEventType.ITEM_CLICKED) {

        }

        // sessionKey만 정규화해서 저장
        ItemClickLogCreateRequestDto fixed = ItemClickLogCreateRequestDto.builder()
                .createdAt(dto.getCreatedAt())
                .userId(dto.getUserId())
                .sessionKey(key)
                .recommendationId(dto.getRecommendationId())
                .recommendationUuid(dto.getRecommendationUuid())
                .clothingItemId(dto.getClothingItemId())
                .eventType(dto.getEventType())
                .payload(payload)
                .build();

        repo.insert(fixed, funnelStep);
    }
}