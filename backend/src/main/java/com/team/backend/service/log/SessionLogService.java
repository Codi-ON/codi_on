// src/main/java/com/team/backend/service/log/SessionLogService.java
package com.team.backend.service.log;

import com.team.backend.api.dto.log.SessionLogRequestDto;
import com.team.backend.repository.log.SessionLogJdbcRepository;
import com.team.backend.repository.session.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;

@Service
@RequiredArgsConstructor
public class SessionLogService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final SessionLogJdbcRepository sessionLogRepo;
    private final SessionRepository sessionRepo;

    /**
     * 정책 (MVP)
     * - sessionKey 필수
     * - eventType 필수 (문자열로 저장)
     * - eventType 대문자 정규화
     * - payload null이면 {} 로 저장
     * - 로그가 찍히면 session.last_seen_at도 같이 갱신 (upsertTouch)
     */
    @Transactional
    public void write(SessionLogRequestDto dto) {
        if (dto == null) throw new IllegalArgumentException("dto is null");

        String sessionKey = trimToNull(dto.getSessionKey());
        if (sessionKey == null) throw new IllegalArgumentException("sessionKey는 필수입니다.");

        String eventType = trimToNull(dto.getEventType());
        if (eventType == null) throw new IllegalArgumentException("eventType은 필수입니다.");

        dto.setSessionKey(sessionKey);
        dto.setEventType(eventType.toUpperCase());

        if (dto.getPayload() == null) {
            dto.setPayload(new LinkedHashMap<>()); // {} 저장
        }

        if (dto.getCreatedAt() == null) {
            dto.setCreatedAt(OffsetDateTime.now(KST));
        }

        // 1) session upsert touch
        sessionRepo.upsertTouch(sessionKey, dto.getCreatedAt());

        // 2) session_log insert
        sessionLogRepo.insert(dto);
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}