import React from 'react';
import { X } from 'lucide-react';

const DisconnectIntegrationModal = ({ isOpen, onClose, platformName }) => {
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
                        <h2 className="text-[20px] font-bold text-[#111827]">Disconnect {platformName}?</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Revoke system access for this integration.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-[14px] text-[#374151] font-[400] leading-relaxed">
                        Orders from <span className="font-bold">{platformName}</span> will no longer sync with your dashboard. You will need to reconnect manually if you change your mind.
                    </p>
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
                        className="px-6 py-2.5 text-[16px] font-[400] text-white bg-[#EF4444] rounded-[8px] shadow-lg shadow-red-100 hover:bg-[#DC2626] active:scale-95 transition-all"
                    >
                        Disconnect Platform
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DisconnectIntegrationModal;
