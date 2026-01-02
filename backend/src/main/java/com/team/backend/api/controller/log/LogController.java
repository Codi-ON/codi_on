// src/main/java/com/team/backend/api/controller/log/LogController.java
package com.team.backend.api.controller.log;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.log.ItemClickLogCreateRequestDto;
import com.team.backend.api.dto.session.SessionLogRequestDto;
import com.team.backend.service.click.ItemClickLogService;
import com.team.backend.service.session.SessionLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(LogController.API_PREFIX)
@RequiredArgsConstructor
public class LogController {

    public static final String API_PREFIX = "/api/logs";
    public static final String PATH_CLICK = "/click";
    public static final String PATH_SESSION = "/session";

    private static final String OK_MESSAGE = "요청이 성공했습니다.";

    private final ItemClickLogService itemClickLogService;
    private final SessionLogService sessionLogService;


    // LogController.java 내부

    @PostMapping(PATH_CLICK)
    public ApiResponse<Void> logClick(@RequestBody @Valid ItemClickLogCreateRequestDto request) {
        itemClickLogService.create(request);
        return ApiResponse.success("클릭 로그가 저장되었습니다.", null);
    }

    @PostMapping(PATH_SESSION)
    public ApiResponse<Void> logSession(@RequestBody @Valid SessionLogRequestDto request) {
        sessionLogService.write(request);
        return ApiResponse.success(OK_MESSAGE, null);
    }
}