import React, { useState } from 'react';
import { X } from 'lucide-react';

const FILTER_STATUS_LABELS = ['Pending', 'In Progress', 'Resolved'];

const FILTER_PRIORITY_LABELS = ['Low', 'Medium', 'High'];

const ASSIGNED_TO_LABELS = ['Restaurant', 'Admin Team'];

const FilterTicketsModal = ({ isOpen, onClose }) => {
    const [selectedFilters, setSelectedFilters] = useState({
        status: [],
        priority: [],
        /** At most one: `'Restaurant' | 'Admin Team' | null` */
        assignedTo: null,
    });

    if (!isOpen) return null;

    const toggleFilter = (category, value) => {
        if (category === 'assignedTo') {
            setSelectedFilters((prev) => ({
                ...prev,
                assignedTo: prev.assignedTo === value ? null : value,
            }));
            return;
        }
        setSelectedFilters((prev) => {
            const current = prev[category] || [];
            if (current.includes(value)) {
                return { ...prev, [category]: current.filter((v) => v !== value) };
            }
            return { ...prev, [category]: [...current, value] };
        });
    };

    const FilterPill = ({ category, label }) => {
        const isActive =
            category === 'assignedTo' ? selectedFilters.assignedTo === label : selectedFilters[category]?.includes(label);
        return (
            <button
                type="button"
                onClick={() => toggleFilter(category, label)}
                className={`rounded-[6px] px-4 py-2 text-[13px] font-[600] transition-all ${
                    isActive
                        ? 'bg-[#DD2F26] text-white shadow-sm shadow-[#DD2F26]/20'
                        : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#4B5563]'
                }`}
            >
                {label}
            </button>
        );
    };

    const resetFilters = () => {
        setSelectedFilters({
            status: [],
            priority: [],
            assignedTo: null,
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 duration-200 animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[500px] overflow-hidden rounded-[12px] border border-[#00000033] bg-white shadow-2xl duration-200 animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-100 p-5">
                    <h2 className="text-[18px] font-bold text-general-text">Filter Tickets</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="custom-scrollbar max-h-[70vh] space-y-6 overflow-y-auto p-6">
                    <div>
                        <label className="mb-3 block text-[14px] font-[500] text-general-text">Status</label>
                        <div className="flex flex-wrap gap-2">
                            {FILTER_STATUS_LABELS.map((s) => (
                                <FilterPill key={s} category="status" label={s} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-3 block text-[14px] font-[500] text-general-text">Priority</label>
                        <div className="flex flex-wrap gap-2">
                            {FILTER_PRIORITY_LABELS.map((p) => (
                                <FilterPill key={p} category="priority" label={p} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-3 block text-[14px] font-[500] text-general-text">Date Range</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="mb-1.5 block text-[11px] font-[700] uppercase tracking-wider text-gray-400">
                                    From
                                </span>
                                <input
                                    type="text"
                                    placeholder="DD/MM/YYYY"
                                    className="w-full rounded-[8px] border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium transition-all focus:border-[#DD2F26] focus:outline-none focus:ring-2 focus:ring-[#DD2F26]/10"
                                />
                            </div>
                            <div>
                                <span className="mb-1.5 block text-[11px] font-[700] uppercase tracking-wider text-gray-400">
                                    To
                                </span>
                                <input
                                    type="text"
                                    placeholder="DD/MM/YYYY"
                                    className="w-full rounded-[8px] border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium transition-all focus:border-[#DD2F26] focus:outline-none focus:ring-2 focus:ring-[#DD2F26]/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mb-3 block text-[14px] font-[500] text-general-text">Assigned To</label>
                        <div className="flex flex-wrap gap-2">
                            {ASSIGNED_TO_LABELS.map((a) => (
                                <FilterPill key={a} category="assignedTo" label={a} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 bg-[#F9FAFB]/50 p-5">
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="rounded-[8px] border border-gray-200 px-6 py-2.5 text-[14px] font-[500] text-[#4B5563] transition-colors hover:bg-gray-50"
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-[8px] bg-[#DD2F26] px-6 py-2.5 text-[14px] font-[600] text-white shadow-sm shadow-[#DD2F26]/10 transition-colors hover:bg-[#C52820]"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterTicketsModal;
