// src/main/java/com/team/backend/service/session/SessionService.java
package com.team.backend.service.session;

import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SessionService {

    /**
     * 익명 세션키 발급
     * - 로그인/DB 없이 프론트에서 X-Session-Key로 붙일 수 있게 UUID 기반으로 발급
     * - 추후 USER_SESSION 테이블/만료 정책/디바이스 바인딩으로 확장 가능
     */
    public String issueAnonymousSessionKey() {
        return UUID.randomUUID().toString();
    }
}