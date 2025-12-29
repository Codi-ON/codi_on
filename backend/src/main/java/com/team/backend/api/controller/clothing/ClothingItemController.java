// src/main/java/com/team/backend/api/controller/clothing/ClothingItemController.java
package com.team.backend.api.controller.clothing;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.clothingItem.ClothingItemRequestDto;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.service.clothing.ClothingItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(ClothingItemController.API_PREFIX)
public class ClothingItemController {

    public static final String API_PREFIX = "/api/clothes";

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    private final ClothingItemService clothingItemService;

    /**
     * Create
     * POST /api/clothes
     */
    @PostMapping
    public ApiResponse<ClothingItemResponseDto> create(
            @Valid @RequestBody ClothingItemRequestDto.Create req
    ) {
        return ApiResponse.success(clothingItemService.create(req));
    }

    /**
     * Read (by internal PK id)
     * GET /api/clothes/{id}
     *
     * favorites merge를 위해 X-Session-Key 받음 (없으면 favorited=false)
     */
    @GetMapping("/{id}")
    public ApiResponse<ClothingItemResponseDto> getById(
            @RequestHeader(value = "X-Session-Key", required = false) String sessionKey,
            @PathVariable Long id
    ) {
        return ApiResponse.success(clothingItemService.getById(sessionKey, id));
    }

    /**
     * Update (PATCH)
     * PATCH /api/clothes/{id}
     */
    @PatchMapping("/{id}")
    public ApiResponse<ClothingItemResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ClothingItemRequestDto.Update req
    ) {
        return ApiResponse.success(clothingItemService.update(id, req));
    }

    /**
     * Delete
     * DELETE /api/clothes/{id}
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id
    ) {
        clothingItemService.delete(id);
        return ApiResponse.success(null);
    }

    /**
     * Search
     * GET /api/clothes/search
     *
     * - clothingId 있으면 단건 조회
     * - 아니면 검색 조건 기반 조회
     * - favorites merge 위해 X-Session-Key 받음
     *
     * Query Params:
     *  category, temp, clothingId, seasons(복수), usageType, thicknessLevel, sort(popular|latest), limit(<=50)
     */
    @GetMapping("/search")
    public ApiResponse<List<ClothingItemResponseDto>> search(
            @RequestHeader(value = "X-Session-Key", required = false) String sessionKey,
            @ModelAttribute ClothingItemRequestDto.Search req
    ) {
        return ApiResponse.success(clothingItemService.search(sessionKey, req));
    }

    /**
     * Popular (전체)
     * GET /api/clothes/popular?limit=20
     *
     * favorites merge 위해 X-Session-Key 받음
     */
    @GetMapping("/popular")
    public ApiResponse<List<ClothingItemResponseDto>> popular(
            @RequestHeader(value = "X-Session-Key", required = false) String sessionKey,
            @RequestParam(name = "limit", defaultValue = "" + DEFAULT_LIMIT) int limit
    ) {
        return ApiResponse.success(clothingItemService.getPopular(sessionKey, clamp(limit)));
    }

    /**
     * Popular (카테고리별)
     * GET /api/clothes/popular/by-category?category=TOP&limit=20
     *
     * favorites merge 위해 X-Session-Key 받음
     */
    @GetMapping("/popular/by-category")
    public ApiResponse<List<ClothingItemResponseDto>> popularByCategory(
            @RequestHeader(value = "X-Session-Key", required = false) String sessionKey,
            @RequestParam("category") ClothingCategory category,
            @RequestParam(name = "limit", defaultValue = "" + DEFAULT_LIMIT) int limit
    ) {
        return ApiResponse.success(clothingItemService.getPopularByCategory(sessionKey, category, clamp(limit)));
    }

    /**
     * SelectedCount 증가 (로그/카운트용)
     * POST /api/clothes/{id}/select
     *
     * - “좋아요(favorite)”와 분리
     * - 프론트에서 아이템 클릭 시 호출
     */
    @PostMapping("/{id}/select")
    public ApiResponse<Void> markSelected(
            @PathVariable Long id
    ) {
        clothingItemService.markSelected(id);
        return ApiResponse.success(null);
    }

    private int clamp(int v) {
        int x = (v <= 0 ? DEFAULT_LIMIT : v);
        return Math.min(x, MAX_LIMIT);
    }
}