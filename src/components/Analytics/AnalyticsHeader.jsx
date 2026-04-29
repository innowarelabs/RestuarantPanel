import React from 'react';
import { Calendar, FileText, Download, ChevronDown } from 'lucide-react';

export default function AnalyticsHeader({
    mainPeriodLabel = 'Last 30 days',
    exporting = false,
    onExportCsv,
    onExportPdf,
    exportDisabled = false,
}) {
    const busy = exporting || exportDisabled;

    return (
        <div className="flex flex-col sm:flex-row border border-[#00000033] rounded-[16px] bg-[#FFFFFF] p-4 sm:px-7 sm:py-3 sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-[24px] font-bold text-[#111827]">Analytics & Performance</h1>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-gray-600 pointer-events-none select-none">
                    <Calendar size={18} className="text-gray-400" />
                    <span>{mainPeriodLabel}</span>
                    <ChevronDown size={14} className="text-gray-400" />
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
