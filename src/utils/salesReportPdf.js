import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dateRangeToDays } from '../components/Reports/reportsFilterConstants';
import { drawTrendLineChart } from './reportPdfCharts';

export const REPORTS_API_BASE = 'https://api.baaie.com';

export const PDF_PRIMARY = [221, 47, 38]; // #DD2F26

/** UI `serviceType` → API `order_type` (delivery, pickup, dine-in). */
function serviceTypeToOrderType(serviceType) {
    if (!serviceType || serviceType === 'all') return null;
    if (serviceType === 'dine_in') return 'dine-in';
    return serviceType;
}

/** UI payment dropdown → API `payment_method` strings. */
function paymentMethodToApiQueryValue(paymentMethod) {
    if (!paymentMethod || paymentMethod === 'all') return null;
    if (paymentMethod === 'card') return 'credit card';
    return paymentMethod;
}

export const DEFAULT_SALES_FILTERS = {
    serviceType: 'delivery',
    paymentMethod: 'card',
    dateRange: 'last-30',
};

export function buildSalesReportQuery(f) {
    const p = new URLSearchParams();
    p.set('days', String(dateRangeToDays(f.dateRange)));
    const orderType = serviceTypeToOrderType(f.serviceType);
    if (orderType) p.set('order_type', orderType);
    const payment = paymentMethodToApiQueryValue(f.paymentMethod);
    if (payment) p.set('payment_method', payment);
    return p.toString();
}

function formatLocalYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Inclusive window for the last N calendar days ending today (local). */
export function breakdownDateWindowFromDays(dayCount) {
    const n = Math.max(1, Number(dayCount) || 1);
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - (n - 1));
    return { from_date: formatLocalYMD(start), to_date: formatLocalYMD(end) };
}

/**
 * Query string for GET /api/v1/reports/sales-report/breakdown
 * @param {typeof DEFAULT_SALES_FILTERS} salesFilters — last-applied page filters (date range, service type, payment)
 * @param {{ orderStatus: Record<string, boolean>, payment: Record<string, boolean> }} breakdownFilters — modal (repeatable order_status / payment_method)
 */
export function buildSalesReportBreakdownQuery(salesFilters, breakdownFilters) {
    const p = new URLSearchParams();
    const days = dateRangeToDays(salesFilters.dateRange);
    p.set('days', String(days));
    p.set('granularity', 'day');
    const { from_date, to_date } = breakdownDateWindowFromDays(days);
    p.set('from_date', from_date);
    p.set('to_date', to_date);
    const orderType = serviceTypeToOrderType(salesFilters.serviceType);
    if (orderType) p.set('order_type', orderType);

    const os = breakdownFilters.orderStatus;
    if (!os.all) {
        if (os.completed) p.append('order_status', 'completed');
        if (os.cancelled) p.append('order_status', 'cancelled');
        if (os.refunded) p.append('order_status', 'refunded');
    }

    const pm = breakdownFilters.payment;
    if (!pm.all) {
        if (pm.card) p.append('payment_method', 'credit card');
        if (pm.cash) p.append('payment_method', 'cash');
        if (pm.contactless) p.append('payment_method', 'contactless');
    } else {
        const pay = paymentMethodToApiQueryValue(salesFilters.paymentMethod);
        if (pay) p.append('payment_method', pay);
    }

    return p.toString();
}

const formatCurrency = (val) => (val != null ? `$${Number(val).toLocaleString()}` : '--');

export function buildSalesReportPdf(data) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(22);
    doc.setTextColor(...PDF_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.text('Sales Report', pageW / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    if (data.restaurant_name) doc.text(data.restaurant_name, pageW / 2, y, { align: 'center' });
    y += 6;
    if (data.date_range_label) doc.text(data.date_range_label, pageW / 2, y, { align: 'center' });
    y += 6;
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageW / 2, y, { align: 'center' });
    y += 16;

    const stats = data.stats;
    if (stats) {
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, y);
        y += 8;

        const statRows = [
            ['Total Sales', formatCurrency(stats.total_sales), 'Orders Count', (stats.orders_count ?? '--').toString()],
            ['Avg Order Value', formatCurrency(stats.avg_order_value), 'Refunds', formatCurrency(stats.refunds)],
            ['Net Earnings', formatCurrency(stats.net_earnings), 'Commission', formatCurrency(stats.commission)],
        ];
        autoTable(doc, {
            startY: y,
            head: [['Metric', 'Value', 'Metric', 'Value']],
            body: statRows,
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 10 },
            columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 45 }, 2: { cellWidth: 45 }, 3: { cellWidth: 45 } },
            margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 14;
    }

    const trend = data.sales_trend || [];
    if (trend.length > 0) {
        if (y > 200) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'bold');
        doc.text('Sales Trend', 14, y);
        y += 8;
        autoTable(doc, {
            startY: y,
            head: [['Date', 'Sales', 'Orders']],
            body: trend.map((r) => [r.label || r.date || '--', formatCurrency(r.sales), (r.orders ?? '--').toString()]),
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 10 },
            margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 10;

        const chartRows = trend.map((r) => ({
            label: r.label || r.date || '',
            value: Number(r.sales) || 0,
        }));
        if (y + 55 > 285) {
            doc.addPage();
            y = 20;
        }
        y = drawTrendLineChart(doc, 14, y, pageW - 28, 45, chartRows, {
            title: 'Sales trend (chart)',
            lineColor: PDF_PRIMARY,
            showZeroLine: chartRows.some((r) => r.value < 0),
        });
        y += 8;
    }

    const daily = data.daily_breakdown || [];
    if (daily.length > 0) {
        if (y > 230) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'bold');
        doc.text('Daily Breakdown', 14, y);
        y += 8;
        autoTable(doc, {
            startY: y,
            head: [['Date', 'Orders', 'Sales', 'Refunds', 'Net Revenue']],
            body: daily.map((r) => [
                r.label || r.date || '--',
                (r.orders ?? '--').toString(),
                formatCurrency(r.sales),
                formatCurrency(r.refunds),
                formatCurrency(r.net_revenue),
            ]),
            theme: 'grid',
            headStyles: { fillColor: PDF_PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            margin: { left: 14, right: 14 },
        });
    }

    return doc;
}
