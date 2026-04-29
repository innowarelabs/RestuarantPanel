import React, { useMemo } from 'react';
import { Award, Users, Gift } from 'lucide-react';
import { ANALYTICS_NO_DATA, ANALYTICS_CARD_NA } from './analyticsCopy';

const labelCls = 'text-[13px] font-medium leading-snug text-[#6B7280]';
const valueCls = 'text-[24px] font-bold leading-tight text-[#0F1724]';
const cardRed = 'rounded-[12px] bg-[#DD2F2626] p-4';
const cardGrey = 'rounded-[12px] bg-[#F6F8F9] p-4';

export default function CustomerInsights({ data = null, loading = false }) {
    const subscriptions = data?.subscriptions;
    const subStats = subscriptions?.stats;
    const planDist = subscriptions?.plan_distribution;

    const loyaltyMembers = useMemo(() => {
        const n = subStats?.active_subscriptions;
        return n != null && !Number.isNaN(Number(n)) ? String(Number(n)) : ANALYTICS_CARD_NA;
    }, [subStats]);

    const nonLoyaltyCount = useMemo(() => {
        if (!planDist) {
            return subscriptions != null ? '0' : ANALYTICS_CARD_NA;
        }
        const b = Number(planDist.basic_plan) || 0;
        const s = Number(planDist.standard_plan) || 0;
        return String(b + s);
    }, [planDist, subscriptions]);

    const newCustomers24h = data?.new_customers_last_24h;
    const newCustomersLine =
        newCustomers24h != null && !Number.isNaN(Number(newCustomers24h))
            ? `New customers (last 24h): ${Number(newCustomers24h)}`
            : null;

    const rewardName = null;
    const rewardRedemptions = null;

    const hasPayload = data != null;

    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033] shadow-sm h-full flex flex-col">
            <h3 className="analytics-section-title mb-6">Customer Insights</h3>

            {loading && <div className="py-8 text-center text-[13px] text-gray-500">Loading…</div>}

            {!loading && !hasPayload && (
                <div className="py-10 text-center text-[13px] text-gray-600">{ANALYTICS_NO_DATA}</div>
            )}

            {!loading && hasPayload && (
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className={cardRed}>
                            <div className="flex items-center gap-3">
                                <Award size={20} className="shrink-0 text-[#DD2F26]" strokeWidth={2} />
                                <span className={labelCls}>Loyalty Members</span>
                            </div>
                            <p className={`${valueCls} mt-2`}>{loyaltyMembers}</p>
                        </div>

                        <div className={cardGrey}>
                            <div className="flex items-center gap-3">
                                <Users size={20} className="shrink-0 text-[#6B7280]" strokeWidth={2} />
                                <span className={labelCls}>Non-Loyalty</span>
                            </div>
                            <p className={`${valueCls} mt-2`}>{nonLoyaltyCount}</p>
                            {/* {newCustomersLine && <p className={`${labelCls} mt-2 text-[12px]`}>{newCustomersLine}</p>} */}
                        </div>
                    </div>

                    <div className={cardRed}>
                        <div className="flex items-center gap-3">
                            <Gift size={20} className="shrink-0 text-[#DD2F26]" strokeWidth={2} />
                            <span className={labelCls}>Most Redeemed Reward</span>
                        </div>
                        <p className="mt-2 text-[18px] sm:text-[20px] font-bold leading-snug text-[#DD2F26]">
                            {rewardName || ANALYTICS_CARD_NA}
                        </p>
                        <p className={`${labelCls} mt-1`}>
                            {rewardRedemptions != null ? `Redeemed ${rewardRedemptions} times` : ANALYTICS_CARD_NA}
                        </p>
                    </div>

                    <div className={cardGrey}>
                        <p className={labelCls}>Avg Points Redeemed per Order</p>
                        <p className={`${valueCls} mt-2`}>{ANALYTICS_CARD_NA}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
