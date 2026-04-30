import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    buildSalesReportPdf,
    buildSalesReportQuery,
    DEFAULT_SALES_FILTERS,
    PDF_PRIMARY,
    REPORTS_API_BASE,
} from './salesReportPdf';
import { drawTrendLineChart } from './reportPdfCharts';

function baseUrl() {
    return (import.meta.env.VITE_BACKEND_URL || REPORTS_API_BASE).replace(/\/$/, '');
}

function jsonHeaders(accessToken, restaurantId) {
    return {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
    };
}

function extractInnerData(json) {
    if (!json || typeof json !== 'object') return null;
    const inner = json.data?.data ?? json.data;
    return inner && typeof inner === 'object' ? inner : null;
}

function fmtMoney(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return '—';
    return `$${x.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function addPdfHeader(doc, title, { restaurantName, dateRangeLabel } = {}) {
    const pageW = doc.internal.pageSize.getWidth();
    let y = 18;
    doc.setFontSize(20);
    doc.setTextColor(...PDF_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageW / 2, y, { align: 'center' });
    y += 9;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    if (restaurantName) {
        doc.text(restaurantName, pageW / 2, y, { align: 'center' });
        y += 5;
    }
    if (dateRangeLabel) {
        doc.text(dateRangeLabel, pageW / 2, y, { align: 'center' });
        y += 5;
    }
    doc.text(`Generated ${new Date().toLocaleString()}`, pageW / 2, y, { align: 'center' });
    return y + 12;
}

function formatOrderStatus(status) {
    if (status == null || status === '') return '—';
    const s = String(status).replace(/_/g, ' ');
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtMinutes(v) {
    if (v == null || v === '') return '—';
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return `${n} min`;
}

export function buildOrderReportPdf(data) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let y = addPdfHeader(doc, 'Order Report', {
        restaurantName: data.restaurant_name,
        dateRangeLabel: data.date_range_label,
    });

    const stats = data.stats || {};
    const daysApplied = data.filters_applied?.days;
    autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: [
            ['Total orders', String(stats.total_orders ?? 0)],
            ['Avg prep time', fmtMinutes(stats.avg_prep_time_min)],
            ['Avg delivery time', fmtMinutes(stats.avg_delivery_time_min)],
            ['Cancelled', String(stats.cancelled ?? 0)],
            ['Completed', String(stats.completed ?? 0)],
            [
                'Success rate',
                stats.success_rate_percent != null && stats.success_rate_percent !== ''
                    ? `${Number(stats.success_rate_percent)}%`
                    : '—',
            ],
            ...(daysApplied != null ? [['Period (days)', String(daysApplied)]] : []),
        ],
        theme: 'grid',
        headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 10 },
        margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;

    const bySource = Array.isArray(data.orders_by_source) ? data.orders_by_source : [];
    if (bySource.length > 0) {
        if (y > 235) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        doc.text('Orders by source', 14, y);
        y += 6;
        autoTable(doc, {
            startY: y,
            head: [['Source', 'Revenue', 'Orders', '% of mix']],
            body: bySource.map((r) => [
                String(r.source || '—'),
                fmtMoney(r.revenue),
                String(r.order_count ?? 0),
                r.percent != null ? `${Number(r.percent)}%` : '—',
            ]),
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 10;
    }

    const recent = Array.isArray(data.recent_orders) ? data.recent_orders.slice(0, 45) : [];
    if (recent.length > 0) {
        if (y > 220) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Recent orders', 14, y);
        y += 6;
        autoTable(doc, {
            startY: y,
            head: [['Order', 'Customer', 'Items', 'Amount', 'Status', 'Source', 'Prep', 'Delivery']],
            body: recent.map((r) => [
                String(r.order_number || '—').slice(0, 14),
                String(r.customer || '—').slice(0, 22),
                String(r.items_count ?? '—'),
                fmtMoney(r.amount),
                formatOrderStatus(r.status),
                String(r.source || '—').slice(0, 14),
                fmtMinutes(r.prep_time_min),
                fmtMinutes(r.delivery_time_min),
            ]),
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 7 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 },
        });
    }

    return doc;
}

function buildCustomerLoyaltyPdf(data) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = addPdfHeader(doc, 'Customer & Loyalty Report', {
        restaurantName: data.restaurant_name,
        dateRangeLabel: data.date_range_label,
    });

    const stats = data.stats || {};
    autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: [
            ['Total customers', String(stats.total_customers ?? 0)],
            ['New customers', String(stats.new_customers ?? 0)],
            ['Loyalty members', String(stats.loyalty_members ?? 0)],
            ['Points earned', String(stats.total_points_earned ?? 0)],
            ['Points redeemed', String(stats.total_points_redeemed ?? 0)],
        ],
        theme: 'grid',
        headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 10 },
        margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;

    const trend = Array.isArray(data.trend) ? data.trend : [];
    const chartRows = trend.map((t) => ({ label: t.label || t.date, value: Number(t.value) || 0 }));
    if (chartRows.length > 0) {
        if (y + 50 > 285) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        doc.text('Daily loyalty points', 14, y);
        y += 6;
        y = drawTrendLineChart(doc, 14, y, pageW - 28, 42, chartRows, {
            title: '',
            lineColor: PDF_PRIMARY,
        });
        y += 6;
    }

    const customers = Array.isArray(data.customers) ? data.customers.slice(0, 40) : [];
    if (customers.length > 0) {
        if (y > 240) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Customers (sample)', 14, y);
        y += 6;
        autoTable(doc, {
            startY: y,
            head: [['Name', 'Email', 'Orders', 'Spent', 'Earned', 'Redeemed', 'Balance']],
            body: customers.map((c) => [
                c.customer_name || '—',
                (c.email || '—').slice(0, 28),
                String(c.order_count ?? 0),
                fmtMoney(c.total_spent),
                String(c.points_earned ?? 0),
                String(c.points_redeemed ?? 0),
                String(c.points_balance ?? 0),
            ]),
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 },
        });
    }
    return doc;
}

function buildDeliveryPdf(data) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = addPdfHeader(doc, 'Delivery Report', {
        restaurantName: data.restaurant_name,
        dateRangeLabel: data.date_range_label,
    });

    const stats = data.stats || {};
    autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: [
            ['Total deliveries', String(stats.total_deliveries ?? 0)],
            ['Delivered', String(stats.delivered_count ?? 0)],
            ['Cancelled', String(stats.cancelled_count ?? 0)],
            ['Avg delivery time (min)', String(stats.avg_delivery_time_min ?? '—')],
            ['On-time rate %', String(stats.on_time_rate_percent ?? '—')],
        ],
        theme: 'grid',
        headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 10 },
        margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;

    const trend = Array.isArray(data.trend) ? data.trend : [];
    const chartRows = trend.map((t) => ({ label: t.label || t.date, value: Number(t.value) || 0 }));
    if (chartRows.length > 0) {
        if (y + 48 > 285) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Deliveries by day', 14, y);
        y += 6;
        y = drawTrendLineChart(doc, 14, y, pageW - 28, 40, chartRows, {
            title: '',
            lineColor: [8, 145, 178],
        });
        y += 8;
    }

    const deliveries = Array.isArray(data.deliveries) ? data.deliveries.slice(0, 35) : [];
    if (deliveries.length > 0) {
        if (y > 230) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Deliveries (sample)', 14, y);
        y += 6;
        autoTable(doc, {
            startY: y,
            head: [['Order', 'Customer', 'Status', 'Provider', 'Total']],
            body: deliveries.map((r) => [
                r.order_number || '—',
                (r.customer_name || '—').slice(0, 18),
                String(r.status || '—'),
                String(r.provider || '—'),
                fmtMoney(r.total_amount),
            ]),
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 },
        });
    }
    return doc;
}

function buildAccountingPdf(data) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = addPdfHeader(doc, 'Accounting & Tax Report', {
        restaurantName: data.restaurant_name,
        dateRangeLabel: data.date_range_label,
    });

    const stats = data.stats || {};
    autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: [
            ['Gross sales', fmtMoney(stats.gross_sales)],
            ['Taxable sales', fmtMoney(stats.taxable_sales)],
            ['Tax collected', fmtMoney(stats.tax_collected)],
            ['Refunds', fmtMoney(stats.refunds)],
            ['Net sales', fmtMoney(stats.net_sales)],
            ['Commission', fmtMoney(stats.commission)],
            ['Platform fees', fmtMoney(stats.platform_fees)],
        ],
        theme: 'grid',
        headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 10 },
        margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;

    const trend = Array.isArray(data.trend) ? data.trend : [];
    const chartRows = trend.map((t) => ({ label: t.label || t.date, value: Number(t.value) || 0 }));
    if (chartRows.length > 0) {
        if (y + 48 > 285) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Daily net movement', 14, y);
        y += 6;
        y = drawTrendLineChart(doc, 14, y, pageW - 28, 40, chartRows, {
            title: '',
            lineColor: [99, 102, 241],
            showZeroLine: true,
        });
        y += 8;
    }

    const breakdown = Array.isArray(data.breakdown) ? data.breakdown : [];
    if (breakdown.length > 0) {
        if (y > 220) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Daily breakdown', 14, y);
        y += 6;
        autoTable(doc, {
            startY: y,
            head: [['Period', 'Gross', 'Tax', 'Refunds', 'Net']],
            body: breakdown.map((r) => [
                r.label || r.date || '—',
                fmtMoney(r.gross_sales),
                fmtMoney(r.tax_collected),
                fmtMoney(r.refunds),
                fmtMoney(r.net_sales),
            ]),
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            margin: { left: 14, right: 14 },
        });
    }
    return doc;
}

function buildIntegrationPdf(data) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = addPdfHeader(doc, 'Integration Report', {
        restaurantName: data.restaurant_name,
        dateRangeLabel: data.date_range_label,
    });

    const stats = data.stats || {};
    autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: [
            ['Total integrated orders', String(stats.total_integrated_orders ?? 0)],
            ['DoorDash orders', String(stats.doordash_orders ?? 0)],
            ['Internal orders', String(stats.internal_orders ?? 0)],
            ['Cancelled deliveries', String(stats.cancelled_deliveries ?? 0)],
            ['Webhook events', String(stats.webhook_events ?? 0)],
            ['Webhook failures', String(stats.webhook_failures ?? 0)],
        ],
        theme: 'grid',
        headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 10 },
        margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;

    const trend = Array.isArray(data.trend) ? data.trend : [];
    const chartRows = trend.map((t) => ({ label: t.label || t.date, value: Number(t.value) || 0 }));
    if (chartRows.length > 0) {
        if (y + 48 > 285) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Integrated orders by day', 14, y);
        y += 6;
        y = drawTrendLineChart(doc, 14, y, pageW - 28, 40, chartRows, {
            title: '',
            lineColor: [234, 88, 12],
        });
        y += 8;
    }

    const breakdown = Array.isArray(data.breakdown) ? data.breakdown : [];
    if (breakdown.length > 0) {
        if (y > 240) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Provider breakdown', 14, y);
        y += 6;
        autoTable(doc, {
            startY: y,
            head: [['Provider', 'Total', 'Delivered', 'Cancelled', 'Avg min']],
            body: breakdown.map((r) => [
                String(r.provider || '—'),
                String(r.total_deliveries ?? 0),
                String(r.delivered ?? 0),
                String(r.cancelled ?? 0),
                String(r.avg_delivery_time_min ?? 0),
            ]),
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            margin: { left: 14, right: 14 },
        });
    }
    return doc;
}

function buildMenuPerformancePdf(data) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = addPdfHeader(doc, 'Menu Performance', {
        restaurantName: data.restaurant_name,
        dateRangeLabel: undefined,
    });

    const addSection = (title, rows, mapRow) => {
        if (!rows || rows.length === 0) return;
        if (y > 245) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        doc.text(title, 14, y);
        y += 6;
        const slice = rows.slice(0, 30);
        autoTable(doc, {
            startY: y,
            head: [['Rank', 'Dish', 'Qty', 'Revenue']],
            body: slice.map(mapRow),
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 10;
    };

    const map = (row) => [
        String(row.rank ?? '—'),
        (row.dish_name || '—').slice(0, 36),
        String(row.quantity_sold ?? '—'),
        fmtMoney(row.revenue),
    ];

    addSection('By month', data.by_month, map);
    addSection('By day', data.by_day, map);
    addSection('By year', data.by_year, map);

    const revenueSeries =
        Array.isArray(data.by_day) && data.by_day.length > 0
            ? data.by_day.map((row, i) => ({
                  label: String(row.period_label || row.label || `D${i + 1}`).slice(0, 10),
                  value: Number(row.revenue) || 0,
              }))
            : Array.isArray(data.by_month)
              ? data.by_month.map((row, i) => ({
                    label: String(row.period_label || row.label || `M${i + 1}`).slice(0, 10),
                    value: Number(row.revenue) || 0,
                }))
              : [];

    if (revenueSeries.length > 1) {
        if (y + 48 > 285) {
            doc.addPage();
            y = 16;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Revenue trend (by row order)', 14, y);
        y += 6;
        drawTrendLineChart(doc, 14, y, pageW - 28, 38, revenueSeries, {
            title: '',
            lineColor: [245, 158, 11],
        });
    }

    return doc;
}

/**
 * Fetch latest report data for a dashboard card and save as PDF.
 */
export async function downloadReportCardPdf(reportId, { accessToken, restaurantId } = {}) {
    const b = baseUrl();
    const h = jsonHeaders(accessToken, restaurantId);
    const dateStr = new Date().toISOString().slice(0, 10);

    if (!accessToken) {
        throw new Error('Please sign in to download');
    }

    switch (reportId) {
        case 'sales': {
            const q = buildSalesReportQuery(DEFAULT_SALES_FILTERS);
            const res = await fetch(`${b}/api/v1/reports/sales-report?${q}`, { headers: h });
            const json = await res.json();
            if (!res.ok || json.code !== 'SUCCESS_200' || !json.data) {
                throw new Error(json.message || 'Failed to load sales report');
            }
            buildSalesReportPdf(json.data).save(`sales-report-${dateStr}.pdf`);
            return;
        }
        case 'order': {
            const res = await fetch(`${b}/api/v1/reports/order-report?days=30`, { headers: h });
            const json = await res.json();
            if (!res.ok || json.code !== 'SUCCESS_200' || !json.data) {
                throw new Error(json.message || 'Failed to load order report');
            }
            buildOrderReportPdf(json.data).save(`order-report-${dateStr}.pdf`);
            return;
        }
        case 'menu': {
            const res = await fetch(`${b}/api/v1/reports/best-performing-menu`, { headers: h });
            const json = await res.json();
            if (!res.ok || json.code !== 'SUCCESS_200' || !json.data) {
                throw new Error(json.message || 'Failed to load menu performance');
            }
            buildMenuPerformancePdf(json.data).save(`menu-performance-${dateStr}.pdf`);
            return;
        }
        case 'customer': {
            const res = await fetch(`${b}/api/v1/reports/customers-loyalty/analytics`, { headers: h });
            const json = await res.json();
            const inner = extractInnerData(json);
            if (!res.ok || !inner) {
                throw new Error(json.message || json.detail || 'Failed to load loyalty report');
            }
            buildCustomerLoyaltyPdf(inner).save(`customer-loyalty-${dateStr}.pdf`);
            return;
        }
        case 'delivery': {
            const res = await fetch(`${b}/api/v1/reports/delivery/analytics`, { headers: h });
            const json = await res.json();
            const inner = extractInnerData(json);
            if (!res.ok || !inner) {
                throw new Error(json.message || json.detail || 'Failed to load delivery report');
            }
            buildDeliveryPdf(inner).save(`delivery-report-${dateStr}.pdf`);
            return;
        }
        case 'accounting': {
            const res = await fetch(`${b}/api/v1/reports/accounting-tax`, { headers: h });
            const json = await res.json();
            const inner = extractInnerData(json);
            if (!res.ok || !inner) {
                throw new Error(json.message || json.detail || 'Failed to load accounting report');
            }
            buildAccountingPdf(inner).save(`accounting-tax-${dateStr}.pdf`);
            return;
        }
        case 'integration': {
            const res = await fetch(`${b}/api/v1/reports/integration`, { headers: h });
            const json = await res.json();
            const inner = extractInnerData(json);
            if (!res.ok || !inner) {
                throw new Error(json.message || json.detail || 'Failed to load integration report');
            }
            buildIntegrationPdf(inner).save(`integration-report-${dateStr}.pdf`);
            return;
        }
        default:
            throw new Error('PDF download is not available for this report yet');
    }
}
