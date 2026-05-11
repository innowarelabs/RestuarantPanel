import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import StatCard from '../../components/AdminDashboard/StatCard';
import HighlightStats from '../../components/AdminDashboard/HighlightStats';
import ActiveOrders from '../../components/AdminDashboard/ActiveOrders';
import OverviewChart from '../../components/AdminDashboard/OverviewChart';
import RecentActivities from '../../components/AdminDashboard/RecentActivities';
import SupportTicketsWidget from '../../components/AdminDashboard/SupportTicketsWidget';
import MarketingSnapshot from '../../components/AdminDashboard/MarketingSnapshot';

import { ShoppingBag, Clock, CheckCircle, XCircle, Banknote } from 'lucide-react';

const API_BASE = 'https://api.baaie.com';

function numOrZero(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

/** `GET .../restaurants/dashboard/highlights` — show row only when at least one card has real data. */
function hasMeaningfulHighlights(data) {
    if (!data || typeof data !== 'object') return false;
    const bs = data.best_seller_today;
    const hasBest =
        (bs?.name != null && String(bs.name).trim() !== '') || numOrZero(bs?.orders_count) > 0;
    const rising = Array.isArray(data.rising_stars) ? data.rising_stars : [];
    const hasRising = rising.some((item) => {
        const nameOk = item?.name != null && String(item.name).trim() !== '';
        const qty = numOrZero(item?.quantity_sold);
        const growth = numOrZero(item?.growth_pct);
        return nameOk || qty > 0 || growth !== 0;
    });
    return hasBest || hasRising;
}

// Main Dashboard Component
export default function AdminDashboard() {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);
    const [dashboardData, setDashboardData] = useState(null);
    const [highlightsData, setHighlightsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dismissingRecentActivities, setDismissingRecentActivities] = useState(false);

    const loadHighlights = useCallback(async () => {
        try {
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || API_BASE).replace(/\/$/, '');
            const restaurantId = user?.restaurant_id || localStorage.getItem('restaurant_id') || '';
            const url = `${baseUrl}/api/v1/restaurants/dashboard/highlights`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const contentType = res.headers.get('content-type');
            const body = contentType?.includes('application/json') ? await res.json() : null;
            if (res.ok && body?.data && typeof body.data === 'object') {
                setHighlightsData(body.data);
            } else {
                setHighlightsData(null);
            }
        } catch (err) {
            console.error('Dashboard highlights API error:', err);
            setHighlightsData(null);
        }
    }, [accessToken, user?.restaurant_id]);

    const loadDashboard = useCallback(
        async (showLoading = true) => {
            if (showLoading) setLoading(true);
            try {
                const baseUrl = (import.meta.env.VITE_BACKEND_URL || API_BASE).replace(/\/$/, '');
                const restaurantId = user?.restaurant_id || localStorage.getItem('restaurant_id') || '';
                const url = `${baseUrl}/api/v1/restaurants/dashboard`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                    },
                });
                const contentType = res.headers.get('content-type');
                const body = contentType?.includes('application/json') ? await res.json() : null;
                if (res.ok && body?.data) {
                    setDashboardData(body.data);
                } else {
                    setDashboardData(null);
                }
            } catch (err) {
                console.error('Dashboard API error:', err);
                setDashboardData(null);
            } finally {
                if (showLoading) setLoading(false);
            }
        },
        [accessToken, user?.restaurant_id],
    );

    /** Re-call dashboard + highlights after order actions (no full-page loading). */
    const refetchDashboard = useCallback(() => {
        loadDashboard(false);
        void loadHighlights();
    }, [loadDashboard, loadHighlights]);

    const dismissAllRecentActivities = useCallback(async () => {
        if (!accessToken) {
            toast.error('Please sign in to dismiss activities.');
            return;
        }
        setDismissingRecentActivities(true);
        try {
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || API_BASE).replace(/\/$/, '');
            const restaurantId = user?.restaurant_id || localStorage.getItem('restaurant_id') || '';
            const url = `${baseUrl}/api/v1/restaurants/dashboard/recent-activities/dismiss-all`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const contentType = res.headers.get('content-type');
            const body = contentType?.includes('application/json') ? await res.json() : null;
            if (res.ok && body?.code === 'SUCCESS_200') {
                const msg =
                    typeof body.message === 'string' && body.message.trim() ? body.message.trim() : null;
                toast.success(msg || 'Recent activities dismissed.');
                await loadDashboard(false);
            } else {
                const msg =
                    (body && typeof body.message === 'string' && body.message.trim()) ||
                    `Could not dismiss activities (${res.status})`;
                toast.error(msg);
            }
        } catch (err) {
            console.error('Dismiss all recent activities failed:', err);
            toast.error(typeof err?.message === 'string' ? err.message : 'Could not dismiss activities');
        } finally {
            setDismissingRecentActivities(false);
        }
    }, [accessToken, user?.restaurant_id, loadDashboard]);

    useEffect(() => {
        loadDashboard(true);
    }, [loadDashboard]);

    useEffect(() => {
        void loadHighlights();
    }, [loadHighlights]);

    const showHighlightSection = highlightsData != null && hasMeaningfulHighlights(highlightsData);

    const statCardsData = useMemo(() => {
        const summary = dashboardData?.summary_cards;
        if (summary && typeof summary === 'object' && Object.keys(summary).length > 0) {
            const s = summary;
            return [
                {
                    Icon: ShoppingBag,
                    title: 'New Orders',
                    value: s.new_orders_this_week ?? 0,
                    change: `${s.new_orders_pct_change ?? 0}%`,
                    growthValue: s.new_orders_pct_change ?? 0,
                },
                {
                    Icon: Clock,
                    title: 'Orders in Progress',
                    value: s.orders_in_progress ?? 0,
                    change: `${s.orders_in_progress_pct_change ?? 0}%`,
                    growthValue: s.orders_in_progress_pct_change ?? 0,
                },
                {
                    Icon: CheckCircle,
                    title: 'Completed',
                    value: s.completed_this_week ?? 0,
                    change: `${s.completed_pct_change ?? 0}%`,
                    growthValue: s.completed_pct_change ?? 0,
                },
                {
                    Icon: XCircle,
                    title: 'Cancelled / Returns',
                    value: s.cancelled_returns_this_week ?? 0,
                    change: `${s.cancelled_pct_change ?? 0}%`,
                    growthValue: s.cancelled_pct_change ?? 0,
                },
                {
                    Icon: Banknote,
                    title: 'Loyalty Points Issued',
                    value: s.loyalty_points_issued_this_week ?? 0,
                    change: `${s.loyalty_pct_change ?? 0}%`,
                    growthValue: s.loyalty_pct_change ?? 0,
                },
            ];
        }

        const o = dashboardData?.orders && typeof dashboardData.orders === 'object' ? dashboardData.orders : {};
        const r = dashboardData?.revenue && typeof dashboardData.revenue === 'object' ? dashboardData.revenue : {};
        const mrr = numOrZero(o.mrr_growth_percent);

        const inProgress = Math.max(
            0,
            numOrZero(o.total_orders_today) - numOrZero(o.completed_orders_today) - numOrZero(o.cancelled_orders_today),
        );

        return [
            {
                Icon: ShoppingBag,
                title: 'New Orders',
                value: numOrZero(o.total_orders_today),
                change: `${mrr}%`,
                growthValue: mrr,
            },
            {
                Icon: Clock,
                title: 'Orders in Progress',
                value: inProgress,
                change: '0%',
                growthValue: 0,
            },
            {
                Icon: CheckCircle,
                title: 'Completed',
                value: numOrZero(o.completed_orders_today),
                change: '0%',
                growthValue: 0,
            },
            {
                Icon: XCircle,
                title: 'Cancelled / Returns',
                value: numOrZero(o.cancelled_orders_today),
                change: '0%',
                growthValue: 0,
            },
            {
                Icon: Banknote,
                title: 'Total revenue',
                value: `$${numOrZero(r.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
                change: `${mrr}%`,
                growthValue: mrr,
            },
        ];
    }, [dashboardData]);

    /** Chart + footer: prefer `orders.order_trend`; fallback legacy `revenue_overview.daily` */
    const { revenueData, ordersData, totalRevenueChart, ordersTotalChart, pctVsLastWeek } = useMemo(() => {
        const trend = Array.isArray(dashboardData?.orders?.order_trend) ? dashboardData.orders.order_trend : [];
        if (trend.length > 0) {
            const slice = trend.length > 7 ? trend.slice(-7) : trend;
            const revenueDataNext = slice.map((d) => ({
                date: d.label || d.date || '',
                value: numOrZero(d.revenue),
            }));
            const ordersDataNext = slice.map((d) => ({
                date: d.label || d.date || '',
                value: numOrZero(d.order_count),
                total: numOrZero(d.order_count),
            }));
            const totalRev = revenueDataNext.reduce((sum, x) => sum + numOrZero(x.value), 0);
            const totalOrd = ordersDataNext.reduce((sum, x) => sum + numOrZero(x.total ?? x.value), 0);
            const pct = numOrZero(dashboardData?.orders?.mrr_growth_percent);
            return {
                revenueData: revenueDataNext,
                ordersData: ordersDataNext,
                totalRevenueChart: totalRev,
                ordersTotalChart: totalOrd,
                pctVsLastWeek: pct,
            };
        }

        const daily = dashboardData?.revenue_overview?.daily || [];
        const revenueDataLegacy = daily.map((d) => ({
            date: d.date,
            value: d.revenue,
        }));
        return {
            revenueData: revenueDataLegacy,
            ordersData: [],
            totalRevenueChart: dashboardData?.revenue_overview?.total_revenue_7d ?? 0,
            ordersTotalChart: 0,
            pctVsLastWeek: dashboardData?.revenue_overview?.pct_vs_last_week ?? 0,
        };
    }, [dashboardData]);

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="mb-6">
                <h1 className="text-[28px] sm:text-[28px] font-black text-[#111111]">Dashboard</h1>
                <p className="text-[14px] text-[#6B7280] mt-[-4px]">
                    {loading ? "Loading your latest performance..." : "Welcome back! Here's what's happening today."}
                </p>
            </div>

            {/* Row 1: Stat cards — `summary_cards` from dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 -mt-[10px]">
                {statCardsData.map((card, index) => (
                    <div key={index} className={index === statCardsData.length - 1 ? "col-span-2 lg:col-span-1" : ""}>
                        <StatCard
                            Icon={card.Icon}
                            title={card.title}
                            value={card.value}
                            change={card.change}
                            growthValue={card.growthValue}
                        />
                    </div>
                ))}
            </div>

            {/* Row 2: Best seller + rising stars from GET .../dashboard/highlights */}
            {showHighlightSection ? (
                <HighlightStats
                    bestSeller={highlightsData.best_seller_today}
                    topSellers={Array.isArray(highlightsData.rising_stars) ? highlightsData.rising_stars : []}
                />
            ) : null}

            {/* Row 3: Active Orders & Overview Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
                {/* Active Orders - 4 columns (roughly 1/3) */}
                <div className="xl:col-span-6">
                    <ActiveOrders
                        orders={dashboardData?.active_orders || []}
                        loading={loading}
                        onOrdersChanged={refetchDashboard}
                    />
                </div>
                {/* Overview Chart - 8 columns (roughly 2/3) */}
                <div className="xl:col-span-6">
                    <OverviewChart
                        revenueData={revenueData}
                        ordersData={ordersData}
                        totalRevenue={totalRevenueChart}
                        ordersTotal={ordersTotalChart}
                        pctChange={pctVsLastWeek}
                    />
                </div>
            </div>

            {/* Row 4: Recent Activities & Support Tickets */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                <div className='lg:col-span-5'>
                    <RecentActivities
                        activities={dashboardData?.recent_activities || []}
                        loading={loading}
                        dismissBusy={dismissingRecentActivities}
                        onDismissAll={dismissAllRecentActivities}
                    />
                </div>
                <div className='lg:col-span-7'>
                    <SupportTicketsWidget tickets={dashboardData?.support_tickets || []} loading={loading} />
                </div>
            </div>

            {/* Row 5: Marketing Snapshot */}
            <MarketingSnapshot marketingSnapshot={dashboardData?.marketing_snapshot} />

        </div>
    );
}
