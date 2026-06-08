import { getApiV1Url } from './backendUrl';

const extractPayload = (raw) => {
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

const pickName = (...values) =>
    values.find((v) => typeof v === 'string' && v.trim())?.trim() || '';

/** Extract restaurant display name from login / session API payload. */
export function extractRestaurantNameFromSession(sessionData) {
    if (!sessionData || typeof sessionData !== 'object') return '';
    return pickName(
        sessionData?.restaurant?.company_name,
        sessionData?.restaurant?.name,
        sessionData?.company_name,
        sessionData?.companyName,
        sessionData?.user?.restaurant?.company_name,
        sessionData?.user?.restaurant?.name,
        sessionData?.user?.company_name,
        sessionData?.user?.companyName,
        sessionData?.user?.restaurant_name,
        sessionData?.user?.restaurantName,
    );
};

const getStoredRestaurantId = () => {
    try {
        return (localStorage.getItem('restaurant_id') || '').trim();
    } catch {
        return '';
    }
};

const extractNameFromDetail = (detail) => {
    if (!detail || typeof detail !== 'object') return '';
    return pickName(detail.name, detail.legal_business_name, detail.company_name);
};

/**
 * Resolve restaurant display name from onboarding step1 and restaurant detail APIs.
 * Used when login response does not include the name.
 */
export async function resolveRestaurantName(accessToken, restaurantId = '') {
    if (!accessToken || typeof accessToken !== 'string') return '';

    try {
        const step1Res = await fetch(getApiV1Url('restaurants/onboarding/step1'), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const step1Ct = step1Res.headers.get('content-type');
        const step1Raw = step1Ct?.includes('application/json') ? await step1Res.json() : await step1Res.text();
        const step1 = extractPayload(step1Raw);
        const companyName = typeof step1?.company_name === 'string' ? step1.company_name.trim() : '';
        if (companyName) return companyName;

        const resolvedId =
            (typeof restaurantId === 'string' ? restaurantId.trim() : '') ||
            (typeof step1?.id === 'string' ? step1.id.trim() : '') ||
            getStoredRestaurantId();

        if (!resolvedId) return '';

        const detailRes = await fetch(getApiV1Url(`restaurants/${encodeURIComponent(resolvedId)}`), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const detailCt = detailRes.headers.get('content-type');
        const detailRaw = detailCt?.includes('application/json') ? await detailRes.json() : await detailRes.text();
        const detail = extractPayload(detailRaw);
        if (!detailRes.ok) return '';

        return extractNameFromDetail(detail);
    } catch {
        return '';
    }
}
