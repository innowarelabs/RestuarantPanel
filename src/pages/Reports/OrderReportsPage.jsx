import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import OrderReports from '../../components/Reports/OrderReports';
import ScheduleReportModal from '../../components/Reports/ScheduleReportModal';
import { buildOrderReportQuery, buildRecentOrdersQuery, DEFAULT_ORDER_REPORT_FILTERS, dateRangeToDays } from '../../components/Reports/reportsFilterConstants';
import { RECENT_ORDERS_FILTER_DEFAULTS } from '../../components/Reports/RecentOrdersFilterModal';
import { buildOrderReportPdf } from '../../utils/reportCardPdfDownload';

const REPORTS_API_BASE = 'https://api.baaie.com';

/** Backend `report_type` for order-report monthly schedule + PDF upload */
const ORDER_SCHEDULE_REPORT_TYPE = 'order_report';

function extractMonthlySchedule(json, reportType) {
    if (!json || typeof json !== 'object') return null;
    const inner = json.data !== undefined ? json.data : json;
    let candidates = [];
    if (Array.isArray(inner)) candidates = inner;
    else if (Array.isArray(inner?.items)) candidates = inner.items;
    else if (Array.isArray(inner?.schedules)) candidates = inner.schedules;
    else if (inner && typeof inner === 'object' && inner.report_type) candidates = [inner];

    const row =
        candidates.find((s) => s && typeof s === 'object' && s.report_type === reportType) ||
        candidates.find((s) => s && typeof s === 'object') ||
        null;
    if (!row || typeof row !== 'object') return null;
    return {
        delivery_email: typeof row.delivery_email === 'string' ? row.delivery_email : '',
        is_active: row.is_active !== false && row.is_active !== 'false',
    };
}

function apiMessageFromBody(data) {
    if (!data || typeof data !== 'object') return null;
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
    if (typeof data.error === 'string' && data.error.trim()) return data.error.trim();
    return null;
}

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
    const [ordersBySourcePeriod, setOrdersBySourcePeriod] = useState('monthly');
    const [ordersBySourceData, setOrdersBySourceData] = useState(null);
    const [ordersBySourceLoading, setOrdersBySourceLoading] = useState(true);
    const [ordersBySourceError, setOrdersBySourceError] = useState('');
    const [recentOrdersApiData, setRecentOrdersApiData] = useState(null);
    const [recentOrdersLoading, setRecentOrdersLoading] = useState(true);
    const [recentOrdersError, setRecentOrdersError] = useState('');
    const [recentOrdersFilterApplied, setRecentOrdersFilterApplied] = useState(() => ({ ...RECENT_ORDERS_FILTER_DEFAULTS }));
    const [appliedOrderFilters, setAppliedOrderFilters] = useState(() => ({ ...DEFAULT_ORDER_REPORT_FILTERS }));
    const [orderReportPdfDownloading, setOrderReportPdfDownloading] = useState(false);
    const [scheduleReportOpen, setScheduleReportOpen] = useState(false);
    const [scheduleEmail, setScheduleEmail] = useState('');
    const [scheduleActive, setScheduleActive] = useState(true);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleSaving, setScheduleSaving] = useState(false);
    const [scheduleLoadError, setScheduleLoadError] = useState('');
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

    useEffect(() => {
        if (!scheduleReportOpen || !accessToken) return;
        let cancelled = false;
        (async () => {
            setScheduleLoading(true);
            setScheduleLoadError('');
            try {
                const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
                const restaurantId = getRestaurantId();
                const url = `${baseUrl}/api/v1/reports/schedule/monthly`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                    },
                });
                const ct = res.headers.get('content-type') || '';
                const data = ct.includes('application/json') ? await res.json() : null;
                if (!res.ok) {
                    const msg = apiMessageFromBody(data) || `Could not load schedule (${res.status})`;
                    if (!cancelled) setScheduleLoadError(msg);
                    return;
                }
                const extracted = extractMonthlySchedule(data, ORDER_SCHEDULE_REPORT_TYPE);
                if (!cancelled && extracted) {
                    setScheduleEmail(extracted.delivery_email);
                    setScheduleActive(extracted.is_active);
                }
            } catch (e) {
                if (!cancelled)
                    setScheduleLoadError(typeof e?.message === 'string' ? e.message : 'Could not load schedule');
            } finally {
                if (!cancelled) setScheduleLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [scheduleReportOpen, accessToken, getRestaurantId]);

    const handleOrderScheduleReport = useCallback(async () => {
        const email = scheduleEmail.trim();
        if (!email) {
            toast.error('Enter a delivery email');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error('Enter a valid email address');
            return;
        }
        if (!orderReportData) {
            toast.error('Load the order report first');
            return;
        }
        const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
        const restaurantId = getRestaurantId();
        setScheduleSaving(true);
        try {
            const res = await fetch(`${baseUrl}/api/v1/reports/schedule/monthly`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
                body: JSON.stringify({
                    report_type: ORDER_SCHEDULE_REPORT_TYPE,
                    delivery_email: email,
                    is_active: scheduleActive,
                }),
            });
            const ct = res.headers.get('content-type') || '';
            const data = ct.includes('application/json') ? await res.json() : null;
            if (!res.ok) {
                toast.error(apiMessageFromBody(data) || `Could not save schedule (${res.status})`);
                return;
            }

            const doc = buildOrderReportPdf(orderReportData);
            const pdf_base64 = doc.output('datauristring');
            const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const d = new Date();
            const file_name = `order-monthly-${months[d.getMonth()]}-${d.getFullYear()}.pdf`;

            const resPdf = await fetch(`${baseUrl}/api/v1/reports/schedule/monthly/send-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
                body: JSON.stringify({
                    report_type: ORDER_SCHEDULE_REPORT_TYPE,
                    pdf_base64,
                    file_name,
                }),
            });
            const ctPdf = resPdf.headers.get('content-type') || '';
            const dataPdf = ctPdf.includes('application/json') ? await resPdf.json() : null;
            if (!resPdf.ok) {
                toast.error(
                    apiMessageFromBody(dataPdf) ||
                        'Schedule saved, but the PDF could not be sent. Try again or contact support.',
                );
                return;
            }

            const msg =
                apiMessageFromBody(dataPdf) || apiMessageFromBody(data) || 'Report scheduled and PDF sent';
            toast.success(msg);
            setScheduleReportOpen(false);
        } catch (e) {
            toast.error(typeof e?.message === 'string' ? e.message : 'Could not complete scheduling');
        } finally {
            setScheduleSaving(false);
        }
    }, [accessToken, getRestaurantId, scheduleEmail, scheduleActive, orderReportData]);

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

    const fetchOrdersBySource = useCallback(
        async (period) => {
            if (!accessToken) {
                setOrdersBySourceLoading(false);
                setOrdersBySourceData(null);
                setOrdersBySourceError('');
                return;
            }
            setOrdersBySourceLoading(true);
            setOrdersBySourceError('');
            try {
                const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
                const restaurantId = getRestaurantId();
                const params = new URLSearchParams({ period });
                const url = `${baseUrl}/api/v1/reports/order-report/orders-by-source?${params.toString()}`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                    },
                });
                const data = await res.json();
                if (!res.ok) {
                    setOrdersBySourceData(null);
                    setOrdersBySourceError(apiMessageFromBody(data) || `Failed to load orders by source (${res.status})`);
                    return;
                }
                if (data.code === 'SUCCESS_200' && data.data) {
                    setOrdersBySourceData(data.data);
                } else {
                    setOrdersBySourceData(null);
                    setOrdersBySourceError(data.message || 'Failed to load orders by source');
                }
            } catch (e) {
                setOrdersBySourceData(null);
                setOrdersBySourceError(typeof e?.message === 'string' ? e.message : 'Failed to load orders by source');
            } finally {
                setOrdersBySourceLoading(false);
            }
        },
        [accessToken, getRestaurantId]
    );

    useEffect(() => {
        fetchOrdersBySource(ordersBySourcePeriod);
    }, [ordersBySourcePeriod, fetchOrdersBySource]);

    const fetchRecentOrders = useCallback(async () => {
        if (!accessToken) {
            setRecentOrdersLoading(false);
            setRecentOrdersApiData(null);
            setRecentOrdersError('');
            return;
        }
        setRecentOrdersLoading(true);
        setRecentOrdersError('');
        try {
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
            const restaurantId = getRestaurantId();
            const days = dateRangeToDays(appliedOrderFilters.dateRange);
            const q = buildRecentOrdersQuery({
                period: ordersBySourcePeriod,
                days,
                limit: 50,
                orderStatus: recentOrdersFilterApplied.orderStatus,
                payment: recentOrdersFilterApplied.payment,
            });
            const url = `${baseUrl}/api/v1/reports/order-report/recent-orders?${q}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const data = await res.json();
            if (!res.ok) {
                setRecentOrdersApiData(null);
                setRecentOrdersError(apiMessageFromBody(data) || `Failed to load recent orders (${res.status})`);
                return;
            }
            if (data.code === 'SUCCESS_200' && data.data) {
                setRecentOrdersApiData(data.data);
            } else {
                setRecentOrdersApiData(null);
                setRecentOrdersError(data.message || 'Failed to load recent orders');
            }
        } catch (e) {
            setRecentOrdersApiData(null);
            setRecentOrdersError(typeof e?.message === 'string' ? e.message : 'Failed to load recent orders');
        } finally {
            setRecentOrdersLoading(false);
        }
    }, [
        accessToken,
        getRestaurantId,
        appliedOrderFilters.dateRange,
        ordersBySourcePeriod,
        recentOrdersFilterApplied,
    ]);

    useEffect(() => {
        fetchRecentOrders();
    }, [fetchRecentOrders]);

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
                onScheduleReportClick={() => {
                    if (!accessToken) {
                        toast.error('Sign in to schedule reports');
                        return;
                    }
                    setScheduleReportOpen(true);
                }}
                ordersBySourcePeriod={ordersBySourcePeriod}
                onOrdersBySourcePeriodChange={setOrdersBySourcePeriod}
                ordersBySourceData={ordersBySourceData}
                ordersBySourceLoading={ordersBySourceLoading}
                ordersBySourceError={ordersBySourceError}
                recentOrdersApiData={recentOrdersApiData}
                recentOrdersLoading={recentOrdersLoading}
                recentOrdersError={recentOrdersError}
                recentOrdersFilterApplied={recentOrdersFilterApplied}
                onRecentOrdersFiltersApply={setRecentOrdersFilterApplied}
            />
            <ScheduleReportModal
                isOpen={scheduleReportOpen}
                onClose={() => setScheduleReportOpen(false)}
                integratedOrderMonthly
                deliveryEmail={scheduleEmail}
                onDeliveryEmailChange={setScheduleEmail}
                isScheduleActive={scheduleActive}
                onScheduleActiveChange={setScheduleActive}
                loadingSchedule={scheduleLoading}
                savingSchedule={scheduleSaving}
                onSaveSchedule={handleOrderScheduleReport}
                scheduleError={scheduleLoadError}
            />
        </div>
    );
};

export default OrderReportsPage;
