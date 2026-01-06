package com.team.backend.api.controller.auth;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class AuthPingController {

    @GetMapping("/api/user/ping")
    public Map<String, Object> userPing() {
        return Map.of("ok", true, "role", "USER");
    }

    @GetMapping("/api/admin/ping")
    public Map<String, Object> adminPing() {
        return Map.of("ok", true, "role", "ADMIN");
    }
}