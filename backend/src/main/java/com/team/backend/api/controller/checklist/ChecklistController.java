// src/main/java/com/team/backend/api/controller/checklist/ChecklistController.java
package com.team.backend.api.controller.checklist;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.checklist.ChecklistSubmitRequestDto;
import com.team.backend.api.dto.checklist.ChecklistSubmitResponseDto;
import com.team.backend.service.checklist.ChecklistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/checklist")
public class ChecklistController {

    private static final String SESSION_KEY_HEADER = "X-Session-Key";

    private final ChecklistService checklistService;

    /**
     * 체크리스트 제출 (오늘 기준 멱등)
     */
    @PostMapping("/submit")
    public ApiResponse<ChecklistSubmitResponseDto> submit(
            @RequestHeader(SESSION_KEY_HEADER) String sessionKey,
            @RequestBody @Valid ChecklistSubmitRequestDto request
    ) {
        return ApiResponse.success(checklistService.submitToday(sessionKey, request));
    }


    @GetMapping("/today")
    public ApiResponse<ChecklistSubmitResponseDto> today(
            @RequestHeader(SESSION_KEY_HEADER) String sessionKey
    ) {

        return ApiResponse.success(checklistService.getToday(sessionKey));
    }
}