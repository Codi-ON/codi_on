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
@RequestMapping("/api/clothes")
@RequiredArgsConstructor
public class ClothingItemController {

    private final ClothingItemService clothingItemService;

    // 1) Create
    @PostMapping
    public ApiResponse<ClothingItemResponseDto> create(
            @RequestBody @Valid ClothingItemRequestDto.Create req
    ) {
        return ApiResponse.success(clothingItemService.create(req));
    }

    // 2) Read
    @GetMapping("/{id}")
    public ApiResponse<ClothingItemResponseDto> getById(@PathVariable Long id) {
        return ApiResponse.success(clothingItemService.getById(id));
    }

    // 3) Update (PATCH)
    @PatchMapping("/{id}")
    public ApiResponse<ClothingItemResponseDto> update(
            @PathVariable Long id,
            @RequestBody @Valid ClothingItemRequestDto.Update req
    ) {
        return ApiResponse.success(clothingItemService.update(id, req));
    }

    // 4) Delete
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        clothingItemService.delete(id);
        return ApiResponse.success("삭제 완료", null);
    }

    // 5) Search
    @GetMapping("/search")
    public ApiResponse<List<ClothingItemResponseDto>> search(
            @ModelAttribute ClothingItemRequestDto.Search req
    ) {
        return ApiResponse.success(clothingItemService.search(req));
    }

    // 6) Popular
    @GetMapping("/popular")
    public ApiResponse<List<ClothingItemResponseDto>> popular(
            @RequestParam(required = false) ClothingCategory category,
            @RequestParam(defaultValue = "10") int limit
    ) {
        if (category == null) {
            return ApiResponse.success(clothingItemService.getPopular(limit));
        }
        return ApiResponse.success(clothingItemService.getPopularByCategory(category, limit));
    }

    // 7) Select count
    @PostMapping("/{id}/select")
    public ApiResponse<Void> select(@PathVariable Long id) {
        clothingItemService.markSelected(id);
        return ApiResponse.success("선택 횟수 증가", null);
    }
}