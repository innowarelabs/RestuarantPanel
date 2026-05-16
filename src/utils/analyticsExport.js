import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ANALYTICS_NO_DATA, ANALYTICS_CARD_NA } from '../components/Analytics/analyticsCopy';

const BRAND = [221, 47, 38];
const HEADER_H_MM = 22;

function escapeCsv(cell) {
    const s = String(cell ?? '');
    if (/[,"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function csvLine(cells) {
    return cells.map(escapeCsv).join(',');
}

function periodLabelFromData(d) {
    if (!d) return '—';
    const days = d?.orders?.period_days ?? d?.revenue?.period_days;
    return days != null ? `Last ${days} days` : 'Selected period';
}

function buildStatRows(analyticsData, analyticsLoading) {
    const formatPct = (n, digits = 1) => {
        if (n == null || Number.isNaN(Number(n))) return '0';
        return Number(n).toFixed(digits);
    };
    const formatMoney = (n) => {
        if (n == null || Number.isNaN(Number(n))) return '$0';
        return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };
    const pl = periodLabelFromData(analyticsData);
    if (!analyticsData) {
        const dash = analyticsLoading ? '…' : '-';
        return [
            { label: 'Total Orders', value: dash, note: '—', extra: '' },
            { label: 'Total Revenue', value: dash, note: '—', extra: '' },
            { label: 'Avg Order Value', value: dash, note: '—', extra: '' },
            { label: 'New Customer', value: dash, note: '—', extra: '' },
            { label: 'Returning Customers', value: dash, note: '—', extra: '' },
            { label: 'Cancellation Rate', value: dash, note: '—', extra: '' },
        ];
    }
    const o = analyticsData.orders || {};
    const r = analyticsData.revenue || {};
    const total = Number(o.total_orders_period) || 0;
    const completed = Number(o.completed_orders_period) || 0;
    const cancelled = Number(o.cancelled_orders_period) || 0;
    const cancelRate = total > 0 ? formatPct((cancelled / total) * 100) : '0';
    const completeShare = total > 0 ? formatPct((completed / total) * 100, 0) : '0';
    const mrr = o.mrr_growth_percent;
    const mrrStr = mrr != null ? `${Number(mrr) >= 0 ? '+' : ''}${formatPct(mrr, 1)}%` : '—';
    const nc = analyticsData.new_customers_last_24h;
    const ncProvided = nc != null && nc !== '';
    const ncValue = ncProvided ? String(Number(nc)) : '-';
    const ncNote = ncProvided ? 'Last 24 hours' : 'Not provided for this period';

    return [
        { label: 'Total Orders', value: String(total), note: pl, extra: '' },
        { label: 'Total Revenue', value: formatMoney(r.revenue_period ?? o.total_revenue_period), note: pl, extra: mrrStr !== '—' ? `MRR growth: ${mrrStr}` : '' },
        { label: 'Avg Order Value', value: `$${formatPct(o.average_order_value_period ?? 0, 2)}`, note: pl, extra: '' },
        { label: 'New Customer', value: ncValue, note: ncNote, extra: '' },
        { label: 'Returning Customers', value: `${completeShare}%`, note: 'Completed share of orders', extra: '' },
        { label: 'Cancellation Rate', value: `${cancelRate}%`, note: 'of orders in period', extra: '' },
    ];
}

function buildCustomerRows(data, loading) {
    if (loading) return [{ key: 'Status', value: 'Loading…' }];
    if (!data) return [{ key: 'Status', value: ANALYTICS_NO_DATA }];
    const subStats = data?.subscriptions?.stats;
    const planDist = data?.subscriptions?.plan_distribution;
    const loyalty =
        subStats?.active_subscriptions != null && !Number.isNaN(Number(subStats.active_subscriptions))
            ? String(Number(subStats.active_subscriptions))
            : ANALYTICS_CARD_NA;
    let nonLoyalty = ANALYTICS_CARD_NA;
    if (planDist) {
        const b = Number(planDist.basic_plan) || 0;
        const s = Number(planDist.standard_plan) || 0;
        nonLoyalty = String(b + s);
    } else if (data.subscriptions != null) {
        nonLoyalty = '0';
    }
    return [
        { key: 'Loyalty Members', value: loyalty },
        { key: 'Non-Loyalty', value: nonLoyalty },
        { key: 'Most Redeemed Reward', value: ANALYTICS_CARD_NA },
        { key: 'Avg Points Redeemed per Order', value: ANALYTICS_CARD_NA },
    ];
}

function buildPlatformRows(performance, loading) {
    if (loading) return [['Loading…', '', '']];
    if (!performance) return [[ANALYTICS_NO_DATA, '', '']];
    const list = performance?.performance_comparison;
    const m = performance?.restaurant_metrics?.[0];
    const revenueRow = Array.isArray(list) ? list.find((x) => x.metric === 'revenue') : null;
    const ordersRow = Array.isArray(list) ? list.find((x) => x.metric === 'orders') : null;
    const g = performance?.insights?.[0] || 'Live comparison';
    return [
        ['Revenue (benchmark)', revenueRow?.value != null ? String(revenueRow.value) : ANALYTICS_NO_DATA, g],
        ['Orders (benchmark)', ordersRow?.value != null ? String(ordersRow.value) : ANALYTICS_NO_DATA, m?.restaurant_name ? `Venue: ${m.restaurant_name}` : 'Dashboard snapshot'],
        ['Delivery performance', m?.avg_delivery_time || ANALYTICS_NO_DATA, m?.orders_per_day != null ? `${m.orders_per_day} orders / day` : ANALYTICS_NO_DATA],
    ];
}

function breakdownRows(orderBreakdown, loading) {
    if (loading) return [['Loading…', '', '']];
    if (!orderBreakdown) return [[ANALYTICS_NO_DATA, '', '']];
    const ob = orderBreakdown;
    return [
        ['Delivery', String(ob.delivery ?? 0), ob.delivery_percent != null ? `${ob.delivery_percent}%` : '—'],
        ['Pickup', String(ob.pickup ?? 0), ob.pickup_percent != null ? `${ob.pickup_percent}%` : '—'],
        ['Dine-in', String(ob.dine_in ?? 0), ob.dine_in_percent != null ? `${ob.dine_in_percent}%` : '—'],
    ];
}

/**
 * @param {object} params
 */
export function buildExportPayload({
    analyticsData,
    analyticsLoading,
    salesSeries,
    orderStatusPie,
    peakHourly,
    peakSummary,
    weekdaySeries,
    weekdayPeak,
    orderBreakdown,
    performance,
    topItemsPeriod,
    topItemsRows,
    restaurantName,
}) {
    const mainPeriod = periodLabelFromData(analyticsData);
    const topPeriodLabel = topItemsPeriod === '7d' ? 'Last 7 days' : 'Last 30 days';
    return {
        generatedAt: new Date().toISOString(),
        restaurantName: restaurantName || 'Restaurant',
        mainPeriod,
        topItemsPeriodLabel: topPeriodLabel,
        statRows: buildStatRows(analyticsData, analyticsLoading),
        salesSeries: salesSeries || [],
        orderStatusPie: orderStatusPie || [],
        peakHourly: peakHourly || [],
        peakSummary: peakSummary || {},
        weekdaySeries: weekdaySeries || [],
        weekdayPeak: weekdayPeak || {},
        orderBreakdownRows: breakdownRows(orderBreakdown, analyticsLoading),
        customerRows: buildCustomerRows(analyticsData, analyticsLoading),
        platformRows: buildPlatformRows(performance, analyticsLoading),
        topItemsRows: topItemsRows || [],
    };
}

export function payloadToCsvString(payload) {
    const lines = [];
    lines.push(csvLine(['Analytics & Performance']));
    lines.push(csvLine(['Generated', new Date(payload.generatedAt).toLocaleString()]));
    lines.push(csvLine(['Venue', payload.restaurantName]));
    lines.push(csvLine(['Main analytics period', payload.mainPeriod]));
    lines.push('');
    lines.push(csvLine(['Key metrics']));
    lines.push(csvLine(['Metric', 'Value', 'Context', 'Notes']));
    payload.statRows.forEach((r) => lines.push(csvLine([r.label, r.value, r.note, r.extra])));

    lines.push('');
    lines.push(csvLine(['Sales trend']));
    lines.push(csvLine(['Period', 'Orders', 'Revenue']));
    if (!payload.salesSeries.length) lines.push(csvLine([ANALYTICS_NO_DATA, '', '']));
    else payload.salesSeries.forEach((p) => lines.push(csvLine([p.name, p.orders, p.revenue])));

    lines.push('');
    lines.push(csvLine(['Order status (share %)']));
    lines.push(csvLine(['Status', 'Share %']));
    if (!payload.orderStatusPie.length) lines.push(csvLine([ANALYTICS_NO_DATA, '']));
    else payload.orderStatusPie.forEach((p) => lines.push(csvLine([p.name, p.value])));

    lines.push('');
    lines.push(csvLine(['Peak hours']));
    lines.push(csvLine(['Peak window', payload.peakSummary.peakLabel || '—']));
    lines.push(csvLine(['Slow hour', payload.peakSummary.slowHourLabel || '—']));
    lines.push(csvLine(['Hour / window', 'Orders']));
    if (!payload.peakHourly.length) lines.push(csvLine([ANALYTICS_NO_DATA, '']));
    else payload.peakHourly.forEach((p) => lines.push(csvLine([p.time, p.value])));

    lines.push('');
    lines.push(csvLine(['Orders by weekday']));
    lines.push(csvLine(['Peak day', payload.weekdayPeak.peakDay || '—']));
    lines.push(csvLine(['Slow day', payload.weekdayPeak.slowDay || '—']));
    lines.push(csvLine(['Day', 'Orders']));
    if (!payload.weekdaySeries.length) lines.push(csvLine([ANALYTICS_NO_DATA, '']));
    else payload.weekdaySeries.forEach((p) => lines.push(csvLine([p.name, p.value])));

    lines.push('');
    lines.push(csvLine(['Revenue breakdown (orders by channel)']));
    lines.push(csvLine(['Channel', 'Orders', 'Raw %']));
    payload.orderBreakdownRows.forEach((r) => lines.push(csvLine(r)));

    lines.push('');
    lines.push(csvLine(['Customer insights']));
    lines.push(csvLine(['Field', 'Value']));
    payload.customerRows.forEach((r) => lines.push(csvLine([r.key, r.value])));

    lines.push('');
    lines.push(csvLine(['Platform performance']));
    lines.push(csvLine(['Metric', 'Value', 'Detail']));
    payload.platformRows.forEach((r) => lines.push(csvLine(r)));

    lines.push('');
    lines.push(csvLine([`Top selling items (${payload.topItemsPeriodLabel})`]));
    lines.push(csvLine(['Item', 'Category', 'Orders', 'Revenue', 'Share']));
    if (!payload.topItemsRows.length) lines.push(csvLine([ANALYTICS_NO_DATA, '', '', '', '']));
    else
        payload.topItemsRows.forEach((t) =>
            lines.push(csvLine([t.name, t.category, t.orders, t.revenue, t.sharePct])),
        );

    return lines.join('\n');
}

function triggerDownload(filename, mime, content) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export function downloadAnalyticsCsv(payload) {
    const stamp = new Date().toISOString().slice(0, 10);
    const name = `analytics-export-${stamp}.csv`;
    triggerDownload(name, 'text/csv;charset=utf-8', '\uFEFF' + payloadToCsvString(payload));
}

function drawHeader(doc, title, subtitle) {
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), HEADER_H_MM, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(title, 14, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(subtitle, 14, 19);
    doc.setTextColor(15, 23, 42);
}

export function downloadAnalyticsPdf(payload) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const sub = `${payload.restaurantName} · ${payload.mainPeriod} · ${new Date(payload.generatedAt).toLocaleString()}`;
    drawHeader(doc, 'Analytics & Performance', sub);

    let y = HEADER_H_MM + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Key metrics', 14, y);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
        startY: y + 2,
        head: [['Metric', 'Value', 'Context']],
        body: payload.statRows.map((r) => [r.label, r.value, r.note + (r.extra ? ` · ${r.extra}` : '')]),
        theme: 'striped',
        headStyles: { fillColor: BRAND, textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;

    const addSection = (title, tableOpts) => {
        if (y > 250) {
            doc.addPage();
            drawHeader(doc, 'Analytics & Performance (cont.)', sub);
            y = HEADER_H_MM + 8;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(title, 14, y);
        doc.setFont('helvetica', 'normal');
        autoTable(doc, {
            startY: y + 2,
            ...tableOpts,
            theme: 'striped',
            headStyles: { fillColor: BRAND, textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 10;
    };

    addSection('Sales trend', {
        head: [['Period', 'Orders', 'Revenue']],
        body:
            payload.salesSeries.length > 0
                ? payload.salesSeries.map((p) => [p.name, String(p.orders), String(p.revenue)])
                : [[ANALYTICS_NO_DATA, '', '']],
    });

    addSection('Order status', {
        head: [['Status', 'Share %']],
        body:
            payload.orderStatusPie.length > 0
                ? payload.orderStatusPie.map((p) => [p.name, String(p.value)])
                : [[ANALYTICS_NO_DATA, '']],
    });

    const peakNote = `Peak: ${payload.peakSummary.peakLabel || '—'} · Slow hour: ${payload.peakSummary.slowHourLabel || '—'}`;
    addSection(`Peak hours — ${peakNote}`, {
        head: [['Hour / window', 'Orders']],
        body:
            payload.peakHourly.length > 0
                ? payload.peakHourly.map((p) => [p.time, String(p.value)])
                : [[ANALYTICS_NO_DATA, '']],
    });

    const dayNote = `Peak day: ${payload.weekdayPeak.peakDay || '—'} · Slow day: ${payload.weekdayPeak.slowDay || '—'}`;
    addSection(`Orders by weekday — ${dayNote}`, {
        head: [['Day', 'Orders']],
        body:
            payload.weekdaySeries.length > 0
                ? payload.weekdaySeries.map((p) => [p.name, String(p.value)])
                : [[ANALYTICS_NO_DATA, '']],
    });

    addSection('Revenue breakdown (channel orders)', {
        head: [['Channel', 'Orders', '%']],
        body: payload.orderBreakdownRows,
    });

    addSection('Customer insights', {
        head: [['Field', 'Value']],
        body: payload.customerRows.map((r) => [r.key, r.value]),
    });

    addSection('Platform performance', {
        head: [['Metric', 'Value', 'Detail']],
        body: payload.platformRows,
    });

    addSection(`Top selling items — ${payload.topItemsPeriodLabel}`, {
        head: [['Item', 'Category', 'Orders', 'Revenue', 'Share']],
        body:
            payload.topItemsRows.length > 0
                ? payload.topItemsRows.map((t) => [t.name, t.category, String(t.orders), t.revenue, t.sharePct])
                : [[ANALYTICS_NO_DATA, '', '', '', '']],
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i += 1) {
        doc.setPage(i);
        const yF = doc.internal.pageSize.getHeight() - 8;
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Page ${i} of ${totalPages}`, pageW - 34, yF);
        doc.text('BAAIE Analytics', 14, yF);
        doc.setTextColor(15, 23, 42);
    }

    const stamp = new Date().toISOString().slice(0, 10);
    doc.save(`analytics-report-${stamp}.pdf`);
}
