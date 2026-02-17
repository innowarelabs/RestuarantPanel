import React, { useState } from 'react';

export default function RejectOrderModal({ isOpen, onClose, onConfirm }) {
    const [selectedReason, setSelectedReason] = useState(null);

    if (!isOpen) return null;

    const reasons = [
        'Item unavailable',
        'Kitchen busy',
        'Closed',
        'Other'
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20">
            <div className="bg-white rounded-[16px] p-6 w-full max-w-[400px] shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-[20px] font-bold text-[#111827] mb-2">Reject Order</h2>
                <p className="text-[14px] text-[#6B7280] mb-6">
                    Please select a reason for rejecting this order
                </p>

                <div className="space-y-3 mb-8">
                    {reasons.map((reason) => (
                        <button
                            key={reason}
                            onClick={() => setSelectedReason(reason)}
                            className={`w-full text-left px-4 py-3 rounded-[8px] text-[14px] font-medium border transition-all cursor-pointer
                                ${selectedReason === reason
                                    ? 'bg-[#FEF2F2] border-[#FECACA] text-[#EF4444]'
                                    : 'bg-white border-gray-100 text-[#374151] hover:border-gray-200'}`}
                        >
                            {reason}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto order-2 sm:order-1 px-6 py-2.5 rounded-[8px] border border-gray-200 text-[#374151] font-medium text-[14px] hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(selectedReason)}
                        disabled={!selectedReason}
                        className={`w-full sm:w-auto order-1 sm:order-2 px-6 py-2.5 rounded-[8px] font-medium text-[14px] transition-colors cursor-pointer
                            ${selectedReason
                                ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                        Reject Order
                    </button>
                </div>
            </div>
        </div>
    );
}
