import React, { useMemo } from 'react';
import { Mail, MousePointer2, CheckCircle2 } from 'lucide-react';

const METRIC_ICONS = {
    email_opens: Mail,
    link_clicks: MousePointer2,
    conversions: CheckCircle2,
};

const DEFAULT_ICON = CheckCircle2;

const FALLBACK_STATS = [
    {
        label: 'Email Opens',
        value: '—',
        change: '—',
        icon: Mail,
        iconColor: 'text-[#3B82F6]',
        iconBg: 'bg-[#EFF6FF]',
        trendColor: 'text-[#6B7280]',
    },
    {
        label: 'Link Clicks',
        value: '—',
        change: '—',
        icon: MousePointer2,
        iconColor: 'text-[#CA8A04]',
        iconBg: 'bg-[#FEF9C3]',
        trendColor: 'text-[#6B7280]',
    },
    {
        label: 'Conversions',
        value: '—',
        change: '—',
        icon: CheckCircle2,
        iconColor: 'text-primary',
        iconBg: 'bg-[#FEE2E2]',
        trendColor: 'text-[#6B7280]',
    },
];

/**
 * @param {{ marketingSnapshot?: { conversion_rate_pct?: number, metrics?: { key: string, label: string, count: number, change_pct: number }[] } }} props
 */
const MarketingSnapshot = ({ marketingSnapshot }) => {
    const stats = useMemo(() => {
        const metrics = Array.isArray(marketingSnapshot?.metrics) ? marketingSnapshot.metrics : [];
        if (metrics.length === 0) return FALLBACK_STATS;

        return metrics.map((m) => {
            const Icon = METRIC_ICONS[m.key] || DEFAULT_ICON;
            const ch = numOrZero(m.change_pct);
            const positive = ch >= 0;
            return {
                label: m.label || m.key || '—',
                value: formatCount(m.count),
                change: `${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%`,
                icon: Icon,
                iconColor: 'text-primary',
                iconBg: 'bg-[#F3F4F6]',
                trendColor: positive ? 'text-[#16A34A]' : 'text-[#EF4444]',
            };
        });
    }, [marketingSnapshot]);

    const conversionPct = marketingSnapshot?.conversion_rate_pct;
    const conversionLabel =
        conversionPct != null && Number.isFinite(Number(conversionPct))
            ? `${Number(conversionPct).toFixed(1)}%`
            : '—';

    return (
        <div className="bg-white rounded-[16px] p-6 border border-[#00000033] mt-6 mb-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
                <h3 className="text-[18px] font-bold text-[#111827] tracking-tight">
                    {marketingSnapshot?.title?.trim() || 'Marketing Snapshot'}
                </h3>
                <p className="text-[13px] font-medium text-[#6B7280] shrink-0">
                    Conversion Rate:{' '}
                    <span className="text-[15px] font-bold text-primary">{conversionLabel}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={`${stat.label}-${index}`}
                            className="bg-[#F3F4F6] rounded-[12px] px-4 py-4 flex items-center justify-between gap-3 min-h-[88px]"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`w-12 h-12 rounded-[10px] ${stat.iconBg} flex items-center justify-center shrink-0`}
                                >
                                    <Icon className={`w-6 h-6 ${stat.iconColor}`} strokeWidth={2} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] text-[#6B7280] font-medium leading-tight mb-0.5">
                                        {stat.label}
                                    </p>
                                    <p className="text-[20px] font-bold text-[#111827] leading-tight tabular-nums">
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                            <span
                                className={`text-[13px] font-semibold shrink-0 tabular-nums ${stat.trendColor}`}
                            >
                                {stat.change}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

function numOrZero(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function formatCount(v) {
    if (v == null) return '—';
    const n = Number(v);
    if (Number.isFinite(n)) return n.toLocaleString();
    return String(v);
}

export default MarketingSnapshot;
