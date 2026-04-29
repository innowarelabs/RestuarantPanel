import React, { useMemo } from 'react';
import { ANALYTICS_NO_DATA } from './analyticsCopy';

function BarSegment({ widthPct, className }) {
    if (widthPct <= 0) return null;
    return (
        <div
            className={`h-full flex items-center justify-center text-white text-[11px] font-bold min-w-0 ${className}`}
            style={{ width: `${widthPct}%` }}
        >
            {widthPct >= 8 ? `${Math.round(widthPct)}%` : ''}
        </div>
    );
}

export default function RevenueBreakdown({ orderBreakdown = null, loading = false }) {
    const { deliveryPct, pickupPct, dinePct, deliveryLabel, pickupLabel, dineLabel } = useMemo(() => {
        const ob = orderBreakdown || {};
        const d = Number(ob.delivery_percent) || 0;
        const p = Number(ob.pickup_percent) || 0;
        const di = Number(ob.dine_in_percent) || 0;
        const norm = d + p + di;
        const safe = norm > 0 ? 100 / norm : 1;
        return {
            deliveryPct: d * safe,
            pickupPct: p * safe,
            dinePct: di * safe,
            deliveryLabel: `Delivery (${ob.delivery ?? 0} orders)`,
            pickupLabel: `Pickup (${ob.pickup ?? 0})`,
            dineLabel: `Dine-in (${ob.dine_in ?? 0})`,
        };
    }, [orderBreakdown]);

    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033]  h-full">
            <h3 className="analytics-section-title mb-6">Revenue Breakdown</h3>

            {loading && <div className="py-8 text-center text-[13px] text-gray-500">Loading…</div>}

            {!loading && !orderBreakdown && (
                <div className="py-10 text-center text-[13px] text-gray-600">{ANALYTICS_NO_DATA}</div>
            )}

            {!loading && orderBreakdown && (
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-[12px] mb-2 font-medium">
                            <span className="text-gray-500">Delivery vs pickup vs dine-in</span>
                        </div>
                        <div className="w-full h-8 flex rounded-lg overflow-hidden border border-gray-100">
                            <BarSegment widthPct={deliveryPct} className="bg-[#DD2F26]" />
                            <BarSegment widthPct={pickupPct} className="bg-[#E0E7FF] text-[#4338CA]" />
                            <BarSegment widthPct={dinePct} className="bg-[#A7F3D0] text-[#065F46]" />
                        </div>
                        {deliveryPct === 0 && pickupPct === 0 && dinePct === 0 && (
                            <p className="text-[12px] text-gray-400 mt-2">{ANALYTICS_NO_DATA}</p>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] text-gray-400 font-medium">
                            <span>{deliveryLabel}</span>
                            <span>{pickupLabel}</span>
                            <span>{dineLabel}</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-[12px] mb-2 font-medium">
                            <span className="text-gray-500">Payment method</span>
                        </div>
                        <p className="text-[13px] text-gray-400 bg-[#F9FAFB] rounded-lg px-3 py-4 border border-gray-100">
                            {ANALYTICS_NO_DATA}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-[12px] text-gray-500 font-medium mb-2">Platform sources</p>
                        <p className="text-[13px] text-gray-400 bg-[#F9FAFB] rounded-lg px-3 py-4 border border-gray-100">
                            {ANALYTICS_NO_DATA}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
