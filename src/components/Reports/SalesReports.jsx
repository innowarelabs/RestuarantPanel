import React, { useState } from 'react';
import { ChevronLeft, Calendar, FileSpreadsheet, FileText, Filter, Download, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import RecentOrdersFilterModal from './RecentOrdersFilterModal';
import ScheduleReportModal from './ScheduleReportModal';

const SalesReports = ({ onBack }) => {
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const chartData = [
        { name: '1 Dec', sales: 850 },
        { name: '2 Dec', sales: 920 },
        { name: '3 Dec', sales: 780 },
        { name: '4 Dec', sales: 1150 },
        { name: '5 Dec', sales: 1100 },
        { name: '6 Dec', sales: 1250 },
        { name: '7 Dec', sales: 1300 },
    ];

    const stats = [
        { label: "Total Sales", value: "$24,582.40", color: "text-primary" },
        { label: "Orders Count", value: "1,247" },
        { label: "Avg Order Value", value: "$19.71" },
        { label: "Refunds", value: "$342.50", color: "text-red-500" },
        { label: "Net Earnings", value: "$23,599.10" },
        { label: "Commission", value: "$983.30" },
    ];

    const dailyBreakdown = [
        { date: "9 Dec 2025", orders: 68, sales: "$1340.50", refunds: "$45.20", net: "$1286.94", isRefunded: true },
        { date: "8 Dec 2025", orders: 62, sales: "$1220.30", refunds: "$0.00", net: "$1171.49", isRefunded: false },
        { date: "7 Dec 2025", orders: 58, sales: "$1142.80", refunds: "$28.50", net: "$1069.73", isRefunded: true },
        { date: "6 Dec 2025", orders: 55, sales: "$1083.25", refunds: "$15.00", net: "$1025.52", isRefunded: true },
        { date: "5 Dec 2025", orders: 51, sales: "$1005.60", refunds: "$32.80", net: "$933.50", isRefunded: true },
        { date: "4 Dec 2025", orders: 48, sales: "$945.20", refunds: "$0.00", net: "$907.39", isRefunded: false },
        { date: "3 Dec 2025", orders: 42, sales: "$827.40", refunds: "$18.00", net: "$776.70", isRefunded: true },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500 pb-12">
            {/* Top Header */}
            <div className="bg-[#FFFFFF] border border-[#00000033] rounded-[16px] p-6 mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[14px] text-[#6B7280] hover:text-primary transition-colors mb-4"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Reports
                </button>

                <div className="mb-8">
                    <h1 className="text-[28px] font-bold text-[#111827] mb-1">Sales Reports</h1>
                    <p className="text-[14px] text-[#6B7280]">Analyze sales performance, payment methods, and revenue trends.</p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-[14px] font-[500] text-[#111827] mb-2">Order Type</label>
                        <div className="relative">
                            <select className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#4B5563] outline-none appearance-none cursor-pointer">
                                <option>Delivery</option>
                                <option>Pickup</option>
                                <option>Dine-in</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-[14px] font-[500] text-[#111827] mb-2">Payment Method</label>
                        <div className="relative">
                            <select className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#4B5563] outline-none appearance-none cursor-pointer">
                                <option>Card</option>
                                <option>Cash</option>
                                <option>Online</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-[14px] font-[500] text-[#111827] mb-2">Source</label>
                        <div className="relative">
                            <select className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#4B5563] outline-none appearance-none cursor-pointer">
                                <option>UberEats</option>
                                <option>Direct</option>
                                <option>DoorDash</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                        <label className="block text-[14px] font-[500] text-[#111827] mb-2">Date Range</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Calendar className="w-4 h-4 text-[#9CA3AF]" />
                            </div>
                            <select className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#4B5563] outline-none appearance-none cursor-pointer">
                                <option>Last 30 Days</option>
                                <option>Last 7 Days</option>
                                <option>Custom</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                    <button className="h-[43px] px-6 bg-[#2BB29C] text-white rounded-[8px] text-[14px] font-medium hover:bg-[#24A18C] transition-all whitespace-nowrap">
                        Apply Filters
                    </button>
                </div>
            </div>


            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-[#E8E8E8] p-3 text-start">
                        <p className="text-[12px] font-[400] text-nowrap text-gray-400 uppercase tracking-wider mb-2">{stat.label}</p>
                        <p className={`text-[20px] font-[800] ${stat.color || 'text-general-text'}`}>{stat.value}</p>
                    </div>
                ))}
            </div>


            {/* Sales Trend Chart */}
            <div className="bg-white  rounded-[16px] border border-[#00000033] p-8  mb-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-[18px] font-[800] text-general-text">Sales Trend</h2>
                        <p className="text-[12px] text-green-500 font-bold flex items-center gap-1 mt-1">
                            <ArrowUpRight className="w-3 h-3" />
                            12.5% increase vs last week
                        </p>
                    </div>
                    <div className="flex p-1 bg-gray-100 rounded-[8px]">
                        <button className="px-4 py-2 bg-primary text-white text-xs rounded-[8px] shadow-sm">Daily</button>
                        <button className="px-4 py-1.5 text-gray-500 text-xs hover:text-gray-700">Weekly</button>
                        <button className="px-4 py-1.5 text-gray-500 text-xs hover:text-gray-700">Monthly</button>
                    </div>

                </div>

                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2BB29C" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#2BB29C" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
                                dy={10}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="sales"
                                stroke="#2BB29C"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorSales)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Daily Breakdown Table */}
            <div className="bg-white rounded-[12px] h-[415px] border border-[#00000033] shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-[18px] font-[800] text-general-text">Daily Breakdown</h2>
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-500 hover:bg-gray-50 active:scale-95 transition-transform"
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Filters
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#F6F8F9] text-[13px] font-[500] text-[#6B7280] text-nowrap tracking-widest">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Orders</th>
                                <th className="px-6 py-4">Sales ($)</th>
                                <th className="px-6 py-4">Refunds ($)</th>
                                <th className="px-6 py-4">Net Revenue ($)</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50">
                            {dailyBreakdown.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-[14px] font-[500] text-nowrap text-general-text">{row.date}</td>
                                    <td className="px-6 py-4 text-[14px] font-[500] text-nowrap text-general-text">{row.orders}</td>
                                    <td className="px-6 py-4 text-[14px] font-[500] text-nowrap text-general-text">{row.sales}</td>
                                    <td className="px-6 py-4 text-[14px] font-[500] text-nowrap text-red-500">
                                        {row.isRefunded ? row.refunds : '$0.00'}
                                    </td>
                                    <td className="px-6 py-4 text-[14px] font-[500] text-nowrap text-general-text">{row.net}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[14px] font-[400] text-gray-600 hover:bg-gray-50 group active:scale-95 transition-transform w-full sm:w-auto">
                        <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary" />
                        Export CSV
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[14px] font-[400] text-gray-600 hover:bg-gray-50 group active:scale-95 transition-transform w-full sm:w-auto">
                        <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary" />
                        Export PDF
                    </button>
                </div>
                <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#2BB29C] text-white rounded-[8px] text-[14px] font-[400] shadow-[#2BB29C]/20 hover:bg-[#24A18C] active:scale-95 transition-all w-full sm:w-auto"
                >
                    <Calendar className="w-4 h-4" />
                    Schedule Monthly Report
                </button>
            </div>


            {/* Modals */}
            <RecentOrdersFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
            />
            <ScheduleReportModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
            />
        </div>
    );
};

export default SalesReports;
