import StatCard from '../../components/AdminDashboard/StatCard';
import HighlightStats from '../../components/AdminDashboard/HighlightStats';
import ActiveOrders from '../../components/AdminDashboard/ActiveOrders';
import OverviewChart from '../../components/AdminDashboard/OverviewChart';
import RecentActivities from '../../components/AdminDashboard/RecentActivities';
import SupportTicketsWidget from '../../components/AdminDashboard/SupportTicketsWidget';
import MarketingSnapshot from '../../components/AdminDashboard/MarketingSnapshot';

import { ShoppingBag, Clock, CheckCircle, XCircle, Gift } from 'lucide-react';

const mockRevenueData = [
    { date: 'Mon', value: 1200 },
    { date: 'Tue', value: 2100 },
    { date: 'Wed', value: 1800 },
    { date: 'Thu', value: 2400 },
    { date: 'Fri', value: 1900 },
    { date: 'Sat', value: 2800 },
    { date: 'Sun', value: 2500 },
];

const mockOrdersData = [
    { day: 'Mon', total: 45 },
    { day: 'Tue', total: 62 },
    { day: 'Wed', total: 58 },
    { day: 'Thu', total: 75 },
    { day: 'Fri', total: 68 },
    { day: 'Sat', total: 95 },
    { day: 'Sun', total: 82 },
];

// Main Dashboard Component
export default function AdminDashboard() {
    const statCardsData = [
        {
            Icon: ShoppingBag,
            title: "New Orders",
            value: "28",
            change: "+12.5%",
            growthValue: 12.5
        },
        {
            Icon: Clock,
            title: "Orders in Progress",
            value: "15",
            change: "-3.2%",
            growthValue: -3.2
        },
        {
            Icon: CheckCircle,
            title: "Completed Orders",
            value: "184",
            change: "+18.7%",
            growthValue: 18.7
        },
        {
            Icon: XCircle,
            title: "Cancelled Returns",
            value: "8",
            change: "-15.3%",
            growthValue: -15.3
        },
        {
            Icon: Gift,
            title: "Loyalty Points Issued",
            value: "2,847",
            change: "+22.4%",
            growthValue: 22.4
        }
    ];

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="mb-6">
                <h1 className="text-[28px] sm:text-[28px]  font-[800] font-Avenir text-[#111111]">Dashboard</h1>
                <p className="text-[14px] text-[#6B7280] mt-[-4px]">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Row 1: Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 -mt-[10px]">
                {statCardsData.map((card, index) => (
                    <div key={index} className={index === statCardsData.length - 1 ? "col-span-2 lg:col-span-1" : ""}>
                        <StatCard
                            Icon={card.Icon}
                            title={card.title}
                            value={card.value}
                            change={card.change}
                            growthValue={card.growthValue}
                        />
                    </div>
                ))}
            </div>

            {/* Row 2: Highlights (Best Seller, Rising Stars) */}
            <HighlightStats />

            {/* Row 3: Active Orders & Overview Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
                {/* Active Orders - 4 columns (roughly 1/3) */}
                <div className="xl:col-span-6">
                    <ActiveOrders />
                </div>
                {/* Overview Chart - 8 columns (roughly 2/3) */}
                <div className="xl:col-span-6">
                    <OverviewChart
                        revenueData={mockRevenueData}
                        ordersData={mockOrdersData}
                    />
                </div>
            </div>

            {/* Row 4: Recent Activities & Support Tickets */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                <div className='lg:col-span-5'>
                    <RecentActivities />
                </div>
                <div className='lg:col-span-7'>
                    <SupportTicketsWidget />
                </div>
            </div>

            {/* Row 5: Marketing Snapshot */}
            <MarketingSnapshot />

        </div>
    );
}
