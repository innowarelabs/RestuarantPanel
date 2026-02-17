import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Clock, Calendar, TrendingDown } from 'lucide-react';

const hourlyData = [
    { time: '8 AM', value: 5 },
    { time: '10 AM', value: 8 },
    { time: '11 AM', value: 12 },
    { time: '12 PM', value: 24 },
    { time: '1 PM', value: 32 },
    { time: '2 PM', value: 18 },
    { time: '3 PM', value: 10 },
    { time: '4 PM', value: 8 },
    { time: '5 PM', value: 15 },
    { time: '6 PM', value: 28 },
    { time: '7 PM', value: 45 },
    { time: '8 PM', value: 52 },
    { time: '9 PM', value: 48 },
    { time: '10 PM', value: 35 },
];

export default function PeakOrderingTimesChart() {
    const [view, setView] = useState('hourly');

    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033] mb-6">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-[18px] font-bold text-[#111827]">Peak Ordering Times</h3>

                <div className="flex bg-[#F3F4F6] p-1 rounded-lg">
                    <button
                        onClick={() => setView('hourly')}
                        className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${view === 'hourly' ? 'bg-white text-[#111827] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Hourly View
                    </button>
                    <button
                        onClick={() => setView('daily')}
                        className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${view === 'daily' ? 'bg-white text-[#111827] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Day of Week
                    </button>
                </div>
            </div>

            <div className="h-[250px] w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                        <XAxis
                            dataKey="time"
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
                        <Tooltip cursor={{ fill: '#F9FAFB' }} />
                        <Bar
                            dataKey="value"
                            fill="#2BB29C"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                        >
                            {hourlyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.value > 40 ? '#2BB29C' : '#4ADE80'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Summary Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#F0FDFA] p-4 rounded-[8px] border border-[#CCFBF1] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#2BB29C]/10 flex items-center justify-center">
                        <Clock size={20} className="text-[#2BB29C]" />
                    </div>
                    <div>
                        <p className="text-[11px] text-[#2BB29C] font-semibold uppercase tracking-wider">Busiest Hour</p>
                        <p className="text-[16px] font-bold text-[#111827]">8 PM – 9 PM</p>
                    </div>
                </div>

                <div className="bg-[#F0FDFA] p-4 rounded-[8px] border border-[#CCFBF1] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#2BB29C]/10 flex items-center justify-center">
                        <Calendar size={20} className="text-[#2BB29C]" />
                    </div>
                    <div>
                        <p className="text-[11px] text-[#2BB29C] font-semibold uppercase tracking-wider">Busiest Day</p>
                        <p className="text-[16px] font-bold text-[#111827]">Saturday</p>
                    </div>
                </div>

                <div className="bg-[#FEF2F2] p-4 rounded-[8px] border border-[#FEE2E2] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
                        <TrendingDown size={20} className="text-[#EF4444]" />
                    </div>
                    <div>
                        <p className="text-[11px] text-[#EF4444] font-semibold uppercase tracking-wider">Slowest Day</p>
                        <p className="text-[16px] font-bold text-[#111827]">Tuesday</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
