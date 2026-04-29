import React, { useMemo } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { ANALYTICS_NO_DATA } from './analyticsCopy';

export default function PlatformPerformance({ performance = null, loading = false }) {
    const cards = useMemo(() => {
        const list = performance?.performance_comparison;
        const m = performance?.restaurant_metrics?.[0];

        const revenueRow = Array.isArray(list) ? list.find((x) => x.metric === 'revenue') : null;
        const ordersRow = Array.isArray(list) ? list.find((x) => x.metric === 'orders') : null;

        const g = performance?.insights?.[0] || 'Live comparison';

        return [
            {
                name: 'Revenue (benchmark)',
                value: revenueRow?.value != null ? String(revenueRow.value) : ANALYTICS_NO_DATA,
                change: g,
                bg: 'bg-[#059669]',
                text: 'text-white',
                up: true,
            },
            {
                name: 'Orders (benchmark)',
                value: ordersRow?.value != null ? String(ordersRow.value) : ANALYTICS_NO_DATA,
                change: m?.restaurant_name ? `Venue: ${m.restaurant_name}` : 'Dashboard snapshot',
                bg: 'bg-[#4F46E5]',
                text: 'text-white',
                up: true,
            },
            {
                name: 'Delivery performance',
                value: m?.avg_delivery_time || ANALYTICS_NO_DATA,
                change: m?.orders_per_day != null ? `${m.orders_per_day} orders / day` : ANALYTICS_NO_DATA,
                bg: 'bg-[#D97706]',
                text: 'text-white',
                up: true,
            },
        ];
    }, [performance]);

    return (
        <div className="bg-white rounded-[12px] border border-[#00000033]  mb-6 overflow-hidden">
            <div className="p-6 border-b border-[#F3F4F6]">
                <h3 className="analytics-section-title">Platform Performance</h3>
                <p className="text-[12px] text-gray-500 mt-1">Mapped from performance comparison and venue metrics (not marketplace-specific).</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 -mt-5 gap-6">
                {loading && (
                    <div className="col-span-full py-8 text-center text-[13px] text-gray-500">Loading…</div>
                )}
                {!loading && !performance && (
                    <div className="col-span-full py-10 text-center text-[13px] text-gray-600">{ANALYTICS_NO_DATA}</div>
                )}
                {!loading &&
                    performance &&
                    cards.map((p, index) => (
                        <div
                            key={index}
                            className={`${p.bg} ${p.text} p-6 min-h-[145px] rounded-[12px] shadow-sm hover:scale-[1.02] transition-transform`}
                        >
                            <p className="text-[13px]  opacity-90 mb-1">{p.name}</p>
                            <h4 className="text-[28px] font-bold mb-4 break-words">{p.value}</h4>
                            <div className="flex items-start gap-2 text-[12px]  opacity-90">
                                {p.up ? <TrendingUp size={16} className="shrink-0 mt-0.5" /> : <TrendingDown size={16} className="shrink-0 mt-0.5" />}
                                <span className="leading-snug">{p.change}</span>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
