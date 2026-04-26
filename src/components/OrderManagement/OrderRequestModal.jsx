import React, { useState } from 'react';
import { X, User, Phone, MapPin, ChevronDown, ChevronUp, CircleCheckBig } from 'lucide-react';

export default function OrderRequestModal({ isOpen, onClose, order, onAccept, onReject }) {
    // Accordion State
    const [openSections, setOpenSections] = useState({
        customerInfo: true,
        timeline: true,
        items: true,
        pricing: true,
        cancellation: true,
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (!isOpen || !order) return null;

    const isCancelled = String(order.status || '').toLowerCase() === 'cancelled';

    // Mock timeline — replace with API fields when available
    const timelineEvents = isCancelled
        ? [
            { status: 'Order Placed', time: '01:15', active: true },
            { status: 'Cancelled', time: '', active: false, isCancelled: true },
        ]
        : [
            { status: 'Order Placed', time: '01:15', active: true },
            { status: 'Accepted', time: '', active: false },
            { status: 'Preparing', time: '', active: false },
            { status: 'Ready', time: '', active: false },
            { status: 'Driver Assigned', time: '', active: false },
            { status: 'On the Way', time: '', active: false },
            { status: 'Delivered', time: '', active: false },
        ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20"
                onClick={onClose}
            ></div>

            {/* Drawer Content */}
            <div className="relative w-full max-w-[600px] bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <h2 className="font-sans text-[22px] font-[700] leading-[26.4px] tracking-normal text-[#0F1724]">
                            {order.id}
                        </h2>
                        <p className="mt-0.5 font-sans text-[14px] font-[400] leading-[21px] tracking-normal text-[#6B7280]">
                            {order.type} Order
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

                {/* Scrollable Body — 24px horizontal inset from drawer */}
                <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">

                    {/* Customer Information */}
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
                            </div>
                        )}
                    </div>

                    {/* Order Timeline */}
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
                                    {timelineEvents.map((event, index) => {
                                        const isLast = index === timelineEvents.length - 1;
                                        /** Line below this node: red while step is active (per design), else inactive gray */
                                        const downLineClass = event.active
                                            ? 'bg-primary'
                                            : 'bg-[#E5E7EB]';
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
                                                            <div
                                                                className="h-8 w-8 shrink-0 rounded-full bg-[#E5E7EB]"
                                                                aria-hidden
                                                            />
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
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
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
                                <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-[#F6F8F9] p-3">
                                    <div className="min-w-0">
                                        <p className="font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                            1x Chicken Tikka Masala
                                        </p>
                                        <p className="mt-0.5 font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                            Large
                                        </p>
                                    </div>
                                    <p className="shrink-0 text-right font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        $8.50
                                    </p>
                                </div>
                                <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-[#F6F8F9] p-3">
                                    <div className="min-w-0">
                                        <p className="font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                            2x Naan Bread
                                        </p>
                                        <p className="mt-0.5 font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                            Garlic
                                        </p>
                                    </div>
                                    <p className="shrink-0 text-right font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        $4.40
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing & Payment */}
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
                                        $10.70
                                    </span>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <span className="font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        VAT
                                    </span>
                                    <span className="shrink-0 text-right font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        $2.20
                                    </span>
                                </div>
                                <div className="mt-1 flex items-start justify-between gap-3 border-t border-gray-100 pt-2">
                                    <span className="font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        Total
                                    </span>
                                    <span className="shrink-0 text-right font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        {order.total}
                                    </span>
                                </div>

                                <div className="mt-1 rounded-lg border border-gray-100 bg-[#F6F8F9] p-3">
                                    <p className="font-sans text-[13px] font-normal leading-[19.5px] tracking-normal text-[#6B7280]">
                                        Payment Method
                                    </p>
                                    <p className="mt-0.5 font-sans text-[15px] font-medium leading-[22.5px] tracking-normal text-[#0F1724]">
                                        {order.paymentStatus === 'Cash'
                                            ? `Cash on ${order.type}`
                                            : 'Card ending *4912'}
                                    </p>
                                    <span
                                        className={`mt-0.5 block font-sans text-[13px] font-normal capitalize leading-[19.5px] tracking-normal ${
                                            String(order.paymentStatus || '')
                                                .toLowerCase() === 'paid'
                                                ? 'text-[#10B981]'
                                                : order.paymentStatus === 'Cash'
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
                    {/* Cancellation Details */}
                    {isCancelled && (
                        <div className="bg-[#F9FAFB] rounded-lg overflow-hidden border border-gray-100">
                            <button
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
                                        <p className="text-[12px] text-[#B91C1C]">
                                            Reason: {order.timeAgo}
                                        </p>
                                    </div>

                                    <div className="bg-[#F3F4F6] rounded-lg p-3">
                                        <p className="text-[11px] text-[#6B7280] mb-1">Payment Handling</p>
                                        <p className="text-[13px] font-medium text-[#374151]">
                                            Refund of {order.total} issued to Card ending *4912
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
                    <button
                        onClick={() => onReject(order)}
                        className="flex-1 py-2.5 border border-[#FECACA] text-[#EF4444] rounded-[8px] font-medium text-[14px] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                        Reject Order
                    </button>
                    <button
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
