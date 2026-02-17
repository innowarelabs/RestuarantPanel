import React from 'react';
import { ShoppingBag, DollarSign, Target, Users, RefreshCcw, XCircle } from 'lucide-react';

import AnalyticsHeader from '../../components/Analytics/AnalyticsHeader';
import AnalyticsStatCard from '../../components/Analytics/AnalyticsStatCard';
import SalesOverviewChart from '../../components/Analytics/SalesOverviewChart';
import TopSellingItems from '../../components/Analytics/TopSellingItems';
import OrderStatusChart from '../../components/Analytics/OrderStatusChart';
import LowPerformingTable from '../../components/Analytics/LowPerformingTable';
import PeakOrderingTimesChart from '../../components/Analytics/PeakOrderingTimesChart';
import CustomerInsights from '../../components/Analytics/CustomerInsights';
import RevenueBreakdown from '../../components/Analytics/RevenueBreakdown';
import RefundsSummary from '../../components/Analytics/RefundsSummary';
import PlatformPerformance from '../../components/Analytics/PlatformPerformance';

const statCards = [
    {
        label: 'Total Orders',
        value: '410',
        secondaryInfo: 'vs previous period',
        percentage: '+12%',
        trend: 'up',
        Icon: ShoppingBag,
        iconBg: 'bg-[#F0FDFA] text-[#2BB29C]'
    },
    {
        label: 'Total Revenue',
        value: '$8,420',
        secondaryInfo: 'vs previous period',
        percentage: '+8%',
        trend: 'up',
        Icon: DollarSign,
        iconBg: 'bg-[#F0FDFA] text-[#2BB29C]'
    },
    {
        label: 'Avg Order Value',
        value: '$18.71',
        secondaryInfo: 'vs previous period',
        percentage: '+5%',
        trend: 'up',
        Icon: Target,
        iconBg: 'bg-[#F0FDFA] text-[#2BB29C]'
    },
    {
        label: 'New Customers',
        value: '62',
        secondaryInfo: 'vs previous period',
        percentage: '+32%',
        trend: 'up',
        Icon: Users,
        iconBg: 'bg-[#EEF2FF] text-[#6366F1]'
    },
    {
        label: 'Returning Customers',
        value: '68%',
        secondaryInfo: 'of total orders',
        percentage: '+2%',
        trend: 'up',
        Icon: RefreshCcw,
        iconBg: 'bg-[#EEF2FF] text-[#6366F1]'
    },
    {
        label: 'Cancellation Rate',
        value: '4.5%',
        secondaryInfo: 'of total orders',
        percentage: '-3%',
        trend: 'down',
        Icon: XCircle,
        iconBg: 'bg-[#FEF2F2] text-[#EF4444]'
    }
];

export default function Analytics() {
    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Section */}
            <AnalyticsHeader />

            {/* Top Stat Cards Section */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
                {statCards.map((card, index) => (
                    <AnalyticsStatCard key={index} {...card} />
                ))}
            </div>

            {/* Sales Chart Section */}
            <SalesOverviewChart />

            {/* Mid Section: Top Items & Order Status */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
                <div className="xl:col-span-8">
                    <TopSellingItems />
                </div>
                <div className="xl:col-span-4">
                    <OrderStatusChart />
                </div>
            </div>

            {/* Low Performing Table Section */}
            <LowPerformingTable />

            {/* Peak Times Chart Section */}
            <PeakOrderingTimesChart />

            {/* Insights & Breakdown Section */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
                <div className="xl:col-span-6">
                    <CustomerInsights />
                </div>
                <div className="xl:col-span-6">
                    <RevenueBreakdown />
                </div>
            </div>

            {/* Refunds Section */}
            <RefundsSummary />

            {/* Platform Performance Section */}
            <PlatformPerformance />
        </div>
    );
}
