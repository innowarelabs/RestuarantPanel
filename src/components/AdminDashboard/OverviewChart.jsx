import React, { useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar } from 'lucide-react';

const CustomTooltip = ({ active, payload, label, type }) => {
    if (active && payload?.length) {
        return (
            <div className="bg-white rounded-lg p-3 shadow-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                <p className="text-lg font-bold text-[#1F2937]">
                    {type === 'Revenue' ? '$' : ''}{payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

const OverviewChart = ({ revenueData = [], ordersData = [] }) => {
    const [activeTab, setActiveTab] = useState('Revenue');

    // Prepare data based on active tab
    const chartData = activeTab === 'Revenue'
        ? revenueData
        : ordersData.map(d => ({ date: d.day || d.date, value: d.total || d.value }));

    return (
        <div className="bg-white rounded-[16px] p-6 border border-[#00000033] h-[530px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-[20px] font-[800] text-[#111827]">Overview</h3>
                    <div className="flex gap-4 mt-2 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('Revenue')}
                            className={`pb-2 text-[14px] font-[400] transition-colors border-b-2 px-1 cursor-pointer ${activeTab === 'Revenue' ? 'text-[#15B99E] border-[#15B99E]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        >
                            Revenue
                        </button>
                        <button
                            onClick={() => setActiveTab('Orders')}
                            className={`pb-2 text-[13px] font-[400] transition-colors border-b-2 px-1 cursor-pointer ${activeTab === 'Orders' ? 'text-[#3B82F6] border-[#3B82F6]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        >
                            Orders
                        </button>
                    </div>
                </div>

                <div className="hidden sm:flex">
                    <button className="flex items-center gap-2 border border-[#E5E7EB] rounded-[8px] px-4 py-3 text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer">
                        <Calendar className="w-4 h-4" />
                        <span>Last 7 days</span>
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <h4 className="text-[16px]  text-gray-900">{activeTab} Overview</h4>
                <p className="text-[13px] text-gray-500">Last 7 days performance</p>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={activeTab === 'Revenue' ? "#15B99E" : "#3B82F6"} stopOpacity={0.1} />
                                <stop offset="95%" stopColor={activeTab === 'Revenue' ? "#15B99E" : "#3B82F6"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            dy={10}
                        />
                        <Tooltip content={<CustomTooltip type={activeTab} />} cursor={{ stroke: activeTab === 'Revenue' ? '#15B99E' : '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={activeTab === 'Revenue' ? "#15B99E" : "#3B82F6"}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                    <p className="text-[13px]-ml-[2px] text-gray-500">Total {activeTab}</p>
                    <p className="text-[20px] font-[400] text-gray-900">
                        {activeTab === 'Revenue' ? '$12,847.50' : '3,450'}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[12px] text-[#15B99E] font-[400">+12.5% vs last week</span>
                </div>
            </div>
        </div>
    );
};

export default OverviewChart;
