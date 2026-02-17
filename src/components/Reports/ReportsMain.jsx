import React from 'react';
import {
    BarChart3,
    Package,
    Wallet,
    Receipt,
    UtensilsCrossed,
    Users,
    UserCheck,
    Truck,
    Calculator,
    Zap,
    Calendar,
    FileSpreadsheet,
    FileText
} from 'lucide-react';
import ReportsStats from './ReportsStats';
import ReportCategoryCard from './ReportCategoryCard';

const ReportsMain = ({ onSelectReport }) => {
    const reportCategories = [
        {
            id: 'order',
            title: "Order Reports",
            description: "Analyze order volumes, sources, and fulfillment times",
            icon: Package,
            color: "bg-blue-500",
        },
        {
            id: 'refund',
            title: "Refund & Adjustment Reports",
            description: "Monitor refunds, cancellations, and financial adjustments",
            icon: Receipt,
            color: "bg-red-500",
        },
        {
            id: 'customer',
            title: "Customer & Loyalty Reports",
            description: "Track customer retention, points, and engagement",
            icon: Users,
            color: "bg-purple-500",
        },
        {
            id: 'delivery',
            title: "Delivery Reports",
            description: "Analyze delivery times, driver performance, and success rates",
            icon: Truck,
            color: "bg-cyan-500",
        },
        {
            id: 'integration',
            title: "Integration Reports",
            description: "Monitor third-party platform syncs and discrepancies",
            icon: Zap,
            color: "bg-orange-500",
        },
        {
            id: 'sales',
            title: "Sales Reports",
            description: "Track revenue, order values, and sales trends over time",
            icon: BarChart3,
            color: "bg-indigo-500",
        },
        {
            id: 'payout',
            title: "Payout & Commission Reports",
            description: "View earnings, platform fees, and payout schedules",
            icon: Wallet,
            color: "bg-green-500",
        },
        {
            id: 'menu',
            title: "Menu Performance",
            description: "Identify top-selling items and category breakdowns",
            icon: UtensilsCrossed,
            color: "bg-amber-500",
        },
        {
            id: 'staff',
            title: "Staff Performance Reports",
            description: "Measure team efficiency and service quality",
            icon: UserCheck,
            color: "bg-teal-500",
        },
        {
            id: 'accounting',
            title: "Accounting & Tax Reports",
            description: "Generate VAT reports and financial statements",
            icon: Calculator,
            color: "bg-gray-500",
        }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 bg-[#FFFFFF] border border-[#00000033] p-4 rounded-[16px]">
                <div className=''>
                    <h1 className="text-[28px] font-[800] text-general-text">Reports</h1>
                    <p className="text-[14px] text-gray-500">View detailed sales, order, menu, loyalty, and payout reports.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-sm  text-gray-600 hover:bg-gray-50 transition-colors ">
                        <Calendar className="w-4 h-4" />
                        Last 30 Days
                    </button>
                    <button className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-sm  text-gray-600 hover:bg-gray-50 transition-colors ">
                        <FileSpreadsheet className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-[8px] text-sm  shadow-lg  hover:bg-primary/90 transition-all">
                        <FileText className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            <ReportsStats />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {reportCategories.map(cat => (
                    <ReportCategoryCard
                        key={cat.id}
                        {...cat}
                        onViewReport={() => onSelectReport(cat.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ReportsMain;
