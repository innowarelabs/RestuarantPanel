import React from 'react';
import { X } from 'lucide-react';

const ConfirmLegalRequestModal = ({ isOpen, onClose, type }) => {
    if (!isOpen) return null;

    const content = type === 'deletion'
        ? "Your data deletion request will be processed within 30 days as per GDPR requirements. This action is irreversible."
        : "Your data export request will be processed and sent to your registered email address within 48 hours.";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">Confirm Request</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Please confirm your legal request below.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6">
                    <p className="text-[14px] text-[#374151] font-[400] leading-relaxed">
                        {content}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 sm:px-6 sm:py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3 bg-white shadow-inner">
                    <button
                        onClick={onClose}
                        className={`w-full sm:w-auto order-1 sm:order-2 px-6 py-2.5 text-[16px] font-[400] text-white rounded-[8px] shadow-lg transition-all active:scale-95 ${type === 'deletion'
                            ? 'bg-[#EF4444] shadow-red-100 hover:bg-[#DC2626]'
                            : 'bg-[#2BB29C] shadow-[#2BB29C]/20 hover:bg-[#24A18C]'
                            }`}
                    >
                        Confirm Request
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto order-2 sm:order-1 px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmLegalRequestModal;
