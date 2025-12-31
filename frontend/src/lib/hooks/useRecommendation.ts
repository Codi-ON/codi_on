// src/lib/hooks/useRecommendation.ts
import { useQuery } from "@tanstack/react-query";
import { recoRepo } from "@/lib/repo/recoRepo";
import { toClosetList, type RecommendationClosetList } from "@/lib/adapters/recoAdapter";

type Payload = {
  region: string;
  lat: number;
  lon: number;
  limit?: number;
};

export function useRecommendation(payload: Payload | null) {
  return useQuery({
    queryKey: ["recommendation", payload],
    enabled: !!payload,
    queryFn: async (): Promise<RecommendationClosetList> => {
      const limit = payload?.limit ?? 50;

      const [top, bottom, outer] = await Promise.all([
        recoRepo.getTodayByCategory({ ...payload!, limit, category: "TOP" }),
        recoRepo.getTodayByCategory({ ...payload!, limit, category: "BOTTOM" }),
        recoRepo.getTodayByCategory({ ...payload!, limit, category: "OUTER" }),
      ]);

      return {
        top: toClosetList(top, "상의"),
        bottom: toClosetList(bottom, "하의"),
        outer: toClosetList(outer, "아우터"),
      };
    },
  });
}