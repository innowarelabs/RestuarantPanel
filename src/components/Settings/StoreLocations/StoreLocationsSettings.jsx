import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { AlertCircle, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = () => ({
    name: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA',
    phone: '',
    sort_order: 0,
    is_primary: false,
});

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

const locationRowId = (row) => {
    if (!row || typeof row !== 'object') return '';
    if (typeof row.id === 'string' && row.id.trim()) return row.id.trim();
    if (typeof row.location_id === 'string' && row.location_id.trim()) return row.location_id.trim();
    if (typeof row.id === 'number' && Number.isFinite(row.id)) return String(row.id);
    if (typeof row.location_id === 'number' && Number.isFinite(row.location_id)) return String(row.location_id);
    return '';
};

const extractLocationsList = (raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const d = raw.data;
    if (Array.isArray(d)) return d;
    if (d && typeof d === 'object') {
        if (Array.isArray(d.data)) return d.data;
        if (Array.isArray(d.locations)) return d.locations;
        if (Array.isArray(d.items)) return d.items;
    }
    return [];
};

const rowToForm = (row) => {
    const base = emptyForm();
    if (!row || typeof row !== 'object') return base;
    return {
        name: typeof row.name === 'string' ? row.name : '',
        street_address: typeof row.street_address === 'string' ? row.street_address : '',
        city: typeof row.city === 'string' ? row.city : '',
        state: typeof row.state === 'string' ? row.state : '',
        postal_code: typeof row.postal_code === 'string' ? row.postal_code : '',
        country: typeof row.country === 'string' && row.country.trim() ? row.country.trim() : 'USA',
        phone: typeof row.phone === 'string' ? row.phone : '',
        sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
        is_primary: !!row.is_primary,
    };
};

const formatAddressLine = (row) => {
    if (!row || typeof row !== 'object') return '';
    const parts = [
        typeof row.street_address === 'string' ? row.street_address.trim() : '',
        [row.city, row.state].filter((x) => typeof x === 'string' && x.trim()).join(', '),
        typeof row.postal_code === 'string' ? row.postal_code.trim() : '',
        typeof row.country === 'string' ? row.country.trim() : '',
    ].filter(Boolean);
    return parts.join(' · ');
};

function StoreLocationsSettingsSkeleton() {
    return (
        <div className="space-y-4" role="status" aria-label="Loading store locations">
            <div className="h-8 w-[220px] max-w-[70%] animate-pulse rounded bg-[#E8E8E8]" />
            <div className="h-4 w-[min(100%,360px)] animate-pulse rounded bg-[#F3F4F6]" />
            <div className="rounded-[12px] border border-[#E8E8E8] bg-white p-5">
                <div className="mb-4 h-10 w-[160px] animate-pulse rounded-[8px] bg-[#E8E8E8]" />
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="rounded-[10px] border border-[#F3F4F6] bg-[#FAFAFA] p-4">
                            <div className="h-4 w-[140px] animate-pulse rounded bg-[#E8E8E8]" />
                            <div className="mt-2 h-3 w-[min(100%,280px)] animate-pulse rounded bg-[#F3F4F6]" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const inputClass =
    'w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#DD2F26]/20 focus:border-[#DD2F26] transition';

const StoreLocationsSettings = () => {
    const accessToken = useSelector((state) => state.auth.accessToken);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [locations, setLocations] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState('');
    const [form, setForm] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const baseUrl = useMemo(() => {
        const u = import.meta.env.VITE_BACKEND_URL;
        return u ? String(u).replace(/\/$/, '') : '';
    }, []);

    const listUrl = `${baseUrl}/api/v1/restaurants/settings/store-locations`;

    const loadLocations = useCallback(
        async (opts = {}) => {
            const silent = !!opts.silent;
            if (!accessToken) {
                if (!silent) setLoading(false);
                return;
            }
            if (!silent) {
                setLoading(true);
                setLoadError('');
            }
            try {
                if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
                const res = await fetch(listUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const contentType = res.headers.get('content-type');
                const raw = contentType?.includes('application/json') ? await res.json() : await res.text();

                if (!res.ok) {
                    const msg =
                        typeof raw === 'object' && raw?.message
                            ? raw.message
                            : typeof raw === 'string'
                              ? raw
                              : `Failed to load (${res.status})`;
                    if (!silent) setLoadError(msg);
                    return;
                }

                const list = extractLocationsList(raw);
                setLocations(Array.isArray(list) ? list : []);
            } catch (e) {
                if (!silent) setLoadError(e?.message || 'Failed to load store locations');
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [accessToken, baseUrl, listUrl],
    );

    useEffect(() => {
        void loadLocations();
    }, [loadLocations]);

    const openCreate = () => {
        setModalMode('create');
        setEditingId('');
        setForm(emptyForm());
        setFormErrors([]);
        setModalOpen(true);
    };

    const openEdit = (row) => {
        const id = locationRowId(row);
        if (!id) return;
        setModalMode('edit');
        setEditingId(id);
        setForm(rowToForm(row));
        setFormErrors([]);
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;
        setModalOpen(false);
        setFormErrors([]);
    };

    const buildCreateBody = () => ({
        name: form.name.trim(),
        street_address: form.street_address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postal_code: form.postal_code.trim(),
        country: form.country.trim() || 'USA',
        phone: form.phone.trim(),
        sort_order: Number.isFinite(Number(form.sort_order)) ? Math.trunc(Number(form.sort_order)) : 0,
        is_primary: !!form.is_primary,
    });

    const buildUpdateBody = () => ({
        name: form.name.trim(),
        street_address: form.street_address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postal_code: form.postal_code.trim(),
        country: form.country.trim() || 'USA',
        phone: form.phone.trim(),
        sort_order: Number.isFinite(Number(form.sort_order)) ? Math.trunc(Number(form.sort_order)) : 0,
        is_primary: !!form.is_primary,
    });

    const handleSubmitModal = async () => {
        if (!accessToken || !baseUrl) return;
        setFormErrors([]);
        const trimmedName = form.name.trim();
        if (!trimmedName) {
            setFormErrors(['Name is required']);
            return;
        }
        setSaving(true);
        try {
            if (modalMode === 'create') {
                const res = await fetch(listUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(buildCreateBody()),
                });
                const contentType = res.headers.get('content-type');
                const data = contentType?.includes('application/json') ? await res.json() : await res.text();

                if (!res.ok) {
                    const lines = toValidationErrorLines(data);
                    setFormErrors(
                        lines.length
                            ? lines
                            : [
                                  typeof data === 'object' && data?.message
                                      ? data.message
                                      : typeof data === 'string'
                                        ? data
                                        : `Create failed (${res.status})`,
                              ],
                    );
                    return;
                }

                if (data && typeof data === 'object' && typeof data.code === 'string' && !isSuccessCode(data.code)) {
                    setFormErrors([
                        typeof data.message === 'string' && data.message.trim()
                            ? data.message.trim()
                            : data.code.trim() || 'Create failed',
                    ]);
                    return;
                }

                const rawMsg =
                    data && typeof data === 'object' && typeof data.message === 'string' ? data.message.trim() : '';
                toast.success(rawMsg || 'Location created');
                setModalOpen(false);
                await loadLocations({ silent: true });
                return;
            }

            const updateUrl = `${listUrl}/${encodeURIComponent(editingId)}`;
            const res = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(buildUpdateBody()),
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok) {
                const lines = toValidationErrorLines(data);
                setFormErrors(
                    lines.length
                        ? lines
                        : [
                              typeof data === 'object' && data?.message
                                  ? data.message
                                  : typeof data === 'string'
                                    ? data
                                    : `Update failed (${res.status})`,
                          ],
                );
                return;
            }

            if (data && typeof data === 'object' && typeof data.code === 'string' && !isSuccessCode(data.code)) {
                setFormErrors([
                    typeof data.message === 'string' && data.message.trim()
                        ? data.message.trim()
                        : data.code.trim() || 'Update failed',
                ]);
                return;
            }

            const rawMsg =
                data && typeof data === 'object' && typeof data.message === 'string' ? data.message.trim() : '';
            toast.success(rawMsg || 'Location updated');
            setModalOpen(false);
            await loadLocations({ silent: true });
        } catch (e) {
            setFormErrors([e?.message || 'Request failed']);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!accessToken || !baseUrl || !deleteTarget?.id) return;
        setDeleting(true);
        try {
            const url = `${listUrl}/${encodeURIComponent(deleteTarget.id)}`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const contentType = res.headers.get('content-type');
            const data = contentType?.includes('application/json') ? await res.json() : await res.text();

            if (!res.ok) {
                const msg =
                    typeof data === 'object' && data?.message
                        ? data.message
                        : typeof data === 'string'
                          ? data
                          : `Delete failed (${res.status})`;
                toast.error(msg);
                return;
            }

            if (data && typeof data === 'object' && typeof data.code === 'string' && !isSuccessCode(data.code)) {
                toast.error(typeof data.message === 'string' ? data.message.trim() : 'Delete failed');
                return;
            }

            const rawMsg =
                data && typeof data === 'object' && typeof data.message === 'string' ? data.message.trim() : '';
            toast.success(rawMsg || 'Location removed');
            setDeleteTarget(null);
            await loadLocations({ silent: true });
        } catch (e) {
            toast.error(e?.message || 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const sortedLocations = useMemo(() => {
        const copy = [...locations];
        copy.sort((a, b) => {
            const sa = Number.isFinite(Number(a?.sort_order)) ? Number(a.sort_order) : 0;
            const sb = Number.isFinite(Number(b?.sort_order)) ? Number(b.sort_order) : 0;
            if (sa !== sb) return sa - sb;
            const na = typeof a?.name === 'string' ? a.name : '';
            const nb = typeof b?.name === 'string' ? b.name : '';
            return na.localeCompare(nb);
        });
        return copy;
    }, [locations]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-[28px] font-bold text-[#1A1A1A]">Stores Location</h2>
                    <p className="text-[#6B6B6B] text-[14px]">
                        Manage physical store or pickup locations for your restaurant. One can be marked as primary.
                    </p>
                </div>
                <button
                    type="button"
                    disabled={!accessToken || loading || !!loadError}
                    onClick={openCreate}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-[8px] bg-[#DD2F26] px-5 text-[14px] font-[500] text-white transition hover:bg-[#C52820] disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#6B7280] sm:self-auto"
                >
                    <Plus className="h-4 w-4" />
                    Add location
                </button>
            </div>

            {loading && <StoreLocationsSettingsSkeleton />}

            {!loading && loadError && (
                <div className="rounded-lg border border-[#F7515133] bg-[#F7515114] px-3 py-2 text-[13px] text-[#47464A]">{loadError}</div>
            )}

            {!loading && !loadError && (
                <div className="rounded-[12px] border border-[#E8E8E8] bg-white p-5">
                    {sortedLocations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#E5E7EB] bg-gray-50 text-[#9CA3AF]">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <p className="text-[15px] font-[500] text-[#1A1A1A]">No locations yet</p>
                            <p className="mt-1 max-w-md text-[13px] text-[#6B7280]">
                                Add your first store location so customers and staff know where orders are fulfilled.
                            </p>
                            <button
                                type="button"
                                disabled={!accessToken}
                                onClick={openCreate}
                                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#DD2F26] px-5 text-[14px] font-[500] text-white transition hover:bg-[#C52820] disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" />
                                Add location
                            </button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[#E5E7EB]">
                            {sortedLocations.map((row) => {
                                const id = locationRowId(row);
                                if (!id) return null;
                                const primary = !!row.is_primary;
                                return (
                                    <li
                                        key={id}
                                        className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <MapPin className="h-4 w-4 shrink-0 text-[#DD2F26]" />
                                                <span className="text-[15px] font-semibold text-[#1A1A1A]">
                                                    {typeof row.name === 'string' ? row.name : 'Location'}
                                                </span>
                                                {primary && (
                                                    <span className="rounded-full bg-[#DD2F26]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#DD2F26]">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-[13px] text-[#6B7280]">{formatAddressLine(row)}</p>
                                            {typeof row.phone === 'string' && row.phone.trim() ? (
                                                <p className="mt-1 text-[13px] text-[#4B5563]">{row.phone.trim()}</p>
                                            ) : null}
                                            <p className="mt-1 text-[12px] text-[#9CA3AF]">
                                                Sort order: {Number.isFinite(Number(row.sort_order)) ? row.sort_order : 0}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-2 sm:pt-0.5">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(row)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#E5E7EB] text-[#374151] transition hover:bg-gray-50"
                                                aria-label="Edit location"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget({ id, name: row.name })}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#E5E7EB] text-[#B91C1C] transition hover:bg-red-50"
                                                aria-label="Delete location"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}

            {modalOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[120] flex min-h-screen min-h-[100dvh] w-full items-center justify-center overflow-y-auto bg-black/45 p-4 sm:p-6"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="store-loc-modal-title"
                        onClick={closeModal}
                    >
                        <div
                            className="relative z-[121] my-auto max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-[12px] border border-[#E8E8E8] bg-white shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                        <div className="sticky top-0 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-5 py-4">
                            <h3 id="store-loc-modal-title" className="text-[18px] font-bold text-[#1A1A1A]">
                                {modalMode === 'create' ? 'Add store location' : 'Edit store location'}
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="rounded-lg p-2 text-[#6B7280] transition hover:bg-gray-100 disabled:opacity-50"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 px-5 py-5">
                            <div>
                                <label className="mb-1 block text-[14px] font-medium text-[#4B5563]">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className={inputClass}
                                    placeholder="e.g. Downtown kitchen"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[14px] font-medium text-[#4B5563]">Street address</label>
                                <input
                                    type="text"
                                    value={form.street_address}
                                    onChange={(e) => setForm((f) => ({ ...f, street_address: e.target.value }))}
                                    className={inputClass}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-[14px] font-medium text-[#4B5563]">City</label>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[14px] font-medium text-[#4B5563]">State</label>
                                    <input
                                        type="text"
                                        value={form.state}
                                        onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-[14px] font-medium text-[#4B5563]">Postal code</label>
                                    <input
                                        type="text"
                                        value={form.postal_code}
                                        onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[14px] font-medium text-[#4B5563]">Country</label>
                                    <input
                                        type="text"
                                        value={form.country}
                                        onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-[14px] font-medium text-[#4B5563]">Phone</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                    className={inputClass}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-[14px] font-medium text-[#4B5563]">Sort order</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.sort_order}
                                        onChange={(e) => {
                                            const n = parseInt(e.target.value, 10);
                                            setForm((f) => ({
                                                ...f,
                                                sort_order: e.target.value === '' || Number.isNaN(n) ? 0 : Math.max(0, n),
                                            }));
                                        }}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex cursor-pointer items-center gap-2 text-[14px] text-[#1A1A1A]">
                                        <input
                                            type="checkbox"
                                            checked={form.is_primary}
                                            onChange={(e) => setForm((f) => ({ ...f, is_primary: e.target.checked }))}
                                            className="h-4 w-4 rounded border-gray-300 text-[#DD2F26] focus:ring-[#DD2F26]"
                                        />
                                        Primary location
                                    </label>
                                </div>
                            </div>

                            {!!formErrors.length && (
                                <div className="rounded-lg border border-[#F7515133] bg-[#F7515114] px-3 py-2">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={18} className="mt-[2px] shrink-0 text-[#EB5757]" />
                                        <div className="space-y-1">
                                            {formErrors.map((line, idx) => (
                                                <p key={idx} className="text-[12px] text-[#47464A]">
                                                    {line}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-[#E5E7EB] bg-gray-50/50 px-5 py-4">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={closeModal}
                                className="rounded-[8px] border border-[#E5E7EB] bg-white px-5 py-2.5 text-[14px] font-[500] text-[#374151] transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => void handleSubmitModal()}
                                className="rounded-[8px] bg-[#DD2F26] px-6 py-2.5 text-[14px] font-[500] text-white transition hover:bg-[#C52820] disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : modalMode === 'create' ? 'Create' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                </div>,
                    document.body,
                )}

            {deleteTarget &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[130] flex min-h-screen min-h-[100dvh] w-full items-center justify-center overflow-y-auto bg-black/45 p-4"
                        role="dialog"
                        aria-modal="true"
                        onClick={() => !deleting && setDeleteTarget(null)}
                    >
                        <div
                            className="relative z-[131] my-auto w-full max-w-md rounded-[12px] border border-[#E8E8E8] bg-white p-6 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                        <h3 className="text-[18px] font-bold text-[#1A1A1A]">Remove location?</h3>
                        <p className="mt-2 text-[14px] text-[#6B7280]">
                            This will delete{' '}
                            <span className="font-medium text-[#1A1A1A]">
                                {deleteTarget.name ? String(deleteTarget.name) : 'this location'}
                            </span>
                            . This cannot be undone.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-[8px] border border-[#E5E7EB] px-4 py-2 text-[14px] font-[500] text-[#374151] hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => void confirmDelete()}
                                className="rounded-[8px] bg-[#B91C1C] px-4 py-2 text-[14px] font-[500] text-white hover:bg-[#991B1B] disabled:opacity-50"
                            >
                                {deleting ? 'Removing…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
};

export default StoreLocationsSettings;
