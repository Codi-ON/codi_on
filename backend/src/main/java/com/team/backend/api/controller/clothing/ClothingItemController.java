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
@RequestMapping(ClothingItemController.API_PREFIX)
@RequiredArgsConstructor
public class ClothingItemController {

    public static final String API_PREFIX = "/api/clothes";

    public static final String PATH_ID = "/{id}";
    public static final String PATH_SELECT = "/{id}/select";
    public static final String PATH_SEARCH = "/search";
    public static final String PATH_POPULAR = "/popular";
    public static final String PATH_POPULAR_BY_CATEGORY = "/popular/by-category";

    public static final String PARAM_LIMIT = "limit";
    public static final String PARAM_CATEGORY = "category";

    private final ClothingItemService clothingItemService;

    // 0) 전체 조회: GET /api/clothes?limit=20
    @GetMapping
    public ApiResponse<List<ClothingItemResponseDto>> getAll(
            @RequestParam(value = PARAM_LIMIT, required = false) Integer limit
    ) {
        return ApiResponse.success(clothingItemService.getAll(limit == null ? 0 : limit));
    }

    // 1) 생성: POST /api/clothes
    @PostMapping
    public ApiResponse<ClothingItemResponseDto> create(
            @RequestBody @Valid ClothingItemRequestDto.Create req
    ) {
        return ApiResponse.success(clothingItemService.create(req));
    }

    // 2) 단건 조회: GET /api/clothes/{id}
    @GetMapping(PATH_ID)
    public ApiResponse<ClothingItemResponseDto> getById(@PathVariable Long id) {
        return ApiResponse.success(clothingItemService.getById(id));
    }

    // 3) 삭제: DELETE /api/clothes/{id}
    @DeleteMapping(PATH_ID)
    public ApiResponse<Void> delete(@PathVariable Long id) {
        clothingItemService.delete(id);
        return ApiResponse.success(null);
    }

    // 4) 수정: PATCH /api/clothes/{id}
    @PatchMapping(PATH_ID)
    public ApiResponse<ClothingItemResponseDto> update(
            @PathVariable Long id,
            @RequestBody @Valid ClothingItemRequestDto.Update req
    ) {
        return ApiResponse.success(clothingItemService.update(id, req));
    }

    // 5) 선택(클릭): POST /api/clothes/{id}/select
    @PostMapping(PATH_SELECT)
    public ApiResponse<Void> select(@PathVariable Long id) {
        clothingItemService.markSelected(id);
        return ApiResponse.success(null);
    }

    // 6) 검색: GET /api/clothes/search?... (QueryString 바인딩)
    @GetMapping(PATH_SEARCH)
    public ApiResponse<List<ClothingItemResponseDto>> search(
            @Valid ClothingItemRequestDto.Search req
    ) {
        return ApiResponse.success(clothingItemService.search(req));
    }

    // 7) 인기: GET /api/clothes/popular?limit=20
    @GetMapping(PATH_POPULAR)
    public ApiResponse<List<ClothingItemResponseDto>> popular(
            @RequestParam(value = PARAM_LIMIT, required = false) Integer limit
    ) {
        return ApiResponse.success(clothingItemService.getPopular(limit == null ? 0 : limit));
    }

    // 8) 카테고리별 인기: GET /api/clothes/popular/by-category?category=TOP&limit=20
    @GetMapping(PATH_POPULAR_BY_CATEGORY)
    public ApiResponse<List<ClothingItemResponseDto>> popularByCategory(
            @RequestParam(value = PARAM_CATEGORY) ClothingCategory category,
            @RequestParam(value = PARAM_LIMIT, required = false) Integer limit
    ) {
        return ApiResponse.success(clothingItemService.getPopularByCategory(category, limit == null ? 0 : limit));
    }
}