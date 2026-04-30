import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, ExternalLink } from 'lucide-react';
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

function formatDateTime(iso) {
    if (!iso || typeof iso !== 'string') return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatProvider(p) {
    const u = String(p || '').toLowerCase().replace(/_/g, ' ').trim();
    if (!u) return '—';
    if (u === 'doordash') return 'DoorDash';
    return u.charAt(0).toUpperCase() + u.slice(1);
}

function statusBadgeClass(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'delivered' || s === 'completed') return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'cancelled' || s === 'canceled') return 'bg-red-50 text-red-700 border-red-200';
    if (s === 'created' || s === 'pending') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
}

const StatMini = ({ label, value }) => (
    <div className="rounded-[12px] border border-[#00000033] bg-white p-4">
        <p className="text-[13px] font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-[22px] font-bold text-[#0F1724] tabular-nums">{value}</p>
    </div>
);

const CHART_GRADIENT_ID = 'deliveryTrendFill';

export default function DeliveryReportsPage() {
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
                const url = `${baseUrl}/api/v1/reports/delivery/analytics`;
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
    const deliveries = Array.isArray(payload?.deliveries) ? payload.deliveries : [];
    const dateRangeLabel = typeof payload?.date_range_label === 'string' ? payload.date_range_label : '';
    const restaurantName = typeof payload?.restaurant_name === 'string' ? payload.restaurant_name : '';

    const avgMin = Number(stats.avg_delivery_time_min);
    const avgDisplay =
        Number.isFinite(avgMin) && avgMin > 0 ? `${Math.round(avgMin)} min` : avgMin === 0 ? '0 min' : '—';

    const onTime = Number(stats.on_time_rate_percent);
    const onTimeDisplay = Number.isFinite(onTime) ? `${onTime % 1 === 0 ? onTime : onTime.toFixed(1)}%` : '—';

    const chartData = useMemo(
        () => trend.map((t) => ({ label: t.label || t.date || '—', deliveries: Number(t.value) || 0 })),
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
                <h1 className="font-sans text-[26px] sm:text-[28px] font-bold text-[#0F1724]">Delivery Reports</h1>
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
                        <StatMini label="Total deliveries" value={String(stats.total_deliveries ?? 0)} />
                        <StatMini label="Delivered" value={String(stats.delivered_count ?? 0)} />
                        <StatMini label="Cancelled" value={String(stats.cancelled_count ?? 0)} />
                        <StatMini label="Avg. delivery time" value={avgDisplay} />
                        <StatMini label="On-time rate" value={onTimeDisplay} />
                    </div>

                    <div className="mb-8 rounded-[12px] border border-[#00000033] bg-white p-4 sm:p-6">
                        <h2 className="mb-4 font-sans text-[18px] font-bold text-[#0F1724]">Daily deliveries</h2>
                        {chartData.length === 0 ? (
                            <p className="text-[14px] text-gray-500">No trend data for this period.</p>
                        ) : (
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id={CHART_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#0891b2" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="#0891b2" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                                        <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" width={40} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 8,
                                                border: '1px solid #E5E7EB',
                                                fontSize: 13,
                                            }}
                                            formatter={(v) => [String(v), 'Deliveries']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="deliveries"
                                            stroke="#0891b2"
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
                            <h2 className="font-sans text-[18px] font-bold text-[#0F1724]">Deliveries</h2>
                            <p className="mt-0.5 text-[13px] text-gray-500">Recent delivery rows</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-[1100px] w-full text-left text-[14px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-[#F9FAFB] text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                                        <th className="px-4 py-3 sm:px-6">Order</th>
                                        <th className="px-4 py-3 sm:px-6">Customer</th>
                                        <th className="px-4 py-3 sm:px-6">Status</th>
                                        <th className="px-4 py-3 sm:px-6">Provider</th>
                                        <th className="px-4 py-3 sm:px-6 text-right">Total</th>
                                        <th className="px-4 py-3 sm:px-6">Created</th>
                                        <th className="px-4 py-3 sm:px-6">Delivered</th>
                                        <th className="px-4 py-3 sm:px-6 min-w-[200px]">Address</th>
                                        <th className="px-4 py-3 sm:px-6">Track</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveries.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                                                No deliveries in this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        deliveries.map((row) => (
                                            <tr
                                                key={row.delivery_id || row.order_id}
                                                className="border-b border-gray-50 hover:bg-gray-50/80"
                                            >
                                                <td className="px-4 py-3 sm:px-6 font-medium text-[#0F1724] whitespace-nowrap">
                                                    {row.order_number || '—'}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-gray-800">{row.customer_name || '—'}</td>
                                                <td className="px-4 py-3 sm:px-6">
                                                    <span
                                                        className={`inline-block rounded-md border px-2 py-0.5 text-[12px] font-medium capitalize ${statusBadgeClass(row.status)}`}
                                                    >
                                                        {String(row.status || '—').replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-gray-600">{formatProvider(row.provider)}</td>
                                                <td className="px-4 py-3 sm:px-6 text-right tabular-nums font-medium">
                                                    {formatMoney(row.total_amount)}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-[13px] text-gray-600 whitespace-nowrap">
                                                    {formatDateTime(row.created_at)}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-[13px] text-gray-600 whitespace-nowrap">
                                                    {row.delivered_at ? formatDateTime(row.delivered_at) : '—'}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-[13px] text-gray-600 max-w-[280px]">
                                                    <span className="line-clamp-2">{row.dropoff_address || '—'}</span>
                                                </td>
                                                <td className="px-4 py-3 sm:px-6">
                                                    {row.tracking_url && String(row.tracking_url).startsWith('http') ? (
                                                        <a
                                                            href={row.tracking_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0891b2] hover:underline"
                                                        >
                                                            Open
                                                            <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                                                        </a>
                                                    ) : (
                                                        '—'
                                                    )}
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
