import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

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

const isLogicalFailure = (payload) => {
    if (!payload || typeof payload !== 'object') return false;
    const c = payload.code;
    if (typeof c !== 'string' || !c.trim()) return false;
    const u = c.trim().toUpperCase();
    if (u.startsWith('SUCCESS_')) return false;
    if (/_200$|_201$|_202$/u.test(u)) return false;
    return true;
};

const parseJsonResponse = async (res) => {
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

/** HTTP 404 or API body ERROR_404 — no document saved yet; not an error for the UI */
const isLegalDocumentNotFound = (res, data) => {
    if (res.status === 404) return true;
    if (!data || typeof data !== 'object') return false;
    const code = typeof data.code === 'string' ? data.code.trim().toUpperCase() : '';
    return code === 'ERROR_404';
};

const LegalDocumentModal = ({
    isOpen,
    onClose,
    documentType,
    documentLabel,
    restaurantId,
    accessToken,
    onSaved,
    readOnly = false,
}) => {
    const [titleField, setTitleField] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setTitleField('');
            setBody('');
            setDeleteConfirmOpen(false);
            return;
        }
        if (!documentType || !restaurantId || !accessToken) return;

        const rowTitle =
            typeof documentLabel === 'string' && documentLabel.trim() ? documentLabel.trim() : '';
        setTitleField(rowTitle);
        setBody('');

        const load = async () => {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) {
                toast.error('VITE_BACKEND_URL is missing');
                return;
            }
            setLoading(true);
            try {
                const q = `?restaurant_id=${encodeURIComponent(restaurantId)}`;
                const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/legal-documents/${encodeURIComponent(documentType)}${q}`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const data = await parseJsonResponse(res);

                if (isLegalDocumentNotFound(res, data)) {
                    setTitleField(rowTitle);
                    setBody('');
                    return;
                }

                if (!res.ok || (typeof data === 'object' && isLogicalFailure(data))) {
                    const msg =
                        typeof data === 'object' && data?.message
                            ? data.message
                            : 'Could not load document';
                    toast.error(msg);
                    setBody('');
                    return;
                }

                const doc = extractPayload(data);
                const inner =
                    doc && typeof doc === 'object' && doc.body === undefined && doc.data && typeof doc.data === 'object'
                        ? doc.data
                        : doc;
                const b =
                    typeof inner?.body === 'string'
                        ? inner.body
                        : typeof inner?.content === 'string'
                          ? inner.content
                          : '';
                const t = typeof inner?.title === 'string' ? inner.title : '';
                setBody(b);
                setTitleField(t || rowTitle);
            } catch (e) {
                toast.error(e?.message || 'Could not load document');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [isOpen, documentType, documentLabel, restaurantId, accessToken]);

    const busy = saving || deleting;
    const mainInteractionLocked = busy || loading;

    const handleSave = async () => {
        if (!documentType || !restaurantId || !accessToken) return;
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) {
            toast.error('VITE_BACKEND_URL is missing');
            return;
        }
        const text = typeof body === 'string' ? body : '';
        if (!text.trim()) {
            toast.error('Document body cannot be empty');
            return;
        }

        setSaving(true);
        try {
            const q = `?restaurant_id=${encodeURIComponent(restaurantId)}`;
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/legal-documents/${encodeURIComponent(documentType)}${q}`;
            const payload = { body: text };
            const ti = titleField.trim();
            if (ti) payload.title = ti;

            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await parseJsonResponse(res);
            if (!res.ok || (typeof data === 'object' && isLogicalFailure(data))) {
                toast.error(typeof data === 'object' && data?.message ? data.message : 'Could not save document');
                return;
            }
            toast.success('Document saved');
            onSaved?.();
        } catch (e) {
            toast.error(e?.message || 'Could not save document');
        } finally {
            setSaving(false);
        }
    };

    const performDelete = async () => {
        if (!documentType || !restaurantId || !accessToken) return;

        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) {
            toast.error('VITE_BACKEND_URL is missing');
            return;
        }

        setDeleting(true);
        try {
            const q = `?restaurant_id=${encodeURIComponent(restaurantId)}`;
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/legal-documents/${encodeURIComponent(documentType)}${q}`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const data = await parseJsonResponse(res);
            if (!res.ok || (typeof data === 'object' && isLogicalFailure(data))) {
                toast.error(typeof data === 'object' && data?.message ? data.message : 'Could not delete document');
                return;
            }
            toast.success('Document removed');
            setDeleteConfirmOpen(false);
            setBody('');
            setTitleField(documentLabel || '');
            onSaved?.();
            onClose();
        } catch (e) {
            toast.error(e?.message || 'Could not delete document');
        } finally {
            setDeleting(false);
        }
    };

    const dismissModal = () => {
        setDeleteConfirmOpen(false);
        onClose();
    };

    if (!isOpen) return null;

    const deleteConfirmDialog = deleteConfirmOpen && !readOnly && (
        <div
            className="fixed inset-0 z-[220] flex min-h-[100dvh] min-h-screen w-full items-center justify-center bg-black/40 p-4 sm:p-6"
            onClick={() => {
                if (!deleting) setDeleteConfirmOpen(false);
            }}
            role="presentation"
        >
            <div
                className="relative w-full max-w-[440px] rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-legal-doc-title"
            >
                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                    <h2 id="delete-legal-doc-title" className="pr-8 text-[20px] font-bold text-[#111827]">
                        Remove document?
                    </h2>
                    <button
                        type="button"
                        disabled={deleting}
                        onClick={() => !deleting && setDeleteConfirmOpen(false)}
                        className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="px-6 py-5">
                    <p className="text-[14px] leading-relaxed text-[#374151]">
                        This removes{' '}
                        <span className="font-[600] text-[#1A1A1A]">{documentLabel || 'this document'}</span> for your
                        restaurant. You can publish again later.
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4 shadow-inner">
                    <button
                        type="button"
                        disabled={deleting}
                        onClick={() => !deleting && setDeleteConfirmOpen(false)}
                        className="rounded-[8px] border border-[#E5E7EB] bg-white px-5 py-2.5 text-[16px] font-[400] text-[#374151] shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={deleting}
                        onClick={() => void performDelete()}
                        className="rounded-[8px] bg-[#DD2F26] px-6 py-2.5 text-[16px] font-[400] text-white shadow-lg shadow-[#DD2F26]/20 transition-all hover:bg-[#C52820] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {deleting ? 'Removing…' : 'Remove'}
                    </button>
                </div>
            </div>
        </div>
    );

    const modal = (
        <div
            className="fixed inset-0 z-[200] flex min-h-[100dvh] min-h-screen w-full items-center justify-center bg-black/20 p-4"
            onClick={() => !mainInteractionLocked && dismissModal()}
        >
            <div
                className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[640px] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">{documentLabel}</h2>
                        <p className="text-[13px] text-gray-500 mt-1">
                            {readOnly ? 'Preview only — use Edit to change or publish.' : 'Create or update this agreement for your restaurant.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        disabled={mainInteractionLocked}
                        onClick={dismissModal}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
                    {loading ? (
                        <p className="text-[14px] text-[#6B7280]">Loading…</p>
                    ) : (
                        <>
                            <div>
                                <label className="block text-[14px] font-[500] text-[#374151] mb-1">Title (optional)</label>
                                <input
                                    type="text"
                                    value={titleField}
                                    onChange={(e) => setTitleField(e.target.value)}
                                    readOnly={readOnly}
                                    disabled={busy && !readOnly}
                                    placeholder="Display title"
                                    className={`w-full px-4 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] disabled:bg-gray-50 ${readOnly ? 'cursor-default bg-[#F9FAFB] focus:border-[#E5E7EB]' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="block text-[14px] font-[500] text-[#374151] mb-1">Agreement text</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    readOnly={readOnly}
                                    disabled={busy && !readOnly}
                                    rows={14}
                                    placeholder="Paste or write your legal text here…"
                                    className={`w-full px-4 py-3 border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#374151] leading-relaxed outline-none focus:border-[#DD2F26] resize-y min-h-[200px] disabled:bg-gray-50 font-[400] ${readOnly ? 'cursor-default resize-none bg-[#F9FAFB] focus:border-[#E5E7EB]' : ''}`}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="px-5 py-3 sm:px-6 sm:py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 bg-white shrink-0">
                    {readOnly ? (
                        <button
                            type="button"
                            disabled={loading}
                            onClick={dismissModal}
                            className="px-6 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 disabled:opacity-50"
                        >
                            Close
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                disabled={mainInteractionLocked}
                                onClick={dismissModal}
                                className="px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={mainInteractionLocked}
                                onClick={() => setDeleteConfirmOpen(true)}
                                className="px-5 py-2.5 text-[16px] font-[400] text-[#EF4444] border border-[#FECACA] rounded-[8px] hover:bg-[#FEF2F2] disabled:opacity-40"
                            >
                                Delete
                            </button>
                            <button
                                type="button"
                                disabled={busy || loading}
                                onClick={() => void handleSave()}
                                className="px-6 py-2.5 text-[16px] font-[400] text-white bg-[#DD2F26] rounded-[8px] shadow-lg shadow-[#DD2F26]/20 hover:bg-[#C52820] disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return (
        <>
            {createPortal(modal, document.body)}
            {deleteConfirmDialog ? createPortal(deleteConfirmDialog, document.body) : null}
        </>
    );
};

export default LegalDocumentModal;
