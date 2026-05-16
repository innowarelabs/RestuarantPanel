import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ShoppingBag, DollarSign, Target, Users, RefreshCcw, XCircle } from 'lucide-react';

import { ANALYTICS_NO_DATA } from '../../components/Analytics/analyticsCopy';
import AnalyticsHeader from '../../components/Analytics/AnalyticsHeader';
import AnalyticsStatCard from '../../components/Analytics/AnalyticsStatCard';
import SalesOverviewChart from '../../components/Analytics/SalesOverviewChart';
import TopSellingItems from '../../components/Analytics/TopSellingItems';
import OrderStatusChart from '../../components/Analytics/OrderStatusChart';
import LowPerformingTable from '../../components/Analytics/LowPerformingTable';
import PeakOrderingTimesChart from '../../components/Analytics/PeakOrderingTimesChart';
import CustomerInsights from '../../components/Analytics/CustomerInsights';
import RevenueBreakdown from '../../components/Analytics/RevenueBreakdown';
// import RefundsSummary from '../../components/Analytics/RefundsSummary';
import PlatformPerformance from '../../components/Analytics/PlatformPerformance';
import { fetchTopSellingItems, mapTopItemsToExportRows } from '../../components/Analytics/topSellingItemsApi';
import { buildExportPayload, downloadAnalyticsCsv, downloadAnalyticsPdf } from '../../utils/analyticsExport';

const API_BASE = 'https://api.baaie.com';

/** Matches GET /api/v1/analytics/restaurant/analytics query: days ∈ {7,30,60} */
export const ANALYTICS_PERIOD_OPTIONS = [
    { days: 7, label: 'Last 7 days' },
    { days: 30, label: 'Last 30 days' },
    { days: 60, label: 'Last 60 days' },
];

const formatMoney = (n) => {
    if (n == null || Number.isNaN(Number(n))) return '$0';
    return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const formatPct = (n, digits = 1) => {
    if (n == null || Number.isNaN(Number(n))) return '0';
    return Number(n).toFixed(digits);
};

/** API may return one object or an array for low performers. */
const normalizeLowPerformingList = (raw) => {
    if (raw == null) return [];
    if (Array.isArray(raw)) return raw.filter((x) => x != null);
    if (typeof raw === 'object') return [raw];
    return [];
};

const extractLowPerformingRaw = (data) => {
    if (!data || typeof data !== 'object') return null;
    return (
        data.low_performing_items ??
        data.lowPerformingItems ??
        data.performance?.low_performing_items ??
        data.performance?.lowPerformingItems ??
        data.orders?.low_performing_items ??
        data.menu?.low_performing_items ??
        null
    );
};

const mapLowPerformingApiRow = (row, formatMoneyFn) => {
    if (!row || typeof row !== 'object') return null;
    const name =
        (typeof row.item_name === 'string' && row.item_name.trim()) ||
        (typeof row.name === 'string' && row.name.trim()) ||
        (typeof row.dish_name === 'string' && row.dish_name.trim()) ||
        '—';
    const category =
        (typeof row.category === 'string' && row.category.trim()) ||
        (typeof row.category_name === 'string' && row.category_name.trim()) ||
        (typeof row.menu_category === 'string' && row.menu_category.trim()) ||
        '—';
    let orders = row.orders ?? row.order_count ?? row.total_orders;
    if (orders != null && typeof orders !== 'string') orders = String(orders);
    if (orders == null || orders === '') orders = '—';
    const revRaw = row.revenue ?? row.revenue_amount ?? row.total_revenue;
    let revenue = '—';
    if (revRaw != null && revRaw !== '') {
        const n = Number(revRaw);
        revenue = !Number.isNaN(n) ? formatMoneyFn(n) : String(revRaw);
    }
    const recommendation =
        (typeof row.recommendation === 'string' && row.recommendation.trim()) ||
        (typeof row.insight === 'string' && row.insight.trim()) ||
        (typeof row.action === 'string' && row.action.trim()) ||
        'Review visibility & pricing';
    const sev = typeof row.severity === 'string' ? row.severity.toLowerCase() : '';
    const color =
        sev === 'high' || sev === 'critical'
            ? 'bg-red-50 text-red-700 border-red-100'
            : sev === 'medium' || sev === 'warn'
              ? 'bg-amber-50 text-amber-800 border-amber-100'
              : 'bg-gray-50 text-gray-600 border-gray-100';
    return { name, category, orders, revenue, recommendation, color };
};

/** When menu-level rows are missing, surface weakest venue metric from dashboard payload. */
const mapWorstPerformerFallback = (wp, formatMoneyFn) => {
    if (!wp || typeof wp !== 'object') return null;
    const metric = typeof wp.metric === 'string' ? wp.metric : 'metric';
    const name =
        (typeof wp.restaurant_name === 'string' && wp.restaurant_name.trim()) ||
        (typeof wp.item_name === 'string' && wp.item_name.trim()) ||
        'Venue';
    let orders = wp.orders ?? wp.order_count;
    if (orders != null && typeof orders !== 'string') orders = String(orders);
    if (orders == null || orders === '') orders = '—';
    const v = wp.value ?? wp.rating;
    let revenue = '—';
    if (metric === 'revenue' && v != null && !Number.isNaN(Number(v))) {
        revenue = formatMoneyFn(Number(v));
    } else if (metric === 'orders' && v != null) {
        revenue = String(v);
    } else if (metric === 'rating' && v != null) {
        revenue = `${Number(v).toFixed(1)} ★`;
    } else if (v != null && v !== '') {
        revenue = String(v);
    }
    const recommendation =
        metric === 'rating'
            ? 'Improve ratings & guest satisfaction'
            : metric === 'revenue'
              ? 'Review pricing and promotions'
              : metric === 'orders'
                ? 'Drive repeat visits & marketing'
                : 'Review operational metrics';
    return {
        name,
        category: `Weakest · ${metric}`,
        orders,
        revenue,
        recommendation,
        color: 'bg-amber-50 text-amber-800 border-amber-100',
    };
};

const buildSalesChartSeries = (data) => {
    const ot = data?.orders?.order_trend;
    if (Array.isArray(ot) && ot.length > 0) {
        return ot.map((p) => ({
            name: p.label && !String(p.label).startsWith('20') ? p.label : String(p.date || '').slice(5) || '—',
            orders: Number(p.order_count) || 0,
            revenue: Number(p.revenue) || 0,
        }));
    }
    const rt = data?.revenue?.revenue_trend;
    if (Array.isArray(rt) && rt.length > 0) {
        return rt.map((p) => ({
            name: p.label || String(p.date || '').slice(5) || '—',
            orders: Number(p.orders) || 0,
            revenue: Number(p.revenue) || 0,
        }));
    }
    return [];
};

const buildOrderStatusPie = (data) => {
    const o = data?.orders;
    if (!o) {
        return [{ name: ANALYTICS_NO_DATA, value: 100, color: '#E5E7EB' }];
    }
    const total = Number(o.total_orders_period) || 0;
    const completed = Number(o.completed_orders_period) || 0;
    const cancelled = Number(o.cancelled_orders_period) || 0;
    const other = Math.max(0, total - completed - cancelled);
    if (total <= 0) {
        return [{ name: ANALYTICS_NO_DATA, value: 100, color: '#E5E7EB' }];
    }
    const slices = [
        { name: 'Completed', value: Math.round((completed / total) * 1000) / 10, color: '#059669' },
        { name: 'Cancelled', value: Math.round((cancelled / total) * 1000) / 10, color: '#EF4444' },
        { name: 'Other', value: Math.round((other / total) * 1000) / 10, color: '#94A3B8' },
    ];
    const filtered = slices.filter((x) => x.value > 0);
    return filtered.length ? filtered : [{ name: 'Completed', value: 100, color: '#059669' }];
};

const buildPeakHourly = (data) => {
    const peaks = data?.orders?.peak_time;
    if (!Array.isArray(peaks)) return [];
    return peaks.map((p) => ({
        time: p.label || `${p.hour}:00`,
        value: Number(p.order_count) || 0,
        hour: p.hour,
    }));
};

const peakHourRangeLabel = (row) => {
    if (!row || row.value <= 0) return '—';
    const h = Number(row.hour);
    const next = (h + 1) % 24;
    return `${h}:00 – ${next}:00`;
};

const peakSummaryFromHourly = (hourly) => {
    if (!hourly.length) {
        return { peakLabel: '—', slowHourLabel: '—' };
    }
    let maxH = hourly[0];
    hourly.forEach((row) => {
        if (row.value > maxH.value) maxH = row;
    });
    const nonZero = hourly.filter((h) => h.value > 0);
    const slowest = nonZero.length ? nonZero.reduce((a, b) => (a.value <= b.value ? a : b)) : null;
    return {
        peakLabel: peakHourRangeLabel(maxH),
        slowHourLabel: slowest && slowest.value > 0 ? `${slowest.hour}:00` : '—',
    };
};

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const buildOrderTrendByWeekday = (data) => {
    if (!data) return [];
    const ot = data?.orders?.order_trend;
    if (!Array.isArray(ot) || ot.length === 0) {
        return [];
    }
    const counts = [0, 0, 0, 0, 0, 0, 0];
    ot.forEach((p) => {
        const raw = p.date;
        if (!raw) return;
        const d = new Date(`${raw}T12:00:00`);
        if (Number.isNaN(d.getTime())) return;
        const dow = d.getDay();
        counts[dow] += Number(p.order_count) || 0;
    });
    return WEEKDAY_SHORT.map((name, i) => ({ name, value: counts[i] }));
};

const peakDaySummaryFromWeekday = (rows) => {
    if (!rows.length) return { peakDay: '—', slowDay: '—' };
    const maxR = rows.reduce((a, b) => (a.value >= b.value ? a : b));
    const nonZero = rows.filter((r) => r.value > 0);
    const slowR = nonZero.length ? nonZero.reduce((a, b) => (a.value <= b.value ? a : b)) : rows[0];
    const fullDay = (short) => {
        const map = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' };
        return map[short] || short;
    };
    return {
        peakDay: maxR.value > 0 ? fullDay(maxR.name) : '—',
        slowDay: slowR && slowR.value > 0 ? fullDay(slowR.name) : '—',
    };
};

export default function Analytics() {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsPeriodDays, setAnalyticsPeriodDays] = useState(30);
    const [topItemsPeriod, setTopItemsPeriod] = useState('30d');
    const [exporting, setExporting] = useState(false);
    const exportInFlight = useRef(false);

    const fetchRestaurantAnalytics = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || API_BASE).replace(/\/$/, '');
            const restaurantId = user?.restaurant_id || localStorage.getItem('restaurant_id') || '';
            const params = new URLSearchParams();
            params.set('days', String(analyticsPeriodDays));
            const url = `${baseUrl}/api/v1/analytics/restaurant/analytics?${params.toString()}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const contentType = res.headers.get('content-type');
            const body = contentType?.includes('application/json') ? await res.json() : {};
            if (res.ok && body?.code === 'SUCCESS_200' && body.data) {
                setAnalyticsData(body.data);
            } else {
                setAnalyticsData(null);
            }
        } catch (err) {
            console.error('[restaurant/analytics] GET error', err);
            setAnalyticsData(null);
        } finally {
            setAnalyticsLoading(false);
        }
    }, [accessToken, user?.restaurant_id, analyticsPeriodDays]);

    useEffect(() => {
        fetchRestaurantAnalytics();
    }, [fetchRestaurantAnalytics]);

    const statCards = useMemo(() => {
        const periodLabel = (d) => {
            const days = d?.orders?.period_days ?? d?.revenue?.period_days;
            return days != null ? `Last ${days} days` : 'Selected period';
        };
        const d = analyticsData;
        if (!d) {
            const mk = (label, Icon, variant) => ({
                label,
                value: analyticsLoading ? '…' : '-',
                secondaryInfo: '—',
                percentage: '',
                trend: 'up',
                showTrend: false,
                Icon,
                variant,
            });
            return [
                mk('Total Orders', ShoppingBag, 'redMetrics'),
                mk('Total Revenue', DollarSign, 'redMetrics'),
                mk('Avg Order Value', Target, 'redMetrics'),
                mk('New Customer', Users, 'indigoMetrics'),
                mk('Returning Customers', RefreshCcw, 'indigoMetrics'),
                mk('Cancellation Rate', XCircle, 'redMetrics'),
            ];
        }
        const o = d.orders || {};
        const r = d.revenue || {};
        const total = Number(o.total_orders_period) || 0;
        const completed = Number(o.completed_orders_period) || 0;
        const cancelled = Number(o.cancelled_orders_period) || 0;
        const cancelRate = total > 0 ? formatPct((cancelled / total) * 100) : '0';
        const completeShare = total > 0 ? formatPct((completed / total) * 100, 0) : '0';
        const mrr = o.mrr_growth_percent;
        const mrrStr = mrr != null ? `${Number(mrr) >= 0 ? '+' : ''}${formatPct(mrr, 1)}%` : '—';
        const mrrTrend = mrr != null && Number(mrr) >= 0 ? 'up' : 'down';

        return [
            {
                label: 'Total Orders',
                value: String(total),
                secondaryInfo: periodLabel(d),
                percentage: '',
                trend: 'up',
                showTrend: false,
                Icon: ShoppingBag,
                variant: 'redMetrics',
            },
            {
                label: 'Total Revenue',
                value: formatMoney(r.revenue_period ?? o.total_revenue_period),
                secondaryInfo: periodLabel(d),
                percentage: mrrStr,
                trend: mrrTrend,
                showTrend: mrr != null,
                Icon: DollarSign,
                variant: 'redMetrics',
            },
            {
                label: 'Avg Order Value',
                value: `$${formatPct(o.average_order_value_period ?? 0, 2)}`,
                secondaryInfo: periodLabel(d),
                percentage: '',
                trend: 'up',
                showTrend: false,
                Icon: Target,
                variant: 'redMetrics',
            },
            {
                label: 'New Customer',
                value:
                    d.new_customers_last_24h != null && d.new_customers_last_24h !== ''
                        ? String(Number(d.new_customers_last_24h))
                        : '-',
                secondaryInfo:
                    d.new_customers_last_24h != null && d.new_customers_last_24h !== ''
                        ? 'Last 24 hours'
                        : 'Not provided for this period',
                percentage: '',
                trend: 'up',
                showTrend: false,
                Icon: Users,
                variant: 'indigoMetrics',
            },
            {
                label: 'Returning Customers',
                value: `${completeShare}%`,
                secondaryInfo: 'Completed share of orders',
                percentage: '',
                trend: 'up',
                showTrend: false,
                Icon: RefreshCcw,
                variant: 'indigoMetrics',
            },
            {
                label: 'Cancellation Rate',
                value: `${cancelRate}%`,
                secondaryInfo: 'of orders in period',
                percentage: '',
                trend: Number(cancelRate) > 10 ? 'down' : 'up',
                showTrend: false,
                Icon: XCircle,
                variant: 'redMetrics',
            },
        ];
    }, [analyticsData, analyticsLoading]);

    const salesSeries = useMemo(() => buildSalesChartSeries(analyticsData), [analyticsData]);
    const orderStatusPie = useMemo(() => buildOrderStatusPie(analyticsData), [analyticsData]);
    const peakHourly = useMemo(() => buildPeakHourly(analyticsData), [analyticsData]);
    const peakSummary = useMemo(() => peakSummaryFromHourly(peakHourly), [peakHourly]);
    const weekdaySeries = useMemo(() => buildOrderTrendByWeekday(analyticsData), [analyticsData]);
    const weekdayPeak = useMemo(() => peakDaySummaryFromWeekday(weekdaySeries), [weekdaySeries]);

    const lowPerformingRows = useMemo(() => {
        const raw = extractLowPerformingRaw(analyticsData);
        const fromApi = normalizeLowPerformingList(raw)
            .map((r) => mapLowPerformingApiRow(r, formatMoney))
            .filter(Boolean);
        if (fromApi.length > 0) return fromApi;
        const wp = analyticsData?.performance?.worst_performer;
        const fallback = mapWorstPerformerFallback(wp, formatMoney);
        return fallback ? [fallback] : [];
    }, [analyticsData]);

    const orderBreakdown = analyticsData?.orders?.order_breakdown || null;
    const performance = analyticsData?.performance || null;

    const runExport = useCallback(
        async (kind) => {
            if (exportInFlight.current) return;
            exportInFlight.current = true;
            setExporting(true);
            try {
                const restaurantId = user?.restaurant_id || localStorage.getItem('restaurant_id') || '';
                if (!accessToken || !restaurantId) {
                    toast.error('Sign in and select a restaurant to export.');
                    return;
                }
                const items = await fetchTopSellingItems({ accessToken, user, period: topItemsPeriod });
                const topRows = mapTopItemsToExportRows(items);
                const payload = buildExportPayload({
                    analyticsData,
                    analyticsLoading,
                    salesSeries,
                    orderStatusPie,
                    peakHourly,
                    peakSummary,
                    weekdaySeries,
                    weekdayPeak,
                    orderBreakdown,
                    performance,
                    topItemsPeriod,
                    topItemsRows: topRows,
                    restaurantName: user?.restaurant_name || user?.name || 'Restaurant',
                });
                if (kind === 'csv') {
                    downloadAnalyticsCsv(payload);
                    toast.success('CSV downloaded');
                } else {
                    downloadAnalyticsPdf(payload);
                    toast.success('PDF downloaded');
                }
            } catch (err) {
                console.error('[analytics export]', err);
                toast.error(kind === 'csv' ? 'Could not export CSV' : 'Could not export PDF');
            } finally {
                exportInFlight.current = false;
                setExporting(false);
            }
        },
        [
            accessToken,
            user,
            topItemsPeriod,
            analyticsData,
            analyticsLoading,
            salesSeries,
            orderStatusPie,
            peakHourly,
            peakSummary,
            weekdaySeries,
            weekdayPeak,
            orderBreakdown,
            performance,
        ],
    );

    const handleExportCsv = useCallback(() => runExport('csv'), [runExport]);
    const handleExportPdf = useCallback(() => runExport('pdf'), [runExport]);

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <AnalyticsHeader
                periodOptions={ANALYTICS_PERIOD_OPTIONS}
                selectedDays={analyticsPeriodDays}
                onDaysChange={setAnalyticsPeriodDays}
                exporting={exporting}
                onExportCsv={handleExportCsv}
                onExportPdf={handleExportPdf}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
                {statCards.map((card, index) => (
                    <AnalyticsStatCard key={index} {...card} />
                ))}
            </div>

            <SalesOverviewChart data={salesSeries} loading={analyticsLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
                <div className="min-w-0 h-full">
                    <TopSellingItems period={topItemsPeriod} onPeriodChange={setTopItemsPeriod} />
                </div>
                <div className="min-w-0 h-full">
                    <OrderStatusChart data={orderStatusPie} loading={analyticsLoading} />
                </div>
            </div>

            <LowPerformingTable rows={lowPerformingRows} loading={analyticsLoading} />

            <PeakOrderingTimesChart
                hourlyData={peakHourly}
                weekdayData={weekdaySeries}
                peakHourLabel={peakSummary.peakLabel}
                slowHourLabel={peakSummary.slowHourLabel}
                peakDayLabel={weekdayPeak.peakDay}
                slowDayLabel={weekdayPeak.slowDay}
                loading={analyticsLoading}
            />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
                <div className="xl:col-span-6">
                    <CustomerInsights data={analyticsData} loading={analyticsLoading} />
                </div>
                <div className="xl:col-span-6">
                    <RevenueBreakdown orderBreakdown={orderBreakdown} loading={analyticsLoading} />
                </div>
            </div>

            {/* <RefundsSummary orders={analyticsData?.orders} loading={analyticsLoading} /> */}

            <PlatformPerformance performance={performance} loading={analyticsLoading} />
        </div>
    );
}
