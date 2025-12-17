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
    private static final int DEFAULT_LIMIT = 100;
    private static final int MAX_LIMIT = 1000;

    private final SessionLogJdbcRepository sessionLogJdbcRepository;

    /**
     * 최근 세션 로그 조회
     * GET /api/admin/session-logs/recent?limit=100
     */
    public List<SessionLogResponseDto> getRecent(int limit) {
        return sessionLogJdbcRepository.findRecent(clamp(limit));
    }

    /**
     * 기간 세션 로그 조회 (date-only)
     * GET /api/admin/session-logs/range?from=2025-12-01&to=2025-12-22&limit=100
     */
    public List<SessionLogResponseDto> getRange(LocalDate from, LocalDate to, int limit) {
        OffsetDateTime fromAt = from.atStartOfDay().atOffset(KST);
        OffsetDateTime toAt = to.plusDays(1).atStartOfDay().atOffset(KST).minusNanos(1);
        return sessionLogJdbcRepository.findByCreatedAtBetween(fromAt, toAt, clamp(limit));
    }

    private int clamp(int v) {
        int x = (v <= 0 ? DEFAULT_LIMIT : v);
        return Math.min(x, MAX_LIMIT);
    }
}