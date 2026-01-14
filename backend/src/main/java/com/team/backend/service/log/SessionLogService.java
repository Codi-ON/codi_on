package com.team.backend.service.log;

import com.team.backend.api.dto.log.SessionLogRequestDto;
import com.team.backend.domain.enums.session.SessionEventType;
import com.team.backend.repository.log.SessionLogJdbcRepository;
import com.team.backend.service.session.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class SessionLogService {

    private final SessionService sessionService;
    private final SessionLogJdbcRepository repo;

    public void write(SessionLogRequestDto dto) {
        if (dto == null) throw new IllegalArgumentException("dto is null");
        if (dto.getSessionKey() == null || dto.getSessionKey().isBlank())
            throw new IllegalArgumentException("sessionKey is required");
        if (dto.getEventType() == null || dto.getEventType().isBlank())
            throw new IllegalArgumentException("eventType is required");

        // ✅ eventType 제한
        SessionEventType type;
        try {
            type = SessionEventType.valueOf(dto.getEventType());
        } catch (Exception e) {
            throw new IllegalArgumentException("invalid eventType. allowed=" + java.util.Arrays.toString(SessionEventType.values()));
        }

        String key = sessionService.validateOnly(dto.getSessionKey());
        sessionService.ensureSession(key);

        Map<String, Object> payload = dto.getPayload() == null ? new LinkedHashMap<>() : new LinkedHashMap<>(dto.getPayload());

        // ✅ payload 최소 키: page
        Object pageObj = payload.get("page");
        if (pageObj == null || Objects.toString(pageObj, "").isBlank())
            throw new IllegalArgumentException("payload.page is required");

        // START/END는 action 권장(강제하려면 if로 throw)
        if (type == SessionEventType.START) {
            payload.putIfAbsent("action", "enter");
        } else if (type == SessionEventType.END) {
            payload.putIfAbsent("action", "leave");
        }

        SessionLogRequestDto fixed = SessionLogRequestDto.builder()
                .createdAt(dto.getCreatedAt())
                .userId(dto.getUserId())
                .sessionKey(key)
                .eventType(dto.getEventType())
                .payload(payload)
                .build();

        repo.insert(fixed);
    }
}