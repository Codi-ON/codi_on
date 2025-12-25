import { getJson } from "@/shared/api/http";
import type { RecommendTodayResponse } from "./types";

export function getTodayRecommend(): Promise<RecommendTodayResponse> {
  return getJson<RecommendTodayResponse>("/api/recommend/today");
}