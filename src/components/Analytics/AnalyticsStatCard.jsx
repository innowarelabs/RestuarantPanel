import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/** Matches AdminDashboard StatCard: 40×40 box, size-20 icon */
const ICON_BOX = 'w-[40px] h-[40px] rounded-[8px] shrink-0 flex items-center justify-center';

const VARIANT = {
    redMetrics: {
        iconWrap: `${ICON_BOX} bg-[#DD2F2626] text-[#DD2F26]`,
        iconSize: 20,
        iconStroke: 2,
    },
    indigoMetrics: {
        iconWrap: `${ICON_BOX} bg-[#E0E7FF] text-[#4F46E5]`,
        iconSize: 20,
        iconStroke: 2,
    },
};

export default function AnalyticsStatCard({
    Icon,
    label,
    value,
    secondaryInfo,
    percentage,
    trend,
    iconBg,
    showTrend = true,
    variant = 'default',
}) {
    const isPositive = trend === 'up';
    const v = VARIANT[variant];

    const iconWrapClass = v ? v.iconWrap : `${ICON_BOX} ${iconBg || 'bg-[#FEF2F2] text-[#DD2F26]'}`;
    const iconSize = v?.iconSize ?? 20;
    const iconStroke = v?.iconStroke ?? 2;

    return (
        <div
            className="bg-white p-3 sm:p-5 rounded-[12px] border border-[#00000033] flex flex-col justify-between h-[150px] sm:h-[180px]"
        >
            <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className={iconWrapClass}>
                    {Icon && React.createElement(Icon, { size: iconSize, strokeWidth: iconStroke })}
                </div>
                {showTrend && percentage != null && String(percentage).trim() !== '' && percentage !== '—' ? (
                    <div className="flex items-center gap-1 mt-2">
                        {isPositive ? (
                            <TrendingUp size={16} className="text-[#DD2F26]" />
                        ) : (
                            <TrendingDown size={16} className="text-[#EF4444]" />
                        )}
                        <span className={`text-[12px] font-bold ${isPositive ? 'text-[#DD2F26]' : 'text-[#EF4444]'}`}>
                            {percentage}
                        </span>
                    </div>
                ) : (
                    <div className="mt-2 h-[14px]" aria-hidden />
                )}
            </div>

            <div className="space-y-0.5 sm:space-y-1">
                <p className="text-[13px] sm:text-[14px] text-gray-500 font-[400] leading-tight">{label}</p>
                <p className="text-[20px] sm:text-[24px] font-[800] text-[#111827] truncate">{value}</p>
                <p className="text-[11px] sm:text-[12px] text-gray-400 truncate">{secondaryInfo}</p>
            </div>
        </div>
    );
}
