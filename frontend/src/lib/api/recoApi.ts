import { http } from '../http';
import type { ClosetItemDto } from './closetApi';

export type ChecklistItemDto = {
  id: string;
  label: string;
  description?: string;
  checked?: boolean;
};

export type RecommendationDto = {
  id: string;
  weatherDate: string;
  strategy: string;
  reason: string;
  checklist: ChecklistItemDto[];
  items: ClosetItemDto[];
};

export function fetchRecommendation() {
  return http<RecommendationDto>('/api/recommendation/today');
}