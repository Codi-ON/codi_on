import { configureStore } from "@reduxjs/toolkit";
import favoritesReducer from "@/state/favorites/favoritesSlice";
import outfitRecoReducer from "@/state/outfitReco/outfitRecoSlice";
export const store = configureStore({
    reducer: {
        favorites: favoritesReducer,
        outfitReco: outfitRecoReducer,
    },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;