import React from 'react';
import { Clock, CheckCircle2, DollarSign, XCircle } from 'lucide-react';

const RecentActivities = () => {
    const activities = [
        {
            text: 'New order #1458 received from Sarah Johnson',
            time: '2 minutes ago',
            icon: Clock,
            iconColor: 'text-[#3B82F6]',
            iconBg: 'bg-[#EFF6FF]'
        },
        {
            text: 'Order #1455 completed and delivered',
            time: '8 minutes ago',
            icon: CheckCircle2,
            iconColor: 'text-[#10B981]',
            iconBg: 'bg-[#ECFDF5]'
        },
        {
            text: 'Payment of $142.50 received',
            time: '12 minutes ago',
            icon: DollarSign,
            iconColor: 'text-[#15B99E]',
            iconBg: 'bg-[#F0FDF9]'
        },
        {
            text: 'Order #1452 cancelled by customer',
            time: '18 minutes ago',
            icon: XCircle,
            iconColor: 'text-[#EF4444]',
            iconBg: 'bg-[#FEF2F2]'
        },
        {
            text: 'New order #1457 received from Mike Chen',
            time: '25 minutes ago',
            icon: Clock,
            iconColor: 'text-[#3B82F6]',
            iconBg: 'bg-[#EFF6FF]'
        }
    ];

    return (
        <div className="bg-white rounded-[16px] border border-[#00000033] h-full flex flex-col">
            <div className="p-6 pb-2">
                <h3 className="text-[16px] font-[800] text-[#111827] mb-6">Recent Activities</h3>

                <div className="space-y-6">
                    {activities.map((activity, index) => {
                        const Icon = activity.icon;
                        return (
                            <div key={index} className="flex gap-4 relative">
                                {/* Connector Line */}
                                {index !== activities.length - 1 && (
                                    <div className="absolute left-[20px] top-[40px] h-[calc(100%-16px)] bg-[#E5E7EB]" />
                                )}

                                <div className={`w-[40px] h-[40px] rounded-[10px] ${activity.iconBg} flex items-center justify-center shrink-0 z-10`}>
                                    <Icon className={`w-5 h-5 ${activity.iconColor}`} />
                                </div>

                                <div className="pt-1">
                                    <p className="text-[13px] text-[#111827] mb-0.5">{activity.text}</p>
                                    <p className="text-[11px] text-[#9CA3AF]">{activity.time}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-auto p-4 bg-[#E5F9F6] rounded-b-[16px] border-t border-[#E5E7EB]">
                <button className="w-full text-center text-[14px] font-[800] text-[#111827] hover:opacity-80 transition-opacity cursor-pointer">
                    Dismiss All
                </button>
            </div>
        </div>
    );
};

export default RecentActivities;
