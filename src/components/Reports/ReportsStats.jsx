import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const formatCurrency = (val) => (val != null ? `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '--');

const StatCard = ({ title, value, change, isPositive, subtitle }) => (
    <div className="bg-white rounded-[12px] border border-[#00000033] p-3 sm:p-4 h-[135px] sm:h-[150px] flex flex-col justify-between">
        <div>
            <p className="text-[13px] sm:text-[14px] font-medium text-gray-500 mb-0.5 sm:mb-1">{title}</p>
            <h3 className="text-[20px] sm:text-[24px] font-bold text-general-text truncate">{value}</h3>
        </div>
        {(change != null || subtitle) && (
            <div className="flex flex-col gap-1 sm:gap-1.5 px-0.5">
                {change != null && (
                    <div className={`flex items-center gap-1 text-[11px] sm:text-[13px] px-1.5 py-0.5 rounded w-fit ${isPositive ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {change}
                    </div>
                )}
                {subtitle && <span className="text-[11px] sm:text-[13px] text-gray-400 font-medium truncate">{subtitle}</span>}
            </div>
        )}
    </div>
);

const ReportsStats = ({ dashboardCards }) => {
    const period = dashboardCards?.month ?? {};
    const stats = dashboardCards
        ? [
            { title: "Total Sales", value: formatCurrency(period.total_sales), subtitle: "This month" },
            { title: "Number of Orders", value: (period.number_of_orders ?? 0).toLocaleString(), subtitle: "This month" },
            { title: "Net Earnings", value: formatCurrency(period.net_earning), subtitle: "This month" },
            { title: "Commission Paid", value: formatCurrency(period.commission), subtitle: "This month" },
            { title: "Total Refunds", value: formatCurrency(period.refund), subtitle: "This month" },
        ]
        : [
            { title: "Total Sales", value: "--", subtitle: "Loading..." },
            { title: "Number of Orders", value: "--", subtitle: "Loading..." },
            { title: "Net Earnings", value: "--", subtitle: "Loading..." },
            { title: "Commission Paid", value: "--", subtitle: "Loading..." },
            { title: "Total Refunds", value: "--", subtitle: "Loading..." },
        ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-8">
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </div>
    );
};

export default ReportsStats;
