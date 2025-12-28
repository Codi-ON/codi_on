import { useEffect, useState } from 'react';
import type { RecommendationResult } from '@/shared/ui/mock';
import { getRecommendation } from '../repo/recoRepo';

export function useRecommendation() {
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getRecommendation();
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