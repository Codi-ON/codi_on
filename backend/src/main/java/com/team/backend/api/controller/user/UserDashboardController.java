// src/main/java/com/team/backend/api/controller/user/UserDashboardController.java
package com.team.backend.api.controller.user;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.user.UserDashboardRequest;
import com.team.backend.api.dto.user.UserDashboardResponse;
import com.team.backend.service.user.UserDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user/dashboard")
public class UserDashboardController {

    private final UserDashboardService userDashboardService;

    /**
     * GET /api/user/dashboard/overview?year=YYYY&month=MM
     * Header: X-Session-Key 필수 (없으면 400)
     */
    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<UserDashboardResponse>> overview(
            @RequestHeader(value = "X-Session-Key", required = false) String sessionKey,
            @ModelAttribute UserDashboardRequest req
    ) {
        if (sessionKey == null || sessionKey.isBlank()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.<UserDashboardResponse>builder()
                            .success(false)
                            .code("BAD_REQUEST")
                            .message("X-Session-Key is required")
                            .data(null)
                            .build()
            );
        }

        try {
            UserDashboardResponse res = userDashboardService.getOverview(sessionKey, req);
            return ResponseEntity.ok(ApiResponse.success(res));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.<UserDashboardResponse>builder()
                            .success(false)
                            .code("BAD_REQUEST")
                            .message(e.getMessage())
                            .data(null)
                            .build()
            );
        }
    }
}