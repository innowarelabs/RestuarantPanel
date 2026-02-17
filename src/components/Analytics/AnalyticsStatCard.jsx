import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function AnalyticsStatCard({ Icon, label, value, secondaryInfo, percentage, trend, iconBg }) {
    const isPositive = trend === 'up';

    return (
        <div className="bg-white p-3 sm:p-5 rounded-[12px] border border-[#00000033] flex flex-col justify-between h-[150px] sm:h-[180px]">
            <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-[#E6F7F4] flex items-center justify-center ${iconBg}`}>
                    {Icon && React.createElement(Icon, { size: 16, className: iconBg.includes('text') ? '' : 'text-white' })}
                </div>
                <div className="flex items-center gap-1 mt-2">
                    {isPositive ? <TrendingUp size={14} className="text-[#2BB29C]" /> : <TrendingDown size={14} className="text-[#EF4444]" />}
                    <span className={`text-[12px] font-bold ${isPositive ? 'text-[#2BB29C]' : 'text-[#EF4444]'}`}>
                        {percentage}
                    </span>
                </div>
            </div>

            <div className="space-y-0.5 sm:space-y-1">
                <p className="text-[13px] sm:text-[14px] text-gray-500 font-[400] leading-tight">{label}</p>
                <p className="text-[20px] sm:text-[24px] font-[800] text-[#111827]">{value}</p>
                <p className="text-[11px] sm:text-[12px] text-gray-400 truncate">{secondaryInfo}</p>
            </div>
        </div>
    );
}
