// src/main/java/com/team/backend/service/session/SessionLogService.java
package com.team.backend.service.log;

import com.team.backend.api.dto.log.SessionLogRequestDto;
import com.team.backend.repository.log.SessionLogJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SessionLogService {

    private final SessionLogJdbcRepository repo;

    public void write(SessionLogRequestDto dto) {
        if (dto == null) throw new IllegalArgumentException("dto is null");
        if (dto.getEventType() == null || dto.getEventType().isBlank())
            throw new IllegalArgumentException("eventType은 필수입니다.");
        if (dto.getSessionKey() == null || dto.getSessionKey().isBlank())
            throw new IllegalArgumentException("sessionKey는 필수입니다.");

        repo.insert(dto);
    }
}