// src/main/java/com/team/backend/api/controller/session/SessionController.java
package com.team.backend.api.controller.session;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.session.SessionResponseDto;
import com.team.backend.service.session.SessionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Session")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/session")
public class SessionController {

    private final SessionService sessionService;

    @PostMapping
    public ApiResponse<SessionResponseDto> issue() {
        String sessionKey = sessionService.issueAnonymousSessionKey();
        return ApiResponse.success(SessionResponseDto.of(sessionKey));
    }
}