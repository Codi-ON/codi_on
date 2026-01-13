// src/state/outfitReco/outfitRecoSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getUserMessage } from "@/lib/errors";

import { recoApi } from "@/lib/api/recoApi";
import { outfitRepo } from "@/lib/repo/outfitRepo";
import type { TodayOutfitDto } from "@/lib/api/outfitApi";
import type { ChecklistSubmitDto } from "@/shared/domain/checklist";

export type FeedbackScore = 1 | 0 | -1; // GOOD(1), NEUTRAL(0), BAD(-1)

// 캘린더/상세에서 보여줄 “모델(머신) 키”
// - 너 요구대로: 소재/혼합율 중 하나는 고정으로 잡아야 하니 기본은 BLEND_RATIO로 둠.
export type RecommendationModelKey = "BLEND_RATIO" | "MATERIAL_RATIO" | "UNKNOWN";

export type ClosetItem = {
    id: string | number;
    clothingId: number;
    label: "상의" | "하의" | "아우터";
    name: string;
    brand?: string;
    imageUrl?: string | null;
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

// ---- Candidates DTO (유연 파싱용) ----
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
    model?: string; // e.g. "BLEND_RATIO" | "MATERIAL_RATIO" | ...
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

/**
 * ✅ A안: “최근 저장한 아웃핏”을 API 없이도 그리기 위한 ViewModel
 * - 저장 시점 스냅샷(selectedOutfitSnapshot) 기반으로 생성
 * - TodayPage/History 카드에서 바로 렌더 가능한 최소 스펙
 */
export type OutfitHistoryVmItem = {
    category: "TOP" | "BOTTOM" | "OUTER";
    clothingId: number;
    name: string;
    imageUrl?: string | null;
    sortOrder: number; // 0,1,2
};

export type OutfitHistoryVm = {
    id: string;            // 프론트 key
    outfitDate: string;    // YYYY-MM-DD
    title?: string | null;
    thumbnailUrl?: string | null;
    items: OutfitHistoryVmItem[];
};

export type OutfitRecoState = {
    checklist: ChecklistSubmitDto | null;

    // RecommendationPage가 쓰는 리스트(각 카테고리 3개만)
    recoList: RecommendationClosetList | null;

    // 원본 후보군(히스토리/디버깅/확장 대비)
    candidatesRaw: CandidatesResponseDto | null;

    // 선택 인덱스
    topIdx: number;
    bottomIdx: number;
    outerIdx: number;

    // 추천 로딩
    loading: boolean;
    error: string | null;

    // 저장 로딩
    saving: boolean;
    saveError: string | null;

    // ✅ “recentlySaved”로 캘린더에서 덮어쓰기할 원천(= 오늘 저장 직후 응답)
    // - today GET에 의존하지 않고 이 값만 사용
    lastSavedTodayOutfit: TodayOutfitDto | null;

    // ✅ 저장 시점에 화면에서 선택된 outfit(이름/브랜드/이미지 등) 스냅샷
    selectedOutfitSnapshot: SelectedOutfit | null;

    // ✅ A안: 최근 저장 히스토리 3개 (API 실패/미연결이어도 렌더 가능)
    recentHistory: OutfitHistoryVm[];

    // ✅ 머신(모델) 키: 혼합율/소재
    recoModelKey: RecommendationModelKey;

    // 추천 결과 피드백(사용자가 누르는 용도)
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

    recentHistory: [],

    recoModelKey: "UNKNOWN",

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
        imageUrl: x.imageUrl ?? null,
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
        imageUrl: x.imageUrl ?? null,
        inCloset: x.inCloset ?? true,
    };
}

function mapCandidatesToList(raw: CandidatesResponseDto): RecommendationClosetList {
    const models = safeArray<CandidateModelDto>((raw as any)?.models);
    const first = models[0];
    const categories = safeArray<CandidateCategoryDto>(first?.categories);

    const byCategory = (cat: "TOP" | "BOTTOM" | "OUTER") => {
        const found = categories.find((c) => String(c?.category).toUpperCase() === cat);
        const candidates = safeArray<CandidateItemDto>((found as any)?.candidates).filter(
            (x) => x && typeof x.clothingId === "number" && typeof x.name === "string"
        );
        return pick3(candidates);
    };

    const topPicked = byCategory("TOP").map((x) => toClosetItemFromCandidate(x, "상의"));
    const bottomPicked = byCategory("BOTTOM").map((x) => toClosetItemFromCandidate(x, "하의"));
    const outerPicked = byCategory("OUTER").map((x) => toClosetItemFromCandidate(x, "아우터"));

    return { top: topPicked, bottom: bottomPicked, outer: outerPicked };
}

function parseModelKey(raw?: string | null): RecommendationModelKey {
    const v = String(raw ?? "").toUpperCase();
    if (v.includes("MATERIAL")) return "MATERIAL_RATIO";
    if (v.includes("BLEND")) return "BLEND_RATIO";
    return "UNKNOWN";
}

// ✅ A안 helper: 오늘 날짜 ISO
function toIsoDateYYYYMMDD(d = new Date()) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// ✅ A안 helper: snapshot → history vm
function buildHistoryVmFromSnapshot(snapshot: SelectedOutfit | null, outfitDate: string): OutfitHistoryVm {
    const items: OutfitHistoryVmItem[] = [];

    if (snapshot?.top) {
        items.push({
            category: "TOP",
            clothingId: snapshot.top.clothingId,
            name: snapshot.top.name,
            imageUrl: snapshot.top.imageUrl ?? null,
            sortOrder: 0,
        });
    }

    if (snapshot?.bottom) {
        items.push({
            category: "BOTTOM",
            clothingId: snapshot.bottom.clothingId,
            name: snapshot.bottom.name,
            imageUrl: snapshot.bottom.imageUrl ?? null,
            sortOrder: 1,
        });
    }

    if (snapshot?.outer) {
        items.push({
            category: "OUTER",
            clothingId: snapshot.outer.clothingId,
            name: snapshot.outer.name,
            imageUrl: snapshot.outer.imageUrl ?? null,
            sortOrder: 2,
        });
    }

    return {
        id: `local-${outfitDate}`,
        outfitDate,
        title: "저장한 아웃핏",
        thumbnailUrl: null,
        items,
    };
}

// ---- Thunk return types ----
type FetchRecommendationResult = {
    recoList: RecommendationClosetList;
    candidatesRaw: CandidatesResponseDto | null;
    modelKey: RecommendationModelKey;
};

type SaveTodayOutfitResult = {
    saved: TodayOutfitDto;
    snapshot: SelectedOutfit | null;
    modelKey: RecommendationModelKey;
};

export const fetchRecommendation = createAsyncThunk<FetchRecommendationResult, void, ThunkConfig>(
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
                checklist,
            } as any)) as unknown;

            // 구형(top/bottom/outer) 응답
            if (isRecoResponseDto(raw)) {
                return {
                    recoList: mapDtoToList(raw),
                    candidatesRaw: null,
                    modelKey: "UNKNOWN",
                };
            }

            // candidates 응답
            const candidatesRaw: CandidatesResponseDto = {
                models: safeArray<CandidateModelDto>((raw as any)?.models),
            };

            const firstModel = candidatesRaw.models?.[0];
            const modelKey = parseModelKey(firstModel?.model) || "BLEND_RATIO"; // 기본은 혼합율

            return {
                recoList: mapCandidatesToList(candidatesRaw),
                candidatesRaw,
                modelKey: modelKey === "UNKNOWN" ? "BLEND_RATIO" : modelKey,
            };
        } catch (e) {
            return rejectWithValue(getUserMessage(e));
        }
    }
);

export const saveTodayOutfitThunk = createAsyncThunk<SaveTodayOutfitResult, void, ThunkConfig>(
    "outfitReco/saveTodayOutfit",
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { outfitReco: OutfitRecoState };
            const { recoList, topIdx, bottomIdx, outerIdx, recoModelKey } = state.outfitReco;

            if (!recoList || !recoList.top.length || !recoList.bottom.length) {
                throw new Error("저장할 추천 조합이 없습니다.");
            }

            const top = recoList.top[topIdx];
            const bottom = recoList.bottom[bottomIdx];
            const outer = recoList.outer.length ? recoList.outer[outerIdx] : undefined;

            const snapshot: SelectedOutfit = { top, bottom, outer };

            const clothingIds = [top?.clothingId, bottom?.clothingId, outer?.clothingId].filter(
                (v): v is number => typeof v === "number"
            );

            // ✅ 서버 계약이 items(sortOrder)지만, outfitRepo가 clothingIds를 items로 매핑하는 구조면 그대로 사용 가능
            // (너 프로젝트 흐름상 이미 그렇게 쓰고 있음)
            const saved = await outfitRepo.saveTodayOutfit(clothingIds);

            return {
                saved,
                snapshot,
                modelKey: recoModelKey === "UNKNOWN" ? "BLEND_RATIO" : recoModelKey,
            };
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

        // 필요하면 UI에서 강제로 스냅샷 만들 때 사용
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
            state.selectedOutfitSnapshot = null;
            state.recentHistory = []; // ✅ 같이 정리
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

                state.recoList = action.payload.recoList;
                state.candidatesRaw = action.payload.candidatesRaw;
                state.recoModelKey = action.payload.modelKey;

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

                // ✅ 캘린더/히스토리에서 today GET 없이 “recentlySaved”로 사용
                state.lastSavedTodayOutfit = action.payload.saved;

                // ✅ 상세 타이틀/프리뷰를 위한 스냅샷
                state.selectedOutfitSnapshot = action.payload.snapshot;

                // ✅ 저장된 건은 어떤 모델로 추천된 건지 같이 유지
                state.recoModelKey = action.payload.modelKey;

                // ✅ A안 핵심: recentHistory 업서트 (최근 3개)
                const outfitDate =
                    (action.payload.saved as any)?.outfitDate ?? toIsoDateYYYYMMDD();

                const vm = buildHistoryVmFromSnapshot(action.payload.snapshot, outfitDate);
                const next = [vm, ...state.recentHistory.filter((h) => h.outfitDate !== outfitDate)];
                state.recentHistory = next.slice(0, 3);
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

// ---- selectors ----
export const selectRecoList = (s: any) => s.outfitReco.recoList as RecommendationClosetList | null;
export const selectCandidatesRaw = (s: any) => s.outfitReco.candidatesRaw as CandidatesResponseDto | null;
export const selectRecoModelKey = (s: any) => s.outfitReco.recoModelKey as RecommendationModelKey;

export const selectIdx = (s: any) => ({
    topIdx: s.outfitReco.topIdx as number,
    bottomIdx: s.outfitReco.bottomIdx as number,
    outerIdx: s.outfitReco.outerIdx as number,
});

export const selectRecoLoading = (s: any) => s.outfitReco.loading as boolean;
export const selectRecoError = (s: any) => s.outfitReco.error as string | null;

export const selectSaving = (s: any) => s.outfitReco.saving as boolean;
export const selectSaveError = (s: any) => s.outfitReco.saveError as string | null;

// ✅ Calendar에서 monthly map에 덮어쓸 “recentlySaved”
export const selectLastSavedTodayOutfit = (s: any) => s.outfitReco.lastSavedTodayOutfit as TodayOutfitDto | null;

export const selectSelectedOutfitSnapshot = (s: any) => s.outfitReco.selectedOutfitSnapshot as SelectedOutfit | null;

export const selectRecoFeedbackScore = (s: any) => s.outfitReco.recoFeedbackScore as FeedbackScore;
export const selectChecklist = (s: any) => s.outfitReco.checklist as ChecklistSubmitDto | null;

// ✅ A안: 최근 저장 히스토리 (API 없이도 렌더)
export const selectRecentHistory = (s: any) =>
    s.outfitReco.recentHistory as OutfitHistoryVm[];