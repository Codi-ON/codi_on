// src/state/favorites/favoritesSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { favoritesApi } from "@/lib/api/favoritesApi";
import { getUserMessage } from "@/lib/errors";

type FavoritesState = {
    ids: number[];
    loading: boolean;
    error: string | null;
};

const initialState: FavoritesState = {
    ids: [],
    loading: false,
    error: null,
};

type ThunkConfig = { rejectValue: string };

/**
 * ✅ favorites 조회
 * - 성공: number[] (clothingId 배열)
 * - 실패: rejectWithValue(string)
 */
export const fetchFavorites = createAsyncThunk<number[], void, ThunkConfig>(
    "favorites/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const ids = await favoritesApi.getFavorites();
            // 방어: number[]만 유지 + 중복 제거
            const cleaned = Array.from(
                new Set((ids ?? []).filter((x) => typeof x === "number" && Number.isFinite(x)))
            );
            return cleaned;
        } catch (e) {
            return rejectWithValue(getUserMessage(e));
        }
    }
);

/**
 * ✅ optimistic 토글 (서버 반영)
 * - arg: { clothingId, next }
 * - 성공: void
 * - 실패: rejectWithValue(string) + reducer에서 rollback
 */
export const toggleFavorite = createAsyncThunk<
    void,
    { clothingId: number; next: boolean },
    ThunkConfig
>("favorites/toggle", async ({ clothingId, next }, { rejectWithValue }) => {
    try {
        if (!Number.isFinite(clothingId)) return;
        if (next) await favoritesApi.add(clothingId);
        else await favoritesApi.remove(clothingId);
    } catch (e) {
        return rejectWithValue(getUserMessage(e));
    }
});

const favoritesSlice = createSlice({
    name: "favorites",
    initialState,
    reducers: {
        /**
         * UI 즉시 반영용(낙관적 업데이트)
         * - 화면에서 먼저 state 바꾸고, 이후 toggleFavorite로 서버 반영
         */
        optimisticSet(state, action: PayloadAction<{ clothingId: number; next: boolean }>) {
            const { clothingId, next } = action.payload;
            if (!Number.isFinite(clothingId)) return;

            const has = state.ids.includes(clothingId);

            if (next && !has) state.ids.push(clothingId);
            if (!next && has) state.ids = state.ids.filter((id) => id !== clothingId);
        },

        /**
         * 필요 시 전체 초기화
         */
        resetFavorites(state) {
            state.ids = [];
            state.loading = false;
            state.error = null;
        },

        /**
         * 에러만 지우고 싶을 때
         */
        clearFavoritesError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchFavorites
            .addCase(fetchFavorites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFavorites.fulfilled, (state, action) => {
                state.loading = false;
                state.ids = action.payload ?? [];
            })
            .addCase(fetchFavorites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "즐겨찾기 조회에 실패했습니다.";
            })

            // toggleFavorite: 성공 시에는 optimisticSet으로 이미 반영돼 있으므로 별도 처리 불필요
            // 실패 시 rollback
            .addCase(toggleFavorite.rejected, (state, action) => {
                state.error = action.payload ?? "즐겨찾기 반영에 실패했습니다.";

                const { clothingId, next } = action.meta.arg ?? ({} as any);
                if (!Number.isFinite(clothingId)) return;

                // optimisticSet으로 next 상태를 적용했는데 실패 → 반대로 되돌림
                const shouldBe = !next;
                const has = state.ids.includes(clothingId);

                if (shouldBe && !has) state.ids.push(clothingId);
                if (!shouldBe && has) state.ids = state.ids.filter((id) => id !== clothingId);
            });
    },
});

export const { optimisticSet, resetFavorites, clearFavoritesError } = favoritesSlice.actions;
export default favoritesSlice.reducer;