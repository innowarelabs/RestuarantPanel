import React from 'react';
import { AlertCircle, RotateCcw, DollarSign, Activity } from 'lucide-react';

const stats = [
    { label: 'Total Refunds', value: '20', Icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Refund Value', value: '$312', Icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total Returns', value: '12', Icon: RotateCcw, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Issues Rate', value: '7.8%', Icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
];

const refundItems = [
    { name: 'Chicken Tikka Masala', count: 8, reason: 'Wrong Item', color: 'bg-orange-100 text-orange-700' },
    { name: 'Fish & Chips', count: 5, reason: 'Cold Food', color: 'bg-blue-100 text-blue-700' },
    { name: 'Burger Special', count: 4, reason: 'Late delivery', color: 'bg-amber-100 text-amber-700' },
    { name: 'Pizza Margherita', count: 3, reason: 'Wrong size', color: 'bg-rose-100 text-rose-700' },
];

export default function RefundsSummary() {
    return (
        <div className="bg-white rounded-[16px] border border-[#00000033]  mb-6 overflow-hidden">
            <div className="p-6  border-[#F3F4F6]">
                <h3 className="text-[18px] font-bold text-[#111827]">Refunds & Returns Summary</h3>
            </div>

            <div className="p-6 -mt-6">
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
                            {refundItems.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-4 text-[14px] font-medium text-[#111827]">{item.name}</td>
                                    <td className="py-4 text-[13px] text-gray-500 font-bold">{item.count}</td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-[4px] text-[12px] font-[500] ${item.color}`}>
                                            {item.reason}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
