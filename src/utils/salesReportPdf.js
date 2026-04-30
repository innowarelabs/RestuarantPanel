import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dateRangeToDays } from '../components/Reports/reportsFilterConstants';
import { drawTrendLineChart } from './reportPdfCharts';

export const REPORTS_API_BASE = 'https://api.baaie.com';

export const PDF_PRIMARY = [221, 47, 38]; // #DD2F26

export const DEFAULT_SALES_FILTERS = {
    serviceType: 'delivery',
    paymentMethod: 'card',
    platform: 'ubereats',
    dateRange: 'last-30',
};

export function buildSalesReportQuery(f) {
    const p = new URLSearchParams();
    p.set('days', String(dateRangeToDays(f.dateRange)));
    p.set('service_type', f.serviceType);
    p.set('payment_method', f.paymentMethod);
    p.set('platform', f.platform);
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
