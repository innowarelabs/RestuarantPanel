import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   dateLabel: string,
 *   onConfirm: () => void | Promise<void>,
 *   pending?: boolean,
 * }} props
 */
const DeleteSpecialDayModal = ({ isOpen, onClose, dateLabel, onConfirm, pending = false }) => {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[210] flex min-h-[100dvh] min-h-screen w-full items-center justify-center bg-black/40 p-4 sm:p-6"
            onClick={() => {
                if (!pending) onClose?.();
            }}
            role="presentation"
        >
            <div
                className="relative w-full max-w-[440px] rounded-2xl bg-white shadow-xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-special-day-title"
            >
                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                    <h2 id="delete-special-day-title" className="pr-8 text-[20px] font-bold text-[#111827]">
                        Remove special day?
                    </h2>
                    <button
                        type="button"
                        disabled={pending}
                        onClick={onClose}
                        className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-5">
                    <p className="text-[14px] leading-relaxed text-[#374151]">
                        This removes the override for{' '}
                        <span className="font-[600] text-[#1A1A1A]">{dateLabel || 'this date'}</span>. You can add it
                        again later if needed.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4 shadow-inner">
                    <button
                        type="button"
                        disabled={pending}
                        onClick={onClose}
                        className="rounded-[8px] border border-[#E5E7EB] bg-white px-5 py-2.5 text-[16px] font-[400] text-[#374151] shadow-sm transition-all hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={pending}
                        onClick={() => void onConfirm?.()}
                        className="rounded-[8px] bg-[#DD2F26] px-6 py-2.5 text-[16px] font-[400] text-white shadow-lg shadow-[#DD2F26]/20 transition-all hover:bg-[#C52820] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {pending ? 'Removing…' : 'Remove'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteSpecialDayModal;
