import React, { useState } from 'react';
import { X } from 'lucide-react';

const ScheduleReportModal = ({ isOpen, onClose }) => {
    const [frequency, setFrequency] = useState('Monthly');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-[450px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-8 pb-6">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-bold text-general-text">Schedule Report</h2>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">Receive automated reports via email</p>
                </div>

                <div className="px-8 pb-8 space-y-6">
                    {/* Report Type */}
                    <div>
                        <label className="block text-sm font-bold text-general-text mb-2">Report Type</label>
                        <input
                            type="text"
                            placeholder="Select report type"
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="block text-sm font-bold text-general-text mb-2">Frequency</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setFrequency('Weekly')}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${frequency === 'Weekly'
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                Weekly
                            </button>
                            <button
                                onClick={() => setFrequency('Monthly')}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${frequency === 'Monthly'
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                Monthly
                            </button>
                        </div>
                    </div>

                    {/* Delivery Email */}
                    <div>
                        <label className="block text-sm font-bold text-general-text mb-2">Delivery Email</label>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-50 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 border border-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            // Logic to schedule report
                            onClose();
                        }}
                        className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        Schedule Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleReportModal;
