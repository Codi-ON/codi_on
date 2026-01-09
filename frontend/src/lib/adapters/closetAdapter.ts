import type { ClothesSearchItemDto } from "@/lib/api/closetApi";
import type { ClothingItem } from "@/shared/domain/clothing";

export const closetAdapter = {
  toDomain(dto: ClothesSearchItemDto): ClothingItem {
    return {
      id: dto.id,
      clothingId: dto.clothingId,
      name: dto.name,
      category: dto.category,
      thicknessLevel: dto.thicknessLevel,
      usageType: dto.usageType,
      seasons: dto.seasons ?? [],
      suitableMinTemp: dto.suitableMinTemp,
      suitableMaxTemp: dto.suitableMaxTemp,
      cottonPercentage: dto.cottonPercentage ?? null,
      polyesterPercentage: dto.polyesterPercentage ?? null,
      etcFiberPercentage: dto.etcFiberPercentage ?? null,
      color: dto.color ?? null,
      styleTag: dto.styleTag ?? null,
      imageUrl: dto.imageUrl ?? null,
      selectedCount: dto.selectedCount ?? 0,
      favorited: !!dto.favorited,
    };
  },
};