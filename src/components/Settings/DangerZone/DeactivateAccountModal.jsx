import React, { useState } from 'react';
import { X } from 'lucide-react';

const DeactivateAccountModal = ({ isOpen, onClose }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">Deactivate Account</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Temporarily disable your restaurant's system access.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <p className="text-[14px] text-[#374151] font-[400] leading-relaxed">
                        Your account will be temporarily deactivated. You can reactivate it anytime by contacting our support team.
                    </p>

                    <div className="space-y-2">
                        <label className="text-[14px] font-[500] text-[#374151]">Reason (Optional)</label>
                        <textarea
                            placeholder="Tell us why you're deactivating..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full h-32 px-4 py-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#F97316] transition-colors placeholder-gray-400 shadow-sm resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shadow-inner">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-[16px] font-[400] text-white bg-[#F97316] rounded-[8px] shadow-lg shadow-orange-100 hover:bg-[#EA580C] active:scale-95 transition-all"
                    >
                        Deactivate Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeactivateAccountModal;
