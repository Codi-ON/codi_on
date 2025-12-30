// src/main/java/com/team/backend/api/controller/session/SessionController.java
package com.team.backend.api.controller.session;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.session.SessionResponseDto;
import com.team.backend.service.session.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Session", description = "익명 세션키 발급 API")
@RestController
@RequiredArgsConstructor
@RequestMapping(SessionController.API_PREFIX)
public class SessionController {

    public static final String API_PREFIX = "/api/session";

    private final SessionService sessionService;

    @Operation(summary = "익명 세션키 발급", description = "로그인 없이 세션키(UUID v4)를 발급합니다. 이후 X-Session-Key로 전달하세요.")
    @PostMapping
    public ApiResponse<SessionResponseDto> issue() {
        String sessionKey = sessionService.issueAnonymousSessionKey();
        return ApiResponse.success(SessionResponseDto.of(sessionKey));
    }
}