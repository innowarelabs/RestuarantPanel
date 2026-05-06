import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { isLogicalFailure, restaurantDangerPost } from './dangerZoneApi';

const PauseRestaurantModal = ({
    isOpen,
    onClose,
    restaurantId,
    accessToken,
    orderingPaused,
    onComplete,
}) => {
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const willPause = !orderingPaused;
    const title = willPause ? 'Pause Restaurant?' : 'Resume Restaurant?';
    const description = willPause
        ? 'Customers will not be able to complete checkout until you resume. Staff can still sign in.'
        : 'Customers will be able to place orders again according to your menu and hours.';

    const handleConfirm = async () => {
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) {
            toast.error('VITE_BACKEND_URL is missing');
            return;
        }
        if (!accessToken || !restaurantId) {
            toast.error('Missing session or restaurant. Sign in again.');
            return;
        }

        setSubmitting(true);
        try {
            const { res, data } = await restaurantDangerPost(
                baseUrl,
                'danger-zone/pause-ordering',
                { paused: willPause },
                accessToken,
                restaurantId
            );
            if (!res.ok || (typeof data === 'object' && isLogicalFailure(data))) {
                toast.error(typeof data === 'object' && data?.message ? data.message : 'Could not update ordering status');
                return;
            }
            toast.success(willPause ? 'Restaurant paused — customer checkout is off' : 'Restaurant resumed — customer checkout is on');
            onComplete?.();
        } catch (e) {
            toast.error(e?.message || 'Could not update ordering status');
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
                        <h2 className="text-[20px] font-bold text-[#111827]">{title}</h2>
                        <p className="text-[13px] text-gray-500 mt-1">
                            {willPause ? 'Temporarily disable ordering for customers.' : 'Turn customer ordering back on.'}
                        </p>
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

                <div className="p-6">
                    <p className="text-[14px] text-[#374151] font-[400] leading-relaxed">{description}</p>
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
                        disabled={busy}
                        onClick={() => void handleConfirm()}
                        className="px-6 py-2.5 text-[16px] font-[400] text-white bg-[#F59E0B] rounded-[8px] shadow-lg shadow-orange-100 hover:bg-[#D97706] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {busy ? 'Saving…' : willPause ? 'Pause Restaurant' : 'Resume Restaurant'}
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modal, document.body);
};

export default PauseRestaurantModal;
