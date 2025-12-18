// src/main/java/com/team/backend/api/controller/clothing/ClothingItemController.java
package com.team.backend.api.controller.clothing;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.clothingItem.*;
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

    // ==============================
    // 🔗 공통 URL prefix / path 상수
    // ==============================
    public static final String API_PREFIX   = "/api/clothes";

    public static final String PATH_ID      = "/{id}";
    public static final String PATH_SEARCH  = "/search";
    public static final String PATH_POPULAR = "/popular";
    public static final String PATH_SELECT  = "/{id}/select";

    // ==============================
    // 🔗 공통 RequestParam 이름 상수
    // ==============================
    public static final String PARAM_LIMIT  = "limit";

    private final ClothingItemService clothingItemService;

    // 1) Create
    @PostMapping
    public ApiResponse<ClothingItemResponseDto> create(@RequestBody @Valid ClothingItemCreateRequestDto req) {
        // clothingId 필수/중복검사는 Service에서 단일 책임으로 처리 (컨트롤러-레포 결합 제거)
        return ApiResponse.success(clothingItemService.create(req));
    }

    // 2) Read
    @GetMapping(PATH_ID)
    public ApiResponse<ClothingItemResponseDto> getById(@PathVariable Long id) {
        return ApiResponse.success(clothingItemService.getById(id));
    }

    // 3) Update (PATCH)
    @PatchMapping(PATH_ID)
    public ApiResponse<ClothingItemResponseDto> update(
            @PathVariable Long id,
            @RequestBody @Valid ClothingItemUpdateRequestDto req
    ) {
        return ApiResponse.success(clothingItemService.update(id, req));
    }

    // 4) Delete
    @DeleteMapping(PATH_ID)
    public ApiResponse<Void> delete(@PathVariable Long id) {
        clothingItemService.delete(id);
        return ApiResponse.success("삭제 완료", null);
    }

    // 5) Search
    // - GET /api/clothes/search?temp=10&category=TOP&usageType=INDOOR&seasons=SUMMER&seasons=SPRING&sort=popular&limit=20
    // - (통합) GET /api/clothes/search?clothingId=123  <= (과거 by-clothing-id 류 엔드포인트가 있었다면 이걸로 일원화)
    @GetMapping(PATH_SEARCH)
    public ApiResponse<List<ClothingItemResponseDto>> search(@ModelAttribute ClothingItemSearchRequestDto req) {
        return ApiResponse.success(clothingItemService.search(req));
    }

    // 6) Popular (통합)
    // - GET /api/clothes/popular?limit=10
    // - GET /api/clothes/popular?category=TOP&limit=10
    @GetMapping(PATH_POPULAR)
    public ApiResponse<List<ClothingItemResponseDto>> popular(
            @RequestParam(required = false) ClothingCategory category,
            @RequestParam(name = PARAM_LIMIT, defaultValue = "10") int limit
    ) {
        return (category == null)
                ? ApiResponse.success(clothingItemService.getPopular(limit))
                : ApiResponse.success(clothingItemService.getPopularByCategory(category, limit));
    }

    // 7) Select count
    @PostMapping(PATH_SELECT)
    public ApiResponse<Void> select(@PathVariable Long id) {
        clothingItemService.markSelected(id);
        return ApiResponse.success("선택 횟수 증가", null);
    }
}