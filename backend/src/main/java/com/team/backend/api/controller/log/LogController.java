// src/main/java/com/team/backend/api/controller/log/LogController.java
package com.team.backend.api.controller.log;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.log.ItemClickLogCreateRequestDto;
import com.team.backend.api.dto.log.SessionLogRequestDto;
import com.team.backend.service.log.ItemClickLogService;
import com.team.backend.service.log.SessionLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/logs")
public class LogController {

    private static final String SESSION_KEY_HEADER = "X-Session-Key";

    private static final String PATH_CLICK = "/click";
    private static final String PATH_SESSION = "/session";

    private final ItemClickLogService itemClickLogService;
    private final SessionLogService sessionLogService;

    @PostMapping(PATH_CLICK)
    public ApiResponse<Void> logClick(
            @RequestBody @Valid ItemClickLogCreateRequestDto request,
            @RequestHeader(value = SESSION_KEY_HEADER, required = false) String sessionKeyHeader
    ) {
        request.fillSessionKeyIfMissing(sessionKeyHeader);
        itemClickLogService.write(request);
        return ApiResponse.success("클릭 로그가 저장되었습니다.", null);
    }

    @PostMapping(PATH_SESSION)
    public ApiResponse<Void> logSession(
            @RequestBody @Valid SessionLogRequestDto request,
            @RequestHeader(value = SESSION_KEY_HEADER, required = false) String sessionKeyHeader
    ) {
        request.fillSessionKeyIfMissing(sessionKeyHeader);
        sessionLogService.write(request);
        return ApiResponse.success("세션 로그가 저장되었습니다.", null);
    }
}