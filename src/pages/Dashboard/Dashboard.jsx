import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import StatCard from '../../components/AdminDashboard/StatCard';
import HighlightStats from '../../components/AdminDashboard/HighlightStats';
import ActiveOrders from '../../components/AdminDashboard/ActiveOrders';
import OverviewChart from '../../components/AdminDashboard/OverviewChart';
import RecentActivities from '../../components/AdminDashboard/RecentActivities';
import SupportTicketsWidget from '../../components/AdminDashboard/SupportTicketsWidget';
import MarketingSnapshot from '../../components/AdminDashboard/MarketingSnapshot';

import { ShoppingBag, Clock, CheckCircle, XCircle, Gift } from 'lucide-react';

const API_BASE = 'https://api.baaie.com';

/** `GET .../dashboard/highlights` → `data` object; hide highlight cards when nothing meaningful. */
function hasMeaningfulHighlights(data) {
    if (!data || typeof data !== 'object') return false;
    const bs = data.best_seller_today;
    const hasBestSeller =
        (bs?.name != null && String(bs.name).trim() !== '') || (Number(bs?.orders_count) > 0);
    const rs = Array.isArray(data.rising_stars) ? data.rising_stars : [];
    const hasRising = rs.some(
        (item) =>
            (item?.name != null && String(item.name).trim() !== '') ||
            Number(item?.orders_count) > 0 ||
            Number(item?.orders_this_week) > 0,
    );
    return hasBestSeller || hasRising;
}

// Main Dashboard Component
export default function AdminDashboard() {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    /** `undefined` = not loaded yet; `null` = loaded but no payload; else API `data` */
    const [highlights, setHighlights] = useState(undefined);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const baseUrl = (import.meta.env.VITE_BACKEND_URL || API_BASE).replace(/\/$/, '');
                const restaurantId = (user?.restaurant_id) || localStorage.getItem('restaurant_id') || '';
                const res = await fetch(`${baseUrl}/api/v1/restaurants/analytics/dashboard`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                    },
                });
                const data = await res.json();
                if (data?.data) {
                    setDashboardData(data.data);
                }
            } catch (err) {
                console.error('Dashboard API error:', err);
            }
            setLoading(false);
        };
        fetchDashboard();
    }, [accessToken, user?.restaurant_id]);

    useEffect(() => {
        const fetchHighlights = async () => {
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
                const body = contentType?.includes('application/json') ? await res.json() : await res.text();
                console.log('Restaurant dashboard highlights:', { url, ok: res.ok, status: res.status, body });
                if (!res.ok) {
                    setHighlights(null);
                    return;
                }
                const payload = typeof body === 'object' && body !== null ? body?.data : null;
                setHighlights(payload ?? null);
            } catch (err) {
                console.error('Dashboard highlights API error:', err);
                setHighlights(null);
            }
        };
        fetchHighlights();
    }, [accessToken, user?.restaurant_id]);

    const showHighlightSection = highlights !== undefined && highlights !== null && hasMeaningfulHighlights(highlights);

    const statCardsData = useMemo(() => {
        const summary = dashboardData?.summary_cards;
        const s = summary && typeof summary === 'object' ? summary : {};
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
                Icon: Gift,
                title: 'Loyalty Points Issued',
                value: s.loyalty_points_issued_this_week ?? 0,
                change: `${s.loyalty_pct_change ?? 0}%`,
                growthValue: s.loyalty_pct_change ?? 0,
            },
        ];
    }, [dashboardData]);

    const revenueData = useMemo(() => {
        const daily = dashboardData?.revenue_overview?.daily || [];
        return daily.map(d => ({
            date: d.date,
            value: d.revenue
        }));
    }, [dashboardData]);

    const ordersData = useMemo(() => {
        // Backend currently does not provide per-day order counts in revenue_overview,
        // so keep this empty for now. Chart will still work for Revenue tab.
        return [];
    }, []);

    const totalRevenue7d = dashboardData?.revenue_overview?.total_revenue_7d ?? 0;
    const pctVsLastWeek = dashboardData?.revenue_overview?.pct_vs_last_week ?? 0;

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="mb-6">
                <h1 className="text-[28px] sm:text-[28px] font-black text-[#111111]">Dashboard</h1>
                <p className="text-[14px] text-[#6B7280] mt-[-4px]">
                    {loading ? "Loading your latest performance..." : "Welcome back! Here's what's happening today."}
                </p>
            </div>

            {/* Row 1: Stat cards — always 5 (analytics); not tied to highlights API */}
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

            {/* Row 2: Highlights — only when /dashboard/highlights has meaningful data */}
            {showHighlightSection ? (
                <HighlightStats
                    bestSeller={highlights.best_seller_today}
                    topSellers={Array.isArray(highlights.rising_stars) ? highlights.rising_stars : []}
                />
            ) : null}

            {/* Row 3: Active Orders & Overview Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
                {/* Active Orders - 4 columns (roughly 1/3) */}
                <div className="xl:col-span-6">
                    <ActiveOrders orders={dashboardData?.active_orders || []} loading={loading} />
                </div>
                {/* Overview Chart - 8 columns (roughly 2/3) */}
                <div className="xl:col-span-6">
                    <OverviewChart
                        revenueData={revenueData}
                        ordersData={ordersData}
                        totalRevenue={totalRevenue7d}
                        pctChange={pctVsLastWeek}
                    />
                </div>
            </div>

            {/* Row 4: Recent Activities & Support Tickets */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                <div className='lg:col-span-5'>
                    <RecentActivities activities={dashboardData?.recent_activities || []} loading={loading} />
                </div>
                <div className='lg:col-span-7'>
                    <SupportTicketsWidget tickets={dashboardData?.support_tickets || []} loading={loading} />
                </div>
            </div>

            {/* Row 5: Marketing Snapshot */}
            <MarketingSnapshot />

        </div>
    );
}
