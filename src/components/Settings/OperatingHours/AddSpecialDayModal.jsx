import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddSpecialDayModal = ({ isOpen, onClose }) => {
    const [isClosedAllDay, setIsClosedAllDay] = useState(false);

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
                        <h2 className="text-[20px] font-bold text-[#111827]">Add Special Day</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Set custom hours or closure for holidays and special events.</p>
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
                    {/* Date */}
                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[500] text-[#374151]">Date <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors shadow-sm"
                        />
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-[12px]">
                        <div>
                            <h4 className="text-[14px] font-[500] text-[#111827]">Closed All Day</h4>
                            <p className="text-[12px] text-gray-500">Restaurant will be marked as closed</p>
                        </div>
                        <div
                            className={`w-[44px] h-[24px] rounded-full p-1 cursor-pointer transition-colors ${isClosedAllDay ? 'bg-[#2BB29C]' : 'bg-gray-300'}`}
                            onClick={() => setIsClosedAllDay(!isClosedAllDay)}
                        >
                            <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${isClosedAllDay ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {/* Time and Finish */}
                    <div className={`grid grid-cols-2 gap-4 transition-all ${isClosedAllDay ? 'opacity-30 pointer-events-none' : ''}`}>
                        <div className="space-y-1.5">
                            <label className="text-[14px] font-[500] text-[#374151]">Open Time</label>
                            <input
                                type="time"
                                className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors shadow-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[14px] font-[500] text-[#374151]">Close Time</label>
                            <input
                                type="time"
                                className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors shadow-sm"
                            />
                        </div>
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
                        className="px-6 py-2.5 text-[16px] font-[400] text-white bg-[#2BB29C] rounded-[8px] shadow-lg shadow-[#2BB29C]/20 hover:bg-[#24A18C] active:scale-95 transition-all"
                    >
                        Save Special Day
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddSpecialDayModal;
