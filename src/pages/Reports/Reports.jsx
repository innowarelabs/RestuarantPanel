import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import ReportsMain from '../../components/Reports/ReportsMain';
import OrderReports from '../../components/Reports/OrderReports';
import SalesReports from '../../components/Reports/SalesReports';

const Reports = () => {
    const [view, setView] = useState('main'); // 'main', 'order', 'sales'
    const [orderReportData, setOrderReportData] = useState(null);
    const [orderReportLoading, setOrderReportLoading] = useState(false);
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

    const fetchOrderReport = useCallback(async (days = 30) => {
        try {
            setOrderReportLoading(true);
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const restaurantId = getRestaurantId();
            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/reports/order-report?days=${days}`;
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
                setOrderReportData(data.data);
            }
        } catch (error) {
            console.error('Error fetching order report:', error);
        } finally {
            setOrderReportLoading(false);
        }
    }, [accessToken, getRestaurantId]);

    useEffect(() => {
        fetchOrderReport();
    }, [fetchOrderReport]);

    const renderView = () => {
        switch (view) {
            case 'main':
                return <ReportsMain onSelectReport={(id) => setView(id)} />;
            case 'order':
                return (
                    <OrderReports 
                        onBack={() => setView('main')} 
                        reportData={orderReportData}
                        loading={orderReportLoading}
                        onRefresh={fetchOrderReport}
                    />
                );
            case 'sales':
                return <SalesReports onBack={() => setView('main')} />;
            default:
                return <ReportsMain onSelectReport={(id) => setView(id)} />;
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-12">
            {renderView()}
        </div>
    );
};

export default Reports;
