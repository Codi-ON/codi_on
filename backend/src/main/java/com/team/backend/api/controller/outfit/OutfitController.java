// src/main/java/com/team/backend/api/controller/outfit/OutfitController.java
package com.team.backend.api.controller.outfit;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.service.outfit.OutfitService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Outfit")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/outfits")
public class OutfitController {

    private final OutfitService outfitService;

    @PostMapping("/today")
    public ApiResponse<OutfitResponseDto.Today> saveToday(
            @RequestHeader("X-Session-Key") String sessionKey,
            @RequestBody OutfitRequestDto.SaveToday req
    ) {
        return ApiResponse.success(outfitService.saveToday(sessionKey, req));
    }

    @GetMapping("/today")
    public ApiResponse<OutfitResponseDto.Today> getToday(
            @RequestHeader("X-Session-Key") String sessionKey
    ) {
        return ApiResponse.success(outfitService.getToday(sessionKey));
    }
}