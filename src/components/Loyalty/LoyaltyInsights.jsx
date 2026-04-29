import { Ticket, TrendingUp, Users, BarChart2 } from 'lucide-react';
import LoyaltyStatCard from './LoyaltyStatCard';
import RedemptionTrendChart from './RedemptionTrendChart';

const formatAvgPoints = (n) => {
    if (n == null || Number.isNaN(Number(n))) return '—';
    const x = Number(n);
    return x.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
};

const LoyaltyInsights = ({ insights, loading }) => {
    const cards = insights?.cards;
    const trend = insights?.trend;

    const totalRedemptions = cards?.total_redemptions ?? '—';
    const most = cards?.most_redeemed;
    const mostTitle = most?.title && String(most.title).trim() ? most.title : null;
    const mostCount = most?.count != null ? Number(most.count) : 0;
    const mostValue = mostTitle || '—';
    const mostSubtext = mostTitle
        ? `${mostCount} redemption${mostCount === 1 ? '' : 's'}`
        : mostCount === 0
          ? 'No redemptions yet'
          : `${mostCount} redemption${mostCount === 1 ? '' : 's'}`;

    const activeMembers = cards?.active_members ?? '—';
    const avgPoints = formatAvgPoints(cards?.avg_points_per_order);

    if (loading && !insights) {
        return (
            <div className="-mt-[28px] rounded-[16px] border border-[#E5E7EB] bg-white p-8">
                <div className="mb-8 h-7 w-48 animate-pulse rounded bg-gray-200" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-[120px] animate-pulse rounded-[12px] bg-gray-100" />
                    ))}
                </div>
                <div className="mt-10 h-[280px] animate-pulse rounded-xl bg-gray-100" />
            </div>
        );
    }

    return (
        <div className="-mt-[28px] rounded-[16px] border border-[#E5E7EB] bg-white p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-[20px] font-bold text-[#1F2937]">Loyalty Insights</h2>
                {insights?.start_date && insights?.end_date && (
                    <p className="text-[13px] text-gray-500">
                        Period: {insights.start_date} — {insights.end_date}
                        {insights.period_days != null ? ` (${insights.period_days} days)` : ''}
                    </p>
                )}
            </div>

            {!insights && !loading ? (
                <p className="rounded-xl border border-dashed border-gray-200 bg-[#F9FAFB] px-4 py-8 text-center text-[14px] text-gray-500">
                    Loyalty insights are unavailable. Check your connection or restaurant setup.
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <LoyaltyStatCard
                            title="Total Redemptions"
                            value={String(totalRedemptions)}
                            icon={<Ticket className="h-5 w-5" />}
                            bgColor="bg-[#DD2F2626]"
                            textColor="text-[#B91C1C]"
                        />
                        <LoyaltyStatCard
                            title="Most Redeemed"
                            value={mostValue}
                            subtext={mostSubtext}
                            icon={<TrendingUp className="h-5 w-5" />}
                            bgColor="bg-[#DD2F2626]"
                            textColor="text-[#B91C1C]"
                        />
                        <LoyaltyStatCard
                            title="Active Members"
                            value={String(activeMembers)}
                            icon={<Users className="h-5 w-5" />}
                            bgColor="bg-[#E0E7FF]"
                            textColor="text-[#4F46E5]"
                        />
                        <LoyaltyStatCard
                            title="Avg Points/Order"
                            value={String(avgPoints)}
                            icon={<BarChart2 className="h-5 w-5" />}
                            bgColor="bg-[#F6F8F9]"
                            textColor="text-[#4B5563]"
                        />
                    </div>

                    <RedemptionTrendChart
                        trend={trend}
                        startDate={insights?.start_date}
                        endDate={insights?.end_date}
                        periodDays={insights?.period_days}
                    />
                </>
            )}
        </div>
    );
};

export default LoyaltyInsights;
