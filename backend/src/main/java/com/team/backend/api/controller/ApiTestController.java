package com.team.backend.api.controller;

import com.team.backend.api.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class ApiTestController {

    /**
     * 1) 기본 성공 응답 테스트
     * GET /api/test/success
     */
    @GetMapping("/success")
    public ApiResponse<String> successTest() {
        return ApiResponse.success("테스트 성공 데이터");
        // JSON 예시
        // {
        //   "success": true,
        //   "code": "SUCCESS",
        //   "message": "요청이 성공했습니다.",
        //   "data": "테스트 성공 데이터"
        // }
    }

    /**
     * 2) 유효성 에러 예시
     * GET /api/test/validation-error
     */
    @GetMapping("/validation-error")
    public ApiResponse<Void> validationErrorTest() {
        return ApiResponse.fail(
                "VALIDATION_ERROR",
                "필수 값이 누락되었습니다."
        );
        // {
        //   "success": false,
        //   "code": "VALIDATION_ERROR",
        //   "message": "필수 값이 누락되었습니다.",
        //   "data": null
        // }
    }

    /**
     * 3) 인증 에러 예시
     * GET /api/test/auth-error
     */
    @GetMapping("/auth-error")
    public ApiResponse<Void> authErrorTest() {
        return ApiResponse.fail(
                "AUTH_REQUIRED",
                "로그인이 필요합니다."
        );
        // {
        //   "success": false,
        //   "code": "AUTH_REQUIRED",
        //   "message": "로그인이 필요합니다.",
        //   "data": null
        // }
    }

    /**
     * 4) 서버 에러 예시
     * GET /api/test/server-error
     */
    @GetMapping("/server-error")
    public ApiResponse<Void> serverErrorTest() {
        return ApiResponse.fail(
                "SERVER_ERROR",
                "서버에서 알 수 없는 오류가 발생했습니다."
        );
    }
}