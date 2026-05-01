import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, Calendar, Download, Filter, X, Check } from 'lucide-react';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ScheduleReportModal from '../../components/Reports/ScheduleReportModal';
import { ReportsFilterSelect } from '../../components/Reports/ReportsFilterSelect';
import { DATE_RANGE_OPTIONS } from '../../components/Reports/reportsFilterConstants';
import { buildSalesReportQuery, buildSalesReportBreakdownQuery, DEFAULT_SALES_FILTERS } from '../../utils/salesReportPdf';

const REPORTS_API_BASE = 'https://api.baaie.com';

/** Parse `filename` / `filename*` from Content-Disposition for CSV export. */
function parseFilenameFromContentDisposition(header) {
    if (!header || typeof header !== 'string') return null;
    const star = /filename\*=UTF-8''([^;\n]+)/i.exec(header);
    if (star) {
        try {
            return decodeURIComponent(star[1].trim().replace(/^["']|["']$/g, ''));
        } catch {
            return star[1];
        }
    }
    const quoted = /filename\s*=\s*"([^"]+)"/i.exec(header);
    if (quoted) return quoted[1];
    const plain = /filename\s*=\s*([^;\n]+)/i.exec(header);
    if (plain) return plain[1].trim().replace(/^["']|["']$/g, '');
    return null;
}

function triggerCsvFileDownload(csvText, downloadName) {
    const name = (downloadName || 'sales-report').replace(/[/\\]/g, '');
    const finalName = /\.csv$/i.test(name) ? name : `${name}.csv`;
    const blob = new Blob(['\uFEFF', csvText], { type: 'text/csv;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = finalName;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(blobUrl);
    }, 250);
}

function triggerPdfFileDownload(blob, downloadName) {
    const name = (downloadName || 'sales-report').replace(/[/\\]/g, '');
    const finalName = /\.pdf$/i.test(name) ? name : `${name}.pdf`;
    const pdfBlob =
        blob.type && blob.type.includes('pdf')
            ? blob
            : new Blob([blob], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = finalName;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(blobUrl);
    }, 250);
}

const SERVICE_TYPE_OPTIONS = [
    { value: 'delivery', label: 'Delivery' },
    { value: 'pickup', label: 'Pickup' },
    { value: 'dine_in', label: 'Dine-in' },
    { value: 'all', label: 'All' },
];

const PAYMENT_OPTIONS = [
    { value: 'card', label: 'Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'all', label: 'All' },
];

const SALES_TREND_GRANULARITY_OPTIONS = [
    { granularity: 'day', label: 'Daily' },
    { granularity: 'week', label: 'Weekly' },
    { granularity: 'month', label: 'Monthly' },
];

const TREND_GRADIENT_ID = 'salesTrendAreaFill';

const DAILY_BREAKDOWN_FILTER_DEFAULTS = {
    orderStatus: { all: true, completed: false, cancelled: false, refunded: false },
    payment: { all: true, card: false, cash: false, contactless: false },
};

function DailyBreakdownFiltersModal({ isOpen, onClose, draft, onChange, onReset, onApply }) {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const orderRows = [
        { key: 'all', label: 'All' },
        { key: 'completed', label: 'Completed' },
        { key: 'cancelled', label: 'Cancelled' },
        { key: 'refunded', label: 'Refunded' },
    ];
    const payRows = [
        { key: 'all', label: 'All' },
        { key: 'card', label: 'Card' },
        { key: 'cash', label: 'Cash' },
        { key: 'contactless', label: 'Contactless' },
    ];

    const toggleOrder = (k) => {
        onChange((prev) => {
            const next = { ...prev.orderStatus, [k]: !prev.orderStatus[k] };
            if (k === 'all' && next.all) {
                return { ...prev, orderStatus: { all: true, completed: false, cancelled: false, refunded: false } };
            }
            if (k !== 'all' && next[k]) {
                return { ...prev, orderStatus: { ...next, all: false } };
            }
            const hasSpecific = next.completed || next.cancelled || next.refunded;
            if (!next.all && !hasSpecific) {
                return { ...prev, orderStatus: { all: true, completed: false, cancelled: false, refunded: false } };
            }
            if (hasSpecific) {
                return { ...prev, orderStatus: { ...next, all: false } };
            }
            return { ...prev, orderStatus: { all: true, completed: false, cancelled: false, refunded: false } };
        });
    };

    const togglePay = (k) => {
        onChange((prev) => {
            const next = { ...prev.payment, [k]: !prev.payment[k] };
            if (k === 'all' && next.all) {
                return { ...prev, payment: { all: true, card: false, cash: false, contactless: false } };
            }
            if (k !== 'all' && next[k]) {
                return { ...prev, payment: { ...next, all: false } };
            }
            const hasSpecific = next.card || next.cash || next.contactless;
            if (!next.all && !hasSpecific) {
                return { ...prev, payment: { all: true, card: false, cash: false, contactless: false } };
            }
            if (hasSpecific) {
                return { ...prev, payment: { ...next, all: false } };
            }
            return { ...prev, payment: { all: true, card: false, cash: false, contactless: false } };
        });
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-filters-title"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                    <h2 id="daily-filters-title" className="text-[16px] font-bold text-[#0F1724]">
                        Filters
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto px-5 py-5 custom-scrollbar">
                    <div>
                        <p className="mb-3 font-sans text-[13px] font-medium leading-[19.5px] tracking-normal text-[#1A1A1A]">Order Status</p>
                        <ul className="space-y-2.5">
                            {orderRows.map((row) => {
                                const checked = draft.orderStatus[row.key];
                                return (
                                    <li key={row.key}>
                                        <label className="flex cursor-pointer items-center gap-2.5">
                                            <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleOrder(row.key)}
                                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-primary bg-white focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 checked:border-primary checked:bg-primary"
                                                />
                                                {checked && (
                                                    <Check
                                                        className="pointer-events-none absolute h-2.5 w-2.5 text-white"
                                                        strokeWidth={3.5}
                                                        aria-hidden
                                                    />
                                                )}
                                            </span>
                                            <span className="text-[14px] text-[#111827]">{row.label}</span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="mt-6">
                        <p className="mb-3 font-sans text-[13px] font-medium leading-[19.5px] tracking-normal text-[#1A1A1A]">Payment Method</p>
                        <ul className="space-y-2.5">
                            {payRows.map((row) => {
                                const checked = draft.payment[row.key];
                                return (
                                    <li key={row.key}>
                                        <label className="flex cursor-pointer items-center gap-2.5">
                                            <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => togglePay(row.key)}
                                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-primary bg-white focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 checked:border-primary checked:bg-primary"
                                                />
                                                {checked && (
                                                    <Check
                                                        className="pointer-events-none absolute h-2.5 w-2.5 text-white"
                                                        strokeWidth={3.5}
                                                        aria-hidden
                                                    />
                                                )}
                                            </span>
                                            <span className="text-[14px] text-[#111827]">{row.label}</span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col gap-2 border-t border-[#E5E7EB] p-4 sm:flex-row sm:items-center sm:justify-stretch sm:gap-3">
                    <button
                        type="button"
                        onClick={onReset}
                        className="h-10 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[14px] font-[500] text-[#0F1724] transition hover:bg-gray-50"
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={onApply}
                        className="h-10 flex-1 rounded-lg bg-primary px-4 text-[14px] font-[600] text-white transition hover:bg-primary/90"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}

const formatCurrency = (val) => (val != null ? `$${Number(val).toLocaleString()}` : '--');

const SalesReportsPage = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pdfDownloading, setPdfDownloading] = useState(false);
    const [csvDownloading, setCsvDownloading] = useState(false);
    const [filters, setFilters] = useState(() => ({ ...DEFAULT_SALES_FILTERS }));
    const [exportQuery, setExportQuery] = useState(() => buildSalesReportQuery(DEFAULT_SALES_FILTERS));
    const [salesTrendGranularity, setSalesTrendGranularity] = useState('day');
    const [salesTrendRows, setSalesTrendRows] = useState([]);
    const [salesTrendDateRangeLabel, setSalesTrendDateRangeLabel] = useState('');
    const [salesTrendLoading, setSalesTrendLoading] = useState(false);
    const [salesTrendError, setSalesTrendError] = useState(null);
    const [dailyBreakdownFiltersOpen, setDailyBreakdownFiltersOpen] = useState(false);
    const [dailyBreakdownFilterDraft, setDailyBreakdownFilterDraft] = useState(() => ({
        orderStatus: { ...DAILY_BREAKDOWN_FILTER_DEFAULTS.orderStatus },
        payment: { ...DAILY_BREAKDOWN_FILTER_DEFAULTS.payment },
    }));
    const [dailyBreakdownFilterApplied, setDailyBreakdownFilterApplied] = useState(() => ({
        orderStatus: { ...DAILY_BREAKDOWN_FILTER_DEFAULTS.orderStatus },
        payment: { ...DAILY_BREAKDOWN_FILTER_DEFAULTS.payment },
    }));
    const [lastAppliedSalesFilters, setLastAppliedSalesFilters] = useState(() => ({ ...DEFAULT_SALES_FILTERS }));
    const [breakdownDailyRows, setBreakdownDailyRows] = useState([]);
    const [breakdownDateRangeLabel, setBreakdownDateRangeLabel] = useState('');
    const [breakdownLoading, setBreakdownLoading] = useState(false);
    const [breakdownError, setBreakdownError] = useState(null);
    const [scheduleReportOpen, setScheduleReportOpen] = useState(false);
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

    const fetchSalesReport = useCallback(
        async (filterSet) => {
            const f = filterSet || DEFAULT_SALES_FILTERS;
            const query = buildSalesReportQuery(f);
            try {
                setLoading(true);
                setError(null);
                const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
                const restaurantId = getRestaurantId();
                const url = `${baseUrl}/api/v1/reports/sales-report?${query}`;
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
                    setLastAppliedSalesFilters({ ...f });
                    setReportData(data.data);
                    setExportQuery(query);
                } else {
                    setError(data.message || 'Failed to load sales report');
                }
            } catch (err) {
                console.error('Error fetching sales report:', err);
                setError(err.message || 'Failed to load sales report');
            } finally {
                setLoading(false);
            }
        },
        [accessToken, getRestaurantId]
    );

    const fetchSalesTrends = useCallback(async () => {
        if (!accessToken) return;
        const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
        const restaurantId = getRestaurantId();
        const params = new URLSearchParams({ granularity: salesTrendGranularity });
        const url = `${baseUrl}/api/v1/reports/sales-trends?${params.toString()}`;
        setSalesTrendLoading(true);
        setSalesTrendError(null);
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const ct = res.headers.get('content-type') || '';
            const data = ct.includes('application/json') ? await res.json() : null;
            if (!res.ok) {
                setSalesTrendRows([]);
                setSalesTrendDateRangeLabel('');
                setSalesTrendError(data?.message || `Sales trends request failed (${res.status})`);
                return;
            }
            if (data?.code === 'SUCCESS_200' && data.data) {
                const list = Array.isArray(data.data.sales_trend) ? data.data.sales_trend : [];
                setSalesTrendRows(
                    list.map((item) => ({
                        label: typeof item.label === 'string' ? item.label : String(item.date || ''),
                        value: typeof item.sales === 'number' ? item.sales : Number(item.sales) || 0,
                        orders: typeof item.orders === 'number' ? item.orders : Number(item.orders) || 0,
                        date: item.date,
                    })),
                );
                setSalesTrendDateRangeLabel(
                    typeof data.data.date_range_label === 'string' ? data.data.date_range_label : '',
                );
            } else {
                setSalesTrendRows([]);
                setSalesTrendDateRangeLabel('');
                setSalesTrendError(data?.message || 'Failed to load sales trend');
            }
        } catch (err) {
            setSalesTrendRows([]);
            setSalesTrendDateRangeLabel('');
            setSalesTrendError(err?.message || 'Failed to load sales trend');
        } finally {
            setSalesTrendLoading(false);
        }
    }, [accessToken, getRestaurantId, salesTrendGranularity]);

    const fetchSalesReportBreakdown = useCallback(async () => {
        if (!accessToken) return;
        const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
        const restaurantId = getRestaurantId();
        const query = buildSalesReportBreakdownQuery(lastAppliedSalesFilters, dailyBreakdownFilterApplied);
        const url = `${baseUrl}/api/v1/reports/sales-report/breakdown?${query}`;
        setBreakdownLoading(true);
        setBreakdownError(null);
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const ct = res.headers.get('content-type') || '';
            const data = ct.includes('application/json') ? await res.json() : null;
            if (!res.ok) {
                setBreakdownDailyRows([]);
                setBreakdownDateRangeLabel('');
                setBreakdownError(data?.message || `Breakdown request failed (${res.status})`);
                return;
            }
            if (data?.code === 'SUCCESS_200' && data.data) {
                const list = Array.isArray(data.data.daily_breakdown) ? data.data.daily_breakdown : [];
                setBreakdownDailyRows(list);
                setBreakdownDateRangeLabel(
                    typeof data.data.date_range_label === 'string' ? data.data.date_range_label : '',
                );
            } else {
                setBreakdownDailyRows([]);
                setBreakdownDateRangeLabel('');
                setBreakdownError(data?.message || 'Failed to load daily breakdown');
            }
        } catch (err) {
            setBreakdownDailyRows([]);
            setBreakdownDateRangeLabel('');
            setBreakdownError(err?.message || 'Failed to load daily breakdown');
        } finally {
            setBreakdownLoading(false);
        }
    }, [accessToken, getRestaurantId, lastAppliedSalesFilters, dailyBreakdownFilterApplied]);

    useEffect(() => {
        fetchSalesTrends();
    }, [fetchSalesTrends]);

    useEffect(() => {
        fetchSalesReportBreakdown();
    }, [fetchSalesReportBreakdown]);

    const trendYAxisDomain = useMemo(() => {
        const vals = salesTrendRows.map((r) => r.value);
        const max = Math.max(1, ...vals);
        const top = Math.ceil(max * 1.1);
        return [0, top];
    }, [salesTrendRows]);

    const renderSalesTrendTooltip = useCallback(({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const row = payload[0].payload;
        return (
            <div className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] shadow-md">
                <p className="mb-1 font-semibold text-[#111827]">{label}</p>
                <p className="text-[#374151]">Sales: {formatCurrency(row.value)}</p>
                <p className="text-[#6B7280]">Orders: {row.orders != null ? Number(row.orders).toLocaleString() : '—'}</p>
            </div>
        );
    }, []);

    useEffect(() => {
        fetchSalesReport(DEFAULT_SALES_FILTERS);
    }, [fetchSalesReport]);

    const handleApplyFilters = () => {
        fetchSalesReport(filters);
    };

    const handleExportPdf = useCallback(async () => {
        if (!reportData) return;
        try {
            setPdfDownloading(true);
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
            const restaurantId = getRestaurantId();
            const q = exportQuery || buildSalesReportQuery(DEFAULT_SALES_FILTERS);
            const url = `${baseUrl}/api/v1/reports/sales-report/export/pdf?${q}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            const cd = res.headers.get('content-disposition');

            if (!res.ok) {
                const errText = await res.text();
                let message = `PDF export failed (${res.status})`;
                if (ct.includes('application/json')) {
                    try {
                        const j = JSON.parse(errText);
                        if (typeof j.message === 'string') message = j.message;
                    } catch {
                        /* ignore */
                    }
                }
                console.error('[sales-report/export/pdf]', message, errText.slice(0, 400));
                return;
            }

            if (ct.includes('application/json')) {
                try {
                    const data = await res.json();
                    console.error('[sales-report/export/pdf]', data?.message || 'Unexpected JSON body', data);
                } catch {
                    console.error('[sales-report/export/pdf] Invalid JSON body');
                }
                return;
            }

            if (
                ct.includes('application/pdf') ||
                ct.includes('/pdf') ||
                ct.includes('application/octet-stream')
            ) {
                const blob = await res.blob();
                const defaultName = `sales-report-${new Date().toISOString().slice(0, 10)}.pdf`;
                const fromHeader = parseFilenameFromContentDisposition(cd);
                const filename =
                    fromHeader && fromHeader.trim().length > 0 ? fromHeader.trim() : defaultName;
                triggerPdfFileDownload(blob, filename);
                return;
            }

            const text = await res.text();
            console.error('[sales-report/export/pdf] Unknown content-type', ct, text.slice(0, 400));
        } catch (err) {
            console.error('[sales-report/export/pdf]', err);
        } finally {
            setPdfDownloading(false);
        }
    }, [accessToken, getRestaurantId, exportQuery, reportData]);

    const handleExportCsv = useCallback(async () => {
        try {
            setCsvDownloading(true);
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
            const restaurantId = getRestaurantId();
            const q = exportQuery || buildSalesReportQuery(DEFAULT_SALES_FILTERS);
            const url = `${baseUrl}/api/v1/reports/sales-report/export/csv?${q}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const text = await res.text();
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            const cd = res.headers.get('content-disposition');

            if (!res.ok) {
                let message = `CSV export failed (${res.status})`;
                if (ct.includes('application/json')) {
                    try {
                        const j = JSON.parse(text);
                        if (typeof j.message === 'string') message = j.message;
                    } catch {
                        /* ignore */
                    }
                }
                console.error('[sales-report/export/csv]', message, text.slice(0, 400));
                return;
            }

            if (ct.includes('application/json') || text.trimStart().startsWith('{')) {
                try {
                    const data = JSON.parse(text);
                    console.error('[sales-report/export/csv]', data?.message || 'Unexpected JSON body', data);
                } catch {
                    console.error('[sales-report/export/csv] Unexpected body', text.slice(0, 400));
                }
                return;
            }

            const defaultName = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
            const fromHeader = parseFilenameFromContentDisposition(cd);
            const filename = fromHeader && fromHeader.trim().length > 0 ? fromHeader.trim() : defaultName;

            const treatAsCsv =
                ct.includes('text/csv') ||
                ct.includes('application/csv') ||
                ct.includes('csv') ||
                ct.includes('text/plain') ||
                ct.length === 0;

            if (treatAsCsv) {
                triggerCsvFileDownload(text, filename);
            } else {
                console.error('[sales-report/export/csv] Unknown content-type, not downloading', { contentType: ct });
            }
        } catch (err) {
            console.error('[sales-report/export/csv]', err);
        } finally {
            setCsvDownloading(false);
        }
    }, [accessToken, getRestaurantId, exportQuery]);

    const stats = reportData?.stats
        ? [
            { label: 'Total Sales', value: formatCurrency(reportData.stats.total_sales) },
            { label: 'Orders Count', value: reportData.stats.orders_count?.toLocaleString() ?? '--' },
            { label: 'Avg Order Value', value: formatCurrency(reportData.stats.avg_order_value) },
            { label: 'Refunds', value: formatCurrency(reportData.stats.refunds) },
            { label: 'Net Earnings', value: formatCurrency(reportData.stats.net_earnings) },
            { label: 'Commission', value: formatCurrency(reportData.stats.commission) },
        ]
        : [];

    const openDailyBreakdownFilters = () => {
        setDailyBreakdownFilterDraft({
            orderStatus: { ...dailyBreakdownFilterApplied.orderStatus },
            payment: { ...dailyBreakdownFilterApplied.payment },
        });
        setDailyBreakdownFiltersOpen(true);
    };

    return (
        <div className="max-w-[1600px] mx-auto">
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="mb-4 rounded-[16px] border border-[#00000033] bg-[#FFFFFF] p-6">
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <button
                                type="button"
                                onClick={() => navigate('/reports')}
                                className="inline-flex items-center gap-1 text-[14px] text-[#6B7280] hover:text-primary transition-colors mb-3"
                            >
                                <ChevronLeft className="h-4 w-4 shrink-0" />
                                Back to Reports
                            </button>
                            <h1 className="font-sans text-[28px] font-bold leading-[33.6px] tracking-normal text-[#0F1724] mb-1">
                                Sales Report
                            </h1>
                            <p className="text-[14px] text-[#6B7280]">Detailed breakdown of sales performance.</p>
                        </div>
                    </div>

                    {/* Filters — custom control: border #00000033, 48px height, down/up chevron */}
                    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch lg:gap-2.5">
                        <div className="w-full min-w-0 flex-1 lg:min-w-0">
                            <ReportsFilterSelect
                                value={filters.serviceType}
                                onValueChange={(v) => setFilters((prev) => ({ ...prev, serviceType: v }))}
                                options={SERVICE_TYPE_OPTIONS}
                                ariaLabel="Service type"
                                containerClassName="relative w-full min-w-0"
                            />
                        </div>
                        <div className="w-full min-w-0 flex-1 lg:min-w-0">
                            <ReportsFilterSelect
                                value={filters.paymentMethod}
                                onValueChange={(v) => setFilters((prev) => ({ ...prev, paymentMethod: v }))}
                                options={PAYMENT_OPTIONS}
                                ariaLabel="Payment method"
                                containerClassName="relative w-full min-w-0"
                            />
                        </div>
                        <div className="w-full min-w-0 flex-1 lg:min-w-0">
                            <ReportsFilterSelect
                                value={filters.dateRange}
                                onValueChange={(v) => setFilters((prev) => ({ ...prev, dateRange: v }))}
                                options={DATE_RANGE_OPTIONS}
                                ariaLabel="Date range"
                                containerClassName="relative w-full min-w-0"
                                leftAdornment={
                                    <Calendar
                                        className="h-4 w-4 shrink-0 text-gray-500"
                                        strokeWidth={1.75}
                                        aria-hidden
                                    />
                                }
                            />
                        </div>
                        <div className="flex w-full min-w-0 shrink-0 justify-stretch sm:w-[114.265625px] sm:justify-start">
                            <button
                                type="button"
                                onClick={handleApplyFilters}
                                className="box-border flex h-12 min-h-[48px] w-full max-w-full sm:w-[114.265625px] sm:shrink-0 items-center justify-center rounded-lg bg-[#DD2F2626] px-2 text-center font-sans text-[14px] font-normal leading-[21px] tracking-normal text-[#141416] transition hover:bg-[#DD2F2640] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                {accessToken && (
                    <div className="mb-4 flex flex-col rounded-[16px] border border-[#00000033] bg-[#FFFFFF] p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <h2 className="text-[18px] font-bold text-[#111827]">Sales Trend</h2>
                                {salesTrendDateRangeLabel ? (
                                    <p className="mt-1 text-[13px] text-[#6B7280]">{salesTrendDateRangeLabel}</p>
                                ) : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {SALES_TREND_GRANULARITY_OPTIONS.map((o) => (
                                    <button
                                        key={o.granularity}
                                        type="button"
                                        onClick={() => setSalesTrendGranularity(o.granularity)}
                                        className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition ${
                                            salesTrendGranularity === o.granularity
                                                ? 'bg-[#DD2F26] text-white shadow-sm'
                                                : 'bg-gray-100 text-[#4B5563] hover:bg-gray-200/80'
                                        }`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {salesTrendError && (
                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                                {salesTrendError}
                            </div>
                        )}
                        <div className="mt-[15px] h-[300px] w-full min-w-0 sm:h-[320px]">
                            {salesTrendLoading ? (
                                <div className="flex h-full items-center justify-center text-[14px] text-[#6B7280]">
                                    Loading chart…
                                </div>
                            ) : salesTrendRows.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-[14px] text-[#6B7280]">
                                    No sales trend data for this period.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesTrendRows} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                                        <defs>
                                            <linearGradient id={TREND_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#DD2F26" stopOpacity={0.32} />
                                                <stop offset="100%" stopColor="#DD2F26" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical horizontal />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 11, fill: '#6B7280' }}
                                            tickLine={false}
                                            axisLine={{ stroke: '#D1D5DB' }}
                                            interval="preserveStartEnd"
                                            angle={salesTrendRows.length > 12 ? -35 : 0}
                                            textAnchor={salesTrendRows.length > 12 ? 'end' : 'middle'}
                                            height={salesTrendRows.length > 12 ? 56 : 30}
                                        />
                                        <YAxis
                                            domain={trendYAxisDomain}
                                            tickCount={5}
                                            tick={{ fontSize: 12, fill: '#6B7280' }}
                                            tickLine={false}
                                            axisLine={{ stroke: '#D1D5DB' }}
                                            width={48}
                                        />
                                        <Tooltip content={renderSalesTrendTooltip} />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            name="Sales"
                                            stroke="#DD2F26"
                                            strokeWidth={2}
                                            fill={`url(#${TREND_GRADIENT_ID})`}
                                            fillOpacity={1}
                                            activeDot={{ r: 4, fill: '#DD2F26', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="mb-3 rounded-[16px] border border-[#00000033] bg-white p-6 text-center text-gray-500">
                        Loading...
                    </div>
                )}
                {error && (
                    <div className="mb-3 rounded-[10px] border border-red-200 bg-red-50 p-4 text-[14px] text-red-700">
                        {error}
                    </div>
                )}
                {!loading && !error && reportData && (
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3">
                        {stats.map((stat, i) => (
                            <div
                                key={i}
                                className="box-border border border-[#E8E8E8] bg-white rounded-[12px] p-5"
                            >
                                <p className="mb-1 text-[14px] text-[#6B7280]">{stat.label}</p>
                                <p className="text-[20px] font-bold text-[#111827]">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {accessToken && (
                    <div className="mb-4 overflow-hidden rounded-[16px] border border-[#00000033] bg-[#FFFFFF]">
                        <div className="flex items-center justify-between gap-3 p-5 pb-3">
                            <div className="min-w-0">
                                <h2 className="text-[18px] font-bold text-[#111827]">Daily Breakdown</h2>
                                {breakdownDateRangeLabel ? (
                                    <p className="mt-1 text-[13px] text-[#6B7280]">{breakdownDateRangeLabel}</p>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                onClick={openDailyBreakdownFilters}
                                className="box-border inline-flex h-[38.33px] min-w-[97.58px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[#E8E8E8] bg-white pl-4 pr-3 text-center font-sans text-[14px] font-normal leading-[21px] tracking-[0] text-[#374151] opacity-100 transition hover:bg-gray-50"
                            >
                                <Filter
                                    className="h-4 w-4 shrink-0 text-[#374151]"
                                    strokeWidth={1.75}
                                    aria-hidden
                                />
                                Filters
                            </button>
                        </div>
                        {breakdownError && (
                            <div className="mx-5 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                                {breakdownError}
                            </div>
                        )}
                        {breakdownLoading ? (
                            <div className="px-5 py-10 text-center text-[14px] text-[#6B7280]">Loading daily breakdown…</div>
                        ) : breakdownDailyRows.length === 0 ? (
                            <div className="p-6 text-center text-[14px] text-[#6B7280]">No daily breakdown data.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-[#E5E7EB] bg-gray-50/80">
                                            <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Date</th>
                                            <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Orders</th>
                                            <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Sales</th>
                                            <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Refunds ($)</th>
                                            <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Net Revenue ($)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {breakdownDailyRows.map((row) => (
                                            <tr key={row.date} className="border-b border-[#E5E7EB] hover:bg-gray-50/50">
                                                <td className="px-5 py-3 text-[14px] text-[#111827]">{row.label ?? row.date ?? '--'}</td>
                                                <td className="px-5 py-3 text-[14px] text-[#6B7280]">{row.orders?.toLocaleString() ?? '--'}</td>
                                                <td className="px-5 py-3 text-[14px] font-medium text-[#111827]">{formatCurrency(row.sales)}</td>
                                                <td className="px-5 py-3 text-[14px] font-medium text-primary">{formatCurrency(row.refunds)}</td>
                                                <td className="px-5 py-3 text-[14px] font-medium text-[#111827]">{formatCurrency(row.net_revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {!loading && !error && reportData && (
                    <>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:w-auto">
                                <button
                                    type="button"
                                    onClick={handleExportCsv}
                                    disabled={csvDownloading}
                                    className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-[#E8E8E8] bg-transparent px-4 font-sans text-[14px] font-normal leading-[21px] text-[#374151] transition hover:bg-gray-50 min-[400px]:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Download
                                        className="h-4 w-4 shrink-0 text-[#374151]"
                                        strokeWidth={1.75}
                                        aria-hidden
                                    />
                                    {csvDownloading ? 'Exporting…' : 'Export CSV'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportPdf}
                                    disabled={!reportData || pdfDownloading}
                                    className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-[#E8E8E8] bg-transparent px-4 font-sans text-[14px] font-normal leading-[21px] text-[#374151] transition hover:bg-gray-50 min-[400px]:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Download
                                        className="h-4 w-4 shrink-0 text-[#374151]"
                                        strokeWidth={1.75}
                                        aria-hidden
                                    />
                                    {pdfDownloading ? 'Exporting…' : 'Export PDF'}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setScheduleReportOpen(true)}
                                className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-sans text-[14px] font-normal leading-[21px] text-white shadow-sm transition hover:bg-primary/90 sm:w-auto"
                            >
                                <Calendar
                                    className="h-4 w-4 shrink-0"
                                    strokeWidth={1.75}
                                    aria-hidden
                                />
                                Schedule Monthly Report
                            </button>
                        </div>
                    </>
                )}
            </div>
            <ScheduleReportModal
                isOpen={scheduleReportOpen}
                onClose={() => setScheduleReportOpen(false)}
            />
            <DailyBreakdownFiltersModal
                isOpen={dailyBreakdownFiltersOpen}
                onClose={() => setDailyBreakdownFiltersOpen(false)}
                draft={dailyBreakdownFilterDraft}
                onChange={setDailyBreakdownFilterDraft}
                onReset={() =>
                    setDailyBreakdownFilterDraft({
                        orderStatus: { ...DAILY_BREAKDOWN_FILTER_DEFAULTS.orderStatus },
                        payment: { ...DAILY_BREAKDOWN_FILTER_DEFAULTS.payment },
                    })
                }
                onApply={() => {
                    setDailyBreakdownFilterApplied({
                        orderStatus: { ...dailyBreakdownFilterDraft.orderStatus },
                        payment: { ...dailyBreakdownFilterDraft.payment },
                    });
                    setDailyBreakdownFiltersOpen(false);
                }}
            />
        </div>
    );
};

export default SalesReportsPage;
