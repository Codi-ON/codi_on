// src/main/java/com/team/backend/service/admin/SessionLogAdminService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.session.SessionLogResponseDto;
import com.team.backend.common.time.TimeRanges;
import com.team.backend.repository.log.SessionLogJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionLogAdminService {

    private static final int DEFAULT_LIMIT = 100;
    private static final int MAX_LIMIT = 1000;

    private final SessionLogJdbcRepository sessionLogJdbcRepository;

    public List<SessionLogResponseDto> getRecent(int limit) {
        return sessionLogJdbcRepository.findRecent(clamp(limit));
    }

    public List<SessionLogResponseDto> getRange(LocalDate from, LocalDate to, int limit) {
        if (from == null || to == null) throw new IllegalArgumentException("from/to는 필수입니다.");
        TimeRanges.Range r = TimeRanges.kstDayRange(from, to); // [from 00:00, to+1 00:00)
        return sessionLogJdbcRepository.findByCreatedAtBetween(r.fromInclusive(), r.toExclusive(), clamp(limit));
    }

    private int clamp(int v) {
        int x = (v <= 0 ? DEFAULT_LIMIT : v);
        return Math.min(x, MAX_LIMIT);
    }
}