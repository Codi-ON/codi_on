import { env } from "@/lib/env";
import { http } from "@/lib/http";
import { MOCK_RECO_CLOSET_LIST } from "@/shared/ui/mock/reco";
import type { RecommendationClosetList } from "@/shared/ui/mock/types";

export type RecommendationRequest = {
  selections?: Record<number, string>;
};

export const recoRepo = {
  async getRecommendationClosetList(
    req?: RecommendationRequest
  ): Promise<RecommendationClosetList> {
    if (env.useMock) {
      return MOCK_RECO_CLOSET_LIST;
    }

    return await http.post<RecommendationClosetList>(
      "/api/recommendation/closet-list",
      req ?? {}
    );
  },
};