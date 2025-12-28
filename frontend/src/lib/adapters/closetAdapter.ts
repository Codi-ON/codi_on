import type { ClosetItem } from '@/shared/ui/mock';
import type { ClosetItemDto } from '../api/closetApi';

export function toClosetItem(dto: ClosetItemDto): ClosetItem {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category as ClosetItem['category'],
    season: dto.season as ClosetItem['season'],
    color: dto.color,
    imageUrl: dto.imageUrl,

    usageType: dto.usageType as ClosetItem['usageType'],
    thickness: dto.thickness as ClosetItem['thickness'],
    material: dto.material,
    memo: dto.memo,
  };
}