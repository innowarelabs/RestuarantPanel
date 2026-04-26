import React from 'react';
import { Mail, MousePointer2, CheckCircle2 } from 'lucide-react';

const MarketingSnapshot = () => {
    const stats = [
        {
            label: 'Email Opens',
            value: '4,832',
            change: '+8.2%',
            icon: Mail,
            iconColor: 'text-[#3B82F6]',
            iconBg: 'bg-[#EFF6FF]',
            trendColor: 'text-[#16A34A]',
        },
        {
            label: 'Link Clicks',
            value: '1,247',
            change: '+12.4%',
            icon: MousePointer2,
            iconColor: 'text-[#CA8A04]',
            iconBg: 'bg-[#FEF9C3]',
            trendColor: 'text-[#16A34A]',
        },
        {
            label: 'Conversions',
            value: '342',
            change: '+15.7%',
            icon: CheckCircle2,
            iconColor: 'text-primary',
            iconBg: 'bg-[#FEE2E2]',
            trendColor: 'text-[#16A34A]',
        },
    ];

    return (
        <div className="bg-white rounded-[16px] p-6 border border-[#00000033] mt-6 mb-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
                <h3 className="text-[18px] font-bold text-[#111827] tracking-tight">Marketing Snapshot</h3>
                <p className="text-[13px] font-medium text-[#6B7280] shrink-0">
                    Conversion Rate:{' '}
                    <span className="text-[15px] font-bold text-primary">7.1%</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-[#F3F4F6] rounded-[12px] px-4 py-4 flex items-center justify-between gap-3 min-h-[88px]"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`w-12 h-12 rounded-[10px] ${stat.iconBg} flex items-center justify-center shrink-0`}
                                >
                                    <Icon className={`w-6 h-6 ${stat.iconColor}`} strokeWidth={2} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] text-[#6B7280] font-medium leading-tight mb-0.5">
                                        {stat.label}
                                    </p>
                                    <p className="text-[20px] font-bold text-[#111827] leading-tight tabular-nums">
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                            <span
                                className={`text-[13px] font-semibold shrink-0 tabular-nums ${stat.trendColor}`}
                            >
                                {stat.change}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MarketingSnapshot;
