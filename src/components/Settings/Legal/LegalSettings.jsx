import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FileText, Download, Trash2, Pencil } from 'lucide-react';

import LegalDocumentModal from './LegalDocumentModal';
import ConfirmLegalRequestModal from './ConfirmLegalRequestModal';

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

const getRestaurantIdFromUser = (user) => {
    if (!user || typeof user !== 'object') return '';
    if (typeof user.restaurant_id === 'string') return user.restaurant_id.trim();
    if (typeof user.id === 'string') return user.id.trim();
    return '';
};

/** Path segments must match API enum: terms_and_conditions, privacy_policy, data_processing, refund_policy */
const LEGAL_DOCUMENT_TYPES = [
    { key: 'terms_and_conditions', label: 'Terms & Conditions' },
    { key: 'privacy_policy', label: 'Privacy Policy' },
    { key: 'data_processing', label: 'Data Processing Agreement' },
    { key: 'refund_policy', label: 'Refund Policy' },
];

/** Map legacy / alternate API values so list “saved” state still matches */
const normalizeLegalDocumentTypeKey = (raw) => {
    const t = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    if (!t) return '';
    if (t === 'data_processing_agreement') return 'data_processing';
    return t;
};

const LegalDocumentsSkeleton = () => (
    <div className="space-y-3" role="status" aria-label="Loading legal documents">
        {Array.from({ length: 4 }).map((_, i) => (
            <div
                key={`legal-doc-skel-${i}`}
                className="flex flex-col justify-between gap-3 rounded-[8px] border border-[#E5E7EB] p-4 sm:flex-row sm:items-center"
            >
                <div className="flex min-w-0 items-center gap-4">
                    <div className="h-7 w-7 shrink-0 animate-pulse rounded bg-[#E8E8E8]" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-4 max-w-[200px] animate-pulse rounded bg-[#E8E8E8]" />
                        <div className="h-3 w-[140px] animate-pulse rounded bg-[#F3F4F6]" />
                    </div>
                </div>
                <div className="flex w-full shrink-0 flex-row items-center justify-end gap-2 sm:w-auto">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-[8px] bg-[#E8E8E8]" />
                    <div className="h-9 flex-1 animate-pulse rounded-[8px] bg-[#E8E8E8] sm:h-9 sm:w-20 sm:flex-none" />
                </div>
            </div>
        ))}
    </div>
);

const LegalAccountDataSkeleton = () => (
    <div
        className="space-y-4 rounded-[16px] border border-[#E8E8E8] bg-white p-5"
        role="status"
        aria-label="Loading account data section"
    >
        <div className="mb-1 h-6 w-[160px] animate-pulse rounded bg-[#E8E8E8]" />
        <div className="h-4 w-full max-w-lg animate-pulse rounded bg-[#F3F4F6]" />
        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
            <div className="h-[52px] w-full animate-pulse rounded-[12px] bg-[#E8E8E8] sm:flex-1" />
            <div className="h-[52px] w-full animate-pulse rounded-[12px] bg-[#F3F4F6] sm:flex-1" />
        </div>
    </div>
);

const extractDocumentsList = (payload) => {
    const p = extractPayload(payload);
    if (!p) return [];
    if (Array.isArray(p)) return p;
    if (Array.isArray(p.documents)) return p.documents;
    if (Array.isArray(p.items)) return p.items;
    if (Array.isArray(p.data)) return p.data;
    return [];
};

const LegalSettings = () => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const authUser = useSelector((state) => state.auth.user);

    const [restaurantId, setRestaurantId] = useState('');

    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [selectedDocKey, setSelectedDocKey] = useState('');
    const [selectedDocLabel, setSelectedDocLabel] = useState('');
    const [documentModalReadOnly, setDocumentModalReadOnly] = useState(false);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestType, setRequestType] = useState('deletion');

    const [listRows, setListRows] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [listError, setListError] = useState(null);

    const resolvedRestaurantId =
        (typeof restaurantId === 'string' && restaurantId.trim() ? restaurantId.trim() : '') ||
        (() => {
            try {
                return (localStorage.getItem('restaurant_id') || '').trim();
            } catch {
                return '';
            }
        })() ||
        getRestaurantIdFromUser(authUser);

    useEffect(() => {
        if (!accessToken) return;

        const resolveRestaurantId = async () => {
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) return;

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

                if (resolvedId) setRestaurantId(resolvedId);
            } catch {
                const fallback =
                    (() => {
                        try {
                            return (localStorage.getItem('restaurant_id') || '').trim();
                        } catch {
                            return '';
                        }
                    })() || getRestaurantIdFromUser(authUser);
                if (fallback) setRestaurantId(fallback);
            }
        };

        resolveRestaurantId();
    }, [accessToken, authUser]);

    const fetchDocumentsList = useCallback(async () => {
        if (!accessToken || !resolvedRestaurantId) return;
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) return;

        setLoadingList(true);
        setListError(null);
        try {
            const q = `?restaurant_id=${encodeURIComponent(resolvedRestaurantId)}`;
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/legal-documents${q}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const data = await parseJsonResponse(res);

            if (!res.ok || (typeof data === 'object' && isLogicalFailure(data))) {
                const msg =
                    typeof data === 'object' && data?.message
                        ? data.message
                        : typeof data === 'string' && data.trim()
                          ? data.trim()
                          : 'Could not load legal documents';
                setListRows([]);
                setListError(msg);
                return;
            }

            setListRows(extractDocumentsList(data));
        } catch (e) {
            setListRows([]);
            setListError(e?.message || 'Could not load legal documents');
        } finally {
            setLoadingList(false);
        }
    }, [accessToken, resolvedRestaurantId]);

    useEffect(() => {
        fetchDocumentsList();
    }, [fetchDocumentsList]);

    const docTypeSaved = useCallback(
        (key) => {
            const rows = Array.isArray(listRows) ? listRows : [];
            return rows.some((row) => {
                const t = row.document_type || row.documentType || row.type || row.slug;
                return normalizeLegalDocumentTypeKey(t) === normalizeLegalDocumentTypeKey(key);
            });
        },
        [listRows],
    );

    const handleOpenDoc = (key, label, mode = 'edit') => {
        setSelectedDocKey(key);
        setSelectedDocLabel(label);
        setDocumentModalReadOnly(mode === 'view');
        setIsDocumentModalOpen(true);
    };

    const handleCloseDocumentModal = () => {
        setIsDocumentModalOpen(false);
        setDocumentModalReadOnly(false);
    };

    const handleRequest = (type) => {
        setRequestType(type);
        setIsRequestModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Legal</h2>
                <p className="text-[#6B6B6B] text-[14px]">View legal documents and manage your data</p>
            </div>

            <div className="bg-white rounded-[16px] border border-[#E8E8E8] p-5 space-y-4">
                <h3 className="font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                    Legal Documents
                </h3>

                {listError && !loadingList && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-[13px] text-red-700">{listError}</div>
                )}

                {loadingList ? (
                    <LegalDocumentsSkeleton />
                ) : (
                    <div className="space-y-3">
                        {LEGAL_DOCUMENT_TYPES.map(({ key, label }) => {
                            const saved = docTypeSaved(key);
                            return (
                                <div
                                    key={key}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-[#E5E7EB] rounded-[8px] hover:border-[#DD2F26]/30 transition"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <FileText
                                            className="shrink-0 h-7 w-7 text-[#6B7280]"
                                            strokeWidth={1.75}
                                            aria-hidden
                                        />
                                        <div className="min-w-0">
                                            <span className="font-[500] text-[14px] text-[#1A1A1A] block">{label}</span>
                                            <span className="text-[12px] text-[#6B7280]">{saved ? 'Saved on server' : 'Not published yet'}</span>
                                        </div>
                                    </div>
                                    <div className="flex w-full flex-shrink-0 flex-row items-center justify-end gap-2 sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenDoc(key, label, 'edit')}
                                            disabled={!resolvedRestaurantId}
                                            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white text-[#6B7280] transition hover:bg-gray-50 disabled:opacity-50"
                                            aria-label="Edit or publish document"
                                        >
                                            <Pencil className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenDoc(key, label, 'view')}
                                            disabled={!resolvedRestaurantId}
                                            className="inline-flex flex-1 items-center justify-center rounded-[8px] border border-[#E5E7EB] px-4 py-2 text-[13px] font-[500] text-[#1A1A1A] shadow-sm transition hover:bg-gray-50 disabled:opacity-50 sm:flex-none"
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {loadingList ? (
                <LegalAccountDataSkeleton />
            ) : (
                <div className="bg-white rounded-[16px] border border-[#E8E8E8] p-5 space-y-4">
                    <h3 className="mb-1 font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                        Account Data
                    </h3>
                    <p className="text-[14px] text-[#6B6B6B]">
                        Request a copy of your data or permanently delete your account information
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                        <button
                            type="button"
                            onClick={() => handleRequest('export')}
                            className="w-full sm:w-auto flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 border border-[#E5E7EB] rounded-[12px] text-[14px] font-[500] text-[#1A1A1A] hover:bg-gray-50 transition shadow-sm active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            Request Data Export
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRequest('deletion')}
                            className="w-full sm:w-auto flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 border border-[#FECACA] text-[#EF4444] rounded-[12px] text-[14px] font-[500] hover:bg-[#FEF2F2] transition shadow-sm active:scale-95 text-center"
                        >
                            <Trash2 className="w-4 h-4" />
                            Request Data Deletion
                        </button>
                    </div>
                </div>
            )}

            <LegalDocumentModal
                isOpen={isDocumentModalOpen}
                onClose={handleCloseDocumentModal}
                documentType={selectedDocKey}
                documentLabel={selectedDocLabel}
                restaurantId={resolvedRestaurantId}
                accessToken={accessToken}
                readOnly={documentModalReadOnly}
                onSaved={() => void fetchDocumentsList()}
            />

            <ConfirmLegalRequestModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                type={requestType}
            />
        </div>
    );
};

export default LegalSettings;
