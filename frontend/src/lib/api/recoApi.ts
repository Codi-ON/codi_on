// src/lib/api/recoApi.ts
import { sessionApi } from "@/lib/http";
import type { ChecklistSubmitDto } from "@/shared/domain/checklist";
import {UUID} from "node:crypto";

export type RecommendCategory = "TOP" | "BOTTOM" | "OUTER";

export type RecommendTodayByCategoryParams = {
  category: RecommendCategory;
  region: string;
  lat: number;
  lon: number;
  limit?: number;
};

export type RecommendTodayItemDto = {
  id: number;
  clothingId: number;
  name: string;
  category: "TOP" | "BOTTOM" | "OUTER" | "ONE_PIECE";
  thicknessLevel: string;
  usageType: string;
  seasons: string[];
  suitableMinTemp: number;
  suitableMaxTemp: number;
  cottonPercentage: number | null;
  polyesterPercentage: number | null;
  etcFiberPercentage: number | null;
  color: string;
  styleTag: string;
  imageUrl: string | null;
  selectedCount: number;
  favorited: boolean;
};

export type RecommendationItemDto = {
  clothingId: number;
  name: string;
  brand?: string;
  imageUrl?: string;
  inCloset?: boolean;
};

/** 메인(오늘추천) 묶음 응답 */
export type RecommendationResponseDto = {
  top: RecommendationItemDto[];
  bottom: RecommendationItemDto[];
  outer: RecommendationItemDto[];
};

/**
 * ✅ candidates 응답(백 계약: score 내림차순 정렬 상태로 내려온다)
 * - 실제 백엔드 응답 구조에 맞춰 프론트에서 쓰기 쉬운 최소 타입만 정의
 */
export type CandidateDto = {
  clothingId: number;
  name: string;
  imageUrl?: string | null;
  brand?: string | null;
  score: number;
};

export type CandidateCategoryDto = {
  category: RecommendCategory;
  candidates: CandidateDto[];
};

export type CandidateModelDto = {
  modelKey: string; // 예: "FM", "RULE", "ENSEMBLE" 등 (백이 내려주는 key)
  categories: CandidateCategoryDto[];
};

export type RecommendCandidatesResponseDto = {
  models: CandidateModelDto[];
};

export type RecommendCandidatesRequestDto = {
  region: string;
  lat: number;
  lon: number;
  topNPerCategory?: number;      // default 10
  recommendationId?: UUID;    // 예: "RECO-202601"
  checklist: ChecklistSubmitDto; // 필수
};

function toItemDto(x: RecommendTodayItemDto): RecommendationItemDto {
  return {
    clothingId: x.clothingId,
    name: x.name,
    brand: x.styleTag ?? "CODION",
    imageUrl: x.imageUrl ?? undefined,
    inCloset: true, // 메인(오늘추천)에서는 옷장 매칭 안하므로 true
  };
}

export const recoApi = {
  /** 메인(체크리스트 전) - 카테고리별 오늘 추천 리스트 */
  async getTodayByCategory(params: RecommendTodayByCategoryParams): Promise<RecommendTodayItemDto[]> {
    return sessionApi.get<RecommendTodayItemDto[]>(
        "/api/recommend/today/by-category",
        { params: { ...params, limit: params.limit ?? 10 } }
    );
  },

  /** 메인(체크리스트 전) - TOP/BOTTOM/OUTER 묶음 */
  async getTodayRecommendation(
      payload?: Partial<Omit<RecommendTodayByCategoryParams, "category">>
  ): Promise<RecommendationResponseDto> {
    const base = {
      region: payload?.region ?? "Seoul",
      lat: payload?.lat ?? 37.5665,
      lon: payload?.lon ?? 126.978,
      limit: payload?.limit ?? 10,
    };

    const [top, bottom, outer] = await Promise.all([
      recoApi.getTodayByCategory({ category: "TOP", ...base }),
      recoApi.getTodayByCategory({ category: "BOTTOM", ...base }),
      recoApi.getTodayByCategory({ category: "OUTER", ...base }),
    ]);

    return {
      top: top.map(toItemDto),
      bottom: bottom.map(toItemDto),
      outer: outer.map(toItemDto),
    };
  },

  /**
   * ✅ 추천페이지(체크리스트 이후) - ML 후보군 + 점수순 결과
   * POST /api/recommend/candidates
   * - Header: X-Session-Key (sessionApi interceptor로 자동)
   */
  async getCandidates(body: RecommendCandidatesRequestDto): Promise<RecommendCandidatesResponseDto> {
    return sessionApi.post<RecommendCandidatesResponseDto>(
        "/api/recommend/candidates",
        {
          region: body.region,
          lat: body.lat,
          lon: body.lon,
          topNPerCategory: body.topNPerCategory ?? 10,
          recommendationId: body.recommendationId ?? "RECO-202601",
          checklist: body.checklist,
        }
    );
  },
};