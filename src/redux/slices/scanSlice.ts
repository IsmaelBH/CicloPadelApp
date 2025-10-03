import { createSlice } from '@reduxjs/toolkit';

interface ScanState {
    count: number;
}

const initialState: ScanState = {
    count: 0,
};

const scanSlice = createSlice({
    name: 'scan',
    initialState,
    reducers: {
        addScan: (state) => {
            state.count += 1;
        },
        resetScan: (state) => {
            state.count = 0;
        },
    },
});

export const { addScan, resetScan } = scanSlice.actions;
export default scanSlice.reducer;
