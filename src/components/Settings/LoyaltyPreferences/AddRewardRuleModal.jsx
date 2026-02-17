import React, { useState } from 'react';
import { X } from 'lucide-react';

const getInitialFormData = (rule) => {
    if (rule) {
        return {
            item: rule.item || '',
            points: rule.points || '',
            status: rule.status === 'Active' || rule.status === true,
        };
    }

    return {
        item: '',
        points: '120',
        status: true,
    };
};

const AddRewardRuleModalInner = ({ onClose, rule }) => {
    const [formData, setFormData] = useState(() => getInitialFormData(rule));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">{rule ? 'Edit' : 'Add'} Reward Rule</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Set loyalty points required for specific items.</p>
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
                    {/* Select Item */}
                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[500] text-[#374151]">Select Item <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="e.g. Pepperoni Pizza"
                            value={formData.item}
                            onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors placeholder-gray-400 shadow-sm"
                        />
                    </div>

                    {/* Required Points */}
                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[500] text-[#374151]">Required Points <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={formData.points}
                            onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                            placeholder="120"
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors placeholder-gray-400 shadow-sm"
                        />
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-[12px]">
                        <div>
                            <h4 className="text-[14px] font-[500] text-[#111827]">Active Status</h4>
                            <p className="text-[12px] text-gray-500">Enable this reward for customers</p>
                        </div>
                        <div
                            className={`w-[44px] h-[24px] rounded-full p-1 cursor-pointer transition-colors ${formData.status ? 'bg-[#2BB29C]' : 'bg-gray-300'}`}
                            onClick={() => setFormData({ ...formData, status: !formData.status })}
                        >
                            <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${formData.status ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white shadow-inner">
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
                        {rule ? 'Save Changes' : 'Add Reward'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddRewardRuleModal = ({ isOpen, onClose, rule }) => {
    if (!isOpen) return null;

    const modalKey = rule
        ? `${rule.item || ''}-${rule.points || ''}-${rule.status || ''}`
        : 'new';

    return <AddRewardRuleModalInner key={modalKey} onClose={onClose} rule={rule} />;
};

export default AddRewardRuleModal;
