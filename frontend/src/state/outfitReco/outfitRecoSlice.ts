import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getUserMessage } from "@/lib/errors";

import { recoApi } from "@/lib/api/recoApi";
import { outfitRepo } from "@/lib/repo/outfitRepo";
import type { TodayOutfitDto } from "@/lib/api/outfitApi";
import type { ChecklistSubmitDto } from "@/pages/user/ChecklistPage";

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

export type SelectedOutfit = {
    top?: ClosetItem;
    bottom?: ClosetItem;
    outer?: ClosetItem;
};

export type OutfitRecoState = {
    checklist: ChecklistSubmitDto | null;

    recoList: RecommendationClosetList | null;
    topIdx: number;
    bottomIdx: number;
    outerIdx: number;

    loading: boolean;
    error: string | null;

    saving: boolean;
    saveError: string | null;

    // ✅ 컴포넌트가 찾는 이름으로 통일
    lastSavedTodayOutfit: TodayOutfitDto | null;
    selectedOutfitSnapshot: SelectedOutfit | null;

    // 추천 만족도 피드백(버튼 GOOD/UNKNOWN/BAD)
    recoFeedbackScore: FeedbackScore;
};

const initialState: OutfitRecoState = {
    checklist: null,

    recoList: null,
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

export const fetchRecommendation = createAsyncThunk<
    RecommendationClosetList,
    void,
    ThunkConfig
>("outfitReco/fetchRecommendation", async (_, { getState, rejectWithValue }) => {
    try {
        const state = getState() as { outfitReco: OutfitRecoState };
        const checklist = state.outfitReco.checklist;

        // ✅ checklist 포함해서 추천 호출 (백엔드가 받을 수 있게 계약 필요)
        const dto = (await recoApi.getRecommendation({
            region: "Seoul",
            lat: 37.5665,
            lon: 126.978,
            limit: 50,
            checklist: checklist ?? undefined,
        } as any)) as unknown as RecoResponseDto;

        return mapDtoToList(dto);
    } catch (e) {
        return rejectWithValue(getUserMessage(e));
    }
});

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

        // ✅ 캘린더/히스토리에서 “저장 직후 UI merge”용 스냅샷
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

        // ✅ 네가 쓰려던 clearLastSaved 추가 (TS2304 해결)
        clearLastSaved(state) {
            state.lastSavedTodayOutfit = null;
        },

        resetOutfitReco() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchRecommendation
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

            // saveTodayOutfitThunk
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