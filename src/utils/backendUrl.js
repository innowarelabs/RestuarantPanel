/**
 * Production API should use HTTPS. If `.env` mistakenly sets
 * `VITE_BACKEND_URL=http://api.baaie.com`, upgrade to https.
 *
 * Many screens use `(env || 'https://api.baaie.com')` so missing env still hits HTTPS.
 * Code paths that used only `env` without fallback looked like “only this API” used HTTP.
 */
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

/** Same pattern as Sidebar / Reports: default to https when env is unset. */
export function getBackendBaseUrl() {
    return normalizeBackendBaseUrl(import.meta.env.VITE_BACKEND_URL || 'https://api.baaie.com');
}
