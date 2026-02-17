import React, { useState } from 'react';
import { X } from 'lucide-react';

const FilterTicketsModal = ({ isOpen, onClose }) => {
    const [selectedFilters, setSelectedFilters] = useState({
        status: ['New', 'Open', 'Waiting'],
        priority: ['Low', 'Normal'],
        channel: ['Chat'],
        tags: ['Refund', 'Delivery']
    });

    if (!isOpen) return null;

    const toggleFilter = (category, value) => {
        setSelectedFilters(prev => {
            const current = prev[category] || [];
            if (current.includes(value)) {
                return { ...prev, [category]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [category]: [...current, value] };
            }
        });
    };

    const FilterPill = ({ category, label }) => {
        const isActive = selectedFilters[category]?.includes(label);
        return (
            <button
                onClick={() => toggleFilter(category, label)}
                className={`px-4 py-2 rounded-[6px] text-[13px] font-[600] transition-all ${isActive
                    ? 'bg-[#2BB29C] text-white shadow-sm shadow-[#2BB29C]/20'
                    : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#4B5563]'
                    }`}
            >
                {label}
            </button>
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[12px] border border-[#00000033] w-full max-w-[500px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-[18px] font-bold text-general-text">Filter Tickets</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Status */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-3">Status</label>
                        <div className="flex flex-wrap gap-2">
                            {['New', 'Open', 'Waiting', 'Escalated', 'Resolved'].map(s => (
                                <FilterPill key={s} category="status" label={s} />
                            ))}
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-3">Priority</label>
                        <div className="flex flex-wrap gap-2">
                            {['Low', 'Normal', 'High', 'Urgent'].map(p => (
                                <FilterPill key={p} category="priority" label={p} />
                            ))}
                        </div>
                    </div>

                    {/* Channel */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-3">Channel</label>
                        <div className="flex flex-wrap gap-2">
                            {['Chat', 'Email', 'Bot'].map(c => (
                                <FilterPill key={c} category="channel" label={c} />
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-3">Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {['Refund', 'Delivery', 'Quality', 'Payment', 'Loyalty'].map(t => (
                                <FilterPill key={t} category="tags" label={t} />
                            ))}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-3">Date Range</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="block text-[11px] font-[700] text-gray-400 mb-1.5 uppercase tracking-wider">From</span>
                                <input
                                    type="text"
                                    placeholder="DD/MM/YYYY"
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2BB29C]/10 focus:border-[#2BB29C] transition-all font-medium"
                                />
                            </div>
                            <div>
                                <span className="block text-[11px] font-[700] text-gray-400 mb-1.5 uppercase tracking-wider">To</span>
                                <input
                                    type="text"
                                    placeholder="DD/MM/YYYY"
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2BB29C]/10 focus:border-[#2BB29C] transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Assigned To */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-3">Assigned To</label>
                        <input
                            type="text"
                            placeholder="Type name..."
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2BB29C]/10 focus:border-[#2BB29C] transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-[#F9FAFB]/50">
                    <button
                        onClick={() => setSelectedFilters({ status: [], priority: [], channel: [], tags: [] })}
                        className="px-6 py-2.5 border border-gray-200 text-[#4B5563] text-[14px] font-[500] rounded-[8px] hover:bg-gray-50 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-[#2BB29C] text-white text-[14px] font-[600] rounded-[8px] hover:bg-[#24A18C] transition-colors shadow-sm shadow-[#2BB29C]/10"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterTicketsModal;
