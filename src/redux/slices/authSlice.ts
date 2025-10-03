import { createSlice } from '@reduxjs/toolkit';

interface UserState {
    email: string | null;
    idToken: string | null;
    uid: string | null; // Cambiamos de localId a uid
    fullName?: string | null;
}

const initialState: UserState = {
    email: null,
    idToken: null,
    uid: null, // Cambiado
    fullName: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.email = action.payload.email;
            state.idToken = action.payload.idToken;
            state.uid = action.payload.localId; // Lo renombramos internamente
            state.fullName = action.payload.fullName || null;
        },
        logout: (state) => {
            state.email = null;
            state.idToken = null;
            state.uid = null; // Cambiado
            state.fullName = null;
        },
    },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;