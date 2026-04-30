import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import OrderReports from '../../components/Reports/OrderReports';
import { buildOrderReportPdf } from '../../utils/reportCardPdfDownload';

const REPORTS_API_BASE = 'https://api.baaie.com';

const OrderReportsPage = () => {
    const navigate = useNavigate();
    const [orderReportData, setOrderReportData] = useState(null);
    const [orderReportLoading, setOrderReportLoading] = useState(false);
    const [orderReportError, setOrderReportError] = useState(null);
    const [orderReportDays, setOrderReportDays] = useState(30);
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
            setOrderReportError(null);
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
            const restaurantId = getRestaurantId();
            const url = `${baseUrl}/api/v1/reports/order-report?days=${days}`;
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
            } else {
                setOrderReportError(data.message || 'Failed to load order report');
            }
        } catch (error) {
            console.error('Error fetching order report:', error);
            setOrderReportError(error.message || 'Failed to load order report');
        } finally {
            setOrderReportLoading(false);
        }
    }, [accessToken, getRestaurantId]);

    useEffect(() => {
        fetchOrderReport(30);
    }, [fetchOrderReport]);

    const applyOrderReportFilters = useCallback(
        (newDays) => {
            setOrderReportDays(newDays);
            fetchOrderReport(newDays);
        },
        [fetchOrderReport]
    );

    const handleExportPdf = useCallback(() => {
        if (!orderReportData) return;
        try {
            buildOrderReportPdf(orderReportData).save(`order-report-${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error('Order report PDF export error:', err);
        }
    }, [orderReportData]);

    const handleExportCsv = useCallback(async () => {
        try {
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
            const restaurantId = getRestaurantId();
            const url = `${baseUrl}/api/v1/reports/order-report/export/csv`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('text/csv')) {
                const text = await res.text();
                const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `order-report-${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            } else if (contentType.includes('application/json')) {
                const data = await res.json();
                console.log('Order report CSV export response:', { status: res.status, ok: res.ok, contentType, data });
            } else {
                const text = await res.text();
                console.log('Order report CSV export response:', { status: res.status, ok: res.ok, contentType, data: text });
            }
        } catch (err) {
            console.error('Order report CSV export error:', err);
        }
    }, [accessToken, getRestaurantId]);

    return (
        <div className="max-w-[1600px] mx-auto">
            <OrderReports
                onBack={() => navigate('/reports')}
                reportData={orderReportData}
                loading={orderReportLoading}
                error={orderReportError}
                days={orderReportDays}
                onApplyFilters={applyOrderReportFilters}
                onExportPdf={handleExportPdf}
                onExportCsv={handleExportCsv}
            />
        </div>
    );
};

export default OrderReportsPage;
