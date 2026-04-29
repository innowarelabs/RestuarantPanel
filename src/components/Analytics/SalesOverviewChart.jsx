import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ANALYTICS_NO_DATA } from './analyticsCopy';

const PLACEHOLDER = [{ name: '—', orders: 0, revenue: 0 }];

export default function SalesOverviewChart({ data = [], loading = false }) {
    const [activeType, setActiveType] = useState('orders');

    const chartData = useMemo(() => {
        if (loading && (!data || data.length === 0)) return PLACEHOLDER;
        if (!data || data.length === 0) return PLACEHOLDER;
        return data;
    }, [data, loading]);

    const hasRealData = Array.isArray(data) && data.length > 0;

    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033]  mb-6">
            <div className="flex items-center justify-between mb-8">
                <h3 className="analytics-section-title">Sales & Orders Over Time</h3>

                <div className="flex bg-[#F3F4F6] p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setActiveType('orders')}
                        className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${activeType === 'orders' ? 'bg-white text-[#111827] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Orders
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveType('revenue')}
                        className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${activeType === 'revenue' ? 'bg-white text-[#111827] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Revenue ($)
                    </button>
                </div>
            </div>

            {!hasRealData && !loading && (
                <p className="text-[13px] text-gray-500 mb-4">{ANALYTICS_NO_DATA}</p>
            )}

            <div className="h-[300px] w-full relative">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-lg">
                        <span className="text-[13px] text-gray-500">Loading chart…</span>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#DD2F26" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#DD2F26" stopOpacity={0} />
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
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                        <Tooltip />
                        <Area
                            type="monotone"
                            dataKey={activeType}
                            stroke="#DD2F26"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            isAnimationActive={hasRealData}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
