// src/main/java/com/team/backend/api/controller/ClothingItemController.java
package com.team.backend.api.controller;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.clothingItem.*;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.service.ClothingItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clothes")
@RequiredArgsConstructor
public class ClothingItemController {

    private final ClothingItemService clothingItemService;

    // 1) Create
    @PostMapping
    public ApiResponse<ClothingItemResponseDto> create(@RequestBody @Valid ClothingItemCreateRequestDto req) {
        return ApiResponse.success(clothingItemService.create(req));
    }

    // 2) Read
    @GetMapping("/{id}")
    public ApiResponse<ClothingItemResponseDto> getById(@PathVariable Long id) {
        return ApiResponse.success(clothingItemService.getById(id));
    }

    @GetMapping("/by-clothing-id/{clothingId}")
    public ApiResponse<ClothingItemResponseDto> getByClothingId(@PathVariable Long clothingId) {
        return ApiResponse.success(clothingItemService.getByClothingId(clothingId));
    }

    // 3) Update (PATCH)
    @PatchMapping("/{id}")
    public ApiResponse<ClothingItemResponseDto> update(
            @PathVariable Long id,
            @RequestBody ClothingItemUpdateRequestDto req
    ) {
        return ApiResponse.success(clothingItemService.update(id, req));
    }

    // 4) Delete
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        clothingItemService.delete(id);
        return ApiResponse.success("삭제 완료", null);
    }

    // 5) Search (필터/탐색: 프론트 클릭용)
    // - GET /api/clothes/search?temp=10&category=TOP&usageType=INDOOR&seasons=SUMMER&seasons=SPRING&sort=popular&limit=20
    @GetMapping("/search")
    public ApiResponse<List<ClothingItemResponseDto>> search(@ModelAttribute ClothingItemSearchRequestDto req) {
        return ApiResponse.success(clothingItemService.search(req));
    }

    // 6) Popular
    @GetMapping("/popular")
    public ApiResponse<List<ClothingItemResponseDto>> popular(@RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.success(clothingItemService.getPopular(limit));
    }

    @GetMapping("/popular/by-category")
    public ApiResponse<List<ClothingItemResponseDto>> popularByCategory(
            @RequestParam ClothingCategory category,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(clothingItemService.getPopularByCategory(category, limit));
    }

    // 7) Select count
    @PostMapping("/{id}/select")
    public ApiResponse<Void> select(@PathVariable Long id) {
        clothingItemService.markSelected(id);
        return ApiResponse.success("선택 횟수 증가", null);
    }
}