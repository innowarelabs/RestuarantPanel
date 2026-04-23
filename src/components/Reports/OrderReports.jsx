import React, { useState, useMemo } from 'react';
import { ChevronLeft, Calendar, FileSpreadsheet, FileText, Filter, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import RecentOrdersFilterModal from './RecentOrdersFilterModal';
import ScheduleReportModal from './ScheduleReportModal';

const CHART_COLORS = ['#DD2F26', '#4F46E5', '#F59E0B', '#94A3B8', '#EF4444', '#8B5CF6'];

const OrderReports = ({ onBack, reportData, loading, error, days, onDaysChange, onRefresh, onExportPdf, onExportCsv }) => {
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const pieData = useMemo(() => {
        if (!reportData?.orders_by_source?.length) return [];
        return reportData.orders_by_source.map((item, index) => ({
            name: item.source,
            value: item.percent,
            color: CHART_COLORS[index % CHART_COLORS.length],
            amount: `$${item.revenue?.toLocaleString() || 0}`
        }));
    }, [reportData]);

    const barData = useMemo(() => {
        if (!reportData?.orders_by_source?.length) return [];
        return reportData.orders_by_source.map(item => ({
            name: item.source,
            orders: item.order_count
        }));
    }, [reportData]);

    const stats = useMemo(() => {
        const s = reportData?.stats || {};
        return [
            { label: "Total Orders", value: s.total_orders?.toLocaleString() || "0" },
            { label: "Avg Prep Time", value: s.avg_prep_time_min ? `${s.avg_prep_time_min} min` : "--" },
            { label: "Avg Delivery Time", value: s.avg_delivery_time_min ? `${s.avg_delivery_time_min} min` : "--" },
            { label: "Cancelled", value: s.cancelled?.toLocaleString() || "0" },
            { label: "Completed", value: s.completed?.toLocaleString() || "0" },
            { label: "Success Rate", value: s.success_rate_percent != null ? `${s.success_rate_percent}%` : "--" },
        ];
    }, [reportData]);

    const recentOrders = useMemo(() => {
        if (!reportData?.recent_orders?.length) return [];
        return reportData.recent_orders.map(order => ({
            id: order.order_number,
            customer: order.customer,
            items: order.items_count,
            amount: `$${order.amount?.toFixed(2) || '0.00'}`,
            status: order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown',
            source: order.source,
            prep: order.prep_time_min ? `${order.prep_time_min} min` : "--",
            delivery: order.delivery_time_min ? `${order.delivery_time_min} min` : "--"
        }));
    }, [reportData]);

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
                    <h1 className="text-[28px] font-bold text-[#111827] mb-1">Order Reports</h1>
                    <p className="text-[14px] text-[#6B7280]">Analyze order volumes, sources, and fulfillment times.</p>
                    {reportData?.date_range_label && (
                        <p className="text-[13px] text-[#6B7280] mt-1 font-medium">{reportData.date_range_label}</p>
                    )}
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-[10px] text-[14px] text-red-700">
                        {error}
                    </div>
                )}

                {/* Filters Row */}
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-[14px] font-[500] text-[#111827] mb-2">Order Type</label>
                        <div className="relative">
                            <select className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#4B5563] outline-none appearance-none cursor-pointer">
                                <option>Delivery</option>
                                <option>Takeaway</option>
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
                                <option>Wallet</option>
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
                                <option>App</option>
                                <option>Deliveroo</option>
                                <option>Walk-in</option>
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
                            <select
                                value={days}
                                onChange={(e) => onDaysChange?.(Number(e.target.value))}
                                className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#4B5563] outline-none appearance-none cursor-pointer"
                            >
                                <option value={7}>Last 7 Days</option>
                                <option value={30}>Last 30 Days</option>
                                <option value={90}>Last 90 Days</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => onRefresh?.()}
                        disabled={loading}
                        className="h-[43px] px-6 bg-[#DD2F26] text-white rounded-[8px] text-[14px] font-medium hover:bg-[#C52820] transition-all whitespace-nowrap disabled:opacity-60"
                    >
                        {loading ? 'Loading…' : 'Apply Filters'}
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-[#E8E8E8] p-3  text-start">
                        <p className="text-[12px] font-[400] text-nowrap text-gray-400 uppercase tracking-wider mb-2">{stat.label}</p>
                        <p className="text-[20px] font-[800] text-general-text">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[18px] font-[800] text-general-text">Orders by Source</h2>
                    <div className="flex p-1 bg-gray-100 rounded-[8px]">
                        <button className="px-4 py-2 bg-primary text-white text-xs  rounded-[8px] shadow-sm">Daily</button>
                        <button className="px-4 py-1.5 text-gray-500 text-xs  hover:text-gray-700">Weekly</button>
                        <button className="px-4 py-1.5 text-gray-500 text-xs  hover:text-gray-700">Monthly</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[16px] border border-[#00000033] p-6 sm:p-8 shadow-sm min-h-[400px] flex flex-col md:flex-row items-center gap-8">
                        {loading ? (
                            <div className="w-full h-[300px] flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : pieData.length > 0 ? (
                            <>
                                <div className="w-full md:w-[60%] h-[250px] sm:h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                innerRadius={70}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full md:w-[40%] space-y-4">
                                    {pieData.map((entry, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></div>
                                            <div className="flex-1">
                                                <p className="text-[13px] font-[500] text-general-text">{entry.name}</p>
                                                <p className="text-[12px] text-[#6B7280]">{entry.amount}</p>
                                            </div>
                                            <span className="text-xs font-bold text-gray-400">{entry.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-[300px] flex items-center justify-center text-gray-400">
                                No data available
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-[16px] border border-[#00000033] p-8 shadow-sm h-[400px]">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : barData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} />
                                    <Tooltip cursor={{ fill: '#F9FAFB' }} />
                                    <Bar dataKey="orders" fill="#DD2F26" radius={[4, 4, 0, 0]} barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No data available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-[12px] h-[415px] border border-[#00000033] shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-[18px] font-[800] text-general-text">Recent Orders</h2>
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
                            <tr className="bg-[#F6F8F9] text-[13px] font-[500] text-[#6B7280] text-nowrap  tracking-widest">
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4 text-center">Items</th>
                                <th className="px-6 py-4">Amount ($)</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4">Prep Time</th>
                                <th className="px-6 py-4">Delivery Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : recentOrders.length > 0 ? (
                                recentOrders.map((order, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-[14px] font-[500] text-nowrap text-primary">{order.id}</td>
                                        <td className="px-6 py-4 text-[14px] font-[500] text-nowrap text-general-text">{order.customer}</td>
                                        <td className="px-6 py-4 text-[14px] font-[500] text-nowrap text-general-text text-center">{order.items}</td>
                                        <td className="px-6 py-4 text-[14px] font-[500] text-nowrap text-general-text">{order.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-[8px] text-[12px] font-[500] ${
                                                order.status === 'Completed' ? 'bg-green-50 text-green-500' : 
                                                order.status === 'Cancelled' ? 'bg-red-50 text-red-500' :
                                                order.status === 'Pending' ? 'bg-yellow-50 text-yellow-600' :
                                                'bg-gray-50 text-gray-500'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[14px] font-[500] text-gray-500">{order.source}</td>
                                        <td className="px-6 py-4 text-[14px] font-[500] text-gray-500">{order.prep}</td>
                                        <td className="px-6 py-4 text-[14px] font-[500] text-gray-500">{order.delivery}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                                        No orders found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={onExportCsv}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[14px] font-[400] text-gray-600 hover:bg-gray-50 group active:scale-95 transition-transform w-full sm:w-auto"
                    >
                        <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary" />
                        Export CSV
                    </button>
                    <button
                        type="button"
                        onClick={onExportPdf}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[14px] font-[400] text-gray-600 hover:bg-gray-50 group active:scale-95 transition-transform w-full sm:w-auto"
                    >
                        <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary" />
                        Export PDF
                    </button>
                </div>
                <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#DD2F26] text-white rounded-[8px] text-[14px] font-[400] shadow-[#DD2F26]/20 hover:bg-[#C52820] active:scale-95 transition-all w-full sm:w-auto"
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

export default OrderReports;
