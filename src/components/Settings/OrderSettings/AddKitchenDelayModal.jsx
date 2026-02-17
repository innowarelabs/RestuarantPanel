import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddKitchenDelayModal = ({ isOpen, onClose }) => {
    const [selectedDelay, setSelectedDelay] = useState(5);
    const [customDelay, setCustomDelay] = useState('');

    if (!isOpen) return null;

    const quickSelects = [5, 10, 15];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">Add Kitchen Delay</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Increase prep time for all incoming orders.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">
                    {/* Quick Select */}
                    <div className="space-y-4">
                        <h4 className="text-[14px] font-[500] text-[#111827]">Quick Select</h4>
                        <div className="flex gap-3">
                            {quickSelects.map((min) => (
                                <button
                                    key={min}
                                    onClick={() => {
                                        setSelectedDelay(min);
                                        setCustomDelay('');
                                    }}
                                    className={`flex-1 py-4 px-2 rounded-[12px] border font-[500] text-[14px] transition-all ${selectedDelay === min && customDelay === ''
                                        ? 'bg-[#2BB29C] border-[#2BB29C] text-white shadow-lg shadow-[#2BB29C]/20'
                                        : 'bg-white border-[#E5E7EB] text-[#111827] hover:border-[#2BB29C]'
                                        }`}
                                >
                                    +{min} min
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Delay */}
                    <div className="space-y-4">
                        <h4 className="text-[14px] font-[500] text-[#111827]">Custom Delay</h4>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Enter minutes"
                                value={customDelay}
                                onChange={(e) => {
                                    setCustomDelay(e.target.value);
                                    setSelectedDelay(null);
                                }}
                                className="w-full h-[46px] px-4 pr-20 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors placeholder-gray-400 shadow-sm"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">minutes</span>
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
                        Apply Delay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddKitchenDelayModal;
