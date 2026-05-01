import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

/** Same rules as onboarding Step2 */
function isValidOpeningHourTime(raw) {
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

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_DISPLAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const defaultOpeningHours = () => ({
    monday: { open: '', close: '', break_start: '', break_end: '' },
    tuesday: { open: '', close: '', break_start: '', break_end: '' },
    wednesday: { open: '', close: '', break_start: '', break_end: '' },
    thursday: { open: '', close: '', break_start: '', break_end: '' },
    friday: { open: '', close: '', break_start: '', break_end: '' },
    saturday: { open: '', close: '', break_start: '', break_end: '' },
    sunday: { open: '', close: '', break_start: '', break_end: '' },
});

const mergeOpeningHours = (saved) => {
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

const defaultDaysUi = () =>
    DAY_KEYS.map((_, i) => ({
        name: DAY_DISPLAY_NAMES[i],
        isOpen: true,
        hours:
            i < 5 ? ['09:00', '22:00'] : i === 5 ? ['10:00', '23:00'] : ['10:00', '21:00'],
        hasBreak: false,
        breakHours: ['', ''],
    }));

const openingHoursRecordToDays = (oh) =>
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
const daysToStep2OpeningHours = (days) => {
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

const normalizeBool = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        if (v === 'true' || v === '1' || v === 'yes') return true;
        if (v === 'false' || v === '0' || v === 'no') return false;
    }
    return null;
};

/** Prefer step2 GET value, else restaurant detail (Business Profile / GET restaurants/{id}). */
function pickMergedString(step2, restaurant, key) {
    const a = step2 && typeof step2 === 'object' && typeof step2[key] === 'string' ? step2[key].trim() : '';
    if (a) return a;
    const b =
        restaurant && typeof restaurant === 'object' && typeof restaurant[key] === 'string'
            ? restaurant[key].trim()
            : '';
    return b;
}

function pickUrlArray(step2, restaurant, key) {
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

function mergeStep2PutBody(restaurantId, step2, restaurantDetail, opening_hours) {
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
    if (Array.isArray(e.special_days)) {
        out.special_days = e.special_days;
    }
    return out;
}

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

const getRestaurantIdFromUser = (user) => {
    if (!user || typeof user !== 'object') return '';
    if (typeof user.restaurant_id === 'string') return user.restaurant_id.trim();
    if (typeof user.id === 'string') return user.id.trim();
    return '';
};

const toValidationErrorLines = (data) => {
    if (!data || typeof data !== 'object') return [];
    if (!Array.isArray(data.detail)) return [];
    return data.detail
        .map((item) => {
            if (!item || typeof item !== 'object') return '';
            const loc = Array.isArray(item.loc) ? item.loc : [];
            const field = typeof loc.at(-1) === 'string' ? loc.at(-1) : '';
            const msg = typeof item.msg === 'string' ? item.msg : '';
            const label = field ? `${field}: ` : '';
            return `${label}${msg}`.trim();
        })
        .filter(Boolean);
};

const isSuccessCode = (code) => {
    if (typeof code !== 'string') return true;
    const normalized = code.trim().toUpperCase();
    return normalized.endsWith('_200') || normalized.endsWith('_201') || normalized.endsWith('_202');
};

const OperatingHours = () => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const authUser = useSelector((state) => state.auth.user);

    const [restaurantId, setRestaurantId] = useState('');
    const [days, setDays] = useState(defaultDaysUi);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveErrors, setSaveErrors] = useState([]);

    const openingHoursValid = days.every((day) => {
        if (!day.isOpen) return true;
        const open = day.hours[0]?.trim() ?? '';
        const close = day.hours[1]?.trim() ?? '';
        if (!open || !close) return false;
        if (!isValidOpeningHourTime(open) || !isValidOpeningHourTime(close)) return false;
        if (day.hasBreak) {
            const b1 = day.breakHours[0]?.trim() ?? '';
            const b2 = day.breakHours[1]?.trim() ?? '';
            if (!b1 || !b2) return false;
            if (!isValidOpeningHourTime(b1) || !isValidOpeningHourTime(b2)) return false;
        }
        return true;
    });

    const isOpeningHourValueInvalid = (value) => {
        const t = typeof value === 'string' ? value.trim() : '';
        if (!t) return false;
        return !isValidOpeningHourTime(t);
    };

    const hoursFormatError = days.some((day) => {
        if (day.isOpen) {
            if (isOpeningHourValueInvalid(day.hours[0]) || isOpeningHourValueInvalid(day.hours[1])) return true;
        }
        if (day.hasBreak && day.isOpen) {
            const b1 = day.breakHours[0]?.trim() ?? '';
            const b2 = day.breakHours[1]?.trim() ?? '';
            if (!b1 || !b2) return true;
            return isOpeningHourValueInvalid(b1) || isOpeningHourValueInvalid(b2);
        }
        return false;
    });

    const toggleDayOpen = (index) => {
        setDays((d) =>
            d.map((row, i) => {
                if (i !== index) return row;
                const nextOpen = !row.isOpen;
                if (nextOpen) {
                    return { ...row, isOpen: true };
                }
                return { ...row, isOpen: false, hasBreak: false, breakHours: ['', ''] };
            }),
        );
    };

    const toggleDayBreak = (index) => {
        setDays((d) =>
            d.map((row, i) => {
                if (i !== index) return row;
                const nextHasBreak = !row.hasBreak;
                return {
                    ...row,
                    hasBreak: nextHasBreak,
                    breakHours: nextHasBreak ? row.breakHours : ['', ''],
                };
            }),
        );
    };

    const setMainHour = (dayIndex, slotIndex, value) => {
        setDays((d) =>
            d.map((row, i) => {
                if (i !== dayIndex) return row;
                const nextHours = [...row.hours];
                nextHours[slotIndex] = value;
                return { ...row, hours: nextHours };
            }),
        );
    };

    const setBreakHour = (dayIndex, slotIndex, value) => {
        setDays((d) =>
            d.map((row, i) => {
                if (i !== dayIndex) return row;
                const next = [...row.breakHours];
                next[slotIndex] = value;
                return { ...row, breakHours: next };
            }),
        );
    };

    useEffect(() => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        const load = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

                const step1Url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step1`;
                const res1 = await fetch(step1Url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const ct1 = res1.headers.get('content-type');
                const raw1 = ct1?.includes('application/json') ? await res1.json() : await res1.text();
                const step1 = extractPayload(raw1);

                const resolvedId =
                    (step1 && typeof step1 === 'object' && typeof step1.id === 'string' ? step1.id.trim() : '') ||
                    (() => {
                        try {
                            return (localStorage.getItem('restaurant_id') || '').trim();
                        } catch {
                            return '';
                        }
                    })() ||
                    getRestaurantIdFromUser(authUser);

                if (!resolvedId) {
                    setLoadError('Restaurant not found. Sign in again or finish onboarding.');
                    return;
                }

                setRestaurantId(resolvedId);

                const step2Url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step2`;
                let merged = defaultOpeningHours();
                let hoursSource = false;

                const res2 = await fetch(step2Url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (res2.ok) {
                    const ct2 = res2.headers.get('content-type');
                    const raw2 = ct2?.includes('application/json') ? await res2.json() : await res2.text();
                    const step2 = extractPayload(raw2);
                    if (step2?.opening_hours && typeof step2.opening_hours === 'object') {
                        merged = mergeOpeningHours(step2.opening_hours);
                        hoursSource = true;
                    }
                }

                if (!hoursSource) {
                    const detailUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/${encodeURIComponent(resolvedId)}`;
                    const resDetail = await fetch(detailUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                    const ctDetail = resDetail.headers.get('content-type');
                    const rawDetail = ctDetail?.includes('application/json')
                        ? await resDetail.json()
                        : await resDetail.text();

                    if (!resDetail.ok) {
                        const msg =
                            typeof rawDetail === 'object' && rawDetail?.message
                                ? rawDetail.message
                                : typeof rawDetail === 'string'
                                  ? rawDetail
                                  : 'Failed to load restaurant';
                        setLoadError(msg);
                        return;
                    }

                    const detail = extractPayload(rawDetail);
                    const bh = detail?.business_hours;
                    if (typeof bh === 'string' && bh.trim()) {
                        try {
                            const parsed = JSON.parse(bh);
                            if (parsed && typeof parsed === 'object') merged = mergeOpeningHours(parsed);
                        } catch {
                            merged = defaultOpeningHours();
                        }
                    } else if (bh && typeof bh === 'object') {
                        merged = mergeOpeningHours(bh);
                    }
                }

                setDays(openingHoursRecordToDays(merged));
            } catch (e) {
                setLoadError(e?.message || 'Failed to load hours');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [accessToken, authUser]);

    const handleSave = async () => {
        if (!openingHoursValid || saving || !restaurantId || !accessToken) return;
        setSaving(true);
        setSaveErrors([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const step2Url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step2`;

            const resGet = await fetch(step2Url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            let existingStep2 = null;
            if (resGet.ok) {
                const ctGet = resGet.headers.get('content-type');
                const rawGet = ctGet?.includes('application/json') ? await resGet.json() : await resGet.text();
                existingStep2 = extractPayload(rawGet);
            }

            const detailUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/${encodeURIComponent(restaurantId)}`;
            const resDetail = await fetch(detailUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            let restaurantDetail = null;
            if (resDetail.ok) {
                const ctD = resDetail.headers.get('content-type');
                const rawD = ctD?.includes('application/json') ? await resDetail.json() : await resDetail.text();
                restaurantDetail = extractPayload(rawD);
            }

            const opening_hours = daysToStep2OpeningHours(days);
            const body = mergeStep2PutBody(restaurantId, existingStep2, restaurantDetail, opening_hours);

            if (
                !String(body.street_address || '').trim() ||
                !String(body.city || '').trim() ||
                !String(body.state || '').trim() ||
                !String(body.postal_code || '').trim()
            ) {
                setSaveErrors([
                    'Street address, city, state, and postal code are required. Add them under Settings → Business Profile (Business Address), then save again.',
                ]);
                return;
            }

            const res = await fetch(step2Url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(body),
            });

            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok) {
                const lines = toValidationErrorLines(data);
                setSaveErrors(
                    lines.length
                        ? lines
                        : [
                              typeof data === 'object' && data?.message
                                  ? data.message
                                  : typeof data === 'string' && data.trim()
                                    ? data.trim()
                                    : 'Update failed',
                          ],
                );
                return;
            }

            if (data && typeof data === 'object' && typeof data.code === 'string' && !isSuccessCode(data.code)) {
                setSaveErrors([
                    typeof data.message === 'string' && data.message.trim()
                        ? data.message.trim()
                        : data.code.trim() || 'Update failed',
                ]);
                return;
            }

            toast.success('Operating hours saved');
        } catch (e) {
            setSaveErrors([e?.message || 'Update failed']);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Operating Hours</h2>
                <p className="text-[#6B6B6B] text-[14px]">Set your restaurant&apos;s opening hours and special days</p>
            </div>

            <div className="bg-white rounded-[12px] border border-[#E8E8E8] p-5">
                <h3 className="mb-4 font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                    Weekly Hours
                </h3>

                {loading && <p className="text-[14px] text-[#6B6B6B]">Loading…</p>}
                {!loading && loadError && (
                    <div className="rounded-lg border border-[#F7515133] bg-[#F7515114] px-3 py-2 text-[13px] text-[#47464A]">{loadError}</div>
                )}

                {!loading && !loadError && (
                    <>
                        <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                            <div className="min-w-[760px] space-y-0">
                                {days.map((day, dayIndex) => (
                                    <div
                                        key={day.name}
                                        className="flex items-center gap-3 border-b border-[#F3F4F6] py-4 last:border-0 sm:gap-4"
                                    >
                                        <div className="w-32 flex-shrink-0">
                                            <span className="font-[500] text-[14px] text-[#1A1A1A]">{day.name}</span>
                                        </div>
                                        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                                            <button
                                                type="button"
                                                onClick={() => toggleDayOpen(dayIndex)}
                                                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${day.isOpen ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${day.isOpen ? 'translate-x-6' : 'translate-x-1'}`}
                                                />
                                            </button>

                                            {day.isOpen ? (
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={day.hours[0]}
                                                        onChange={(e) => setMainHour(dayIndex, 0, e.target.value)}
                                                        className={`w-20 sm:w-24 px-2 py-1 border rounded-[8px] text-[14px] text-center focus:outline-none focus:ring-1 focus:ring-[#DD2F26] ${isOpeningHourValueInvalid(day.hours[0]) ? 'border-[#EB5757] ring-1 ring-[#EB5757]/30' : 'border-[#E8E8E8]'}`}
                                                    />
                                                    <span className="text-[#9CA3AF]">-</span>
                                                    <input
                                                        type="text"
                                                        value={day.hours[1]}
                                                        onChange={(e) => setMainHour(dayIndex, 1, e.target.value)}
                                                        className={`w-20 sm:w-24 px-3 py-1 border rounded-[8px] text-[14px] text-center focus:outline-none focus:ring-1 focus:ring-[#DD2F26] ${isOpeningHourValueInvalid(day.hours[1]) ? 'border-[#EB5757] ring-1 ring-[#EB5757]/30' : 'border-[#E8E8E8]'}`}
                                                    />
                                                </div>
                                            ) : (
                                                <span className="shrink-0 text-sm text-[#9CA3AF]">Closed</span>
                                            )}

                                            <div className="ml-auto mr-[20px] flex shrink-0 items-center gap-3 sm:gap-4">
                                                <div className="flex w-[128px] shrink-0 -translate-x-[20px] items-center gap-2 sm:w-[136px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleDayBreak(dayIndex)}
                                                        disabled={!day.isOpen}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${day.hasBreak ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${day.hasBreak ? 'translate-x-6' : 'translate-x-1'}`}
                                                        />
                                                    </button>
                                                    <span className="min-w-0 flex-1 truncate text-[14px] text-[#9CA3AF]">
                                                        {day.hasBreak ? 'Break' : 'No break'}
                                                    </span>
                                                </div>
                                                <div className="flex h-[34px] w-[168px] shrink-0 items-center gap-2 sm:w-[184px]">
                                                    {day.hasBreak && day.isOpen ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                value={day.breakHours[0]}
                                                                onChange={(e) => setBreakHour(dayIndex, 0, e.target.value)}
                                                                className={`w-20 shrink-0 rounded-[8px] border bg-gray-50 px-2 py-1.5 text-sm sm:w-24 ${isOpeningHourValueInvalid(day.breakHours[0]) ? 'border-[#EB5757] ring-1 ring-[#EB5757]/30' : 'border-[#E8E8E8]'}`}
                                                            />
                                                            <span className="shrink-0 text-[#9CA3AF]">-</span>
                                                            <input
                                                                type="text"
                                                                value={day.breakHours[1]}
                                                                onChange={(e) => setBreakHour(dayIndex, 1, e.target.value)}
                                                                className={`w-20 shrink-0 rounded-[8px] border bg-gray-50 px-2 py-1.5 text-sm sm:w-24 ${isOpeningHourValueInvalid(day.breakHours[1]) ? 'border-[#EB5757] ring-1 ring-[#EB5757]/30' : 'border-[#E8E8E8]'}`}
                                                            />
                                                        </>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {hoursFormatError && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#F7515133] bg-[#F7515114] px-3 py-2">
                                <AlertCircle size={16} className="text-[#EB5757] shrink-0 mt-0.5" aria-hidden />
                                <p className="text-[12px] text-[#47464A] leading-snug">
                                    Invalid time. Use 1–12 with AM or PM (for example 9:00 AM), or 24-hour format (for example 14:00). Values like 13 AM are not valid.
                                </p>
                            </div>
                        )}

                        {!!saveErrors.length && (
                            <div className="mt-4 bg-[#F751511F] rounded-[12px] py-[10px] px-[12px]">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={18} className="text-[#EB5757] mt-[2px]" />
                                    <div className="space-y-1">
                                        {saveErrors.map((line, idx) => (
                                            <p key={idx} className="text-[12px] text-[#47464A]">
                                                {line}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button
                                type="button"
                                disabled={!openingHoursValid || saving || !restaurantId}
                                onClick={handleSave}
                                className="flex items-center gap-2 bg-[#DD2F26] text-white text-[14px] px-6 py-2.5 rounded-[8px] font-[500] hover:bg-[#C52820] transition disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving…' : 'Save Hours'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Special Days — commented out per product request
            <div className="bg-white rounded-[12px] border border-[#E8E8E8] p-5">
                ...
            </div>
            <AddSpecialDayModal isOpen={...} onClose={...} />
            */}
        </div>
    );
};

export default OperatingHours;
