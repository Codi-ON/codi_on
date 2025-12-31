// src/main/java/com/team/backend/api/controller/favorite/FavoriteController.java
package com.team.backend.api.controller.favorite;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.service.favorite.FavoriteService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Favorite")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/{clothingId}")
    public ApiResponse<Void> add(
            @RequestHeader("X-Session-Key") String sessionKey,
            @PathVariable Long clothingId
    ) {
        favoriteService.add(sessionKey, clothingId);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{clothingId}")
    public ApiResponse<Void> remove(
            @RequestHeader("X-Session-Key") String sessionKey,
            @PathVariable Long clothingId
    ) {
        favoriteService.remove(sessionKey, clothingId);
        return ApiResponse.success(null);
    }

    @GetMapping
    public ApiResponse<List<Long>> list(
            @RequestHeader("X-Session-Key") String sessionKey
    ) {
        return ApiResponse.success(favoriteService.listFavoriteClothingIds(sessionKey));
    }

    @GetMapping("/{clothingId}")
    public ApiResponse<Boolean> isFavorite(
            @RequestHeader("X-Session-Key") String sessionKey,
            @PathVariable Long clothingId
    ) {
        return ApiResponse.success(favoriteService.isFavorite(sessionKey, clothingId));
    }
}