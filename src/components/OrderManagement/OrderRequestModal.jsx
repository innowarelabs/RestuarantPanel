import React, { useMemo, useState } from 'react';
import { X, User, Phone, MapPin, ChevronDown, ChevronUp, CircleCheckBig, Mail } from 'lucide-react';
import { mapApiTimelineToDisplayEvents, formatShortTime } from './orderTimelineUtils';
import OrderApiTimelineList from './OrderApiTimelineList';

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

function formatLineSecondary(line) {
    const parts = [line.variant_name, (line.special_requests || '').trim(), formatLineAddons(line)]
        .filter((p) => p && String(p).trim());
    return parts.length ? parts.join(' · ') : null;
}

function formatLineAddons(line) {
    const raw = line.selected_addons;
    if (!Array.isArray(raw) || !raw.length) return '';
    return raw
        .map((a) => {
            if (typeof a === 'string') return a;
            if (a && typeof a === 'object') {
                return a.addon_name || a.name || a.label || '';
            }
            return '';
        })
        .filter(Boolean)
        .join(', ');
}

export default function OrderRequestModal({ isOpen, onClose, order, onAccept, onReject }) {
    const [openSections, setOpenSections] = useState({
        customerInfo: true,
        timeline: true,
        items: true,
        pricing: true,
        cancellation: true,
    });

    const toggleSection = (section) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const { apiTimelineEvents, subtotal, tax, platformFee, total, items, paymentLabel } = useMemo(() => {
        if (!order) {
            return {
                apiTimelineEvents: [],
                subtotal: 0,
                tax: 0,
                platformFee: 0,
                total: 0,
                items: [],
                paymentLabel: '—',
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
            typeof order.subtotal === 'number' && order.subtotal > 0 ? order.subtotal : lineSubtotal;
        const t = typeof order.taxAmount === 'number' ? order.taxAmount : 0;
        const pf = typeof order.platformFee === 'number' ? order.platformFee : 0;
        const totN =
            typeof order.totalAmount === 'number' && !Number.isNaN(order.totalAmount)
                ? order.totalAmount
                : s + t + pf;
        return {
            apiTimelineEvents: mapApiTimelineToDisplayEvents(order.timeline),
            subtotal: s,
            tax: t,
            platformFee: pf,
            total: totN,
            items: list,
            paymentLabel: labelPaymentMethod(order.paymentMethod, order.type),
        };
    }, [order]);

    if (!isOpen || !order) return null;

    const isCancelled = String(order.status || '').toLowerCase() === 'cancelled';
    const typeLabel = order.type || 'Delivery';
    const estLine = (order.estimatedDeliveryTime && String(order.estimatedDeliveryTime).trim()) || '';

    const hasApiTimeline = apiTimelineEvents.length > 0;
    const fallbackTimeline = isCancelled
        ? [
              { status: 'Order Placed', time: formatShortTime(order.createdAt) || '—', active: true, isCancelled: false },
              { status: 'Cancelled', time: '', active: false, isCancelled: true },
          ]
        : [
              { status: 'Order Placed', time: formatShortTime(order.createdAt) || '—', active: true },
              { status: 'Accepted', time: '', active: false },
              { status: 'Preparing', time: '', active: false },
              { status: 'Ready', time: '', active: false },
              { status: 'Driver Assigned', time: '', active: false },
              { status: 'On the Way', time: '', active: false },
              { status: 'Delivered', time: '', active: false },
          ];
    const totalStr =
        order.total && String(order.total).includes('$') ? order.total : formatMoney(total);

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>

            <div className="relative w-full max-w-[600px] bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <h2 className="font-sans text-[22px] font-[700] leading-[26.4px] tracking-normal text-[#0F1724]">
                            {order.id}
                        </h2>
                        <p className="mt-0.5 font-sans text-[14px] font-[400] leading-[21px] tracking-normal text-[#6B7280]">
                            {typeLabel} Order{estLine ? ` · Est. ${estLine}` : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} className="text-[#6B7280]" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
                    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
                        <button
                            type="button"
                            onClick={() => toggleSection('customerInfo')}
                            className="flex w-full items-center justify-between gap-2 bg-[#F6F8F9] px-4 py-3"
                        >
                            <span className="text-left font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                Customer Information
                            </span>
                            <span className="shrink-0 text-[#0F1724]">
                                {openSections.customerInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                        </button>

                        {openSections.customerInfo && (
                            <div className="space-y-3 bg-white px-4 py-3">
                                <div className="flex gap-3">
                                    <User size={17} className="mt-1 shrink-0 text-[#6B7280]" strokeWidth={2} />
                                    <div className="min-w-0">
                                        <p className="font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                            Name
                                        </p>
                                        <p className="mt-0.5 font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                            {order.customerName || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Phone size={17} className="mt-1 shrink-0 text-[#6B7280]" strokeWidth={2} />
                                    <div className="min-w-0">
                                        <p className="font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                            Phone
                                        </p>
                                        <p className="mt-0.5 font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                            {order.customerPhone || '—'}
                                        </p>
                                    </div>
                                </div>
                                {order.customerEmail && (
                                    <div className="flex gap-3">
                                        <Mail size={17} className="mt-1 shrink-0 text-[#6B7280]" strokeWidth={2} />
                                        <div className="min-w-0">
                                            <p className="font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                                Email
                                            </p>
                                            <p className="mt-0.5 break-all font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                                {order.customerEmail}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <MapPin size={17} className="mt-1 shrink-0 text-[#6B7280]" strokeWidth={2} />
                                    <div className="min-w-0">
                                        <p className="font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                            Delivery Address
                                        </p>
                                        <p className="mt-0.5 font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                            {order.deliveryAddress?.trim() ? order.deliveryAddress : '—'}
                                        </p>
                                    </div>
                                </div>
                                {order.specialInstructions ? (
                                    <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2">
                                        <p className="font-sans text-[12px] font-medium text-[#92400E]">Order notes</p>
                                        <p className="mt-0.5 font-sans text-[14px] text-[#0F1724]">{order.specialInstructions}</p>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

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
                                {hasApiTimeline ? (
                                    <OrderApiTimelineList events={apiTimelineEvents} />
                                ) : (
                                    <ol className="m-0 list-none p-0">
                                        {fallbackTimeline.map((event, index) => {
                                            const isLast = index === fallbackTimeline.length - 1;
                                            const downLineClass = event.active ? 'bg-primary' : 'bg-[#E5E7EB]';
                                            return (
                                                <li key={index} className="flex items-start gap-3">
                                                    <div className="flex w-8 shrink-0 flex-col items-center">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                                            {event.isCancelled ? (
                                                                <div
                                                                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-200 bg-red-50"
                                                                    aria-hidden
                                                                />
                                                            ) : event.active ? (
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
                                                            ) : (
                                                                <div className="h-8 w-8 shrink-0 rounded-full bg-[#E5E7EB]" aria-hidden />
                                                            )}
                                                        </div>
                                                        {!isLast && (
                                                            <div
                                                                className={`h-12 w-[2px] shrink-0 ${downLineClass}`}
                                                                aria-hidden
                                                            />
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`min-w-0 flex-1 pt-1.5 ${
                                                            isLast ? 'pb-0' : 'pb-7'
                                                        }`}
                                                    >
                                                        <p
                                                            className={`font-sans text-[15px] font-medium leading-[22.5px] tracking-normal ${
                                                                event.active
                                                                    ? 'text-[#0F1724]'
                                                                    : event.isCancelled
                                                                      ? 'text-red-600'
                                                                      : 'text-[#9CA3AF]'
                                                            }`}
                                                        >
                                                            {event.status}
                                                        </p>
                                                        {event.active && !!event.time && (
                                                            <p className="mt-0.5 font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                                                {event.time}
                                                            </p>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                )}
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
                                                : (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
                                        const secondary = formatLineSecondary(line);
                                        return (
                                            <div
                                                key={`${line.dish_id || 'd'}-${line.selected_variant_id || ''}-${i}`}
                                                className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-[#F6F8F9] p-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                                        {q}x {name}
                                                        {line.is_free_reward ? (
                                                            <span className="ml-2 text-[12px] font-medium text-[#16A34A]">
                                                                (Reward)
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                    {secondary && (
                                                        <p className="mt-0.5 font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                                            {secondary}
                                                        </p>
                                                    )}
                                                    {typeof line.addons_total_price === 'number' &&
                                                    line.addons_total_price > 0 ? (
                                                        <p className="mt-0.5 font-sans text-[12px] text-[#6B7280]">
                                                            Add-ons: {formatMoney(line.addons_total_price)}
                                                        </p>
                                                    ) : null}
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
                                            Tax
                                        </span>
                                        <span className="shrink-0 text-right font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                            {formatMoney(tax)}
                                        </span>
                                    </div>
                                )}
                                {platformFee > 0 && (
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                            Platform fee
                                        </span>
                                        <span className="shrink-0 text-right font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                            {formatMoney(platformFee)}
                                        </span>
                                    </div>
                                )}
                                <div className="mt-1 flex items-start justify-between gap-3 border-t border-gray-100 pt-2">
                                    <span className="font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        Total
                                    </span>
                                    <span className="shrink-0 text-right font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        {totalStr}
                                    </span>
                                </div>

                                <div className="mt-1 rounded-lg border border-gray-100 bg-[#F6F8F9] p-3">
                                    <p className="font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                        Payment Method
                                    </p>
                                    <p className="mt-0.5 font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        {paymentLabel}
                                    </p>
                                    <span
                                        className={`mt-0.5 block font-sans text-[13px] font-normal capitalize leading-[19.5px] tracking-normal ${
                                            String(order.paymentStatus || '').toLowerCase() === 'paid'
                                                ? 'text-[#10B981]'
                                                : String(order.paymentStatus || '').toLowerCase() === 'cash'
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
                    {isCancelled && (
                        <div className="bg-[#F9FAFB] rounded-lg overflow-hidden border border-gray-100">
                            <button
                                type="button"
                                onClick={() => toggleSection('cancellation')}
                                className="w-full flex items-center justify-between p-3 text-[13px] font-semibold text-[#374151]"
                            >
                                Cancellation Details
                                {openSections.cancellation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {openSections.cancellation && (
                                <div className="px-3 pb-3 space-y-3">
                                    <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3">
                                        <p className="text-[13px] font-semibold text-[#B91C1C] mb-1">
                                            {order.cancelledBy || 'Cancelled'}
                                        </p>
                                        <p className="text-[12px] text-[#B91C1C]">Reason: {order.cancelReason || '—'}</p>
                                    </div>

                                    <div className="bg-[#F3F4F6] rounded-lg p-3">
                                        <p className="text-[11px] text-[#6B7280] mb-1">Payment Handling</p>
                                        <p className="text-[13px] font-medium text-[#374151]">
                                            Refund of {totalStr} to {paymentLabel}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
                    <button
                        type="button"
                        onClick={() => onReject(order)}
                        className="flex-1 py-2.5 border border-[#FECACA] text-[#EF4444] rounded-[8px] font-medium text-[14px] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                        Reject Order
                    </button>
                    <button
                        type="button"
                        onClick={() => onAccept(order)}
                        className="flex-1 py-2.5 bg-[#DD2F26] text-white rounded-[8px] font-medium text-[14px] hover:bg-[#C52820] transition-colors shadow-sm cursor-pointer"
                    >
                        Accept Order
                    </button>
                </div>
            </div>
        </div>
    );
}
