import React from 'react';
import { AlertCircle } from 'lucide-react';
import { isValidOpeningHourTime } from '../utils/restaurantOperatingHours';

/**
 * Weekly hours UI (matches Settings → Operating Hours).
 * @param {{ name: string, isOpen: boolean, hours: [string, string], hasBreak: boolean, breakHours: [string, string] }[]} days
 * @param {React.Dispatch<React.SetStateAction<typeof days>>} setDays
 */
export default function WeeklyHoursEditor({ days, setDays }) {
    const isOpeningHourValueInvalid = (value) => {
        const t = typeof value === 'string' ? value.trim() : '';
        if (!t) return false;
        return !isValidOpeningHourTime(t);
    };

    const hoursFormatError = days.some((day) => {
        if (day.isOpen) {
            if (isOpeningHourValueInvalid(day.hours[0]) || isOpeningHourValueInvalid(day.hours[1])) return true;
        }
        if (day.hasBreak && day.isOpen) {
            const b1 = day.breakHours[0]?.trim() ?? '';
            const b2 = day.breakHours[1]?.trim() ?? '';
            if (!b1 || !b2) return true;
            return isOpeningHourValueInvalid(b1) || isOpeningHourValueInvalid(b2);
        }
        return false;
    });

    const toggleDayOpen = (index) => {
        setDays((d) =>
            d.map((row, i) => {
                if (i !== index) return row;
                const nextOpen = !row.isOpen;
                if (nextOpen) {
                    return { ...row, isOpen: true };
                }
                return { ...row, isOpen: false, hasBreak: false, breakHours: ['', ''] };
            }),
        );
    };

    const toggleDayBreak = (index) => {
        setDays((d) =>
            d.map((row, i) => {
                if (i !== index) return row;
                const nextHasBreak = !row.hasBreak;
                return {
                    ...row,
                    hasBreak: nextHasBreak,
                    breakHours: nextHasBreak ? row.breakHours : ['', ''],
                };
            }),
        );
    };

    const setMainHour = (dayIndex, slotIndex, value) => {
        setDays((d) =>
            d.map((row, i) => {
                if (i !== dayIndex) return row;
                const nextHours = [...row.hours];
                nextHours[slotIndex] = value;
                return { ...row, hours: nextHours };
            }),
        );
    };

    const setBreakHour = (dayIndex, slotIndex, value) => {
        setDays((d) =>
            d.map((row, i) => {
                if (i !== dayIndex) return row;
                const next = [...row.breakHours];
                next[slotIndex] = value;
                return { ...row, breakHours: next };
            }),
        );
    };

    return (
        <>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                <div className="space-y-0">
                    {days.map((day, dayIndex) => (
                        <div
                            key={day.name}
                            className="flex min-w-[660px] flex-nowrap items-center gap-x-2 border-b border-[#F3F4F6] py-4 last:border-0 sm:gap-x-3"
                        >
                            {/* Day label + open toggle — tight gap */}
                            <div className="flex shrink-0 items-center gap-[10px]">
                                <span className="w-[72px] shrink-0 font-[500] text-[14px] text-[#1A1A1A] sm:w-[80px]">
                                    {day.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => toggleDayOpen(dayIndex)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${day.isOpen ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${day.isOpen ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>

                            {/* Fixed slot: main hours always occupy this band so Break stays aligned */}
                            <div className="flex h-[34px] w-[212px] shrink-0 items-center justify-start sm:w-[228px]">
                                {day.isOpen ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={day.hours[0]}
                                            onChange={(e) => setMainHour(dayIndex, 0, e.target.value)}
                                            className={`w-[76px] shrink-0 rounded-[8px] border px-2 py-1 text-[14px] text-center focus:outline-none focus:ring-1 focus:ring-[#DD2F26] sm:w-20 ${isOpeningHourValueInvalid(day.hours[0]) ? 'border-[#EB5757] ring-1 ring-[#EB5757]/30' : 'border-[#E8E8E8]'}`}
                                        />
                                        <span className="shrink-0 text-[#9CA3AF]">-</span>
                                        <input
                                            type="text"
                                            value={day.hours[1]}
                                            onChange={(e) => setMainHour(dayIndex, 1, e.target.value)}
                                            className={`w-[76px] shrink-0 rounded-[8px] border px-2 py-1 text-[14px] text-center focus:outline-none focus:ring-1 focus:ring-[#DD2F26] sm:w-24 ${isOpeningHourValueInvalid(day.hours[1]) ? 'border-[#EB5757] ring-1 ring-[#EB5757]/30' : 'border-[#E8E8E8]'}`}
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm text-[#9CA3AF]">Closed</span>
                                )}
                            </div>

                            {/* Break toggle + label — always after the main-hours slot */}
                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => toggleDayBreak(dayIndex)}
                                    disabled={!day.isOpen}
                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${day.hasBreak ? 'bg-[#DD2F26]' : 'bg-gray-200'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${day.hasBreak ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                                <span className="w-[72px] shrink-0 text-[14px] text-[#9CA3AF] sm:w-[76px]">
                                    {day.hasBreak ? 'Break' : 'No break'}
                                </span>
                            </div>

                            {/* Break time inputs */}
                            <div className="flex h-[34px] min-w-[168px] shrink-0 items-center gap-2 sm:min-w-[184px]">
                                {day.hasBreak && day.isOpen ? (
                                    <>
                                        <input
                                            type="text"
                                            value={day.breakHours[0]}
                                            onChange={(e) => setBreakHour(dayIndex, 0, e.target.value)}
                                            className={`w-[76px] shrink-0 rounded-[8px] border bg-gray-50 px-2 py-1.5 text-sm sm:w-20 ${isOpeningHourValueInvalid(day.breakHours[0]) ? 'border-[#EB5757] ring-1 ring-[#EB5757]/30' : 'border-[#E8E8E8]'}`}
                                        />
                                        <span className="shrink-0 text-[#9CA3AF]">-</span>
                                        <input
                                            type="text"
                                            value={day.breakHours[1]}
                                            onChange={(e) => setBreakHour(dayIndex, 1, e.target.value)}
                                            className={`w-[76px] shrink-0 rounded-[8px] border bg-gray-50 px-2 py-1.5 text-sm sm:w-24 ${isOpeningHourValueInvalid(day.breakHours[1]) ? 'border-[#EB5757] ring-1 ring-[#EB5757]/30' : 'border-[#E8E8E8]'}`}
                                        />
                                    </>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {hoursFormatError && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#F7515133] bg-[#F7515114] px-3 py-2">
                    <AlertCircle size={16} className="text-[#EB5757] shrink-0 mt-0.5" aria-hidden />
                    <p className="text-[12px] text-[#47464A] leading-snug">
                        Invalid time. Use 1–12 with AM or PM (for example 9:00 AM), or 24-hour format (for example 14:00). Values like 13 AM are not valid.
                    </p>
                </div>
            )}
        </>
    );
}
