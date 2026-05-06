export const extractPayload = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'string') {
        const text = raw.trim();
        if (!text) return null;
        try {
            return extractPayload(JSON.parse(text));
        } catch {
            return null;
        }
    }
    if (typeof raw !== 'object') return null;
    const nested = raw?.data?.data && typeof raw.data.data === 'object' ? raw.data.data : null;
    const top = raw?.data && typeof raw.data === 'object' ? raw.data : null;
    return nested || top || raw;
};

export const isLogicalFailure = (payload) => {
    if (!payload || typeof payload !== 'object') return false;
    const c = payload.code;
    if (typeof c !== 'string' || !c.trim()) return false;
    const u = c.trim().toUpperCase();
    if (u.startsWith('SUCCESS_')) return false;
    if (/_200$|_201$|_202$/u.test(u)) return false;
    return true;
};

export const parseJsonResponse = async (res) => {
    const ct = res.headers.get('content-type');
    if (ct?.includes('application/json')) {
        try {
            return await res.json();
        } catch {
            return null;
        }
    }
    const t = await res.text();
    if (!t.trim()) return null;
    try {
        return JSON.parse(t);
    } catch {
        return t;
    }
};

/**
 * POST /api/v1/restaurants/{endpoint}
 * - danger-zone/pause-ordering — body `{ paused: boolean }`
 * - danger-zone/deactivate — body `{ confirm: true }`
 * - danger-zone/permanent-delete — body `{ confirm: true, restaurant_name: string }` — success e.g. `code: SUCCESS_200`
 */
export async function restaurantDangerPost(baseUrl, endpoint, body, accessToken, restaurantId) {
    const path = String(endpoint).replace(/^\//, '');
    const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/${path}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            ...(restaurantId ? { 'X-Restaurant-Id': String(restaurantId) } : {}),
        },
        body: JSON.stringify(body),
    });
    const data = await parseJsonResponse(res);
    return { res, data };
}

export async function fetchRestaurantSummary(baseUrl, restaurantId, accessToken) {
    const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/${encodeURIComponent(restaurantId)}`;
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    });
    const data = await parseJsonResponse(res);
    if (!res.ok || (typeof data === 'object' && isLogicalFailure(data))) {
        return { ok: false, detail: null, data, res };
    }
    const detail = extractPayload(data);
    return { ok: true, detail: detail && typeof detail === 'object' ? detail : null, data, res };
}
