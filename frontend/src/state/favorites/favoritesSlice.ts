import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {favoritesApi} from "@/lib/api/favoritesApi";
import {getUserMessage} from "@/lib/errors";

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
 * ✅ favorites 조회 (세션키가 없으면 ensureSessionKey가 생성해서 붙임)
 * - 성공: number[]
 * - 실패: rejectWithValue(string)
 */

export const fetchFavorites = createAsyncThunk<number[], void, ThunkConfig>(
    "favorites/fetch",
    async (_, {rejectWithValue}) => {
        try {
            return await favoritesApi.getFavorites();
        } catch (e) {
            return rejectWithValue(getUserMessage(e));
        }
    }
);
/**
 * ✅ optimistic 토글
 * - arg: { clothingId, next }
 * - 성공: void
 * - 실패: rejectWithValue(string) + reducer에서 rollback
 */
export const toggleFavorite = createAsyncThunk<
    void,
    { clothingId: number; next: boolean },
    ThunkConfig
>("favorites/toggle", async ({clothingId, next}, {rejectWithValue}) => {
    try {
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
        // UI에서 즉시 반영용(낙관적 업데이트)
        optimisticSet(state, action: PayloadAction<{ clothingId: number; next: boolean }>) {
            const {clothingId, next} = action.payload;
            const has = state.ids.includes(clothingId);

            if (next && !has) state.ids.push(clothingId);
            if (!next && has) state.ids = state.ids.filter((id) => id !== clothingId);
        },

        // 필요 시 전체 초기화
        resetFavorites(state) {
            state.ids = [];
            state.loading = false;
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

            // toggleFavorite (서버 실패 시 rollback)
            .addCase(toggleFavorite.rejected, (state, action) => {
                state.error = action.payload ?? "즐겨찾기 반영에 실패했습니다.";
                // rollback은 UI에서 optimisticSet 했던 반대값으로 처리하는 게 안전.
                // 여기서 자동 rollback 하려면 arg가 필요하므로, 아래처럼 meta.arg 사용.
                const arg = action.meta.arg;
                const {clothingId, next} = arg;

                // next로 optimistic 반영했는데 실패 -> 반대로 되돌림
                const shouldBe = !next;
                const has = state.ids.includes(clothingId);

                if (shouldBe && !has) state.ids.push(clothingId);
                if (!shouldBe && has) state.ids = state.ids.filter((id) => id !== clothingId);
            });
    },
});

export const {optimisticSet, resetFavorites} = favoritesSlice.actions;
export default favoritesSlice.reducer;