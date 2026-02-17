import { configureStore, createSlice } from '@reduxjs/toolkit';

const getUserFromStorage = () => {
    try {
        const userStr = localStorage.getItem("user");
        if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

const authSlice = createSlice({
    name: 'auth',
    initialState: { user: getUserFromStorage() },
    reducers: {
        login: (state, action) => {
            state.user = action.payload;
            localStorage.setItem("user", JSON.stringify(action.payload));
            localStorage.setItem("accessToken", "dummy_token");
        },
        logout: (state) => {
            state.user = null;
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        }
    }
});

export const { login, logout } = authSlice.actions;

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState: { isCollapsed: typeof window !== 'undefined' ? window.innerWidth < 768 : false },
    reducers: {
        toggleSidebar: (state) => {
            state.isCollapsed = !state.isCollapsed;
        },
        setCollapsed: (state, action) => {
            state.isCollapsed = action.payload;
        }
    }
});

export const { toggleSidebar, setCollapsed } = sidebarSlice.actions;

const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
        sidebar: sidebarSlice.reducer
    },
});

export default store;
