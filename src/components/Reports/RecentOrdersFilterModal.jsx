import React, { useState } from 'react';
import { X } from 'lucide-react';

const Checkbox = ({ label, isChecked, onChange }) => (
    <label className="flex items-center gap-3 cursor-pointer group py-1 select-none">
        <div
            onClick={onChange}
            className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${isChecked ? 'bg-primary border-primary' : 'border-gray-200 group-hover:border-primary'
                }`}
        >
            {isChecked && <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mb-0.5 animate-in zoom-in-50 duration-200"></div>}
        </div>
        <span className={`text-[14px] font-bold ${isChecked ? 'text-general-text' : 'text-gray-500'}`}>{label}</span>
    </label>
);

const RecentOrdersFilterModal = ({ isOpen, onClose }) => {
    const [status, setStatus] = useState(['All']);
    const [payment, setPayment] = useState(['All']);

    if (!isOpen) return null;

    const toggleFilter = (current, setter, value) => {
        if (value === 'All') {
            setter(['All']);
            return;
        }

        let next = current.includes('All') ? [] : [...current];
        if (next.includes(value)) {
            next = next.filter(v => v !== value);
        } else {
            next.push(value);
        }

        if (next.length === 0) {
            setter(['All']);
        } else {
            setter(next);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-[24px] w-full max-w-[400px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-50 flex items-center justify-between shrink-0">
                    <h2 className="text-[20px] font-bold text-general-text">Filters</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* Order Status */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-general-text uppercase tracking-widest text-[#9CA3AF]">Order Status</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Checkbox
                                label="All Statuses"
                                isChecked={status.includes('All')}
                                onChange={() => toggleFilter(status, setStatus, 'All')}
                            />
                            <Checkbox
                                label="Completed"
                                isChecked={status.includes('Completed')}
                                onChange={() => toggleFilter(status, setStatus, 'Completed')}
                            />
                            <Checkbox
                                label="Cancelled"
                                isChecked={status.includes('Cancelled')}
                                onChange={() => toggleFilter(status, setStatus, 'Cancelled')}
                            />
                            <Checkbox
                                label="Refunded"
                                isChecked={status.includes('Refunded')}
                                onChange={() => toggleFilter(status, setStatus, 'Refunded')}
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-general-text uppercase tracking-widest text-[#9CA3AF]">Payment Method</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Checkbox
                                label="All Methods"
                                isChecked={payment.includes('All')}
                                onChange={() => toggleFilter(payment, setPayment, 'All')}
                            />
                            <Checkbox
                                label="Card"
                                isChecked={payment.includes('Card')}
                                onChange={() => toggleFilter(payment, setPayment, 'Card')}
                            />
                            <Checkbox
                                label="Cash"
                                isChecked={payment.includes('Cash')}
                                onChange={() => toggleFilter(payment, setPayment, 'Cash')}
                            />
                            <Checkbox
                                label="Contactless"
                                isChecked={payment.includes('Contactless')}
                                onChange={() => toggleFilter(payment, setPayment, 'Contactless')}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 sm:p-6 border-t border-gray-50 flex flex-col sm:flex-row gap-3 bg-white shrink-0">
                    <button
                        onClick={() => {
                            setStatus(['All']);
                            setPayment(['All']);
                        }}
                        className="flex-1 py-3 px-4 border border-[#E5E7EB] text-[#4B5563] font-bold rounded-[12px] hover:bg-gray-50 transition-all active:scale-95 shadow-sm order-2 sm:order-1"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-[12px] hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 order-1 sm:order-2"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecentOrdersFilterModal;
