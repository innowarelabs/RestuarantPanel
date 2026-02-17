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
            changeColor: 'text-[#10B981]'
        },
        {
            label: 'Link Clicks',
            value: '1,247',
            change: '+12.4%',
            icon: MousePointer2,
            iconColor: 'text-[#EAB308]',
            iconBg: 'bg-[#FEFCE8]',
            changeColor: 'text-[#10B981]'
        },
        {
            label: 'Conversions',
            value: '342',
            change: '+15.7%',
            icon: CheckCircle2,
            iconColor: 'text-[#10B981]',
            iconBg: 'bg-[#ECFDF5]',
            changeColor: 'text-[#10B981]'
        }
    ];

    return (
        <div className="bg-white rounded-[16px] p-6 border border-[#00000033] mt-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[16px] font-[800] text-[#111827]">Marketing Snapshot</h3>
                <p className="text-[13px] font-[500] text-[#374151]">
                    Conversion Rate: <span className="text-[#10B981] text-[14px] font-bold">7.1%</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-[#F6F8F9] rounded-[12px] p-4 flex items-center gap-4">
                            <div className={`w-[48px] h-[48px]  rounded-[10px] ${stat.iconBg} flex items-center justify-center shrink-0`}>
                                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                            </div>
                            <div>
                                <p className="text-[13px] text-[#6B7280] mb-0.5">{stat.label}</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-[20px] font-bold text-[#111827]">{stat.value}</span>
                                    <span className={`text-[12px] font-medium ml-10 ${stat.changeColor}`}>{stat.change}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MarketingSnapshot;
