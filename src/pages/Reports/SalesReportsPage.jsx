import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChevronLeft, DollarSign, ShoppingCart, Receipt, Wallet, Percent, Download, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const REPORTS_API_BASE = 'https://api.baaie.com';
const PDF_PRIMARY = [43, 178, 156]; // #2BB29C

const formatCurrency = (val) => (val != null ? `$${Number(val).toLocaleString()}` : '--');

function buildSalesReportPdf(data) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(...PDF_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.text('Sales Report', pageW / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    if (data.restaurant_name) doc.text(data.restaurant_name, pageW / 2, y, { align: 'center' });
    y += 6;
    if (data.date_range_label) doc.text(data.date_range_label, pageW / 2, y, { align: 'center' });
    y += 6;
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageW / 2, y, { align: 'center' });
    y += 16;

    // Summary stats table
    const stats = data.stats;
    if (stats) {
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, y);
        y += 8;

        const statRows = [
            ['Total Sales', formatCurrency(stats.total_sales), 'Orders Count', (stats.orders_count ?? '--').toString()],
            ['Avg Order Value', formatCurrency(stats.avg_order_value), 'Refunds', formatCurrency(stats.refunds)],
            ['Net Earnings', formatCurrency(stats.net_earnings), 'Commission', formatCurrency(stats.commission)],
        ];
        autoTable(doc, {
            startY: y,
            head: [['Metric', 'Value', 'Metric', 'Value']],
            body: statRows,
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 10 },
            columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 45 }, 2: { cellWidth: 45 }, 3: { cellWidth: 45 } },
            margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 14;
    }

    // Sales trend
    const trend = data.sales_trend || [];
    if (trend.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'bold');
        doc.text('Sales Trend', 14, y);
        y += 8;
        autoTable(doc, {
            startY: y,
            head: [['Date', 'Sales', 'Orders']],
            body: trend.map((r) => [r.label || r.date || '--', formatCurrency(r.sales), (r.orders ?? '--').toString()]),
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 10 },
            margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 14;
    }

    // Daily breakdown
    const daily = data.daily_breakdown || [];
    if (daily.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'bold');
        doc.text('Daily Breakdown', 14, y);
        y += 8;
        autoTable(doc, {
            startY: y,
            head: [['Date', 'Orders', 'Sales', 'Refunds', 'Net Revenue']],
            body: daily.map((r) => [
                r.label || r.date || '--',
                (r.orders ?? '--').toString(),
                formatCurrency(r.sales),
                formatCurrency(r.refunds),
                formatCurrency(r.net_revenue),
            ]),
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            margin: { left: 14, right: 14 },
        });
    }

    return doc;
}

const SalesReportsPage = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pdfDownloading, setPdfDownloading] = useState(false);
    const [csvDownloading, setCsvDownloading] = useState(false);
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const getRestaurantId = useCallback(() => {
        const fromUser = user && typeof user === 'object' && typeof user.restaurant_id === 'string' ? user.restaurant_id : '';
        let fromStorage = '';
        try {
            fromStorage = localStorage.getItem('restaurant_id') || '';
        } catch {
            fromStorage = '';
        }
        return fromUser || fromStorage;
    }, [user]);

    const fetchSalesReport = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
            const restaurantId = getRestaurantId();
            const url = `${baseUrl}/api/v1/reports/sales-report`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const data = await res.json();
            if (data.code === 'SUCCESS_200' && data.data) {
                setReportData(data.data);
            } else {
                setError(data.message || 'Failed to load sales report');
            }
        } catch (err) {
            console.error('Error fetching sales report:', err);
            setError(err.message || 'Failed to load sales report');
        } finally {
            setLoading(false);
        }
    }, [accessToken, getRestaurantId]);

    useEffect(() => {
        fetchSalesReport();
    }, [fetchSalesReport]);

    const handleExportPdf = useCallback(() => {
        if (!reportData) return;
        try {
            setPdfDownloading(true);
            const doc = buildSalesReportPdf(reportData);
            doc.save(`sales-report-${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error('Sales report PDF export error:', err);
        } finally {
            setPdfDownloading(false);
        }
    }, [reportData]);

    const handleExportCsv = useCallback(async () => {
        try {
            setCsvDownloading(true);
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
            const restaurantId = getRestaurantId();
            const url = `${baseUrl}/api/v1/reports/sales-report/export/csv`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('text/csv')) {
                const text = await res.text();
                const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            } else if (contentType.includes('application/json')) {
                const data = await res.json();
                console.log('Sales report CSV export response:', data);
            } else {
                const text = await res.text();
                console.log('Sales report CSV export response:', { status: res.status, contentType, data: text });
            }
        } catch (err) {
            console.error('Sales report CSV export error:', err);
        } finally {
            setCsvDownloading(false);
        }
    }, [accessToken, getRestaurantId]);

    const stats = reportData?.stats
        ? [
            { label: 'Total Sales', value: formatCurrency(reportData.stats.total_sales), icon: DollarSign },
            { label: 'Orders Count', value: reportData.stats.orders_count?.toLocaleString() ?? '--', icon: ShoppingCart },
            { label: 'Avg Order Value', value: formatCurrency(reportData.stats.avg_order_value), icon: Receipt },
            { label: 'Refunds', value: formatCurrency(reportData.stats.refunds), icon: Receipt },
            { label: 'Net Earnings', value: formatCurrency(reportData.stats.net_earnings), icon: Wallet },
            { label: 'Commission', value: formatCurrency(reportData.stats.commission), icon: Percent },
        ]
        : [];

    const salesTrend = reportData?.sales_trend || [];
    const dailyBreakdown = reportData?.daily_breakdown || [];

    return (
        <div className="max-w-[1600px] mx-auto pb-12">
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 pb-12">
                <div className="bg-[#FFFFFF] border border-[#00000033] rounded-[16px] p-6 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <button
                                onClick={() => navigate('/reports')}
                                className="flex items-center gap-2 text-[14px] text-[#6B7280] hover:text-primary transition-colors mb-4"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back to Reports
                            </button>
                            <h1 className="text-[28px] font-bold text-[#111827] mb-1">Sales Reports</h1>
                            <p className="text-[14px] text-[#6B7280]">Track revenue, order values, and sales trends over time.</p>
                            {reportData?.restaurant_name && (
                                <p className="text-[13px] text-[#6B7280] mt-1 font-medium">{reportData.restaurant_name}</p>
                            )}
                            {reportData?.date_range_label && (
                                <p className="text-[13px] text-[#6B7280] mt-0.5">{reportData.date_range_label}</p>
                            )}
                        </div>
                        {reportData && (
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleExportPdf}
                                    disabled={pdfDownloading}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] border border-[#E8E8E8] text-[14px] font-medium text-[#6B7280] hover:bg-gray-50 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    title="Download PDF"
                                >
                                    <Download className="w-5 h-5" />
                                    Download PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportCsv}
                                    disabled={csvDownloading}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] border border-[#E8E8E8] text-[14px] font-medium text-[#6B7280] hover:bg-gray-50 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    title="Download CSV"
                                >
                                    <FileSpreadsheet className="w-5 h-5" />
                                    Download CSV
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="bg-white border border-[#00000033] rounded-[16px] p-8 text-center text-gray-500">
                        Loading...
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[10px] text-[14px] text-red-700">
                        {error}
                    </div>
                )}
                {!loading && !error && reportData && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            {stats.map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={i} className="bg-white border border-[#00000033] rounded-[12px] p-5">
                                        <div className="flex items-center gap-2 text-[#6B7280] text-[14px] mb-1">
                                            {Icon && <Icon className="w-4 h-4" />}
                                            {stat.label}
                                        </div>
                                        <p className="text-[20px] font-bold text-[#111827]">{stat.value}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Sales Trend Chart */}
                        {salesTrend.length > 0 && (
                            <div className="bg-[#FFFFFF] border border-[#00000033] rounded-[16px] p-6 mb-8">
                                <h2 className="text-[18px] font-bold text-[#111827] mb-6">Sales Trend</h2>
                                <div className="h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salesTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `$${v}`} />
                                            <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Sales']} cursor={{ fill: '#F9FAFB' }} />
                                            <Bar dataKey="sales" fill="#2BB29C" radius={[4, 4, 0, 0]} name="Sales" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Daily Breakdown Table */}
                        <div className="bg-[#FFFFFF] border border-[#00000033] rounded-[16px] overflow-hidden">
                            <h2 className="text-[18px] font-bold text-[#111827] p-6 pb-4">Daily Breakdown</h2>
                            {dailyBreakdown.length === 0 ? (
                                <div className="p-8 text-center text-[#6B7280] text-[14px]">No daily breakdown data.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-[#E5E7EB] bg-gray-50/80">
                                                <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Date</th>
                                                <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Orders</th>
                                                <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Sales</th>
                                                <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Refunds</th>
                                                <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Net Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dailyBreakdown.map((row) => (
                                                <tr key={row.date} className="border-b border-[#E5E7EB] hover:bg-gray-50/50">
                                                    <td className="px-5 py-3 text-[14px] text-[#111827]">{row.label ?? row.date ?? '--'}</td>
                                                    <td className="px-5 py-3 text-[14px] text-[#6B7280]">{row.orders?.toLocaleString() ?? '--'}</td>
                                                    <td className="px-5 py-3 text-[14px] font-medium text-[#111827]">{formatCurrency(row.sales)}</td>
                                                    <td className="px-5 py-3 text-[14px] text-[#6B7280]">{formatCurrency(row.refunds)}</td>
                                                    <td className="px-5 py-3 text-[14px] font-medium text-[#111827]">{formatCurrency(row.net_revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SalesReportsPage;
