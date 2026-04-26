import React, { useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar } from 'lucide-react';

/** Matches `--color-primary` / admin charts */
const PRIMARY_STROKE = '#DD2F26';

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

const OverviewChart = ({
    revenueData = [],
    ordersData = [],
    totalRevenue = 0,
    pctChange = 0
}) => {
    const [activeTab, setActiveTab] = useState('Revenue');

    // Prepare data based on active tab
    const chartData = activeTab === 'Revenue'
        ? revenueData
        : ordersData.map(d => ({ date: d.day || d.date, value: d.total || d.value }));

    return (
        <div className="bg-white rounded-[16px] p-6 border border-[#00000033] h-[530px]">
            <div className="mb-6 w-full">
                <h3 className="text-[20px] font-[800] text-[#111827]">Overview</h3>
                <div className="mt-4 w-full border-b border-gray-200">
                    <div className="flex gap-4 -mb-px">
                        <button
                            type="button"
                            onClick={() => setActiveTab('Revenue')}
                            className={`pb-2 text-[14px] font-[400] transition-colors border-b-2 px-1 cursor-pointer ${activeTab === 'Revenue' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        >
                            Revenue
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('Orders')}
                            className={`pb-2 text-[13px] font-[400] transition-colors border-b-2 px-1 cursor-pointer ${activeTab === 'Orders' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        >
                            Orders
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                    <h4 className="text-[16px] text-gray-900">{activeTab} Overview</h4>
                    <p className="text-[13px] text-gray-500 mt-0.5">Last 7 days performance</p>
                </div>
                <button
                    type="button"
                    className="flex shrink-0 items-center justify-center gap-2 self-stretch border border-[#E5E7EB] rounded-[8px] px-4 py-2.5 text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer sm:self-auto sm:py-3"
                >
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Last 7 days</span>
                </button>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={PRIMARY_STROKE} stopOpacity={0.12} />
                                <stop offset="95%" stopColor={PRIMARY_STROKE} stopOpacity={0} />
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
                        <Tooltip content={<CustomTooltip type={activeTab} />} cursor={{ stroke: PRIMARY_STROKE, strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={PRIMARY_STROKE}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                    <p className="text-[13px] text-gray-500">Total {activeTab}</p>
                    <p className="text-[20px] font-[400] text-gray-900">
                        {activeTab === 'Revenue'
                            ? `$${Number(totalRevenue || 0).toLocaleString()}`
                            : ordersData.reduce((sum, d) => sum + (d.total || d.value || 0), 0).toLocaleString()}
                    </p>
                </div>
                <div className="text-right">
                    <span className={`text-[12px] font-[400] ${pctChange >= 0 ? 'text-primary' : 'text-[#EF4444]'}`}>
                        {pctChange >= 0 ? '+' : ''}
                        {pctChange}% vs last week
                    </span>
                </div>
            </div>
        </div>
    );
};

export default OverviewChart;
