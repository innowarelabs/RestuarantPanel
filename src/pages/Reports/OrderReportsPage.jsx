import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import OrderReports from '../../components/Reports/OrderReports';
import { buildOrderReportQuery, DEFAULT_ORDER_REPORT_FILTERS, dateRangeToDays } from '../../components/Reports/reportsFilterConstants';

const REPORTS_API_BASE = 'https://api.baaie.com';

function parseFilenameFromContentDisposition(header) {
    if (!header || typeof header !== 'string') return null;
    const star = /filename\*=UTF-8''([^;\n]+)/i.exec(header);
    if (star) {
        try {
            return decodeURIComponent(star[1].trim().replace(/^["']|["']$/g, ''));
        } catch {
            return star[1];
        }
    }
    const quoted = /filename\s*=\s*"([^"]+)"/i.exec(header);
    if (quoted) return quoted[1];
    const plain = /filename\s*=\s*([^;\n]+)/i.exec(header);
    if (plain) return plain[1].trim().replace(/^["']|["']$/g, '');
    return null;
}

function triggerOrderReportCsvDownload(csvText, downloadName) {
    const name = (downloadName || 'order-report').replace(/[/\\]/g, '');
    const finalName = /\.csv$/i.test(name) ? name : `${name}.csv`;
    const blob = new Blob(['\uFEFF', csvText], { type: 'text/csv;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = finalName;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(blobUrl);
    }, 250);
}

function triggerOrderReportPdfDownload(blob, downloadName) {
    const name = (downloadName || 'order-report').replace(/[/\\]/g, '');
    const finalName = /\.pdf$/i.test(name) ? name : `${name}.pdf`;
    const pdfBlob =
        blob.type && blob.type.includes('pdf')
            ? blob
            : new Blob([blob], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = finalName;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(blobUrl);
    }, 250);
}

const OrderReportsPage = () => {
    const navigate = useNavigate();
    const [orderReportData, setOrderReportData] = useState(null);
    const [orderReportLoading, setOrderReportLoading] = useState(false);
    const [orderReportError, setOrderReportError] = useState(null);
    const [appliedOrderFilters, setAppliedOrderFilters] = useState(() => ({ ...DEFAULT_ORDER_REPORT_FILTERS }));
    const [orderReportPdfDownloading, setOrderReportPdfDownloading] = useState(false);
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const orderReportDays = useMemo(() => dateRangeToDays(appliedOrderFilters.dateRange), [appliedOrderFilters.dateRange]);

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

    const fetchOrderReport = useCallback(
        async (filters) => {
            const f = { ...DEFAULT_ORDER_REPORT_FILTERS, ...filters };
            try {
                setOrderReportLoading(true);
                setOrderReportError(null);
                const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
                const restaurantId = getRestaurantId();
                const q = buildOrderReportQuery(f);
                const url = `${baseUrl}/api/v1/reports/order-report?${q}`;
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
        },
        [accessToken, getRestaurantId]
    );

    useEffect(() => {
        fetchOrderReport({ ...DEFAULT_ORDER_REPORT_FILTERS });
    }, [fetchOrderReport]);

    const applyOrderReportFilters = useCallback(
        (nextFilters) => {
            const f = { ...DEFAULT_ORDER_REPORT_FILTERS, ...nextFilters };
            setAppliedOrderFilters(f);
            fetchOrderReport(f);
        },
        [fetchOrderReport]
    );

    const handleExportPdf = useCallback(async () => {
        try {
            setOrderReportPdfDownloading(true);
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
            const restaurantId = getRestaurantId();
            const q = buildOrderReportQuery(appliedOrderFilters);
            const url = `${baseUrl}/api/v1/reports/order-report/export/pdf?${q}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            const cd = res.headers.get('content-disposition');

            if (!res.ok) {
                const errText = await res.text();
                let message = `PDF export failed (${res.status})`;
                if (ct.includes('application/json')) {
                    try {
                        const j = JSON.parse(errText);
                        if (typeof j.message === 'string') message = j.message;
                    } catch {
                        /* ignore */
                    }
                }
                console.error('[order-report/export/pdf]', message, errText.slice(0, 400));
                return;
            }

            if (ct.includes('application/json')) {
                const data = await res.json();
                console.error('[order-report/export/pdf]', data?.message || 'Unexpected JSON body', data);
                return;
            }

            if (
                ct.includes('application/pdf') ||
                ct.includes('/pdf') ||
                ct.includes('application/octet-stream')
            ) {
                const blob = await res.blob();
                const defaultName = `order-report-${new Date().toISOString().slice(0, 10)}.pdf`;
                const fromHeader = parseFilenameFromContentDisposition(cd);
                const filename =
                    fromHeader && fromHeader.trim().length > 0 ? fromHeader.trim() : defaultName;
                triggerOrderReportPdfDownload(blob, filename);
                return;
            }

            const text = await res.text();
            console.error('[order-report/export/pdf] Unknown content-type', ct, text.slice(0, 400));
        } catch (err) {
            console.error('[order-report/export/pdf]', err);
        } finally {
            setOrderReportPdfDownloading(false);
        }
    }, [accessToken, getRestaurantId, appliedOrderFilters]);

    const handleExportCsv = useCallback(async () => {
        try {
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
            const restaurantId = getRestaurantId();
            const q = buildOrderReportQuery(appliedOrderFilters);
            const url = `${baseUrl}/api/v1/reports/order-report/export/csv?${q}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            const cd = res.headers.get('content-disposition');
            const bodyText = await res.text();

            if (!res.ok) {
                let message = `CSV export failed (${res.status})`;
                if (ct.includes('application/json')) {
                    try {
                        const j = JSON.parse(bodyText);
                        if (typeof j.message === 'string') message = j.message;
                    } catch {
                        /* ignore */
                    }
                }
                console.error('[order-report/export/csv]', message, bodyText.slice(0, 400));
                return;
            }

            if (ct.includes('application/json') || bodyText.trimStart().startsWith('{')) {
                try {
                    const data = JSON.parse(bodyText);
                    console.error('[order-report/export/csv]', data?.message || 'Unexpected JSON body', data);
                } catch {
                    console.error('[order-report/export/csv] Unexpected body', bodyText.slice(0, 400));
                }
                return;
            }

            const treatAsCsv =
                ct.includes('text/csv') ||
                ct.includes('application/csv') ||
                ct.includes('csv') ||
                ct.includes('text/plain') ||
                ct.length === 0;

            if (treatAsCsv) {
                const defaultName = `order-report-${new Date().toISOString().slice(0, 10)}.csv`;
                const fromHeader = parseFilenameFromContentDisposition(cd);
                const filename =
                    fromHeader && fromHeader.trim().length > 0 ? fromHeader.trim() : defaultName;
                triggerOrderReportCsvDownload(bodyText, filename);
            } else {
                console.error('[order-report/export/csv] Unknown content-type', ct, bodyText.slice(0, 400));
            }
        } catch (err) {
            console.error('[order-report/export/csv]', err);
        }
    }, [accessToken, getRestaurantId, appliedOrderFilters]);

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
                pdfExporting={orderReportPdfDownloading}
            />
        </div>
    );
};

export default OrderReportsPage;
