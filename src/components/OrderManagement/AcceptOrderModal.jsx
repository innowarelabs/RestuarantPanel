import React from 'react';

export default function AcceptOrderModal({ isOpen, onClose, onConfirm, orderId }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20">
            <div className="bg-white rounded-[16px] p-6 w-full max-w-[400px] shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-[20px] font-bold text-[#111827] mb-2">Accept Order?</h2>
                <p className="text-[14px] text-[#6B7280] mb-8">
                    You're about to accept Order {orderId}.
                </p>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto order-2 sm:order-1 px-6 py-2.5 rounded-[8px] border border-gray-200 text-[#374151] font-medium text-[14px] hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="w-full sm:w-auto order-1 sm:order-2 px-6 py-2.5 rounded-[8px] bg-[#2BB29C] text-white font-medium text-[14px] hover:bg-[#259D89] transition-colors cursor-pointer"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}
