import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const formatCurrency = (val) =>
    val != null && Number.isFinite(Number(val))
        ? `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
        : '--';

const formatInt = (val) =>
    val != null && Number.isFinite(Number(val)) ? Number(val).toLocaleString() : '--';

/** Format API trend_pct for display */
function formatTrendPercent(raw) {
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const sign = n > 0 ? '+' : '';
    const decimals = Math.abs(n % 1) < 1e-9 ? 0 : 2;
    return `${sign}${n.toFixed(decimals)}%`;
}

function trendTone(pctRaw) {
    if (pctRaw == null || pctRaw === '') return null;
    const n = Number(pctRaw);
    if (!Number.isFinite(n)) return null;
    if (n > 0) return 'up';
    if (n < 0) return 'down';
    return 'flat';
}

const StatCard = ({ title, value, trendPct, loading, vsPreviousPeriod }) => {
    const pctLabel = formatTrendPercent(trendPct);
    const tone = trendTone(trendPct);

    const trendTextClass =
        tone === 'up'
            ? 'text-[#16a34a]'
            : tone === 'down'
              ? 'text-[#dc2626]'
              : tone === 'flat'
                ? 'text-gray-600'
                : '';

    const showTrend = pctLabel != null && tone != null && !loading;
    const showVsLine = vsPreviousPeriod && !loading;

    return (
        <div className="bg-white rounded-[12px] border border-[#00000033] p-4 sm:p-5 min-h-[140px] sm:min-h-[152px] flex flex-col">
            <div className="flex flex-col gap-1">
                <p className="text-[13px] sm:text-[14px] font-medium text-gray-500">{title}</p>
                <h3 className="text-[20px] sm:text-[24px] font-bold text-[#0F1724] truncate tracking-tight">{value}</h3>
                <div className="flex flex-col gap-0.5 pt-1">
                    {loading && <span className="text-[11px] sm:text-[12px] text-gray-400">Loading…</span>}

                    {showTrend && (
                        <div className={`flex items-center gap-1 text-[12px] sm:text-[13px] font-semibold ${trendTextClass}`}>
                            {tone === 'up' ? (
                                <TrendingUp className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                            ) : tone === 'down' ? (
                                <TrendingDown className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                            ) : (
                                <Minus className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                            )}
                            <span>{pctLabel}</span>
                        </div>
                    )}

                    {showVsLine && (
                        <p className="text-[10px] sm:text-[11px] text-gray-400 font-normal leading-snug">vs previous period</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const ReportsStats = ({ dashboardCards, periodKey = 'month' }) => {
    const period = dashboardCards?.[periodKey] ?? {};
    const trends = period.trend_pct && typeof period.trend_pct === 'object' ? period.trend_pct : {};

    const stats = dashboardCards
        ? [
              {
                  title: 'Total Sales',
                  value: formatCurrency(period.total_sales),
                  trendPct: trends.total_sales,
                  loading: false,
                  vsPreviousPeriod: true,
              },
              {
                  title: 'Number of Orders',
                  value: formatInt(period.number_of_orders),
                  trendPct: trends.number_of_orders,
                  loading: false,
                  vsPreviousPeriod: true,
              },
              {
                  title: 'Net Earnings',
                  value: formatCurrency(period.net_earning),
                  trendPct: trends.net_earning,
                  loading: false,
                  vsPreviousPeriod: true,
              },
              {
                  title: 'Commission Paid',
                  value: formatCurrency(period.commission),
                  trendPct: trends.commission,
                  loading: false,
                  vsPreviousPeriod: true,
              },
              {
                  title: 'Total Refunds',
                  value: formatCurrency(period.refund),
                  trendPct: trends.refund,
                  loading: false,
                  vsPreviousPeriod: true,
              },
          ]
        : [
              { title: 'Total Sales', value: '--', trendPct: null, loading: true, vsPreviousPeriod: false },
              { title: 'Number of Orders', value: '--', trendPct: null, loading: true, vsPreviousPeriod: false },
              { title: 'Net Earnings', value: '--', trendPct: null, loading: true, vsPreviousPeriod: false },
              { title: 'Commission Paid', value: '--', trendPct: null, loading: true, vsPreviousPeriod: false },
              { title: 'Total Refunds', value: '--', trendPct: null, loading: true, vsPreviousPeriod: false },
          ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-8">
            {stats.map((stat, index) => (
                <StatCard key={`${stat.title}-${index}`} {...stat} />
            ))}
        </div>
    );
};

export default ReportsStats;
