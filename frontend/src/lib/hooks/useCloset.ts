import { useEffect, useState } from 'react';
import type { ClosetItem } from '@/shared/ui/mock';
import { getClosetItems } from '../repo/closetRepo';

export function useCloset() {
  const [data, setData] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getClosetItems();
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}