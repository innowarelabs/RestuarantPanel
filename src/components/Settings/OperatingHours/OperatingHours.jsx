import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertCircle, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import WeeklyHoursEditor from '../../WeeklyHoursEditor';
import AddSpecialDayModal from './AddSpecialDayModal';
import {
    daysToStep2OpeningHours,
    defaultDaysUi,
    extractPayload,
    getRestaurantIdFromUser,
    mergeOpeningHours,
    openingHoursRecordToDays,
    isValidOpeningHourTime,
} from '../../../utils/restaurantOperatingHours';

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

const specialDayId = () => {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return `sd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeSpecialDayRow = (row) => {
    if (!row || typeof row !== 'object') return null;
    const date = typeof row.date === 'string' ? row.date.trim().slice(0, 10) : '';
    if (!date) return null;
    const id = typeof row.id === 'string' && row.id.trim() ? row.id.trim() : specialDayId();
    return {
        id,
        date,
        is_closed: !!row.is_closed,
        open: typeof row.open === 'string' ? row.open : '',
        close: typeof row.close === 'string' ? row.close : '',
        break_start: typeof row.break_start === 'string' ? row.break_start : '',
        break_end: typeof row.break_end === 'string' ? row.break_end : '',
        note: typeof row.note === 'string' ? row.note : '',
    };
};

const OperatingHours = () => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const authUser = useSelector((state) => state.auth.user);

    const [restaurantId, setRestaurantId] = useState('');
    const [days, setDays] = useState(defaultDaysUi);
    const [specialDays, setSpecialDays] = useState([]);
    const [specialModalOpen, setSpecialModalOpen] = useState(false);
    const [editingSpecialDay, setEditingSpecialDay] = useState(null);
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
                let merged = mergeOpeningHours(null);
                let hoursSource = false;
                let loadedSpecial = [];

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
                    if (Array.isArray(step2?.special_days)) {
                        loadedSpecial = step2.special_days.map(normalizeSpecialDayRow).filter(Boolean);
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
                            merged = mergeOpeningHours(null);
                        }
                    } else if (bh && typeof bh === 'object') {
                        merged = mergeOpeningHours(bh);
                    }
                }

                setDays(openingHoursRecordToDays(merged));
                setSpecialDays(loadedSpecial);
            } catch (e) {
                setLoadError(e?.message || 'Failed to load hours');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [accessToken, authUser]);

    /** If API returns a partial restaurant, only apply keys that are present. */
    const applySaveResponsePayload = (payload) => {
        if (!payload || typeof payload !== 'object') return;
        let openingHoursObj = null;
        if (payload.opening_hours && typeof payload.opening_hours === 'object') {
            openingHoursObj = payload.opening_hours;
        } else if (payload.business_hours != null && payload.business_hours !== '') {
            const bh = payload.business_hours;
            if (typeof bh === 'string' && bh.trim()) {
                try {
                    const parsed = JSON.parse(bh);
                    if (parsed && typeof parsed === 'object') openingHoursObj = parsed;
                } catch {
                    /* ignore */
                }
            } else if (bh && typeof bh === 'object') {
                openingHoursObj = bh;
            }
        }
        if (openingHoursObj) {
            setDays(openingHoursRecordToDays(mergeOpeningHours(openingHoursObj)));
        }
        if (Array.isArray(payload.special_days)) {
            setSpecialDays(payload.special_days.map(normalizeSpecialDayRow).filter(Boolean));
        }
    };

    const handleSave = async () => {
        if (!openingHoursValid || saving || !restaurantId || !accessToken) return;
        setSaving(true);
        setSaveErrors([]);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const opening_hours = daysToStep2OpeningHours(days);
            const putUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/${encodeURIComponent(restaurantId)}`;
            const body = {
                opening_hours,
                special_days: Array.isArray(specialDays) ? specialDays : [],
            };

            const res = await fetch(putUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(body),
            });

            const contentType = res.headers.get('content-type');
            const raw = contentType?.includes('application/json') ? await res.json() : await res.text();
            const data = typeof raw === 'string' ? extractPayload(raw) ?? raw : raw;

            if (!res.ok) {
                const lines = toValidationErrorLines(data);
                setSaveErrors(
                    lines.length
                        ? lines
                        : [
                              typeof data === 'object' && data?.message
                                  ? data.message
                                  : typeof data === 'string' && String(data).trim()
                                    ? String(data).trim()
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
            applySaveResponsePayload(extractPayload(data));
        } catch (e) {
            setSaveErrors([e?.message || 'Update failed']);
        } finally {
            setSaving(false);
        }
    };

    const openAddSpecial = () => {
        setEditingSpecialDay(null);
        setSpecialModalOpen(true);
    };

    const openEditSpecial = (row) => {
        setEditingSpecialDay(row);
        setSpecialModalOpen(true);
    };

    const handleSpecialModalClose = () => {
        setSpecialModalOpen(false);
        setEditingSpecialDay(null);
    };

    const handleSpecialSave = (row) => {
        setSpecialDays((prev) => {
            const idx = prev.findIndex((p) => p.id === row.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = row;
                return next;
            }
            return [...prev, row];
        });
    };

    const deleteSpecialDay = (id) => {
        setSpecialDays((prev) => prev.filter((p) => p.id !== id));
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
                        <WeeklyHoursEditor days={days} setDays={setDays} />
                    </>
                )}
            </div>

            {!loading && !loadError && (
                <div className="bg-white rounded-[12px] border border-[#E8E8E8] p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="font-sans text-[18px] font-bold leading-[21.6px] text-[#0F1724]">Special holidays</h3>
                            <p className="text-[13px] text-[#6B6B6B] mt-1">Overrides for specific dates. Saved via your restaurant profile (same request as weekly hours).</p>
                        </div>
                        <button
                            type="button"
                            onClick={openAddSpecial}
                            className="inline-flex items-center gap-2 rounded-[8px] border border-[#E8E8E8] bg-white px-4 py-2 text-[14px] font-[500] text-[#1A1A1A] hover:bg-[#F9FAFB]"
                        >
                            <Plus className="h-4 w-4" />
                            Add day
                        </button>
                    </div>

                    {specialDays.length === 0 ? (
                        <p className="text-[14px] text-[#9CA3AF]">No special days yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {specialDays.map((row) => (
                                <li
                                    key={row.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#F3F4F6] bg-[#FAFAFA] px-4 py-3"
                                >
                                    <div>
                                        <p className="text-[14px] font-[600] text-[#1A1A1A]">{row.date}</p>
                                        <p className="text-[13px] text-[#6B7280] mt-0.5">
                                            {row.is_closed
                                                ? 'Closed all day'
                                                : `${row.open || '—'} – ${row.close || '—'}${
                                                      row.break_start || row.break_end
                                                          ? ` · Break ${row.break_start || '—'}–${row.break_end || '—'}`
                                                          : ''
                                                  }`}
                                        </p>
                                        {row.note ? <p className="text-[12px] text-[#9CA3AF] mt-1">{row.note}</p> : null}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditSpecial(row)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#E8E8E8] bg-white text-[#374151] hover:bg-[#F3F4F6]"
                                            aria-label="Edit special day"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteSpecialDay(row.id)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#F7515133] bg-white text-[#EB5757] hover:bg-[#FEF2F2]"
                                            aria-label="Remove special day"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {!loading && !loadError && (
                <div className="space-y-4">
                    {!!saveErrors.length && (
                        <div className="bg-[#F751511F] rounded-[12px] py-[10px] px-[12px]">
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
                    <div className="flex justify-end">
                        <button
                            type="button"
                            disabled={!openingHoursValid || saving || !restaurantId}
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-[#DD2F26] text-white text-[14px] px-6 py-2.5 rounded-[8px] font-[500] hover:bg-[#C52820] transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving…' : 'Save operating hours'}
                        </button>
                    </div>
                </div>
            )}

            <AddSpecialDayModal
                isOpen={specialModalOpen}
                onClose={handleSpecialModalClose}
                onSave={handleSpecialSave}
                initial={editingSpecialDay}
            />
        </div>
    );
};

export default OperatingHours;
