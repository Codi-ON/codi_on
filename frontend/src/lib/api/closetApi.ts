import { http } from '../http';

export type ClosetItemDto = {
  id: string;
  name: string;
  category: string;
  season: string;
  color: string;
  imageUrl?: string;
  usageType?: string;
  thickness?: string;
  material?: string;
  memo?: string;
};

export function fetchClosetItems() {
  return http<ClosetItemDto[]>('/api/closet/items');
}