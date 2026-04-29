import React, { useMemo } from 'react';
import { AlertCircle, RotateCcw, DollarSign, Activity } from 'lucide-react';
import { ANALYTICS_NO_DATA } from './analyticsCopy';

const formatMoney = (n) => {
    if (n == null || Number.isNaN(Number(n))) return '$0';
    return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

export default function RefundsSummary({ orders = null, loading = false }) {
    const stats = useMemo(() => {
        const total = Number(orders?.total_orders_period) || 0;
        const cancelled = Number(orders?.cancelled_orders_period) || 0;
        const issueRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : '0';
        return [
            { label: 'Total Refunds', value: '0', Icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Refund value', value: formatMoney(0), Icon: DollarSign, color: 'text-[#DD2F26]', bg: 'bg-red-50' },
            { label: 'Refund line items', value: '0', Icon: RotateCcw, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Cancellation rate', value: `${issueRate}%`, Icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
        ];
    }, [orders]);

    return (
        <div className="bg-white rounded-[16px] border border-[#00000033]  mb-6 overflow-hidden">
            <div className="p-6  border-[#F3F4F6]">
                <h3 className="analytics-section-title">Refunds & Returns Summary</h3>
                <p className="text-[12px] text-gray-500 mt-1">
                    Refund line items are not in the current API; cancelled orders in period:{' '}
                    {orders?.cancelled_orders_period != null ? orders.cancelled_orders_period : ANALYTICS_NO_DATA}.
                </p>
            </div>

            <div className="p-6 -mt-6">
                {loading && <div className="py-6 text-center text-[13px] text-gray-500">Loading…</div>}
                {!loading && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {stats.map((stat, index) => (
                                <div key={index} className={`${stat.bg} p-4 rounded-[8px] border border-transparent`}>
                                    <p className="text-[12px] text-gray-500 font-medium mb-1">{stat.label}</p>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-[24px] font-bold ${stat.color}`}>{stat.value}</p>
                                        <stat.Icon size={18} className={stat.color} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="pb-4">Item Name</th>
                                        <th className="pb-4">Refund Count</th>
                                        <th className="pb-4">Primary Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F3F4F6]">
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-[13px] text-gray-500">
                                            {ANALYTICS_NO_DATA}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
