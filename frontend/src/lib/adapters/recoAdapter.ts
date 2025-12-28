import type { RecommendationResult } from '@/shared/ui/mock';
import type { RecommendationDto } from '../api/recoApi';
import { toClosetItem } from './closetAdapter';

export function toRecommendation(dto: RecommendationDto): RecommendationResult {
  return {
    id: dto.id,
    weatherDate: dto.weatherDate,
    strategy: (dto.strategy as RecommendationResult['strategy']) ?? 'RULE',
    reason: dto.reason,
    checklist: dto.checklist ?? [],
    items: (dto.items ?? []).map(toClosetItem),
  };
}