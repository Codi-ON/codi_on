// src/main/java/com/team/backend/service/SessionLogQueryService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.session.SessionLogResponseDto;
import com.team.backend.repository.log.SessionLogJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionLogAdminService {

    private final SessionLogJdbcRepository sessionLogJdbcRepository;

    public List<SessionLogResponseDto> getRecent(int limit) {
        return sessionLogJdbcRepository.findRecent(limit);
    }

    public List<SessionLogResponseDto> getByCreatedAtBetween(
            OffsetDateTime from,
            OffsetDateTime to,
            int limit
    ) {
        return sessionLogJdbcRepository.findByCreatedAtBetween(from, to, limit);
    }
}