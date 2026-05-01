import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const MARGIN = 14;
const PRIMARY = [221, 47, 38];

function formatMoney(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return '$0.00';
    return `$${x.toFixed(2)}`;
}

function labelPaymentMethod(paymentMethod, orderType) {
    const u = String(paymentMethod || '').toLowerCase().replace(/_/g, ' ').trim();
    if (u === 'credit card' || u === 'card' || u === 'debit card') return 'Card';
    if (u === 'cash' || u === 'cash on delivery' || u === 'cod') {
        return `Cash on ${orderType || 'Delivery'}`;
    }
    if (!u) return '—';
    return u.charAt(0).toUpperCase() + u.slice(1);
}

function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

/** Opens the system print dialog for a PDF blob. */
function printPdfBlob(blob) {
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Print receipt');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
        'position:fixed;inset:0;visibility:hidden;width:0;height:0;border:0;pointer-events:none;';
    document.body.appendChild(iframe);

    let printed = false;
    const doPrint = () => {
        if (printed) return;
        try {
            const w = iframe.contentWindow;
            if (w) {
                w.focus();
                w.print();
                printed = true;
            }
        } catch (e) {
            console.error(e);
        }
    };

    const cleanup = () => {
        try {
            iframe.remove();
        } catch {
            /* ignore */
        }
        URL.revokeObjectURL(url);
    };

    iframe.onload = () => setTimeout(doPrint, 200);
    iframe.src = url;
    setTimeout(() => {
        if (!printed) {
            doPrint();
        }
    }, 1200);
    setTimeout(cleanup, 120_000);
}

function ensureSpace(doc, y, neededMm) {
    const pageH = doc.internal.pageSize.getHeight();
    if (y + neededMm > pageH - MARGIN) {
        doc.addPage();
        return MARGIN;
    }
    return y;
}

/**
 * @param {object} order — same shape as mapped orders on the Completed tab
 * @returns {import('jspdf').jsPDF}
 */
export function buildCompletedOrderReceiptPdf(order) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const maxTextW = pageW - 2 * MARGIN;
    let y = MARGIN;

    const list = Array.isArray(order.orderItems) ? order.orderItems : [];
    const lineSubtotal = list.reduce((s, it) => {
        const st = it?.subtotal;
        if (typeof st === 'number' && !Number.isNaN(st)) return s + st;
        const q = Number(it?.quantity) || 0;
        const up = Number(it?.unit_price) || 0;
        return s + q * up;
    }, 0);
    const subtotal =
        typeof order.subtotal === 'number' && order.subtotal > 0 ? order.subtotal : lineSubtotal;
    const tax = typeof order.taxAmount === 'number' ? order.taxAmount : 0;
    const platformFee = typeof order.platformFee === 'number' ? order.platformFee : 0;
    const totalNum =
        typeof order.totalAmount === 'number' && !Number.isNaN(order.totalAmount)
            ? order.totalAmount
            : subtotal + tax + platformFee;
    const totalDisplay =
        order.total && String(order.total).includes('$') ? order.total : formatMoney(totalNum);
    const typeLabel = order.type || 'Delivery';

    doc.setFontSize(18);
    doc.setTextColor(...PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.text(`Order ${String(order.id)}`, MARGIN, y);
    y += 9;

    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('Completed', MARGIN, y);
    y += 10;

    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Order info', MARGIN, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    [
        `Type: ${typeLabel}`,
        `Placed: ${formatDateTime(order.createdAt)}`,
        `Delivered: ${formatDateTime(order.deliveredAt)}`,
    ].forEach((line) => {
        y = ensureSpace(doc, y, 8);
        doc.text(line, MARGIN, y);
        y += 5;
    });
    y += 5;

    y = ensureSpace(doc, y, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text('Customer', MARGIN, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text(`Name: ${order.customerName || '—'}`, MARGIN, y);
    y += 5;
    y = ensureSpace(doc, y, 8);
    doc.text(`Phone: ${order.customerPhone || '—'}`, MARGIN, y);
    y += 5;
    if (order.customerEmail) {
        y = ensureSpace(doc, y, 8);
        doc.text(`Email: ${String(order.customerEmail)}`, MARGIN, y);
        y += 5;
    }

    if (order.deliveryAddress) {
        y += 3;
        y = ensureSpace(doc, y, 20);
        doc.setFont('helvetica', 'bold');
        doc.text('Address', MARGIN, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        const addrLines = doc.splitTextToSize(String(order.deliveryAddress), maxTextW);
        addrLines.forEach((ln) => {
            y = ensureSpace(doc, y, 8);
            doc.text(ln, MARGIN, y);
            y += 5;
        });
    }

    if (order.specialInstructions) {
        y += 3;
        y = ensureSpace(doc, y, 20);
        doc.setFont('helvetica', 'bold');
        doc.text('Instructions', MARGIN, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        const instLines = doc.splitTextToSize(String(order.specialInstructions), maxTextW);
        instLines.forEach((ln) => {
            y = ensureSpace(doc, y, 8);
            doc.text(ln, MARGIN, y);
            y += 5;
        });
    }

    y += 6;
    y = ensureSpace(doc, y, 30);

    const tableBody =
        list.length === 0
            ? [['No line items', '—']]
            : list.map((line) => {
                  const q = line.quantity || 0;
                  const name = line.dish_name || 'Item';
                  const sub =
                      typeof line.subtotal === 'number'
                          ? line.subtotal
                          : (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
                  const secondary = [line.variant_name, (line.special_requests || '').trim()]
                      .filter(Boolean)
                      .join(' · ');
                  const itemCell = secondary ? `${q}× ${name}\n${secondary}` : `${q}× ${name}`;
                  return [itemCell, formatMoney(sub)];
              });

    autoTable(doc, {
        startY: y,
        head: [['Item', 'Amount']],
        body: tableBody,
        theme: 'striped',
        headStyles: {
            fillColor: PRIMARY,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10,
        },
        bodyStyles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: maxTextW - 32 },
            1: { cellWidth: 32, halign: 'right' },
        },
        margin: { left: MARGIN, right: MARGIN },
    });

    y = doc.lastAutoTable.finalY + 10;
    y = ensureSpace(doc, y, 45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text('Totals & payment', MARGIN, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);

    const payRows = [
        ['Subtotal', formatMoney(subtotal)],
        ...(tax > 0 ? [['Tax', formatMoney(tax)]] : []),
        ...(platformFee > 0 ? [['Platform fee', formatMoney(platformFee)]] : []),
        ['Payment', labelPaymentMethod(order.paymentMethod, typeLabel)],
        [
            'Payment status',
            String(order.paymentStatus || '')
                .replace(/_/g, ' ')
                .toLowerCase() || '—',
        ],
    ];

    autoTable(doc, {
        startY: y,
        body: payRows,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1.5 },
        columnStyles: {
            0: { textColor: [107, 114, 128], fontStyle: 'normal' },
            1: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 36] },
        },
        margin: { left: MARGIN, right: MARGIN },
    });

    y = doc.lastAutoTable.finalY + 8;
    y = ensureSpace(doc, y, 12);
    doc.setDrawColor(15, 23, 36);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y, pageW - MARGIN, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total', MARGIN, y);
    doc.text(String(totalDisplay), pageW - MARGIN, y, { align: 'right' });

    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Receipt generated from restaurant orders.', MARGIN, pageH - 10);

    return doc;
}

/** Builds a PDF receipt and opens the browser print dialog for that PDF. */
export function printCompletedOrderReceiptPdf(order) {
    if (!order) return;
    try {
        const doc = buildCompletedOrderReceiptPdf(order);
        const blob = doc.output('blob');
        printPdfBlob(blob);
    } catch (e) {
        console.error(e);
        toast.error('Receipt PDF could not be created. Try again.');
    }
}
