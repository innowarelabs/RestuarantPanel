import { configureStore, createSlice } from '@reduxjs/toolkit';

const ACCESS_TOKEN_COOKIE_KEY = 'accessToken';
const REFRESH_TOKEN_COOKIE_KEY = 'refreshToken';
const ONBOARDING_STEP_STORAGE_KEY = 'onboardingStep';
const RESTAURANT_NAME_STORAGE_KEY = 'restaurantName';
/** Login `data.is_open` + sidebar accepting-orders toggle (`/dashboard/toggle-open`) */
export const RESTAURANT_IS_OPEN_STORAGE_KEY = 'restaurantPanelAcceptingOrders';

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

const getRestaurantNameFromStorage = () => {
    try {
        const value = localStorage.getItem(RESTAURANT_NAME_STORAGE_KEY);
        if (!value || value === 'undefined' || value === 'null') return '';
        return value;
    } catch {
        return '';
    }
};

const getRestaurantIsOpenFromStorage = () => {
    try {
        const v = localStorage.getItem(RESTAURANT_IS_OPEN_STORAGE_KEY);
        if (v === 'false') return false;
        return true;
    } catch {
        return true;
    }
};

const persistRestaurantIsOpen = (value) => {
    try {
        localStorage.setItem(RESTAURANT_IS_OPEN_STORAGE_KEY, String(Boolean(value)));
    } catch {
        /* ignore */
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

/** Keys used by onboarding draft, auth, 2FA, sidebar — cleared on logout */
const APP_LOCAL_STORAGE_KEYS = [
    'user',
    ONBOARDING_STEP_STORAGE_KEY,
    RESTAURANT_NAME_STORAGE_KEY,
    'restaurant_id',
    'onboardingFormData',
    'onboardingCategories',
    'onboardingItems',
    'onboardingMaxStepReached',
    'onboardingCurrentStep',
    'twoFAStatus',
    'twoFANextRoute',
    'twoFAGoto',
    'twoFAUserId',
    'sidebarSelected',
    RESTAURANT_IS_OPEN_STORAGE_KEY,
];

const clearAppLocalStorage = () => {
    try {
        for (const key of APP_LOCAL_STORAGE_KEYS) {
            localStorage.removeItem(key);
        }
    } catch {
        /* ignore quota / private mode */
    }
};

const clearSiteCookies = () => {
    if (typeof document === 'undefined') return;
    deleteCookie(ACCESS_TOKEN_COOKIE_KEY);
    deleteCookie(REFRESH_TOKEN_COOKIE_KEY);
    try {
        const seen = new Set();
        document.cookie.split(';').forEach((raw) => {
            const name = raw.split('=')[0]?.trim();
            if (!name || seen.has(name)) return;
            seen.add(name);
            deleteCookie(name);
        });
    } catch {
        /* ignore */
    }
};

const clearSessionStorage = () => {
    try {
        sessionStorage.removeItem('twoFAEmail');
        sessionStorage.removeItem('twoFAPassword');
    } catch {
        /* ignore */
    }
};

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: getUserFromStorage(),
        accessToken: getCookie(ACCESS_TOKEN_COOKIE_KEY),
        refreshToken: getCookie(REFRESH_TOKEN_COOKIE_KEY),
        onboardingStep: getOnboardingStepFromStorage(),
        restaurantName: getRestaurantNameFromStorage(),
        restaurantIsOpen: getRestaurantIsOpenFromStorage(),
    },
    reducers: {
        setSession: (state, action) => {
            const {
                user,
                accessToken,
                refreshToken,
                onboardingStep,
                accessTokenExpiresIn,
                restaurantName,
                restaurantIsOpen,
            } = action.payload || {};

            state.user = user || null;
            state.accessToken = accessToken || null;
            state.refreshToken = refreshToken || null;
            state.onboardingStep = onboardingStep || 'step1';
            if (typeof restaurantName === 'string') {
                state.restaurantName = restaurantName;
                localStorage.setItem(RESTAURANT_NAME_STORAGE_KEY, restaurantName);
            }

            if (typeof restaurantIsOpen === 'boolean') {
                state.restaurantIsOpen = restaurantIsOpen;
                persistRestaurantIsOpen(restaurantIsOpen);
            }

            if (user) localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem(ONBOARDING_STEP_STORAGE_KEY, state.onboardingStep);

            if (accessToken) setCookie(ACCESS_TOKEN_COOKIE_KEY, accessToken, { maxAgeSeconds: accessTokenExpiresIn });
            if (refreshToken) setCookie(REFRESH_TOKEN_COOKIE_KEY, refreshToken, { maxAgeSeconds: 60 * 60 * 24 * 30 });
        },
        setRestaurantIsOpen: (state, action) => {
            const next = Boolean(action.payload);
            state.restaurantIsOpen = next;
            persistRestaurantIsOpen(next);
        },
        setRestaurantName: (state, action) => {
            const nextValue = typeof action.payload === 'string' ? action.payload.trim() : '';
            state.restaurantName = nextValue;
            localStorage.setItem(RESTAURANT_NAME_STORAGE_KEY, nextValue);
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
            state.restaurantName = '';
            state.restaurantIsOpen = true;
            clearAppLocalStorage();
            clearSiteCookies();
            clearSessionStorage();
        }
    }
});

export const { setSession, setRestaurantName, setRestaurantIsOpen, setOnboardingStep, logout } = authSlice.actions;

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
