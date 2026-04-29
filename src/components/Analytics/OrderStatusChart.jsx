import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ANALYTICS_NO_DATA } from './analyticsCopy';

const DEFAULT_PIE = [{ name: ANALYTICS_NO_DATA, value: 100, color: '#E5E7EB' }];

export default function OrderStatusChart({ data = DEFAULT_PIE, loading = false }) {
    const chartData = Array.isArray(data) && data.length > 0 ? data : DEFAULT_PIE;

    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033]  h-full flex flex-col">
            <h3 className="analytics-section-title mb-6">Order Status Breakdown</h3>

            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 relative min-h-[220px]">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-lg">
                        <span className="text-[13px] text-gray-500">Loading…</span>
                    </div>
                )}
                <div className="w-[200px] h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-3">
                    {chartData.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[13px] text-gray-600 font-medium whitespace-nowrap">{item.name}</span>
                            <span className="text-[13px] font-bold text-[#111827] ml-auto">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
