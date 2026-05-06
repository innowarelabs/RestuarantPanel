import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { isLogicalFailure, restaurantDangerPost } from './dangerZoneApi';

const DeleteAccountModal = ({ isOpen, onClose, restaurantId, accessToken, restaurantName = '', onSuccess }) => {
    const [confirmName, setConfirmName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) setConfirmName('');
    }, [isOpen]);

    if (!isOpen) return null;

    const trimmedTarget = typeof restaurantName === 'string' ? restaurantName.trim() : '';
    const isConfirmed = trimmedTarget.length > 0 && confirmName.trim() === trimmedTarget;
    const nameMissing = !trimmedTarget;

    const handleDelete = async () => {
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) {
            toast.error('VITE_BACKEND_URL is missing');
            return;
        }
        if (!accessToken || !restaurantId) {
            toast.error('Missing session or restaurant. Sign in again.');
            return;
        }
        if (!isConfirmed) return;

        setSubmitting(true);
        try {
            const { res, data } = await restaurantDangerPost(
                baseUrl,
                'danger-zone/permanent-delete',
                { confirm: true, restaurant_name: trimmedTarget },
                accessToken,
                restaurantId
            );
            if (!res.ok || (typeof data === 'object' && isLogicalFailure(data))) {
                toast.error(typeof data === 'object' && data?.message ? data.message : 'Could not delete restaurant');
                return;
            }
            onClose();
            onSuccess?.();
        } catch (e) {
            toast.error(e?.message || 'Could not delete restaurant');
        } finally {
            setSubmitting(false);
        }
    };

    const busy = submitting;

    const modal = (
        <div
            className="fixed inset-0 z-[200] flex min-h-[100dvh] min-h-screen w-full items-center justify-center bg-black/20 p-4"
            onClick={() => !busy && onClose()}
        >
            <div
                className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">Delete Account Permanently?</h2>
                        <p className="text-[13px] text-gray-500 mt-1">This action is irreversible.</p>
                    </div>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-[12px] flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                        <div>
                            <p className="font-[600] text-[14px] text-[#DC2626]">Warning</p>
                            <p className="text-[13px] text-[#DC2626]/80 leading-relaxed mt-1">
                                Tickets, payments, loyalty data, orders, analytics, and related records for this restaurant
                                are removed in one transaction, along with users and sessions for this tenant.
                            </p>
                        </div>
                    </div>

                    {nameMissing ? (
                        <p className="text-[14px] text-[#B45309]">
                            Restaurant name could not be loaded. Refresh the page or contact support before deleting.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-[14px] font-[500] text-[#374151]">
                                Type{' '}
                                <span className="font-[600] text-[#1A1A1A]">&quot;{trimmedTarget}&quot;</span> to confirm
                            </label>
                            <input
                                type="text"
                                placeholder="Restaurant name"
                                value={confirmName}
                                onChange={(e) => setConfirmName(e.target.value)}
                                disabled={busy}
                                autoComplete="off"
                                className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#EF4444] transition-colors placeholder-gray-400 shadow-sm disabled:bg-gray-50"
                            />
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shadow-inner">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onClose}
                        className="px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!isConfirmed || busy || nameMissing}
                        onClick={() => void handleDelete()}
                        className={`px-6 py-2.5 text-[16px] font-[400] text-white rounded-[8px] shadow-lg transition-all active:scale-95 ${
                            isConfirmed && !busy && !nameMissing
                                ? 'bg-[#EF4444] hover:bg-[#DC2626] shadow-red-100'
                                : 'bg-red-300 cursor-not-allowed shadow-none'
                        }`}
                    >
                        {busy ? 'Deleting…' : 'Delete Restaurant'}
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modal, document.body);
};

export default DeleteAccountModal;
