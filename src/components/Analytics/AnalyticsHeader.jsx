import React from 'react';
import { Calendar, FileText, Download, ChevronDown } from 'lucide-react';

export default function AnalyticsHeader({
    periodOptions = [],
    selectedDays = 30,
    onDaysChange,
    exporting = false,
    onExportCsv,
    onExportPdf,
    exportDisabled = false,
}) {
    const busy = exporting || exportDisabled;
    const opts = Array.isArray(periodOptions) ? periodOptions : [];

    return (
        <div className="flex flex-col sm:flex-row border border-[#00000033] rounded-[16px] bg-[#FFFFFF] p-4 sm:px-7 sm:py-3 sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-[24px] font-bold text-[#111827]">Analytics & Performance</h1>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-gray-700 min-w-0 sm:min-w-[200px]">
                    <Calendar size={18} className="text-gray-400 shrink-0" aria-hidden />
                    <div className="relative flex-1 min-w-0">
                        <select
                            aria-label="Report period"
                            value={selectedDays}
                            disabled={busy}
                            onChange={(e) => onDaysChange?.(Number(e.target.value))}
                            className="w-full appearance-none bg-transparent text-[14px] text-gray-700 font-medium cursor-pointer outline-none focus:ring-0 pr-7 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {opts.map((opt) => (
                                <option key={opt.days} value={opt.days}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400"
                            aria-hidden
                        />
                    </div>
                </div>

                <button
                    type="button"
                    disabled={busy}
                    onClick={onExportCsv}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileText size={18} className="text-gray-400" />
                    <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
                </button>

                <button
                    type="button"
                    disabled={busy}
                    onClick={onExportPdf}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#DD2F26] text-white rounded-[8px] text-[14px] font-medium hover:bg-[#C52820] transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={18} />
                    <span>{exporting ? 'Exporting…' : 'Export PDF'}</span>
                </button>
            </div>
        </div>
    );
}
