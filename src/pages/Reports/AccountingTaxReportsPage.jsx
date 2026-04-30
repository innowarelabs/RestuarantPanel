import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
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

const StatMini = ({ label, value, valueClassName }) => (
    <div className="rounded-[12px] border border-[#00000033] bg-white p-4">
        <p className="text-[13px] font-medium text-gray-500">{label}</p>
        <p
            className={`mt-1 text-[22px] font-bold tabular-nums ${valueClassName || 'text-[#0F1724]'}`}
        >
            {value}
        </p>
    </div>
);

export default function AccountingTaxReportsPage() {
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
                const url = `${baseUrl}/api/v1/reports/accounting-tax`;
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
    const breakdown = Array.isArray(payload?.breakdown) ? payload.breakdown : [];
    const dateRangeLabel = typeof payload?.date_range_label === 'string' ? payload.date_range_label : '';
    const restaurantName = typeof payload?.restaurant_name === 'string' ? payload.restaurant_name : '';

    const netSales = Number(stats.net_sales);
    const netSalesNeg = Number.isFinite(netSales) && netSales < 0;

    const chartData = useMemo(
        () => trend.map((t) => ({ label: t.label || t.date || '—', netMovement: Number(t.value) || 0 })),
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
                <h1 className="font-sans text-[26px] sm:text-[28px] font-bold text-[#0F1724]">
                    Accounting &amp; Tax Reports
                </h1>
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
                <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-10 text-center text-gray-500">
                    Loading…
                </div>
            )}

            {!loading && error && (
                <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">
                    {error}
                </div>
            )}

            {!loading && !error && payload && (
                <>
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 lg:gap-4">
                        <StatMini label="Gross sales" value={formatMoney(stats.gross_sales)} />
                        <StatMini label="Taxable sales" value={formatMoney(stats.taxable_sales)} />
                        <StatMini label="Tax collected" value={formatMoney(stats.tax_collected)} />
                        <StatMini label="Refunds" value={formatMoney(stats.refunds)} />
                        <StatMini
                            label="Net sales"
                            value={formatMoney(stats.net_sales)}
                            valueClassName={netSalesNeg ? 'text-red-600' : 'text-[#0F1724]'}
                        />
                        <StatMini label="Commission" value={formatMoney(stats.commission)} />
                        <StatMini label="Platform fees" value={formatMoney(stats.platform_fees)} />
                    </div>

                    <div className="mb-8 rounded-[12px] border border-[#00000033] bg-white p-4 sm:p-6">
                        <h2 className="mb-4 font-sans text-[18px] font-bold text-[#0F1724]">
                            Daily net movement
                        </h2>
                        <p className="mb-4 text-[13px] text-gray-500">
                            Day-over-day change (gross minus refunds) from trend data.
                        </p>
                        {chartData.length === 0 ? (
                            <p className="text-[14px] text-gray-500">No trend data for this period.</p>
                        ) : (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="4 4" />
                                        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            stroke="#9CA3AF"
                                            width={52}
                                            tickFormatter={(v) =>
                                                `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                            }
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 8,
                                                border: '1px solid #E5E7EB',
                                                fontSize: 13,
                                            }}
                                            formatter={(v) => [formatMoney(v), 'Net']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="netMovement"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            dot={{ r: 2, fill: '#6366f1' }}
                                            activeDot={{ r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div className="rounded-[12px] border border-[#00000033] bg-white overflow-hidden">
                        <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                            <h2 className="font-sans text-[18px] font-bold text-[#0F1724]">Daily breakdown</h2>
                            <p className="mt-0.5 text-[13px] text-gray-500">Gross, tax, refunds, and net by day</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-[720px] w-full text-left text-[14px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-[#F9FAFB] text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                                        <th className="px-4 py-3 sm:px-6">Period</th>
                                        <th className="px-4 py-3 sm:px-6 text-right">Gross sales</th>
                                        <th className="px-4 py-3 sm:px-6 text-right">Tax collected</th>
                                        <th className="px-4 py-3 sm:px-6 text-right">Refunds</th>
                                        <th className="px-4 py-3 sm:px-6 text-right">Net sales</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdown.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                                No breakdown rows for this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        breakdown.map((row) => {
                                            const net = Number(row.net_sales);
                                            const netNeg = Number.isFinite(net) && net < 0;
                                            return (
                                                <tr
                                                    key={row.date || row.label}
                                                    className="border-b border-gray-50 hover:bg-gray-50/80"
                                                >
                                                    <td className="px-4 py-3 sm:px-6 font-medium text-[#0F1724] whitespace-nowrap">
                                                        {row.label || row.date || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 sm:px-6 text-right tabular-nums">
                                                        {formatMoney(row.gross_sales)}
                                                    </td>
                                                    <td className="px-4 py-3 sm:px-6 text-right tabular-nums">
                                                        {formatMoney(row.tax_collected)}
                                                    </td>
                                                    <td className="px-4 py-3 sm:px-6 text-right tabular-nums text-gray-700">
                                                        {formatMoney(row.refunds)}
                                                    </td>
                                                    <td
                                                        className={`px-4 py-3 sm:px-6 text-right tabular-nums font-medium ${netNeg ? 'text-red-600' : 'text-[#0F1724]'}`}
                                                    >
                                                        {formatMoney(row.net_sales)}
                                                    </td>
                                                </tr>
                                            );
                                        })
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
