// src/main/java/com/team/backend/api/controller/favorite/FavoriteController.java
package com.team.backend.api.controller.favorite;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.service.favorite.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(FavoriteController.API_PREFIX)
public class FavoriteController {

    public static final String API_PREFIX = "/api/favorites";
    public static final String HEADER_SESSION_KEY = "X-Session-Key";

    private final FavoriteService favoriteService;

    /**
     * 즐겨찾기 추가
     * POST /api/favorites/{clothingId}
     */
    @PostMapping("/{clothingId}")
    public ApiResponse<Void> add(
            @RequestHeader(HEADER_SESSION_KEY) String sessionKey,
            @PathVariable Long clothingId
    ) {
        favoriteService.add(sessionKey, clothingId);
        return ApiResponse.success(null);
    }

    /**
     * 즐겨찾기 제거
     * DELETE /api/favorites/{clothingId}
     */
    @DeleteMapping("/{clothingId}")
    public ApiResponse<Void> remove(
            @RequestHeader(HEADER_SESSION_KEY) String sessionKey,
            @PathVariable Long clothingId
    ) {
        favoriteService.remove(sessionKey, clothingId);
        return ApiResponse.success(null);
    }

    /**
     * 즐겨찾기 목록
     * GET /api/favorites
     */
    @GetMapping
    public ApiResponse<List<Long>> list(
            @RequestHeader(HEADER_SESSION_KEY) String sessionKey
    ) {
        return ApiResponse.success(favoriteService.listFavoriteClothingIds(sessionKey));
    }

    /**
     * 즐겨찾기 여부
     * GET /api/favorites/{clothingId}
     */
    @GetMapping("/{clothingId}")
    public ApiResponse<Boolean> isFavorite(
            @RequestHeader(HEADER_SESSION_KEY) String sessionKey,
            @PathVariable Long clothingId
    ) {
        return ApiResponse.success(favoriteService.isFavorite(sessionKey, clothingId));
    }
}