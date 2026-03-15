import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ReportsMain from '../../components/Reports/ReportsMain';

const REPORTS_API_BASE = 'https://api.baaie.com';

const Reports = () => {
    const navigate = useNavigate();
    const [dashboardCards, setDashboardCards] = useState(null);
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

    useEffect(() => {
        const fetchDashboardCards = async () => {
            try {
                const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
                const restaurantId = getRestaurantId();
                const url = `${baseUrl}/api/v1/restaurants/dashboard/cards`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                    },
                });
                const data = await res.json();
                if (data?.data) {
                    setDashboardCards(data.data);
                }
            } catch (err) {
                console.error('Dashboard cards API error:', err);
            }
        };
        fetchDashboardCards();
    }, [accessToken, getRestaurantId]);

    const handleSelectReport = (id) => {
        if (id === 'order') {
            navigate('/reports/order-reports');
        }
        if (id === 'payout') {
            navigate('/reports/payout-commission');
        }
        if (id === 'menu') {
            navigate('/reports/menu-performance');
        }
        if (id === 'sales') {
            navigate('/reports/sales-reports');
        }
        // Other report types can be wired to their routes later
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-12">
            <ReportsMain onSelectReport={handleSelectReport} dashboardCards={dashboardCards} />
        </div>
    );
};

export default Reports;
