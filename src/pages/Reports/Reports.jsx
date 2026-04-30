import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import ReportsMain from '../../components/Reports/ReportsMain';
import { downloadReportCardPdf } from '../../utils/reportCardPdfDownload';

const REPORTS_API_BASE = 'https://api.baaie.com';

const Reports = () => {
    const navigate = useNavigate();
    const [dashboardCards, setDashboardCards] = useState(null);
    const [pdfDownloadingId, setPdfDownloadingId] = useState(null);
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
        if (id === 'customer') {
            navigate('/reports/customer-loyalty');
        }
        if (id === 'delivery') {
            navigate('/reports/delivery');
        }
        if (id === 'accounting') {
            navigate('/reports/accounting-tax');
        }
        if (id === 'integration') {
            navigate('/reports/integration');
        }
    };

    const handleDownloadPdf = async (id) => {
        if (!accessToken) {
            toast.error('Please sign in to download');
            return;
        }
        const tid = toast.loading('Preparing PDF…');
        setPdfDownloadingId(id);
        try {
            await downloadReportCardPdf(id, {
                accessToken,
                restaurantId: getRestaurantId(),
            });
            toast.success('PDF downloaded', { id: tid });
        } catch (e) {
            toast.error(e?.message || 'Download failed', { id: tid });
        } finally {
            setPdfDownloadingId(null);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-12">
            <ReportsMain
                onSelectReport={handleSelectReport}
                onDownloadPdf={handleDownloadPdf}
                downloadingReportId={pdfDownloadingId}
                dashboardCards={dashboardCards}
            />
        </div>
    );
};

export default Reports;
