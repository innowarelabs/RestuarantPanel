import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RedemptionTrendChart = () => {
    const data = [
        { date: 'Dec 1', redemptions: 3 },
        { date: 'Dec 3', redemptions: 5 },
        { date: 'Dec 5', redemptions: 7 },
        { date: 'Dec 7', redemptions: 4 },
        { date: 'Dec 9', redemptions: 8 },
        { date: 'Dec 11', redemptions: 6 },
        { date: 'Dec 13', redemptions: 9 },
        { date: 'Dec 15', redemptions: 11 },
    ];

    return (
        <div className="w-full mt-10">
            <h4 className="text-[16px] font-semibold text-[#1F2937] mb-6">Reward Redemption Trend (Last 30 Days)</h4>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            padding={{ left: 10, right: 10 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            domain={[0, 12]}
                            ticks={[0, 3, 6, 9, 12]}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#24B99E', fontWeight: 'bold' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="redemptions"
                            stroke="#24B99E"
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#24B99E', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 7, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RedemptionTrendChart;
