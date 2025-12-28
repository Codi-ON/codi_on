import { env } from '../env';
import { MOCK_CLOSET } from '@/shared/ui/mock';
import { fetchClosetItems } from '../api/closetApi';
import { toClosetItem } from '../adapters/closetAdapter';
import type { ClosetItem } from '@/shared/ui/mock';

export async function getClosetItems(): Promise<ClosetItem[]> {
  if (env.useMock) return MOCK_CLOSET;

  const dtos = await fetchClosetItems();
  return dtos.map(toClosetItem);
}