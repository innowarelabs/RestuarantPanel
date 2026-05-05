/** Shared: onboarding Step2 + Settings → Operating Hours (same step2 PUT shape). */

export function isValidOpeningHourTime(raw) {
    const s = typeof raw === 'string' ? raw.trim() : '';
    if (!s) return false;
    const normalized = s.replace(/\./g, '').trim();

    const twelve = /^(\d{1,2})(:(\d{2}))?\s*(am|pm)$/i.exec(normalized);
    if (twelve) {
        const hour = parseInt(twelve[1], 10);
        const minute = twelve[3] !== undefined ? parseInt(twelve[3], 10) : 0;
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
        if (hour < 1 || hour > 12) return false;
        if (minute < 0 || minute > 59) return false;
        return true;
    }

    const twentyFour = /^(\d{1,2}):(\d{2})$/i.exec(normalized);
    if (twentyFour) {
        const hour = parseInt(twentyFour[1], 10);
        const minute = parseInt(twentyFour[2], 10);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
        if (hour < 0 || hour > 23) return false;
        if (minute < 0 || minute > 59) return false;
        return true;
    }

    return false;
}

export const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const DAY_DISPLAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const defaultOpeningHours = () => ({
    monday: { open: '', close: '', break_start: '', break_end: '' },
    tuesday: { open: '', close: '', break_start: '', break_end: '' },
    wednesday: { open: '', close: '', break_start: '', break_end: '' },
    thursday: { open: '', close: '', break_start: '', break_end: '' },
    friday: { open: '', close: '', break_start: '', break_end: '' },
    saturday: { open: '', close: '', break_start: '', break_end: '' },
    sunday: { open: '', close: '', break_start: '', break_end: '' },
});

export const mergeOpeningHours = (saved) => {
    const merged = defaultOpeningHours();
    const source = saved && typeof saved === 'object' ? saved : {};
    for (const key of Object.keys(merged)) {
        const day = source[key];
        if (day && typeof day === 'object') {
            merged[key] = {
                open: typeof day.open === 'string' ? day.open : merged[key].open,
                close: typeof day.close === 'string' ? day.close : merged[key].close,
                break_start:
                    typeof day.break_start === 'string' ? day.break_start : merged[key].break_start,
                break_end: typeof day.break_end === 'string' ? day.break_end : merged[key].break_end,
            };
        }
    }
    return merged;
};

export const defaultDaysUi = () =>
    DAY_KEYS.map((_, i) => ({
        name: DAY_DISPLAY_NAMES[i],
        isOpen: true,
        hours: i < 5 ? ['09:00', '22:00'] : i === 5 ? ['10:00', '23:00'] : ['10:00', '21:00'],
        hasBreak: false,
        breakHours: ['', ''],
    }));

export const openingHoursRecordToDays = (oh) =>
    DAY_KEYS.map((key, i) => {
        const entry = oh[key] || {};
        const open = typeof entry.open === 'string' ? entry.open.trim() : '';
        const close = typeof entry.close === 'string' ? entry.close.trim() : '';
        const isOpen = !!(open && close);
        const fallback = defaultDaysUi()[i].hours;
        const breakStart = typeof entry.break_start === 'string' ? entry.break_start.trim() : '';
        const breakEnd = typeof entry.break_end === 'string' ? entry.break_end.trim() : '';
        const hasBreak = !!(breakStart || breakEnd);
        return {
            name: DAY_DISPLAY_NAMES[i],
            isOpen,
            hours: isOpen ? [open, close] : fallback,
            hasBreak,
            breakHours: hasBreak ? [breakStart, breakEnd] : ['', ''],
        };
    });

/** Step 2 API: each day has open, close, break_start, break_end */
export const daysToStep2OpeningHours = (days) => {
    const out = {};
    days.forEach((day, i) => {
        const key = DAY_KEYS[i];
        if (!day.isOpen) {
            out[key] = { open: '', close: '', break_start: '', break_end: '' };
            return;
        }
        const open = typeof day.hours[0] === 'string' ? day.hours[0].trim() : '';
        const close = typeof day.hours[1] === 'string' ? day.hours[1].trim() : '';
        let break_start = '';
        let break_end = '';
        if (day.hasBreak) {
            break_start = typeof day.breakHours[0] === 'string' ? day.breakHours[0].trim() : '';
            break_end = typeof day.breakHours[1] === 'string' ? day.breakHours[1].trim() : '';
        }
        out[key] = { open, close, break_start, break_end };
    });
    return out;
};

export const normalizeBool = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        if (v === 'true' || v === '1' || v === 'yes') return true;
        if (v === 'false' || v === '0' || v === 'no') return false;
    }
    return null;
};

export function pickMergedString(step2, restaurant, key) {
    const a = step2 && typeof step2 === 'object' && typeof step2[key] === 'string' ? step2[key].trim() : '';
    if (a) return a;
    const b =
        restaurant && typeof restaurant === 'object' && typeof restaurant[key] === 'string'
            ? restaurant[key].trim()
            : '';
    return b;
}

export function pickUrlArray(step2, restaurant, key) {
    const from = (obj) => {
        if (!obj || typeof obj !== 'object') return [];
        const a = obj[key];
        if (!Array.isArray(a)) return [];
        return a.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
    };
    const e = from(step2);
    if (e.length) return e;
    return from(restaurant);
}

/**
 * Full PUT body for `PUT /api/v1/restaurants/onboarding/step2` (onboarding + legacy flows).
 * Settings → Operating Hours uses `PUT /api/v1/restaurants/{id}` with only `{ opening_hours, special_days }`.
 * @param {string|null|undefined} goto - e.g. `'step3'` for onboarding only; omit or null for settings save.
 * @param {Array|null|undefined} special_days - when `null`, keep existing from `step2` if any; else use array (may be `[]`).
 */
export function mergeStep2PutBody(restaurantId, step2, restaurantDetail, opening_hours, special_days, goto) {
    const e = step2 && typeof step2 === 'object' ? step2 : {};
    const r = restaurantDetail && typeof restaurantDetail === 'object' ? restaurantDetail : {};
    const str = (k) => pickMergedString(e, r, k);
    const out = {
        restaurant_id: restaurantId,
        street_address: str('street_address'),
        city: str('city'),
        state: str('state'),
        postal_code: str('postal_code'),
        country: pickMergedString(e, r, 'country') || 'USA',
        website_header_images: pickUrlArray(e, r, 'website_header_images'),
        website_footer_images: pickUrlArray(e, r, 'website_footer_images'),
        alternate_contact: pickMergedString(e, r, 'alternate_contact'),
        opening_hours,
        average_preparation_time: pickMergedString(e, r, 'average_preparation_time'),
        enable_delivery: normalizeBool(e.enable_delivery) ?? normalizeBool(r.enable_delivery) ?? false,
        enable_pickup: normalizeBool(e.enable_pickup) ?? normalizeBool(r.enable_pickup) ?? false,
    };
    if (special_days !== null && special_days !== undefined) {
        out.special_days = Array.isArray(special_days) ? special_days : [];
    } else if (Array.isArray(e.special_days)) {
        out.special_days = e.special_days;
    }
    if (goto != null && goto !== '') {
        out.goto = goto;
    }
    return out;
}

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

export const getRestaurantIdFromUser = (user) => {
    if (!user || typeof user !== 'object') return '';
    if (typeof user.restaurant_id === 'string') return user.restaurant_id.trim();
    if (typeof user.id === 'string') return user.id.trim();
    return '';
};
