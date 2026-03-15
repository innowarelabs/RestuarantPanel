import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, Wallet, Percent, DollarSign } from 'lucide-react';

const REPORTS_API_BASE = 'https://api.baaie.com';

const formatCurrency = (val) => (val != null ? `$${Number(val).toLocaleString()}` : '--');

const PayoutCommissionPage = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const getRestaurantId = useCallback(() => {
        const fromUser = user && typeof user === 'object' && typeof user.restaurant_id === 'string' ? user.restaurant_id : '';
        let fromStorage = '';
        try {
            fromStorage = localStorage.getItem('restaurant_id') || '';
        } catch {
            fromStorage = '';
        }
        return fromUser || fromStorage;
    }, [user]);

    const fetchCommissionReport = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
            const restaurantId = getRestaurantId();
            const url = `${baseUrl}/api/v1/reports/commission`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const data = await res.json();
            if (data.code === 'SUCCESS_200' && data.data) {
                setReportData(data.data);
            } else {
                setError(data.message || 'Failed to load commission report');
            }
        } catch (err) {
            console.error('Error fetching commission report:', err);
            setError(err.message || 'Failed to load commission report');
        } finally {
            setLoading(false);
        }
    }, [accessToken, getRestaurantId]);

    useEffect(() => {
        fetchCommissionReport();
    }, [fetchCommissionReport]);

    const d = reportData;

    return (
        <div className="max-w-[1600px] mx-auto pb-12">
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 pb-12">
                <div className="bg-[#FFFFFF] border border-[#00000033] rounded-[16px] p-6 mb-8">
                    <button
                        onClick={() => navigate('/reports')}
                        className="flex items-center gap-2 text-[14px] text-[#6B7280] hover:text-primary transition-colors mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Reports
                    </button>
                    <h1 className="text-[28px] font-bold text-[#111827] mb-1">Payout & Commission Reports</h1>
                    <p className="text-[14px] text-[#6B7280]">View earnings, platform fees, and payout schedules.</p>
                    {d?.restaurant_name && (
                        <p className="text-[13px] text-[#6B7280] mt-1 font-medium">{d.restaurant_name}</p>
                    )}
                </div>

                {loading && (
                    <div className="bg-white border border-[#00000033] rounded-[16px] p-8 text-center text-gray-500">
                        Loading...
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[10px] text-[14px] text-red-700">
                        {error}
                    </div>
                )}
                {!loading && !error && d && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white border border-[#00000033] rounded-[12px] p-5">
                            <div className="flex items-center gap-2 text-[#6B7280] text-[14px] mb-1">
                                <Percent className="w-4 h-4" />
                                Commission Rate
                            </div>
                            <p className="text-[22px] font-bold text-[#111827]">
                                {d.commission_rate_percent != null ? `${d.commission_rate_percent}%` : '--'}
                            </p>
                        </div>
                        <div className="bg-white border border-[#00000033] rounded-[12px] p-5">
                            <div className="flex items-center gap-2 text-[#6B7280] text-[14px] mb-1">
                                <Wallet className="w-4 h-4" />
                                Commission Today
                            </div>
                            <p className="text-[22px] font-bold text-[#111827]">{formatCurrency(d.commission_today)}</p>
                        </div>
                        <div className="bg-white border border-[#00000033] rounded-[12px] p-5">
                            <div className="flex items-center gap-2 text-[#6B7280] text-[14px] mb-1">
                                <Wallet className="w-4 h-4" />
                                Commission This Month
                            </div>
                            <p className="text-[22px] font-bold text-[#111827]">{formatCurrency(d.commission_this_month)}</p>
                        </div>
                        <div className="bg-white border border-[#00000033] rounded-[12px] p-5">
                            <div className="flex items-center gap-2 text-[#6B7280] text-[14px] mb-1">
                                <Wallet className="w-4 h-4" />
                                Commission This Year
                            </div>
                            <p className="text-[22px] font-bold text-[#111827]">{formatCurrency(d.commission_this_year)}</p>
                        </div>
                    </div>
                )}
                {!loading && !error && d && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white border border-[#00000033] rounded-[12px] p-5">
                            <div className="flex items-center gap-2 text-[#6B7280] text-[14px] mb-1">
                                <DollarSign className="w-4 h-4" />
                                Revenue Today
                            </div>
                            <p className="text-[22px] font-bold text-[#111827]">{formatCurrency(d.revenue_today)}</p>
                        </div>
                        <div className="bg-white border border-[#00000033] rounded-[12px] p-5">
                            <div className="flex items-center gap-2 text-[#6B7280] text-[14px] mb-1">
                                <DollarSign className="w-4 h-4" />
                                Revenue This Month
                            </div>
                            <p className="text-[22px] font-bold text-[#111827]">{formatCurrency(d.revenue_this_month)}</p>
                        </div>
                        <div className="bg-white border border-[#00000033] rounded-[12px] p-5">
                            <div className="flex items-center gap-2 text-[#6B7280] text-[14px] mb-1">
                                <DollarSign className="w-4 h-4" />
                                Revenue This Year
                            </div>
                            <p className="text-[22px] font-bold text-[#111827]">{formatCurrency(d.revenue_this_year)}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayoutCommissionPage;
