// src/main/java/com/team/backend/service/session/SessionService.java
package com.team.backend.service.session;

import com.team.backend.common.time.TimeRanges;
import com.team.backend.repository.session.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionService {

    private final SessionRepository sessionRepository;

    public String issueAnonymousSessionKey() {
        String sessionKey = UUID.randomUUID().toString();
        while (sessionRepository.existsBySessionKey(sessionKey)) {
            sessionKey = UUID.randomUUID().toString();
        }
        sessionRepository.upsertTouch(sessionKey, TimeRanges.nowKst());
        return sessionKey;
    }

    /** WRITE 전용 */
    public void ensureSession(String sessionKey) {
        String key = requireUuidV4(sessionKey);
        sessionRepository.upsertTouch(key, TimeRanges.nowKst());
    }

    /** READ 전용(검증만) */
    public String validateOnly(String sessionKey) {
        return requireUuidV4(sessionKey);
    }

    private String requireUuidV4(String raw) {
        if (raw == null || raw.isBlank()) throw new IllegalArgumentException("X-Session-Key is required");
        String key = raw.trim();

        UUID uuid;
        try {
            uuid = UUID.fromString(key);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("X-Session-Key must be UUID v4");
        }
        if (uuid.version() != 4) throw new IllegalArgumentException("X-Session-Key must be UUID v4");
        return key;
    }
}