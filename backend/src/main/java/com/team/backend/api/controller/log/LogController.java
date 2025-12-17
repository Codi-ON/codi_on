// src/main/java/com/team/backend/api/controller/log/LogController.java
package com.team.backend.api.controller.log;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.recommendation.ItemClickLogRequestDto;
import com.team.backend.api.dto.session.SessionLogRequestDto;
import com.team.backend.service.click.ClickLogService;
import com.team.backend.service.session.SessionLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class LogController {

    private final ClickLogService clickLogService;
    private final SessionLogService sessionLogService;

    @PostMapping("/click")
    public ApiResponse<Void> logClick(@RequestBody @Valid ItemClickLogRequestDto request) {
        clickLogService.logClick(request);
        return ApiResponse.success("요청이 성공했습니다.", null);
    }

    @PostMapping("/session")
    public ApiResponse<Void> logSession(@RequestBody @Valid SessionLogRequestDto request) {
        sessionLogService.write(request); // 또는 sessionLogService.logSession(request)
        return ApiResponse.success("요청이 성공했습니다.", null);
    }
}