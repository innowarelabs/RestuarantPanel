/**
 * Draw a simple line chart in jsPDF (mm). Works with positive and negative values.
 */
export function drawTrendLineChart(doc, x, y, w, h, rows, options = {}) {
    const {
        valueKey = 'value',
        title = 'Trend',
        lineColor = [221, 47, 38],
        showZeroLine = true,
    } = options;

    const vals = rows.map((r) => Number(r[valueKey]));
    if (rows.length === 0 || vals.every((v) => !Number.isFinite(v))) {
        doc.setDrawColor(220);
        doc.rect(x, y, w, h);
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(title || 'Trend', x + 3, y + 6);
        doc.setFontSize(8);
        doc.text('No data', x + 3, y + 14);
        return y + h;
    }

    let minV = Math.min(...vals, 0);
    let maxV = Math.max(...vals, 0);
    if (minV === maxV) {
        minV -= 1;
        maxV += 1;
    }
    const range = maxV - minV || 1;

    const padL = 12;
    const padR = 4;
    const padT = 8;
    const padB = 10;
    const plotX = x + padL;
    const plotY = y + padT;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    doc.setDrawColor(230);
    doc.rect(x, y, w, h);
    if (title) {
        doc.setFontSize(9);
        doc.setTextColor(55);
        doc.text(title, x + 3, y + 6);
    }

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(String(Math.round(maxV * 100) / 100), x + 2, plotY + 4);
    doc.text(String(Math.round(minV * 100) / 100), x + 2, plotY + plotH);

    if (showZeroLine && minV < 0 && maxV > 0) {
        const zeroY = plotY + plotH - ((0 - minV) / range) * plotH;
        doc.setDrawColor(180);
        doc.setLineDashPattern([1, 2], 0);
        doc.line(plotX, zeroY, plotX + plotW, zeroY);
        doc.setLineDashPattern([], 0);
    }

    const n = rows.length;
    doc.setDrawColor(...lineColor);
    doc.setLineWidth(0.35);

    for (let i = 0; i < n - 1; i++) {
        const v1 = vals[i];
        const v2 = vals[i + 1];
        const x1 = plotX + (i / Math.max(n - 1, 1)) * plotW;
        const x2 = plotX + ((i + 1) / Math.max(n - 1, 1)) * plotW;
        const y1 = plotY + plotH - ((v1 - minV) / range) * plotH;
        const y2 = plotY + plotH - ((v2 - minV) / range) * plotH;
        doc.line(x1, y1, x2, y2);
    }

    const dotR = 0.6;
    for (let i = 0; i < n; i++) {
        const v = vals[i];
        const cx = plotX + (i / Math.max(n - 1, 1)) * plotW;
        const cy = plotY + plotH - ((v - minV) / range) * plotH;
        doc.setFillColor(...lineColor);
        doc.circle(cx, cy, dotR, 'F');
    }

    doc.setFontSize(6);
    doc.setTextColor(120);
    const step = n > 12 ? Math.ceil(n / 10) : 1;
    for (let i = 0; i < n; i += step) {
        const lbl = String(rows[i].label || rows[i].date || i + 1).slice(0, 8);
        const lx = plotX + (i / Math.max(n - 1, 1)) * plotW - 4;
        doc.text(lbl, lx, y + h - 2);
    }

    return y + h;
}
