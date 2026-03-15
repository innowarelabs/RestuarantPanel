import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, TrendingUp } from 'lucide-react';

const REPORTS_API_BASE = 'https://api.baaie.com';

const formatCurrency = (val) => (val != null ? `$${Number(val).toLocaleString()}` : '--');

const MenuPerformancePage = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activePeriod, setActivePeriod] = useState('month'); // 'day' | 'month' | 'year'
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

    const fetchBestPerformingMenu = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
            const restaurantId = getRestaurantId();
            const url = `${baseUrl}/api/v1/reports/best-performing-menu`;
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
                setError(data.message || 'Failed to load menu performance report');
            }
        } catch (err) {
            console.error('Error fetching best performing menu:', err);
            setError(err.message || 'Failed to load menu performance report');
        } finally {
            setLoading(false);
        }
    }, [accessToken, getRestaurantId]);

    useEffect(() => {
        fetchBestPerformingMenu();
    }, [fetchBestPerformingMenu]);

    const items = reportData
        ? activePeriod === 'day'
            ? reportData.by_day || []
            : activePeriod === 'month'
                ? reportData.by_month || []
                : reportData.by_year || []
        : [];

    const periodLabels = { day: 'By Day', month: 'By Month', year: 'By Year' };

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
                    <h1 className="text-[28px] font-bold text-[#111827] mb-1">Menu Performance</h1>
                    <p className="text-[14px] text-[#6B7280]">Identify top-selling items and category breakdowns.</p>
                    {reportData?.restaurant_name && (
                        <p className="text-[13px] text-[#6B7280] mt-1 font-medium">{reportData.restaurant_name}</p>
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
                {!loading && !error && reportData && (
                    <>
                        <div className="flex gap-2 mb-6">
                            {(['day', 'month', 'year']).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setActivePeriod(key)}
                                    className={`px-4 py-2 rounded-[8px] text-[14px] font-medium transition-colors ${
                                        activePeriod === key
                                            ? 'bg-primary text-white'
                                            : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50'
                                    }`}
                                >
                                    {periodLabels[key]}
                                </button>
                            ))}
                        </div>
                        <div className="bg-[#FFFFFF] border border-[#00000033] rounded-[16px] overflow-hidden">
                            {items.length === 0 ? (
                                <div className="p-8 text-center text-[#6B7280] text-[14px] flex flex-col items-center gap-2">
                                    <TrendingUp className="w-10 h-10 text-gray-300" />
                                    No data for this period.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-[#E5E7EB] bg-gray-50/80">
                                                <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Rank</th>
                                                <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Dish Name</th>
                                                <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Qty Sold</th>
                                                <th className="px-5 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((row) => (
                                                <tr key={row.dish_id || row.dish_name} className="border-b border-[#E5E7EB] hover:bg-gray-50/50">
                                                    <td className="px-5 py-3 text-[14px] font-medium text-[#111827]">{row.rank ?? '--'}</td>
                                                    <td className="px-5 py-3 text-[14px] text-[#111827]">{row.dish_name ?? '--'}</td>
                                                    <td className="px-5 py-3 text-[14px] text-[#6B7280]">{row.quantity_sold?.toLocaleString() ?? '--'}</td>
                                                    <td className="px-5 py-3 text-[14px] font-medium text-[#111827]">{formatCurrency(row.revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MenuPerformancePage;
