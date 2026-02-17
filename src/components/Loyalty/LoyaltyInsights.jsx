import { Ticket, TrendingUp, Users, BarChart2 } from 'lucide-react';
import LoyaltyStatCard from './LoyaltyStatCard';
import RedemptionTrendChart from './RedemptionTrendChart';

const LoyaltyInsights = () => {
    return (
        <div className="bg-white rounded-[16px] -mt-[28px] border border-[#E5E7EB] p-8 ">
            <h2 className="text-[20px] font-bold text-[#1F2937] mb-8">Loyalty Insights</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <LoyaltyStatCard
                    title="Total Redemptions"
                    value="100"
                    icon={<Ticket className="w-5 h-5" />}
                    bgColor="bg-[#E6F7F4]"
                    textColor="text-[#0D9488]"
                />
                <LoyaltyStatCard
                    title="Most Redeemed"
                    value="Free Coffee"
                    subtext="31 times"
                    icon={<TrendingUp className="w-5 h-5" />}
                    bgColor="bg-[#E6F7F4]"
                    textColor="text-[#0D9488]"
                />
                <LoyaltyStatCard
                    title="Active Members"
                    value="320"
                    icon={<Users className="w-5 h-5" />}
                    bgColor="bg-[#EEF2FF]"
                    textColor="text-[#4F46E5]"
                />
                <LoyaltyStatCard
                    title="Avg Points/Order"
                    value="42"
                    icon={<BarChart2 className="w-5 h-5" />}
                    bgColor="bg-[#F9FAFB]"
                    textColor="text-[#4B5563]"
                />
            </div>

            <RedemptionTrendChart />
        </div>
    );
};

export default LoyaltyInsights;
