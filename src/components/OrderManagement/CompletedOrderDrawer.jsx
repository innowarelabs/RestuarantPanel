import React, { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, CircleCheckBig, Printer, RefreshCcw } from 'lucide-react';

function formatMoney(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return '$0.00';
    return `$${x.toFixed(2)}`;
}

function formatShortTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
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

/**
 * Completed order: timeline (Order Placed + Delivered), items, pricing, print / refund.
 */
export default function CompletedOrderDrawer({ isOpen, onClose, order, onPrintReceipt, onIssueRefund }) {
    const [openSections, setOpenSections] = useState({
        timeline: true,
        items: true,
        pricing: true,
    });

    const toggleSection = (key) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const { subtotal, tax, total, items, placedTime, deliveredTime } = useMemo(() => {
        if (!order) {
            return {
                subtotal: 0,
                tax: 0,
                total: 0,
                items: [],
                placedTime: '',
                deliveredTime: '',
            };
        }

        const list = Array.isArray(order.orderItems) ? order.orderItems : [];
        const lineSubtotal = list.reduce((s, it) => {
            const st = it?.subtotal;
            if (typeof st === 'number' && !Number.isNaN(st)) return s + st;
            const q = Number(it?.quantity) || 0;
            const up = Number(it?.unit_price) || 0;
            return s + q * up;
        }, 0);

        const s =
            typeof order.subtotal === 'number' && order.subtotal > 0
                ? order.subtotal
                : lineSubtotal;
        const t = typeof order.taxAmount === 'number' ? order.taxAmount : 0;
        const totN =
            typeof order.totalAmount === 'number' && !Number.isNaN(order.totalAmount)
                ? order.totalAmount
                : s + t;

        return {
            subtotal: s,
            tax: t,
            total: totN,
            items: list,
            placedTime: formatShortTime(order.createdAt),
            deliveredTime: formatShortTime(order.deliveredAt),
        };
    }, [order]);

    if (!isOpen || !order) return null;

    const typeLabel = order.type || 'Delivery';

    const timelineSteps = [
        { key: 'placed', status: 'Order Placed', time: placedTime, kind: 'done' },
        { key: 'delivered', status: 'Delivered', time: deliveredTime, kind: 'done' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} role="presentation" />
            <div className="relative flex h-full w-full max-w-[600px] flex-col bg-white shadow-xl animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between border-b border-gray-100 p-5">
                    <div>
                        <h2 className="font-sans text-[22px] font-[700] leading-[26.4px] tracking-normal text-[#0F1724]">
                            {order.id}
                        </h2>
                        <p className="mt-0.5 font-sans text-[14px] font-[400] leading-[21px] tracking-normal text-[#6B7280]">
                            {typeLabel} Order
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1 transition-colors hover:bg-gray-100"
                        aria-label="Close"
                    >
                        <X size={20} className="text-[#6B7280]" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
                        <button
                            type="button"
                            onClick={() => toggleSection('timeline')}
                            className="flex w-full items-center justify-between gap-2 bg-[#F6F8F9] px-4 py-3"
                        >
                            <span className="text-left font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                Order Timeline
                            </span>
                            <span className="shrink-0 text-[#0F1724]">
                                {openSections.timeline ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                        </button>
                        {openSections.timeline && (
                            <div className="bg-white px-4 py-3">
                                <ol className="m-0 list-none p-0">
                                    {timelineSteps.map((event, index) => {
                                        const isLast = index === timelineSteps.length - 1;
                                        return (
                                            <li key={event.key} className="flex items-start gap-3">
                                                <div className="flex w-8 shrink-0 flex-col items-center">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                                        <div
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary"
                                                            aria-hidden
                                                        >
                                                            <CircleCheckBig
                                                                size={18}
                                                                strokeWidth={2.5}
                                                                className="text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                    {!isLast && (
                                                        <div
                                                            className="h-12 w-[2px] shrink-0 bg-primary"
                                                            aria-hidden
                                                        />
                                                    )}
                                                </div>
                                                <div
                                                    className={`min-w-0 flex-1 pt-1.5 ${
                                                        isLast ? 'pb-0' : 'pb-7'
                                                    }`}
                                                >
                                                    <p className="font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                                        {event.status}
                                                    </p>
                                                    {!!event.time && (
                                                        <p className="mt-0.5 font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                                            {event.time}
                                                        </p>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
                        <button
                            type="button"
                            onClick={() => toggleSection('items')}
                            className="flex w-full items-center justify-between gap-2 bg-[#F6F8F9] px-4 py-3"
                        >
                            <span className="text-left font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                Order Items
                            </span>
                            <span className="shrink-0 text-[#0F1724]">
                                {openSections.items ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                        </button>
                        {openSections.items && (
                            <div className="space-y-2 bg-white px-4 py-3">
                                {items.length === 0 ? (
                                    <p className="font-sans text-[13px] text-[#6B7280]">No line items</p>
                                ) : (
                                    items.map((line, i) => {
                                        const q = line.quantity || 0;
                                        const name = line.dish_name || 'Item';
                                        const sub =
                                            typeof line.subtotal === 'number'
                                                ? line.subtotal
                                                : (Number(line.quantity) || 0) *
                                                  (Number(line.unit_price) || 0);
                                        const secondary =
                                            [line.variant_name, (line.special_requests || '').trim()]
                                                .filter(Boolean)
                                                .join(' · ') || null;

                                        return (
                                            <div
                                                key={line.dish_id || i}
                                                className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-[#F6F8F9] p-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                                        {q}x {name}
                                                    </p>
                                                    {secondary && (
                                                        <p className="mt-0.5 font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                                            {secondary}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="shrink-0 text-right font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                                    {formatMoney(sub)}
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
                        <button
                            type="button"
                            onClick={() => toggleSection('pricing')}
                            className="flex w-full items-center justify-between gap-2 bg-[#F6F8F9] px-4 py-3"
                        >
                            <span className="text-left font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                Pricing & Payment
                            </span>
                            <span className="shrink-0 text-[#0F1724]">
                                {openSections.pricing ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                        </button>
                        {openSections.pricing && (
                            <div className="space-y-2 bg-white px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <span className="font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        Subtotal
                                    </span>
                                    <span className="shrink-0 text-right font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        {formatMoney(subtotal)}
                                    </span>
                                </div>
                                {tax > 0 && (
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                            VAT
                                        </span>
                                        <span className="shrink-0 text-right font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                            {formatMoney(tax)}
                                        </span>
                                    </div>
                                )}
                                <div className="mt-1 flex items-start justify-between gap-3 border-t border-gray-100 pt-2">
                                    <span className="font-sans text-[15px] font-bold leading-[22.5px] tracking-normal text-[#0F1724]">
                                        Total
                                    </span>
                                    <span className="shrink-0 text-right font-sans text-[15px] font-bold leading-[22.5px] tracking-normal text-[#0F1724]">
                                        {order.total && String(order.total).includes('$')
                                            ? order.total
                                            : formatMoney(total)}
                                    </span>
                                </div>
                                <div className="mt-1 rounded-lg border border-gray-100 bg-[#F6F8F9] p-3">
                                    <p className="font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                        Payment Method
                                    </p>
                                    <p className="mt-0.5 font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        {labelPaymentMethod(order.paymentMethod, typeLabel)}
                                    </p>
                                    <span
                                        className={`mt-0.5 block font-sans text-[13px] font-normal capitalize leading-[19.5px] tracking-normal ${
                                            String(order.paymentStatus || '')
                                                .toLowerCase() === 'paid'
                                                ? 'text-[#10B981]'
                                                : String(order.paymentStatus || '')
                                                        .toLowerCase() === 'cash'
                                                    ? 'text-[#ea580c]'
                                                    : 'text-[#DD2F26]'
                                        }`}
                                    >
                                        {String(order.paymentStatus || '')
                                            .replace(/_/g, ' ')
                                            .toLowerCase()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 border-t border-gray-100 bg-white p-4">
                    <button
                        type="button"
                        onClick={() => onPrintReceipt && onPrintReceipt(order)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-[8px] border border-gray-100 bg-white py-2.5 text-[14px] font-medium text-[#0F1724] transition-colors hover:bg-gray-50"
                    >
                        <Printer size={18} strokeWidth={2} className="shrink-0" />
                        Print Receipt
                    </button>
                    <button
                        type="button"
                        onClick={() => onIssueRefund && onIssueRefund(order)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-[8px] border border-gray-100 bg-white py-2.5 text-[14px] font-medium text-[#0F1724] transition-colors hover:bg-gray-50"
                    >
                        <RefreshCcw size={18} strokeWidth={2} className="shrink-0" />
                        Issue Refund
                    </button>
                </div>
            </div>
        </div>
    );
}
