import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';

const REPORTS_API_BASE = 'https://api.baaie.com';

const extractInnerData = (json) => {
    if (!json || typeof json !== 'object') return null;
    const inner = json.data?.data ?? json.data;
    return inner && typeof inner === 'object' ? inner : null;
};

const formatMoney = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return '—';
    return `$${x.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const StatMini = ({ label, value }) => (
    <div className="rounded-[12px] border border-[#00000033] bg-white p-4">
        <p className="text-[13px] font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-[22px] font-bold text-[#0F1724] tabular-nums">{value}</p>
    </div>
);

const CHART_GRADIENT_ID = 'customerLoyaltyTrendFill';

export default function CustomerLoyaltyReportsPage() {
    const navigate = useNavigate();
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const getRestaurantId = useCallback(() => {
        const fromUser =
            user && typeof user === 'object' && typeof user.restaurant_id === 'string' ? user.restaurant_id : '';
        let fromStorage = '';
        try {
            fromStorage = localStorage.getItem('restaurant_id') || '';
        } catch {
            fromStorage = '';
        }
        return (fromUser || fromStorage).trim();
    }, [user]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [payload, setPayload] = useState(null);

    useEffect(() => {
        if (!accessToken) {
            setLoading(false);
            setError('Not signed in');
            return;
        }

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
                const restaurantId = getRestaurantId();
                const url = `${baseUrl}/api/v1/reports/customers-loyalty/analytics`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                        ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                    },
                });
                const json = await res.json().catch(() => ({}));
                const inner = extractInnerData(json);

                if (!res.ok) {
                    const msg =
                        (typeof json?.message === 'string' && json.message) ||
                        (typeof json?.detail === 'string' && json.detail) ||
                        `Request failed (${res.status})`;
                    setError(msg);
                    setPayload(null);
                    return;
                }

                if (!inner) {
                    setError('Invalid response');
                    setPayload(null);
                    return;
                }

                setPayload(inner);
            } catch (e) {
                setError(e?.message || 'Failed to load report');
                setPayload(null);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [accessToken, getRestaurantId]);

    const stats = payload?.stats ?? {};
    const trend = Array.isArray(payload?.trend) ? payload.trend : [];
    const customers = Array.isArray(payload?.customers) ? payload.customers : [];
    const dateRangeLabel = typeof payload?.date_range_label === 'string' ? payload.date_range_label : '';
    const restaurantName = typeof payload?.restaurant_name === 'string' ? payload.restaurant_name : '';

    const chartData = useMemo(
        () => trend.map((t) => ({ label: t.label || t.date || '—', points: Number(t.value) || 0 })),
        [trend],
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-300">
            <button
                type="button"
                onClick={() => navigate('/reports')}
                className="mb-6 inline-flex items-center gap-2 text-[14px] font-medium text-[#6B7280] hover:text-[#0F1724] transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                Back to Reports
            </button>

            <div className="mb-8 rounded-[16px] border border-[#00000033] bg-white p-5 sm:p-6">
                <h1 className="font-sans text-[26px] sm:text-[28px] font-bold text-[#0F1724]">Customer &amp; Loyalty Reports</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-gray-500">
                    {restaurantName ? <span>{restaurantName}</span> : null}
                    {dateRangeLabel ? (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[13px] font-medium text-[#374151]">
                            {dateRangeLabel}
                        </span>
                    ) : null}
                </div>
            </div>

            {loading && (
                <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-10 text-center text-gray-500">Loading…</div>
            )}

            {!loading && error && (
                <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">{error}</div>
            )}

            {!loading && !error && payload && (
                <>
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                        <StatMini label="Total customers" value={String(stats.total_customers ?? 0)} />
                        <StatMini label="New customers" value={String(stats.new_customers ?? 0)} />
                        <StatMini label="Loyalty members" value={String(stats.loyalty_members ?? 0)} />
                        <StatMini label="Points earned" value={(stats.total_points_earned ?? 0).toLocaleString()} />
                        <StatMini label="Points redeemed" value={(stats.total_points_redeemed ?? 0).toLocaleString()} />
                    </div>

                    <div className="mb-8 rounded-[12px] border border-[#00000033] bg-white p-4 sm:p-6">
                        <h2 className="mb-4 font-sans text-[18px] font-bold text-[#0F1724]">Daily loyalty points</h2>
                        {chartData.length === 0 ? (
                            <p className="text-[14px] text-gray-500">No trend data for this period.</p>
                        ) : (
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id={CHART_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#DD2F26" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="#DD2F26" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                                        <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" width={48} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 8,
                                                border: '1px solid #E5E7EB',
                                                fontSize: 13,
                                            }}
                                            formatter={(v) => [`${Number(v).toLocaleString()} pts`, 'Points']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="points"
                                            stroke="#DD2F26"
                                            strokeWidth={2}
                                            fill={`url(#${CHART_GRADIENT_ID})`}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div className="rounded-[12px] border border-[#00000033] bg-white overflow-hidden">
                        <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                            <h2 className="font-sans text-[18px] font-bold text-[#0F1724]">Customers</h2>
                            <p className="mt-0.5 text-[13px] text-gray-500">Loyalty activity by customer</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-[800px] w-full text-left text-[14px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-[#F9FAFB] text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                                        <th className="px-4 py-3 sm:px-6">Customer</th>
                                        <th className="px-4 py-3 sm:px-6">Email</th>
                                        <th className="px-4 py-3 sm:px-6 text-right">Orders</th>
                                        <th className="px-4 py-3 sm:px-6 text-right">Total spent</th>
                                        <th className="px-4 py-3 sm:px-6 text-right">Earned</th>
                                        <th className="px-4 py-3 sm:px-6 text-right">Redeemed</th>
                                        <th className="px-4 py-3 sm:px-6 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                                No customers in this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.map((row) => (
                                            <tr key={row.customer_id || row.email} className="border-b border-gray-50 hover:bg-gray-50/80">
                                                <td className="px-4 py-3 sm:px-6 font-medium text-[#0F1724]">
                                                    {row.customer_name || '—'}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-gray-600 break-all max-w-[220px]">
                                                    {row.email || '—'}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-right tabular-nums">
                                                    {(row.order_count ?? 0).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-right tabular-nums font-medium">
                                                    {formatMoney(row.total_spent)}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-right tabular-nums">
                                                    {(row.points_earned ?? 0).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-right tabular-nums">
                                                    {(row.points_redeemed ?? 0).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-right tabular-nums font-semibold text-[#0F1724]">
                                                    {(row.points_balance ?? 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
