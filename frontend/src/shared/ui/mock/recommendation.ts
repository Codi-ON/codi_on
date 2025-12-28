import type { RecommendationResult } from "./types";
import { MOCK_CHECKLIST, MOCK_CLOSET } from "./data";

export const MOCK_RECOMMENDATION: RecommendationResult = {
  id: "reco-2025-12-26",
  weatherDate: "2025-12-26",
  strategy: "HYBRID",
  reason:
    "체감 16°C + 오후 비 가능성 + 일교차 신호가 있어, 얇은 이너 + 가디건 레이어 조합을 우선 추천합니다.",
  checklist: MOCK_CHECKLIST,
  items: [
    MOCK_CLOSET[1], // 오프화이트 긴팔 티
    MOCK_CLOSET[0], // 네이비 가디건
    MOCK_CLOSET[2], // 블랙 슬랙스
  ],
};