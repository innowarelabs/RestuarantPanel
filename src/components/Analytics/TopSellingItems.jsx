import React, { useState } from 'react';

const items = [
    { name: 'Chicken Burger', category: 'Burgers', orders: 120, revenue: '$1,250', percentage: '36%', color: 'bg-[#2BB29C]' },
    { name: 'Fries', category: 'Sides', orders: 95, revenue: '$450', percentage: '24%', color: 'bg-[#4338CA]' },
    { name: 'Ice Cream', category: 'Desserts', orders: 77, revenue: '$250', percentage: '18%', color: 'bg-[#06B6D4]' },
    { name: 'Chicken Tikka Masala', category: 'Mains', orders: 68, revenue: '$870', percentage: '12%', color: 'bg-[#F59E0B]' },
    { name: 'Soft Drink', category: 'Drinks', orders: 55, revenue: '$150', percentage: '10%', color: 'bg-[#EC4899]' },
];

export default function TopSellingItems() {
    const [period, setPeriod] = useState('30d');

    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033]  h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-[18px] font-bold text-[#111827]">Top Selling Items</h3>
                <div className="flex bg-[#F3F4F6] p-1 rounded-lg">
                    <button
                        onClick={() => setPeriod('7d')}
                        className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${period === '7d' ? 'bg-white text-[#111827] shadow-sm' : 'text-gray-500'}`}
                    >
                        Last 7 days
                    </button>
                    <button
                        onClick={() => setPeriod('30d')}
                        className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${period === '30d' ? 'bg-white text-[#111827] shadow-sm' : 'text-gray-500'}`}
                    >
                        Last 30 days
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 bg-[#F6F8F9] rounded-[8px] px-6 py-1">
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1.5">
                                <div>
                                    <p className="text-[14px] font-bold text-[#111827]">{item.name}</p>
                                    <p className="text-[11px] text-gray-400">{item.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[13px] font-bold text-[#111827]">{item.orders} orders</p>
                                    <p className="text-[11px] text-gray-400">{item.revenue}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${item.color}`}
                                        style={{ width: item.percentage }}
                                    ></div>
                                </div>
                                <span className="text-[12px] font-semibold text-gray-500 w-8">{item.percentage}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
