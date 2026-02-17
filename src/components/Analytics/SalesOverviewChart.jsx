import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
    { name: 'Dec 1', orders: 12, revenue: 240 },
    { name: 'Dec 2', orders: 15, revenue: 300 },
    { name: 'Dec 3', orders: 18, revenue: 360 },
    { name: 'Dec 4', orders: 14, revenue: 280 },
    { name: 'Dec 5', orders: 22, revenue: 440 },
    { name: 'Dec 6', orders: 25, revenue: 500 },
    { name: 'Dec 7', orders: 19, revenue: 380 },
    { name: 'Dec 8', orders: 16, revenue: 320 },
    { name: 'Dec 9', orders: 20, revenue: 400 },
    { name: 'Dec 10', orders: 21, revenue: 420 },
    { name: 'Dec 11', orders: 17, revenue: 340 },
    { name: 'Dec 12', orders: 23, revenue: 460 },
    { name: 'Dec 13', orders: 28, revenue: 560 },
    { name: 'Dec 14', orders: 24, revenue: 480 },
];

export default function SalesOverviewChart() {
    const [activeType, setActiveType] = useState('orders');

    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033]  mb-6">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-[18px] font-bold text-[#111827]">Sales & Orders Over Time</h3>

                <div className="flex bg-[#F3F4F6] p-1 rounded-lg">
                    <button
                        onClick={() => setActiveType('orders')}
                        className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${activeType === 'orders' ? 'bg-white text-[#111827] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Orders
                    </button>
                    <button
                        onClick={() => setActiveType('revenue')}
                        className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${activeType === 'revenue' ? 'bg-white text-[#111827] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Revenue ($)
                    </button>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2BB29C" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#2BB29C" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9CA3AF' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9CA3AF' }}
                        />
                        <Tooltip />
                        <Area
                            type="monotone"
                            dataKey={activeType}
                            stroke="#2BB29C"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
