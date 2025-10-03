
import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import scanReducer from './slices/scanSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
        scan: scanReducer,
        [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
