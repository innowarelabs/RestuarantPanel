import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {boolean} [props.integratedSalesMonthly] — Sales Reports: GET schedule + primary saves schedule + sends PDF
 * @param {boolean} [props.integratedOrderMonthly] — Order Reports: same flow with order_report
 * @param {string} [props.deliveryEmail]
 * @param {(v: string) => void} [props.onDeliveryEmailChange]
 * @param {boolean} [props.isScheduleActive]
 * @param {(v: boolean) => void} [props.onScheduleActiveChange]
 * @param {boolean} [props.loadingSchedule]
 * @param {boolean} [props.savingSchedule]
 * @param {() => void | Promise<void>} [props.onSaveSchedule]
 * @param {string} [props.scheduleError]
 */
const ScheduleReportModal = ({
    isOpen,
    onClose,
    integratedSalesMonthly = false,
    integratedOrderMonthly = false,
    deliveryEmail = '',
    onDeliveryEmailChange,
    isScheduleActive = true,
    onScheduleActiveChange,
    loadingSchedule = false,
    savingSchedule = false,
    onSaveSchedule,
    scheduleError = '',
}) => {
    const [frequency, setFrequency] = useState('Monthly');
    const [localEmail, setLocalEmail] = useState('');

    if (!isOpen) return null;

    const isIntegratedMonthly = integratedSalesMonthly || integratedOrderMonthly;

    const emailValue = isIntegratedMonthly ? deliveryEmail : localEmail;
    const setEmailValue = isIntegratedMonthly ? onDeliveryEmailChange ?? (() => {}) : setLocalEmail;

    const handlePrimary = () => {
        if (isIntegratedMonthly && typeof onSaveSchedule === 'function') {
            void onSaveSchedule();
            return;
        }
        onClose();
    };

    const integratedSubtitle = integratedOrderMonthly
        ? 'Saves your monthly email schedule and uploads the current order report PDF in one step.'
        : 'Saves your monthly email schedule and uploads the current sales report PDF in one step.';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-[450px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-8 pb-6 shrink-0">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-bold text-general-text">Schedule Report</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        {isIntegratedMonthly ? integratedSubtitle : 'Receive automated reports via email'}
                    </p>
                </div>

                <div className="px-8 pb-8 space-y-6 overflow-y-auto custom-scrollbar">
                    {isIntegratedMonthly && loadingSchedule ? (
                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-6 text-center text-[13px] text-gray-600">
                            Loading saved schedule…
                        </div>
                    ) : null}

                    {isIntegratedMonthly && scheduleError ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                            {scheduleError}
                        </div>
                    ) : null}

                    {/* Report Type */}
                    <div>
                        <label className="block text-sm font-bold text-general-text mb-2">Report Type</label>
                        {isIntegratedMonthly ? (
                            <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-100 rounded-xl text-sm font-medium text-[#374151]">
                                {integratedOrderMonthly ? 'Order Report' : 'Sales Report'}
                            </div>
                        ) : (
                            <input
                                type="text"
                                placeholder="Select report type"
                                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                readOnly
                            />
                        )}
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="block text-sm font-bold text-general-text mb-2">Frequency</label>
                        {isIntegratedMonthly ? (
                            <div className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-100 rounded-xl text-sm font-medium text-[#374151]">
                                Monthly
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFrequency('Weekly')}
                                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                                        frequency === 'Weekly'
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    Weekly
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFrequency('Monthly')}
                                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                                        frequency === 'Monthly'
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    Monthly
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Delivery Email */}
                    <div>
                        <label className="block text-sm font-bold text-general-text mb-2">Delivery Email</label>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={emailValue}
                            onChange={(e) => setEmailValue(e.target.value)}
                            disabled={isIntegratedMonthly && loadingSchedule}
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium disabled:opacity-60"
                        />
                    </div>

                    {isIntegratedMonthly && typeof onScheduleActiveChange === 'function' ? (
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-[#FAFAFA] px-4 py-3">
                            <input
                                type="checkbox"
                                checked={isScheduleActive}
                                onChange={(e) => onScheduleActiveChange(e.target.checked)}
                                disabled={loadingSchedule}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-[#374151]">Schedule active (receive monthly emails)</span>
                        </label>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-50 flex gap-4 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={savingSchedule}
                        className="flex-1 py-3 px-4 border border-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={savingSchedule || (isIntegratedMonthly && loadingSchedule)}
                        onClick={handlePrimary}
                        className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isIntegratedMonthly
                            ? savingSchedule
                                ? 'Scheduling…'
                                : 'Schedule Report'
                            : 'Schedule Report'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleReportModal;
