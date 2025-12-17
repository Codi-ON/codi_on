// src/main/java/com/team/backend/api/controller/SessionLogController.java
package com.team.backend.api.controller.session;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.session.SessionLogRequestDto;
import com.team.backend.service.session.SessionLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/logs/session")
@RequiredArgsConstructor
public class SessionLogController {

    private final SessionLogService sessionLogService;

    /**
     * 세션 로그 쓰기용 테스트 API
     * - POST /api/logs/session
     * - body: SessionLogRequestDto (JSON)
     */
    @PostMapping
    public ApiResponse<Void> write(@RequestBody SessionLogRequestDto request) {
        sessionLogService.write(request);
        return ApiResponse.success(null);
    }
}