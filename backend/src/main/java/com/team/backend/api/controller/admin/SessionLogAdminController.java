// src/main/java/com/team/backend/api/controller/admin/SessionLogAdminController.java
package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.session.SessionLogResponseDto;
import com.team.backend.repository.SessionLogAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/session-logs")
@RequiredArgsConstructor
public class SessionLogAdminController {

    private final SessionLogAdminService sessionLogAdminService;

    @GetMapping("/recent")
    public ApiResponse<List<SessionLogResponseDto>> getRecent(
            @RequestParam(name = "limit", defaultValue = "100") int limit
    ) {
        return ApiResponse.success(sessionLogAdminService.getRecent(limit));
    }

    @GetMapping("/range")
    public ApiResponse<List<SessionLogResponseDto>> getByRange(
            @RequestParam("from")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime from,
            @RequestParam("to")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime to,
            @RequestParam(name = "limit", defaultValue = "200") int limit
    ) {
        return ApiResponse.success(
                sessionLogAdminService.getByCreatedAtBetween(from, to, limit)
        );
    }
}