import React from 'react';

const lowItems = [
    { name: 'Garlic Bread', category: 'Sides', orders: 3, revenue: '$9', recommendation: 'Run promotion', color: 'bg-[#F0FDFA] text-[#2BB29C] border-[#CCFBF1]' },
    { name: 'Milkshake', category: 'Drinks', orders: 5, revenue: '$15', recommendation: 'Update photo', color: 'bg-[#FFF7ED] text-[#F59E0B] border-[#FFEDD5]' },
    { name: 'Fish Wrap', category: 'Mains', orders: 2, revenue: '$18', recommendation: 'Consider removing', color: 'bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2]' },
    { name: 'Onion Rings', category: 'Sides', orders: 4, revenue: '$12', recommendation: 'Bundle with mains', color: 'bg-[#EFF6FF] text-[#3B82F6] border-[#DBEAFE]' },
];

export default function LowPerformingTable() {
    return (
        <div className="bg-white rounded-[16px] border border-[#00000033]  mb-6 overflow-hidden">
            <div className="p-6 border-b border-[#F3F4F6]">
                <h3 className="text-[18px] font-bold text-[#111827]">Low Performing Items</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#F9FAFB]">
                        <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="px-6 text-nowrap py-4">Item Name</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Orders</th>
                            <th className="px-6 py-4">Revenue</th>
                            <th className="px-6 py-4">Recommendation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                        {lowItems.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-nowrap text-[14px] font-bold text-[#111827]">{item.name}</td>
                                <td className="px-6 py-4 text-nowrap text-[13px] text-gray-500">{item.category}</td>
                                <td className="px-6 py-4 text-nowrap text-[13px] text-gray-500">{item.orders}</td>
                                <td className="px-6 py-4 text-nowrap text-[13px] font-bold text-[#111827]">{item.revenue}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 text-nowrap rounded-[4px] text-[11px] font-[600] border ${item.color}`}>
                                        {item.recommendation}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
