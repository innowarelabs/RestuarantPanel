import React from 'react';
import { ANALYTICS_NO_DATA } from './analyticsCopy';

export default function LowPerformingTable({ rows = [], loading = false, subtitle }) {
    const items = Array.isArray(rows) ? rows : [];
    const hint =
        subtitle ||
        'Uses low_performing_items from analytics when present (single object or array). If omitted, the weakest venue metric may show as a fallback.';

    return (
        <div className="bg-white rounded-[16px] border border-[#00000033]  mb-6 overflow-hidden">
            <div className="p-6 border-b border-[#F3F4F6]">
                <h3 className="analytics-section-title">Low Performing Items</h3>
                <p className="text-[12px] text-gray-500 mt-1">{hint}</p>
            </div>
            <div className="overflow-x-auto">
                {loading && <div className="p-8 text-center text-[13px] text-gray-500">Loading…</div>}
                {!loading && items.length === 0 && (
                    <div className="p-8 text-center text-[13px] text-gray-500">{ANALYTICS_NO_DATA}</div>
                )}
                {!loading && items.length > 0 && (
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
                            {items.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-nowrap text-[14px] font-bold text-[#111827]">{item.name}</td>
                                    <td className="px-6 py-4 text-nowrap text-[13px] text-gray-500">{item.category}</td>
                                    <td className="px-6 py-4 text-nowrap text-[13px] text-gray-500">{item.orders}</td>
                                    <td className="px-6 py-4 text-nowrap text-[13px] font-bold text-[#111827]">{item.revenue}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 text-nowrap rounded-[4px] text-[11px] font-[600] border ${item.color || 'bg-gray-50 text-gray-600 border-gray-100'}`}
                                        >
                                            {item.recommendation}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
