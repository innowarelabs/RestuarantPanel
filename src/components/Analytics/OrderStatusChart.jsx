import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const data = [
    { name: 'Completed', value: 82, color: '#2BB29C' },
    { name: 'Cancelled', value: 3, color: '#EF4444' },
    { name: 'Refunded', value: 5, color: '#F59E0B' },
    { name: 'Returned', value: 3, color: '#6366F1' },
    { name: 'In Progress', value: 7, color: '#10B981' },
];

export default function OrderStatusChart() {
    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033]  h-full flex flex-col">
            <h3 className="text-[18px] font-bold text-[#111827] mb-6">Order Status Breakdown</h3>

            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="w-[200px] h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-3">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-[13px] text-gray-600 font-medium whitespace-nowrap">{item.name}</span>
                            <span className="text-[13px] font-bold text-[#111827] ml-auto">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
