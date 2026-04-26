import React from 'react';
import { Clock, CircleCheckBig, DollarSign, CircleX } from 'lucide-react';

/** API types: e.g. `cancelled`, `completed`, `payment` (+ legacy snake_case) */
const getIconConfig = (type) => {
    const t = (type && String(type).toLowerCase().trim()) || '';
    const primaryTint = { iconColor: 'text-primary', iconBg: 'bg-primary-bg' };

    switch (t) {
        case 'new_order':
            return { icon: Clock, iconColor: 'text-[#3B82F6]', iconBg: 'bg-[#EFF6FF]' };
        case 'order_completed':
        case 'completed':
            return { icon: CircleCheckBig, iconColor: 'text-[#10B981]', iconBg: 'bg-[#ECFDF5]' };
        case 'payment':
        case 'payment_received':
            return { icon: DollarSign, ...primaryTint };
        case 'order_cancelled':
        case 'cancelled':
            return { icon: CircleX, ...primaryTint };
        default:
            return { icon: Clock, iconColor: 'text-[#6B7280]', iconBg: 'bg-gray-100' };
    }
};

const RecentActivities = ({ activities = [], loading = false }) => {
    const hasActivities = activities && activities.length > 0;

    return (
        <div className="bg-white rounded-[16px] border border-[#00000033] h-full flex flex-col">
            <div className="p-6 pb-2">
                <h3 className="text-[16px] font-[800] text-[#111827] mb-6">Recent Activities</h3>

                {!hasActivities && !loading && (
                    <div className="py-8 text-center text-[13px] text-[#9CA3AF]">
                        No recent activity yet.
                    </div>
                )}

                {hasActivities && (
                    <div className="space-y-6 max-h-[320px] overflow-y-auto pr-1">
                        {activities.map((activity, index) => {
                            const { icon: Icon, iconColor, iconBg } = getIconConfig(activity.type);
                            return (
                                <div key={activity.created_at || index} className="flex gap-4 relative">
                                    {/* Connector Line */}
                                    {index !== activities.length - 1 && (
                                        <div className="absolute left-[20px] top-[40px] h-[calc(100%-16px)] bg-[#E5E7EB]" />
                                    )}

                                    <div className={`w-[40px] h-[40px] rounded-[10px] ${iconBg} flex items-center justify-center shrink-0 z-10`}>
                                        <Icon className={`w-5 h-5 ${iconColor}`} />
                                    </div>

                                    <div className="pt-1">
                                        <p className="text-[13px] text-[#111827] mb-0.5">
                                            {activity.message}
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            {activity.time_ago}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-auto p-4 bg-[#DD2F2626] rounded-b-[16px] border-t border-[#E5E7EB]">
                <button className="w-full text-center text-[14px] font-[800] text-[#111827] hover:opacity-80 transition-opacity cursor-pointer">
                    Dismiss All
                </button>
            </div>
        </div>
    );
};

export default RecentActivities;
