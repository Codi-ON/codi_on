// src/main/java/com/team/backend/api/controller/outfit/OutfitController.java
package com.team.backend.api.controller.outfit;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.service.outfit.OutfitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping(OutfitController.API_PREFIX)
public class OutfitController {

    public static final String API_PREFIX = "/api/outfits";
    public static final String HEADER_SESSION_KEY = "X-Session-Key";
    public static final String PATH_TODAY = "/today";

    private final OutfitService outfitService;

    @PostMapping
    public ApiResponse<OutfitResponseDto.Today> saveToday(
            @RequestHeader(HEADER_SESSION_KEY) String sessionKey,
            @RequestBody @Valid OutfitRequestDto.SaveToday req
    ) {
        return ApiResponse.success(outfitService.saveToday(sessionKey, req));
    }

    @GetMapping(PATH_TODAY)
    public ApiResponse<OutfitResponseDto.Today> getToday(
            @RequestHeader(HEADER_SESSION_KEY) String sessionKey
    ) {
        return ApiResponse.success(outfitService.getToday(sessionKey));
    }
}