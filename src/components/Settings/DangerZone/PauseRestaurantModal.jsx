import React from 'react';
import { X } from 'lucide-react';

const PauseRestaurantModal = ({ isOpen, onClose }) => {
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
                        <h2 className="text-[20px] font-bold text-[#111827]">Pause Restaurant?</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Temporarily disable ordering for all customers.</p>
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
                        Customers will not be able to place new orders until you resume manually. Current orders will still need to be processed.
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
                        className="px-6 py-2.5 text-[16px] font-[400] text-white bg-[#F59E0B] rounded-[8px] shadow-lg shadow-orange-100 hover:bg-[#D97706] active:scale-95 transition-all"
                    >
                        Pause Restaurant
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PauseRestaurantModal;
