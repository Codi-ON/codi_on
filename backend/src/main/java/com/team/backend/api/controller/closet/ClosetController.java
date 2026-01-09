package com.team.backend.api.controller.closet;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.service.closet.ClosetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/closet")
public class ClosetController {

    private static final String SESSION_HEADER = "X-Session-Key";

    private final ClosetService closetService;

    /**
     * GET /api/closet/items?category=TOP&limit=30
     * Header: X-Session-Key 필수
     * category 생략 시 전체
     */
    @GetMapping("/items")
    public ApiResponse<List<ClothingItemResponseDto>> listItems(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @RequestParam(required = false) ClothingCategory category,
            @RequestParam(required = false) Integer limit
    ) {
        return ApiResponse.success(
                closetService.listClosetItems(sessionKey, category, limit)
        );
    }
}