import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DeleteAccountModal = ({ isOpen, onClose, restaurantName = "The Spice House" }) => {
    const [confirmName, setConfirmName] = useState('');

    if (!isOpen) return null;

    const isConfirmed = confirmName === restaurantName;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">Delete Account Permanently?</h2>
                        <p className="text-[13px] text-gray-500 mt-1">This action is irreversible and permanent.</p>
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
                    {/* Warning Box */}
                    <div className="p-4 bg-red-50 border border-red-100 rounded-[12px] flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                        <div>
                            <p className="font-[600] text-[14px] text-[#DC2626]">Warning</p>
                            <p className="text-[13px] text-[#DC2626]/80 leading-relaxed mt-1">
                                All your restaurant data, orders, menu items, and settings will be permanently deleted from our servers.
                            </p>
                        </div>
                    </div>

                    {/* Confirmation Input */}
                    <div className="space-y-2">
                        <label className="text-[14px] font-[500] text-[#374151]">
                            Type "{restaurantName}" to confirm
                        </label>
                        <input
                            type="text"
                            placeholder="Type restaurant name"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#EF4444] transition-colors placeholder-gray-400 shadow-sm"
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
                        disabled={!isConfirmed}
                        className={`px-6 py-2.5 text-[16px] font-[400] text-white rounded-[8px] shadow-lg transition-all active:scale-95 ${isConfirmed
                                ? 'bg-[#EF4444] hover:bg-[#DC2626] shadow-red-100'
                                : 'bg-red-300 cursor-not-allowed shadow-none'
                            }`}
                    >
                        Delete Permanently
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;
