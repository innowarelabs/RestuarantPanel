import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, Calendar, Filter, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import RecentOrdersFilterModal, { RECENT_ORDERS_FILTER_DEFAULTS } from './RecentOrdersFilterModal';
import ScheduleReportModal from './ScheduleReportModal';
import { ReportsFilterSelect } from './ReportsFilterSelect';
import {
    DATE_RANGE_OPTIONS,
    daysToDateRangeValue,
    ORDER_TYPE_FILTER_OPTIONS,
    ORDER_PAYMENT_FILTER_OPTIONS,
    DEFAULT_ORDER_REPORT_FILTERS,
} from './reportsFilterConstants';

const CHART_COLORS = ['#DD2F26', '#4F46E5', '#F59E0B', '#94A3B8', '#EF4444', '#8B5CF6'];

function recentOrderRowMatchesFilter(row, f) {
    if (!f?.orderStatus?.all) {
        const s = (row.rawStatus || row.status || '').toLowerCase();
        const match =
            (f.orderStatus.completed && s.includes('complet')) ||
            (f.orderStatus.cancelled && s.includes('cancel')) ||
            (f.orderStatus.refunded && s.includes('refund'));
        if (!match) return false;
    }
    if (!f?.orderSource?.all) {
        const src = (row.source || '').toLowerCase();
        const match =
            (f.orderSource.uberEats && (src.includes('uber') || /eats/i.test(row.source || ''))) ||
            (f.orderSource.app && src.includes('app') && !src.includes('uber') && !src.includes('eats')) ||
            (f.orderSource.deliveroo && src.includes('deliveroo')) ||
            (f.orderSource.walkIn && (src.includes('walk') || src.includes('dine') || src.includes('in-store') || src.includes('counter')));
        if (!match) return false;
    }
    if (!f?.payment?.all) {
        const p = (row.rawPayment || '').toLowerCase();
        if (p) {
            const match =
                (f.payment.card && p.includes('card')) ||
                (f.payment.cash && p.includes('cash')) ||
                (f.payment.contactless &&
                    (p.includes('contactless') || p.includes('wallet') || p.includes('apple') || p.includes('google') || p.includes('tap')));
            if (!match) return false;
        }
    }
    return true;
}

const OrderReports = ({ onBack, reportData, loading, error, days, onApplyFilters, onExportPdf, onExportCsv, pdfExporting = false }) => {
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [filterDraft, setFilterDraft] = useState(() => ({ ...DEFAULT_ORDER_REPORT_FILTERS }));
    const [recentOrdersFilterDraft, setRecentOrdersFilterDraft] = useState(() => ({
        ...RECENT_ORDERS_FILTER_DEFAULTS,
    }));
    const [recentOrdersFilterApplied, setRecentOrdersFilterApplied] = useState(() => ({
        ...RECENT_ORDERS_FILTER_DEFAULTS,
    }));

    useEffect(() => {
        // Sync date dropdown when parent refetches with new `days` (order type / payment stay local until Apply).
        // eslint-disable-next-line react-hooks/set-state-in-effect -- draft mirrors parent-applied range
        setFilterDraft((prev) => ({ ...prev, dateRange: daysToDateRangeValue(days) }));
    }, [days]);

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
        return reportData.recent_orders.map((order) => ({
            id: order.order_number,
            customer: order.customer,
            items: order.items_count,
            amount: `$${order.amount?.toFixed(2) || '0.00'}`,
            status: order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown',
            source: order.source,
            prep: order.prep_time_min ? `${order.prep_time_min} min` : "--",
            delivery: order.delivery_time_min ? `${order.delivery_time_min} min` : "--",
            rawStatus: (order.status || '').toLowerCase(),
            rawPayment: (order.payment_method != null
                ? String(order.payment_method)
                : order.payment != null
                  ? String(order.payment)
                  : ""
            ).toLowerCase(),
        }));
    }, [reportData]);

    const filteredRecentOrders = useMemo(() => {
        return recentOrders.filter((row) => recentOrderRowMatchesFilter(row, recentOrdersFilterApplied));
    }, [recentOrders, recentOrdersFilterApplied]);

    const openRecentOrderFilters = () => {
        setRecentOrdersFilterDraft({
            orderStatus: { ...recentOrdersFilterApplied.orderStatus },
            orderSource: { ...recentOrdersFilterApplied.orderSource },
            payment: { ...recentOrdersFilterApplied.payment },
        });
        setIsFilterModalOpen(true);
    };

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Top — matches Sales Report pattern; labels + #E8E8E8 controls per design */}
            <div className="mb-4 rounded-[16px] border border-[#00000033] bg-[#FFFFFF] p-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-3 inline-flex items-center gap-1 text-[14px] text-[#6B7280] transition-colors hover:text-primary"
                >
                    <ChevronLeft className="h-4 w-4 shrink-0" />
                    Back to Reports
                </button>
                <div className="mb-6 min-w-0">
                    <h1 className="mb-1 font-sans text-[28px] font-bold leading-[33.6px] text-[#0F1724]">Order Reports</h1>
                    <p className="text-[14px] text-[#6B7280]">Analyze order volumes, sources, and fulfillment times.</p>
                </div>
                <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:gap-2.5">
                    <div className="w-full min-w-0 flex-1 lg:min-w-0">
                        <span className="mb-1.5 block font-sans text-[13px] font-medium leading-[19.5px] tracking-normal text-[#1A1A1A]">
                            Order Type
                        </span>
                        <ReportsFilterSelect
                            value={filterDraft.orderType}
                            onValueChange={(v) => setFilterDraft((prev) => ({ ...prev, orderType: v }))}
                            options={ORDER_TYPE_FILTER_OPTIONS}
                            ariaLabel="Order type"
                            borderClassName="border-[#E8E8E8]"
                            containerClassName="relative w-full min-w-0"
                        />
                    </div>
                    <div className="w-full min-w-0 flex-1 lg:min-w-0">
                        <span className="mb-1.5 block font-sans text-[13px] font-medium leading-[19.5px] tracking-normal text-[#1A1A1A]">
                            Payment Method
                        </span>
                        <ReportsFilterSelect
                            value={filterDraft.paymentMethod}
                            onValueChange={(v) => setFilterDraft((prev) => ({ ...prev, paymentMethod: v }))}
                            options={ORDER_PAYMENT_FILTER_OPTIONS}
                            ariaLabel="Payment method"
                            borderClassName="border-[#E8E8E8]"
                            containerClassName="relative w-full min-w-0"
                        />
                    </div>
                    <div className="w-full min-w-0 flex-1 lg:min-w-0">
                        <span className="mb-1.5 block font-sans text-[13px] font-medium leading-[19.5px] tracking-normal text-[#1A1A1A]">
                            Date Range
                        </span>
                        <ReportsFilterSelect
                            value={filterDraft.dateRange}
                            onValueChange={(v) => setFilterDraft((prev) => ({ ...prev, dateRange: v }))}
                            options={DATE_RANGE_OPTIONS}
                            ariaLabel="Date range"
                            borderClassName="border-[#E8E8E8]"
                            containerClassName="relative w-full min-w-0"
                            leftAdornment={
                                <Calendar className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} aria-hidden />
                            }
                        />
                    </div>
                    <div className="flex w-full min-w-0 shrink-0 justify-stretch sm:w-[150px] sm:justify-start">
                        <button
                            type="button"
                            onClick={() =>
                                onApplyFilters?.({
                                    orderType: filterDraft.orderType,
                                    paymentMethod: filterDraft.paymentMethod,
                                    dateRange: filterDraft.dateRange,
                                })
                            }
                            disabled={loading}
                            className="box-border flex h-12 min-h-[48px] w-full max-w-full items-center justify-center rounded-lg bg-primary px-4 text-center font-sans text-[14px] font-normal leading-[21px] text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Loading…' : 'Apply Filters'}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-3 rounded-[10px] border border-red-200 bg-red-50 p-4 text-[14px] text-red-700">
                    {error}
                </div>
            )}

            {/* Quick Stats */}
            <div className="mb-8 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
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
                    <h2 className="font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                        Orders by Source
                    </h2>
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

            {/* Recent Orders table */}
            <div className="mb-0 overflow-hidden h-[415px] rounded-[16px] border border-[#00000033] bg-[#FFFFFF] shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] p-5 pb-3">
                    <h2 className="min-w-0 font-sans text-[18px] font-bold leading-[21.6px] tracking-normal text-[#0F1724]">
                        Recent Orders
                    </h2>
                    <button
                        type="button"
                        onClick={openRecentOrderFilters}
                        className="box-border inline-flex h-[38.33px] min-w-[97.58px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[#E8E8E8] bg-white pl-4 pr-3 text-center font-sans text-[14px] font-normal leading-[21px] tracking-[0] text-[#374151] transition hover:bg-gray-50"
                    >
                        <Filter
                            className="h-4 w-4 shrink-0 text-[#374151]"
                            strokeWidth={1.75}
                            aria-hidden
                        />
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
                            ) : filteredRecentOrders.length > 0 ? (
                                filteredRecentOrders.map((order, idx) => (
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
                                        {recentOrders.length > 0
                                            ? 'No orders match the selected filters.'
                                            : 'No orders found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:w-auto">
                    <button
                        type="button"
                        onClick={onExportCsv}
                        className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-[#E8E8E8] bg-transparent px-4 font-sans text-[14px] font-normal leading-[21px] text-[#374151] transition hover:bg-gray-50 min-[400px]:w-auto"
                    >
                        <Download className="h-4 w-4 shrink-0 text-[#374151]" strokeWidth={1.75} aria-hidden />
                        Export CSV
                    </button>
                    <button
                        type="button"
                        onClick={onExportPdf}
                        disabled={pdfExporting}
                        className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-[#E8E8E8] bg-transparent px-4 font-sans text-[14px] font-normal leading-[21px] text-[#374151] transition hover:bg-gray-50 min-[400px]:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Download className="h-4 w-4 shrink-0 text-[#374151]" strokeWidth={1.75} aria-hidden />
                        {pdfExporting ? 'Exporting…' : 'Export PDF'}
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-sans text-[14px] font-normal leading-[21px] text-white shadow-sm transition hover:bg-primary/90 sm:w-auto"
                >
                    <Calendar className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                    Schedule Monthly Report
                </button>
            </div>

            <RecentOrdersFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                draft={recentOrdersFilterDraft}
                onChange={setRecentOrdersFilterDraft}
                onReset={() =>
                    setRecentOrdersFilterDraft({ ...RECENT_ORDERS_FILTER_DEFAULTS })
                }
                onApply={() => {
                    setRecentOrdersFilterApplied({
                        orderStatus: { ...recentOrdersFilterDraft.orderStatus },
                        orderSource: { ...recentOrdersFilterDraft.orderSource },
                        payment: { ...recentOrdersFilterDraft.payment },
                    });
                    setIsFilterModalOpen(false);
                }}
            />
            <ScheduleReportModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
            />
        </div>
    );
};

export default OrderReports;
