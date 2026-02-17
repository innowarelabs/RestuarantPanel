import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, change, isPositive, subtitle }) => (
    <div className="bg-white rounded-[12px] border border-[#00000033] p-3 sm:p-4 h-[135px] sm:h-[150px] flex flex-col justify-between">
        <div>
            <p className="text-[13px] sm:text-[14px] font-medium text-gray-500 mb-0.5 sm:mb-1">{title}</p>
            <h3 className="text-[20px] sm:text-[24px] font-bold text-general-text truncate">{value}</h3>
        </div>
        <div className="flex flex-col gap-1 sm:gap-1.5 px-0.5">
            <div className={`flex items-center gap-1 text-[11px] sm:text-[13px] px-1.5 py-0.5 rounded w-fit ${isPositive ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change}
            </div>
            <span className="text-[11px] sm:text-[13px] text-gray-400 font-medium truncate">{subtitle}</span>
        </div>
    </div>
);

const ReportsStats = () => {
    const stats = [
        { title: "Total Sales", value: "$24,582.40", change: "+12.5%", isPositive: true, subtitle: "vs previous period" },
        { title: "Number of Orders", value: "1,247", change: "+8.2%", isPositive: true, subtitle: "vs previous period" },
        { title: "Net Earnings", value: "$23,599.10", change: "+11.8%", isPositive: true, subtitle: "vs previous period" },
        { title: "Commission Paid", value: "$983.30", change: "-2.1%", isPositive: false, subtitle: "vs previous period" },
        { title: "Total Refunds", value: "$342.50", change: "-15.3%", isPositive: true, subtitle: "vs previous period" },
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
