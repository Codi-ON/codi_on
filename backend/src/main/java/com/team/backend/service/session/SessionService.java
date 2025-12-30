// src/main/java/com/team/backend/service/session/SessionService.java
package com.team.backend.service.session;

import com.team.backend.domain.session.Session;
import com.team.backend.repository.session.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final SessionRepository sessionRepository;

    /**
     * 익명 세션키 발급
     * - 프론트 계약: UUID v4 문자열 그대로
     */
    public String issueAnonymousSessionKey() {
        OffsetDateTime now = OffsetDateTime.now(KST);

        String sessionKey = UUID.randomUUID().toString();
        while (sessionRepository.existsBySessionKey(sessionKey)) {
            sessionKey = UUID.randomUUID().toString();
        }

        sessionRepository.save(Session.builder()
                .sessionKey(sessionKey)
                .lastSeenAt(now.toLocalDateTime())
                .build());

        return sessionKey;
    }

    /**
     * READ에서도 사용할 수 있는 "검증 전용"
     * - DB write 없음
     */
    @Transactional(readOnly = true)
    public String requireUuidV4(String sessionKey) {
        if (sessionKey == null || sessionKey.isBlank()) {
            throw new IllegalArgumentException("X-Session-Key is required");
        }

        String key = sessionKey.trim();

        UUID uuid;
        try {
            uuid = UUID.fromString(key);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("X-Session-Key must be UUID v4");
        }

        if (uuid.version() != 4) {
            throw new IllegalArgumentException("X-Session-Key must be UUID v4");
        }

        return key;
    }

    /**
     * 세션 보장 (upsert + touch)
     * - WRITE API에서만 호출할 것
     * - 정상 반환값(정규화된 key)을 리턴해서 서비스에서 그대로 사용
     */
    public String ensureSession(String sessionKey) {
        String key = requireUuidV4(sessionKey); // 검증
        OffsetDateTime now = OffsetDateTime.now(KST);
        sessionRepository.upsertTouch(key, now);
        return key;
    }
}