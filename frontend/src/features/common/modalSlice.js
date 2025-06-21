import { createSlice } from '@reduxjs/toolkit';

export const MODAL_BODY_TYPES = {
    LEAD_ADD_NEW: 'LEAD_ADD_NEW',
    CONFIRMATION: 'CONFIRMATION',
    IMPORT_EXCEL: 'IMPORT_EXCEL',
};

const initialState = {
    isOpen: false,
    title: '',
    bodyType: '',
    extraObject: {},
};

const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        openModal: (state, action) => {
            const { title, bodyType, extraObject } = action.payload;
            state.isOpen = true;
            state.title = title;
            state.bodyType = bodyType;
            state.extraObject = extraObject || {};
        },
        closeModal: (state) => {
            state.isOpen = false;
            state.title = '';
            state.bodyType = '';
            state.extraObject = {};
        },
    },
});

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;