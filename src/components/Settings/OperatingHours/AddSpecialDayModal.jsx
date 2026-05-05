import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { isValidOpeningHourTime } from '../../../utils/restaurantOperatingHours';

function newSpecialDayId() {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return `sd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const emptyForm = () => ({
    date: '',
    is_closed: false,
    open: '',
    close: '',
    hasBreak: false,
    break_start: '',
    break_end: '',
    note: '',
});

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSave: (row: { id: string, date: string, is_closed: boolean, open: string, close: string, break_start: string, break_end: string, note: string }) => void,
 *   initial?: { id?: string, date?: string, is_closed?: boolean, open?: string, close?: string, break_start?: string, break_end?: string, note?: string } | null,
 * }} props
 */
const AddSpecialDayModal = ({ isOpen, onClose, onSave, initial = null }) => {
    const [form, setForm] = useState(emptyForm);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setSubmitAttempted(false);
        if (initial && typeof initial === 'object') {
            const bs = typeof initial.break_start === 'string' ? initial.break_start.trim() : '';
            const be = typeof initial.break_end === 'string' ? initial.break_end.trim() : '';
            setForm({
                date: typeof initial.date === 'string' ? initial.date.trim().slice(0, 10) : '',
                is_closed: !!initial.is_closed,
                open: typeof initial.open === 'string' ? initial.open : '',
                close: typeof initial.close === 'string' ? initial.close : '',
                hasBreak: !!(bs || be),
                break_start: bs,
                break_end: be,
                note: typeof initial.note === 'string' ? initial.note : '',
            });
        } else {
            setForm(emptyForm());
        }
    }, [isOpen, initial]);

    if (!isOpen) return null;

    const timeInvalid = (v) => {
        const t = typeof v === 'string' ? v.trim() : '';
        if (!t) return false;
        return !isValidOpeningHourTime(t);
    };

    const dateOk = !!form.date?.trim();
    const timesOk =
        form.is_closed ||
        (form.open?.trim() &&
            form.close?.trim() &&
            isValidOpeningHourTime(form.open) &&
            isValidOpeningHourTime(form.close) &&
            (!form.hasBreak ||
                (form.break_start?.trim() &&
                    form.break_end?.trim() &&
                    isValidOpeningHourTime(form.break_start) &&
                    isValidOpeningHourTime(form.break_end))));

    const showErrors = submitAttempted;
    const canSubmit = dateOk && timesOk && !timeInvalid(form.open) && !timeInvalid(form.close) && !timeInvalid(form.break_start) && !timeInvalid(form.break_end);

    const handleSave = () => {
        setSubmitAttempted(true);
        if (!canSubmit) return;
        const id = typeof initial?.id === 'string' && initial.id.trim() ? initial.id.trim() : newSpecialDayId();
        const open = form.is_closed ? '' : String(form.open || '').trim();
        const close = form.is_closed ? '' : String(form.close || '').trim();
        let break_start = '';
        let break_end = '';
        if (!form.is_closed && form.hasBreak) {
            break_start = String(form.break_start || '').trim();
            break_end = String(form.break_end || '').trim();
        }
        onSave?.({
            id,
            date: form.date.trim(),
            is_closed: !!form.is_closed,
            open,
            close,
            break_start,
            break_end,
            note: String(form.note || '').trim(),
        });
        onClose?.();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="special-day-title"
            >
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 id="special-day-title" className="text-[20px] font-bold text-[#111827]">
                            {initial?.id ? 'Edit special day' : 'Add special day'}
                        </h2>
                        <p className="text-[13px] text-gray-500 mt-1">Custom hours or closure for holidays and one-off dates.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[500] text-[#374151]">
                            Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                            className={`w-full h-[46px] px-4 bg-white border rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors shadow-sm ${showErrors && !dateOk ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                        />
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-[12px]">
                        <div>
                            <h4 className="text-[14px] font-[500] text-[#111827]">Closed all day</h4>
                            <p className="text-[12px] text-gray-500">Restaurant will be closed for this date</p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setForm((f) => {
                                    const nextClosed = !f.is_closed;
                                    return {
                                        ...f,
                                        is_closed: nextClosed,
                                        ...(nextClosed
                                            ? { open: '', close: '', hasBreak: false, break_start: '', break_end: '' }
                                            : {}),
                                    };
                                })
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${form.is_closed ? 'bg-[#DD2F26]' : 'bg-gray-300'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_closed ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>

                    <div className={`space-y-4 transition-all ${form.is_closed ? 'opacity-40 pointer-events-none' : ''}`}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[14px] font-[500] text-[#374151]">Open</label>
                                <input
                                    type="text"
                                    value={form.open}
                                    onChange={(e) => setForm((f) => ({ ...f, open: e.target.value }))}
                                    placeholder="9:00 AM"
                                    className={`w-full h-[46px] px-4 bg-white border rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] shadow-sm ${timeInvalid(form.open) ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[14px] font-[500] text-[#374151]">Close</label>
                                <input
                                    type="text"
                                    value={form.close}
                                    onChange={(e) => setForm((f) => ({ ...f, close: e.target.value }))}
                                    placeholder="10:00 PM"
                                    className={`w-full h-[46px] px-4 bg-white border rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] shadow-sm ${timeInvalid(form.close) ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-[12px] border border-[#E5E7EB] px-4 py-3">
                            <span className="text-[14px] font-[500] text-[#374151]">Break</span>
                            <button
                                type="button"
                                disabled={form.is_closed}
                                onClick={() =>
                                    setForm((f) => ({
                                        ...f,
                                        hasBreak: !f.hasBreak,
                                        break_start: !f.hasBreak ? f.break_start : '',
                                        break_end: !f.hasBreak ? f.break_end : '',
                                    }))
                                }
                                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${form.hasBreak ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.hasBreak ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>

                        {form.hasBreak ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-[500] text-[#374151]">Break start</label>
                                    <input
                                        type="text"
                                        value={form.break_start}
                                        onChange={(e) => setForm((f) => ({ ...f, break_start: e.target.value }))}
                                        className={`w-full h-[46px] px-4 bg-white border rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] shadow-sm ${timeInvalid(form.break_start) ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-[500] text-[#374151]">Break end</label>
                                    <input
                                        type="text"
                                        value={form.break_end}
                                        onChange={(e) => setForm((f) => ({ ...f, break_end: e.target.value }))}
                                        className={`w-full h-[46px] px-4 bg-white border rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] shadow-sm ${timeInvalid(form.break_end) ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[500] text-[#374151]">Note (optional)</label>
                        <textarea
                            value={form.note}
                            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                            rows={2}
                            className="w-full px-4 py-2 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] shadow-sm resize-none"
                            placeholder="e.g., New Year's Eve - early close"
                        />
                    </div>

                    {showErrors && !canSubmit && (
                        <p className="text-[13px] text-red-600">Please enter a valid date and times (12h with AM/PM or 24h HH:MM).</p>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shadow-inner">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-6 py-2.5 text-[16px] font-[400] text-white bg-[#DD2F26] rounded-[8px] shadow-lg shadow-[#DD2F26]/20 hover:bg-[#C52820] active:scale-95 transition-all"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddSpecialDayModal;
