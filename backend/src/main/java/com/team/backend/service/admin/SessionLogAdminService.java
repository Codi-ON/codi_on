// src/main/java/com/team/backend/service/admin/SessionLogAdminService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.session.SessionLogResponseDto;
import com.team.backend.repository.log.SessionLogJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionLogAdminService {

    private static final ZoneOffset KST = ZoneOffset.ofHours(9);

    private final SessionLogJdbcRepository sessionLogJdbcRepository;

    public List<SessionLogResponseDto> getRecent(int limit) {
        return sessionLogJdbcRepository.findRecent(limit);
    }

    public List<SessionLogResponseDto> getRange(LocalDate from, LocalDate to, int limit) {
        OffsetDateTime fromAt = from.atStartOfDay().atOffset(KST);
        OffsetDateTime toAt = to.plusDays(1).atStartOfDay().atOffset(KST).minusNanos(1);
        return sessionLogJdbcRepository.findByCreatedAtBetween(fromAt, toAt, limit);
    }
}