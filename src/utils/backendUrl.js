/**
 * Single source for API host from `VITE_BACKEND_URL`.
 * Production default: https://api.baaie.com when env is unset.
 *
 * If `.env` mistakenly sets `VITE_BACKEND_URL=http://api.baaie.com`, upgrade to https.
 */
const DEFAULT_BACKEND = 'https://api.baaie.com';

export function normalizeBackendBaseUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    try {
        const u = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
        if (u.hostname.toLowerCase() === 'api.baaie.com' && u.protocol === 'http:') {
            u.protocol = 'https:';
            const path = u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '');
            return `${u.origin}${path}`;
        }
    } catch {
        /* fall through */
    }
    const noTrailingSlash = trimmed.replace(/\/$/, '');
    if (/^http:\/\/api\.baaie\.com/i.test(noTrailingSlash)) {
        return noTrailingSlash.replace(/^http:\/\//i, 'https://');
    }
    return noTrailingSlash;
}

/** Host root without trailing slash (no `/api/v1` suffix). */
export function getBackendBaseUrl() {
    const raw = import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND;
    const normalized = normalizeBackendBaseUrl(raw);
    return normalized.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '') || DEFAULT_BACKEND;
}

/**
 * Build REST URL under `/api/v1`.
 * @param {string} path - e.g. `auth/restaurant/login` or `/orders?status=pending`
 */
export function getApiV1Url(path = '') {
    const base = getBackendBaseUrl();
    const trimmed = String(path).trim();
    if (!trimmed) return `${base}/api/v1`;
    const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    if (withLeading.startsWith('/api/v1')) {
        return `${base}${withLeading}`;
    }
    return `${base}/api/v1${withLeading}`;
}

/**
 * Base host for `POST /api/v1/restaurants/upload/image`.
 * Uses `VITE_UPLOAD_IMAGE_BASE_URL` when set; otherwise `VITE_BACKEND_URL`.
 */
export function getUploadImageBaseUrl() {
    const raw =
        import.meta.env.VITE_UPLOAD_IMAGE_BASE_URL ||
        import.meta.env.VITE_BACKEND_URL ||
        DEFAULT_BACKEND;
    const normalized = normalizeBackendBaseUrl(raw);
    return normalized.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '') || DEFAULT_BACKEND;
}

/** Full URL for restaurant image upload endpoint. */
export function getRestaurantUploadImageUrl() {
    return `${getUploadImageBaseUrl()}/api/v1/restaurants/upload/image`;
}

/** WebSocket origin (`ws:` / `wss:`) derived from `VITE_BACKEND_URL`. */
export function getActivityWsBaseUrl() {
    const base = getBackendBaseUrl();
    try {
        const u = new URL(base.includes('://') ? base : `https://${base}`);
        const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${proto}//${u.host}`;
    } catch {
        return base.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
    }
}
