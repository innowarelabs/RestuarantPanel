import { configureStore, createSlice } from '@reduxjs/toolkit';

const ACCESS_TOKEN_COOKIE_KEY = 'accessToken';
const REFRESH_TOKEN_COOKIE_KEY = 'refreshToken';
const ONBOARDING_STEP_STORAGE_KEY = 'onboardingStep';

const getUserFromStorage = () => {
    try {
        const userStr = localStorage.getItem("user");
        if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

const getOnboardingStepFromStorage = () => {
    try {
        const value = localStorage.getItem(ONBOARDING_STEP_STORAGE_KEY);
        if (!value || value === 'undefined' || value === 'null') return 'step1';
        return value;
    } catch {
        return 'step1';
    }
};

const getCookie = (name) => {
    if (typeof document === 'undefined') return null;
    const parts = document.cookie.split(';').map((c) => c.trim());
    const match = parts.find((c) => c.startsWith(`${encodeURIComponent(name)}=`));
    if (!match) return null;
    return decodeURIComponent(match.split('=').slice(1).join('='));
};

const setCookie = (name, value, { maxAgeSeconds } = {}) => {
    if (typeof document === 'undefined') return;
    if (!value) return;

    const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : '';
    const maxAge = typeof maxAgeSeconds === 'number' ? `; Max-Age=${Math.floor(maxAgeSeconds)}` : '';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${maxAge}${secure}`;
};

const deleteCookie = (name) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
};

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: getUserFromStorage(),
        accessToken: getCookie(ACCESS_TOKEN_COOKIE_KEY),
        refreshToken: getCookie(REFRESH_TOKEN_COOKIE_KEY),
        onboardingStep: getOnboardingStepFromStorage(),
    },
    reducers: {
        setSession: (state, action) => {
            const { user, accessToken, refreshToken, onboardingStep, accessTokenExpiresIn } = action.payload || {};

            state.user = user || null;
            state.accessToken = accessToken || null;
            state.refreshToken = refreshToken || null;
            state.onboardingStep = onboardingStep || 'step1';

            if (user) localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem(ONBOARDING_STEP_STORAGE_KEY, state.onboardingStep);

            if (accessToken) setCookie(ACCESS_TOKEN_COOKIE_KEY, accessToken, { maxAgeSeconds: accessTokenExpiresIn });
            if (refreshToken) setCookie(REFRESH_TOKEN_COOKIE_KEY, refreshToken, { maxAgeSeconds: 60 * 60 * 24 * 30 });
        },
        setOnboardingStep: (state, action) => {
            state.onboardingStep = action.payload || 'step1';
            localStorage.setItem(ONBOARDING_STEP_STORAGE_KEY, state.onboardingStep);
        },
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.onboardingStep = 'step1';
            localStorage.removeItem("user");
            localStorage.removeItem(ONBOARDING_STEP_STORAGE_KEY);
            deleteCookie(ACCESS_TOKEN_COOKIE_KEY);
            deleteCookie(REFRESH_TOKEN_COOKIE_KEY);
        }
    }
});

export const { setSession, setOnboardingStep, logout } = authSlice.actions;

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
