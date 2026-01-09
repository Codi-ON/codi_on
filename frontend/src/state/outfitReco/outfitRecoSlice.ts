// src/state/outfitReco/outfitRecoSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getUserMessage } from "@/lib/errors";

import { recoApi } from "@/lib/api/recoApi";
import { outfitRepo } from "@/lib/repo/outfitRepo";
import type { TodayOutfitDto } from "@/lib/api/outfitApi";
import type { ChecklistSubmitDto } from "@/shared/domain/checklist";

export type FeedbackScore = 1 | 0 | -1; // GOOD(1), UNKNOWN(0), BAD(-1)

export type ClosetItem = {
    id: string | number;
    clothingId: number;
    label: "상의" | "하의" | "아우터";
    name: string;
    brand?: string;
    imageUrl?: string;
    inCloset?: boolean;
};

export type RecommendationClosetList = {
    top: ClosetItem[];
    bottom: ClosetItem[];
    outer: ClosetItem[];
};

type RecoItemDto = {
    id?: number;
    clothingId: number;
    name: string;
    brand?: string;
    imageUrl?: string | null;
    inCloset?: boolean;
};

type RecoResponseDto = {
    top: RecoItemDto[];
    bottom: RecoItemDto[];
    outer: RecoItemDto[];
};

// ---- Candidates DTO (유연 파싱용, 정확 스키마 없어도 동작하게) ----
type CandidateItemDto = {
    clothingId: number;
    name: string;
    imageUrl?: string | null;
    styleTag?: string | null;
    brand?: string | null;
    inCloset?: boolean;
    score?: number; // 서버에서 내려옴(정렬되어 있다고 가정)
};

type CandidateCategoryDto = {
    category: "TOP" | "BOTTOM" | "OUTER" | string;
    candidates: CandidateItemDto[];
};

type CandidateModelDto = {
    model?: string;
    categories: CandidateCategoryDto[];
};

type CandidatesResponseDto = {
    models: CandidateModelDto[];
};

export type SelectedOutfit = {
    top?: ClosetItem;
    bottom?: ClosetItem;
    outer?: ClosetItem;
};

export type OutfitRecoState = {
    checklist: ChecklistSubmitDto | null;

    // ✅ RecommendationPage가 쓰는 리스트(각 카테고리 3개만)
    recoList: RecommendationClosetList | null;

    // ✅ 원본 후보군(추후 히스토리/디버깅/상세페이지 확장 대비)
    candidatesRaw: CandidatesResponseDto | null;

    topIdx: number;
    bottomIdx: number;
    outerIdx: number;

    loading: boolean;
    error: string | null;

    saving: boolean;
    saveError: string | null;

    lastSavedTodayOutfit: TodayOutfitDto | null;
    selectedOutfitSnapshot: SelectedOutfit | null;

    recoFeedbackScore: FeedbackScore;
};

const initialState: OutfitRecoState = {
    checklist: null,

    recoList: null,
    candidatesRaw: null,

    topIdx: 0,
    bottomIdx: 0,
    outerIdx: 0,

    loading: false,
    error: null,

    saving: false,
    saveError: null,

    lastSavedTodayOutfit: null,
    selectedOutfitSnapshot: null,

    recoFeedbackScore: 0,
};

type ThunkConfig = { rejectValue: string };

const safeArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function isRecoResponseDto(v: any): v is RecoResponseDto {
    return v && typeof v === "object" && Array.isArray(v.top) && Array.isArray(v.bottom) && Array.isArray(v.outer);
}

function mapDtoToList(dto: RecoResponseDto): RecommendationClosetList {
    const toClosetItem = (x: RecoItemDto, label: ClosetItem["label"]): ClosetItem => ({
        id: x.clothingId ?? x.id ?? `${label}-${Math.random()}`,
        clothingId: x.clothingId,
        label,
        name: x.name,
        brand: x.brand,
        imageUrl: x.imageUrl ?? undefined,
        inCloset: x.inCloset ?? true,
    });

    const top = safeArray<RecoItemDto>(dto.top)
        .filter((x) => typeof x?.clothingId === "number")
        .map((x) => toClosetItem(x, "상의"));

    const bottom = safeArray<RecoItemDto>(dto.bottom)
        .filter((x) => typeof x?.clothingId === "number")
        .map((x) => toClosetItem(x, "하의"));

    const outer = safeArray<RecoItemDto>(dto.outer)
        .filter((x) => typeof x?.clothingId === "number")
        .map((x) => toClosetItem(x, "아우터"));

    return { top, bottom, outer };
}

/**
 * candidates 배열이 score 내림차순으로 내려온다는 전제
 * - 길이 >= 7  → 1,5,7 (idx 0,4,6)
 * - 길이 <  7  → 1,3,5 (idx 0,2,4)
 * - 없는 인덱스는 자동 스킵
 */
function pick3<T>(arr: T[]): T[] {
    if (!arr.length) return [];
    const indices = arr.length >= 7 ? [0, 4, 6] : [0, 2, 4];
    const picked = indices.filter((i) => i < arr.length).map((i) => arr[i]);
    return picked.length ? picked : [arr[0]];
}

function toClosetItemFromCandidate(x: CandidateItemDto, label: ClosetItem["label"]): ClosetItem {
    return {
        id: x.clothingId ?? `${label}-${Math.random()}`,
        clothingId: x.clothingId,
        label,
        name: x.name,
        brand: (x.styleTag ?? x.brand ?? "CODION") || "CODION",
        imageUrl: x.imageUrl ?? undefined,
        inCloset: x.inCloset ?? true,
    };
}

function mapCandidatesToList(raw: CandidatesResponseDto): RecommendationClosetList {
    const models = safeArray<CandidateModelDto>((raw as any)?.models);
    const first = models[0];
    const categories = safeArray<CandidateCategoryDto>(first?.categories);

    const byCategory = (cat: "TOP" | "BOTTOM" | "OUTER") => {
        const found = categories.find((c) => String(c?.category).toUpperCase() === cat);
        const candidates = safeArray<CandidateItemDto>((found as any)?.candidates)
            .filter((x) => x && typeof x.clothingId === "number" && typeof x.name === "string");
        return pick3(candidates);
    };

    const topPicked = byCategory("TOP").map((x) => toClosetItemFromCandidate(x, "상의"));
    const bottomPicked = byCategory("BOTTOM").map((x) => toClosetItemFromCandidate(x, "하의"));
    const outerPicked = byCategory("OUTER").map((x) => toClosetItemFromCandidate(x, "아우터"));

    return { top: topPicked, bottom: bottomPicked, outer: outerPicked };
}

export const fetchRecommendation = createAsyncThunk<RecommendationClosetList, void, ThunkConfig>(
    "outfitReco/fetchRecommendation",
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { outfitReco: OutfitRecoState };
            const checklist = state.outfitReco.checklist;

            if (!checklist) throw new Error("체크리스트가 없습니다. 체크리스트부터 제출해 주세요.");

            // ✅ ML 후보군 호출 (POST /api/recommend/candidates)
            // region/lat/lon 고정(서울) 정책 반영
            const raw = (await recoApi.getCandidates({
                region: "Seoul",
                lat: 37.5665,
                lon: 126.978,
                topNPerCategory: 10,
                recommendationKey: "RECO-202601", // 필요 없으면 백에서 무시
                checklist,
            } as any)) as unknown;

            // ✅ 구형(top/bottom/outer) 응답이 와도 깨지지 않게
            if (isRecoResponseDto(raw)) {
                return mapDtoToList(raw);
            }

            // ✅ candidates 응답
            const candidatesRaw: CandidatesResponseDto = {
                models: safeArray<CandidateModelDto>((raw as any)?.models),
            };

            return mapCandidatesToList(candidatesRaw);
        } catch (e) {
            return rejectWithValue(getUserMessage(e));
        }
    }
);

export const saveTodayOutfitThunk = createAsyncThunk<TodayOutfitDto, void, ThunkConfig>(
    "outfitReco/saveTodayOutfit",
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { outfitReco: OutfitRecoState };
            const { recoList, topIdx, bottomIdx, outerIdx } = state.outfitReco;

            if (!recoList || !recoList.top.length || !recoList.bottom.length) {
                throw new Error("저장할 추천 조합이 없습니다.");
            }

            const top = recoList.top[topIdx];
            const bottom = recoList.bottom[bottomIdx];
            const outer = recoList.outer.length ? recoList.outer[outerIdx] : undefined;

            const clothingIds = [top?.clothingId, bottom?.clothingId, outer?.clothingId].filter(
                (v): v is number => typeof v === "number"
            );

            return await outfitRepo.saveTodayOutfit(clothingIds);
        } catch (e) {
            return rejectWithValue(getUserMessage(e));
        }
    }
);

const outfitRecoSlice = createSlice({
    name: "outfitReco",
    initialState,
    reducers: {
        setChecklist(state, action: PayloadAction<ChecklistSubmitDto>) {
            state.checklist = action.payload;
        },

        setIdx(state, action: PayloadAction<{ topIdx?: number; bottomIdx?: number; outerIdx?: number }>) {
            if (typeof action.payload.topIdx === "number") state.topIdx = action.payload.topIdx;
            if (typeof action.payload.bottomIdx === "number") state.bottomIdx = action.payload.bottomIdx;
            if (typeof action.payload.outerIdx === "number") state.outerIdx = action.payload.outerIdx;
        },

        setRecoFeedbackScore(state, action: PayloadAction<FeedbackScore>) {
            state.recoFeedbackScore = action.payload;
        },

        setSelectedOutfitSnapshot(state) {
            if (!state.recoList || !state.recoList.top.length || !state.recoList.bottom.length) {
                state.selectedOutfitSnapshot = null;
                return;
            }
            state.selectedOutfitSnapshot = {
                top: state.recoList.top[state.topIdx],
                bottom: state.recoList.bottom[state.bottomIdx],
                outer: state.recoList.outer.length ? state.recoList.outer[state.outerIdx] : undefined,
            };
        },

        clearLastSaved(state) {
            state.lastSavedTodayOutfit = null;
        },

        resetOutfitReco() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRecommendation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRecommendation.fulfilled, (state, action) => {
                state.loading = false;
                state.recoList = action.payload;
                state.topIdx = 0;
                state.bottomIdx = 0;
                state.outerIdx = 0;
            })
            .addCase(fetchRecommendation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "추천 불러오기에 실패했습니다.";
            })

            .addCase(saveTodayOutfitThunk.pending, (state) => {
                state.saving = true;
                state.saveError = null;
            })
            .addCase(saveTodayOutfitThunk.fulfilled, (state, action) => {
                state.saving = false;
                state.lastSavedTodayOutfit = action.payload;
            })
            .addCase(saveTodayOutfitThunk.rejected, (state, action) => {
                state.saving = false;
                state.saveError = action.payload ?? "오늘 아웃핏 저장에 실패했습니다.";
            });
    },
});

export const {
    setChecklist,
    setIdx,
    setRecoFeedbackScore,
    setSelectedOutfitSnapshot,
    clearLastSaved,
    resetOutfitReco,
} = outfitRecoSlice.actions;

export default outfitRecoSlice.reducer;

export const selectRecoList = (s: any) => s.outfitReco.recoList as RecommendationClosetList | null;
export const selectIdx = (s: any) => ({
    topIdx: s.outfitReco.topIdx as number,
    bottomIdx: s.outfitReco.bottomIdx as number,
    outerIdx: s.outfitReco.outerIdx as number,
});
export const selectRecoLoading = (s: any) => s.outfitReco.loading as boolean;
export const selectRecoError = (s: any) => s.outfitReco.error as string | null;

export const selectSaving = (s: any) => s.outfitReco.saving as boolean;
export const selectSaveError = (s: any) => s.outfitReco.saveError as string | null;

export const selectLastSavedTodayOutfit = (s: any) =>
    s.outfitReco.lastSavedTodayOutfit as TodayOutfitDto | null;

export const selectSelectedOutfitSnapshot = (s: any) =>
    s.outfitReco.selectedOutfitSnapshot as SelectedOutfit | null;

export const selectRecoFeedbackScore = (s: any) => s.outfitReco.recoFeedbackScore as FeedbackScore;
export const selectChecklist = (s: any) => s.outfitReco.checklist as ChecklistSubmitDto | null;