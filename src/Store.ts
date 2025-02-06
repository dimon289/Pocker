import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./Slices/userSlice"
import serverReducer from "./Slices/serverSlice"

export const store = configureStore({
    reducer: {
        user: userReducer,
        server: serverReducer,
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;