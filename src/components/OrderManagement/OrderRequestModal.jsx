import React, { useState } from 'react';
import { X, User, Phone, MapPin, ChevronDown, ChevronUp, Check } from 'lucide-react';

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

    // Mock Timeline Data
    const timelineEvents = order.status === 'Cancelled' ? [
        { status: 'Order Placed', time: '01:15', active: true },
        { status: 'Cancelled', time: '', active: false, isCancelled: true },
    ] : [
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
            <div className="relative w-full max-w-[400px] bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-[18px] font-bold text-[#111827]">{order.id}</h2>
                        <p className="text-[12px] text-gray-500">{order.type} Order</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {/* Customer Information */}
                    <div className="bg-[#F9FAFB] rounded-lg overflow-hidden border border-gray-100">
                        <button
                            onClick={() => toggleSection('customerInfo')}
                            className="w-full flex items-center justify-between p-3 text-[13px] font-semibold text-[#374151]"
                        >
                            Customer Information
                            {openSections.customerInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {openSections.customerInfo && (
                            <div className="px-3 pb-3 space-y-3">
                                <div className="flex gap-3">
                                    <User size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-gray-500">Name</p>
                                        <p className="text-[13px] font-medium text-[#111827]">{order.customerName}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Phone size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-gray-500">Phone</p>
                                        <p className="text-[13px] font-medium text-[#111827]">{order.customerPhone}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-gray-500">Delivery Address</p>
                                        <p className="text-[13px] font-medium text-[#111827]">123 High Street, London, SW1A 1AA</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Timeline */}
                    <div className="bg-[#F9FAFB] rounded-lg overflow-hidden border border-gray-100">
                        <button
                            onClick={() => toggleSection('timeline')}
                            className="w-full flex items-center justify-between p-3 text-[13px] font-semibold text-[#374151]"
                        >
                            Order Timeline
                            {openSections.timeline ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {openSections.timeline && (
                            <div className="px-4 pb-4 pt-1">
                                <div className="relative border-l border-gray-200 ml-3 space-y-6">
                                    {timelineEvents.map((event, index) => (
                                        <div key={index} className="relative pl-6">
                                            {/* Dot/Icon */}
                                            <div className={`absolute -left-[11px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white
                                                ${event.active ? 'border-[#2BB29C] text-[#2BB29C]' : 'border-gray-200 text-gray-300'}`}>
                                                {event.active ? (
                                                    <div className="w-6 h-6 rounded-full bg-[#2BB29C] flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                                                )}
                                            </div>

                                            <div>
                                                <p className={`text-[13px] font-medium ${event.active ? 'text-[#111827]' : 'text-gray-400'}`}>
                                                    {event.status}
                                                </p>
                                                {event.time && <p className="text-[11px] text-gray-400">{event.time}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    <div className="bg-[#F9FAFB] rounded-lg overflow-hidden border border-gray-100">
                        <button
                            onClick={() => toggleSection('items')}
                            className="w-full flex items-center justify-between p-3 text-[13px] font-semibold text-[#374151]"
                        >
                            Order Items
                            {openSections.items ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {openSections.items && (
                            <div className="px-3 pb-3 space-y-2">
                                <div className="bg-white p-3 rounded border border-gray-100 flex justify-between items-start">
                                    <div>
                                        <p className="text-[13px] font-medium text-[#111827]"><span className="font-bold">1x</span> Chicken Tikka Masala</p>
                                        <p className="text-[11px] text-gray-500">Large</p>
                                    </div>
                                    <p className="text-[13px] font-medium text-[#111827]">$8.50</p>
                                </div>
                                <div className="bg-white p-3 rounded border border-gray-100 flex justify-between items-start">
                                    <div>
                                        <p className="text-[13px] font-medium text-[#111827]"><span className="font-bold">2x</span> Naan Bread</p>
                                        <p className="text-[11px] text-gray-500">Garlic</p>
                                    </div>
                                    <p className="text-[13px] font-medium text-[#111827]">$4.40</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing & Payment */}
                    <div className="bg-[#F9FAFB] rounded-lg overflow-hidden border border-gray-100">
                        <button
                            onClick={() => toggleSection('pricing')}
                            className="w-full flex items-center justify-between p-3 text-[13px] font-semibold text-[#374151]"
                        >
                            Pricing & Payment
                            {openSections.pricing ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {openSections.pricing && (
                            <div className="px-3 pb-3">
                                <div className="bg-white p-3 rounded border border-gray-100 space-y-2">
                                    <div className="flex justify-between text-[13px] text-gray-500">
                                        <span>Subtotal</span>
                                        <span>$10.70</span>
                                    </div>
                                    <div className="flex justify-between text-[13px] text-gray-500">
                                        <span>VAT</span>
                                        <span>$2.20</span>
                                    </div>
                                    <div className="flex justify-between text-[14px] font-bold text-[#111827] py-2 border-t border-gray-100 mt-1">
                                        <span>Total</span>
                                        <span>{order.total}</span>
                                    </div>

                                    <div className="bg-[#F9FAFB] p-2.5 rounded text-[12px] mt-2">
                                        <p className="text-gray-500 mb-1">Payment Method</p>
                                        <p className="font-medium text-[#111827] flex items-center gap-2">
                                            {order.paymentStatus === 'Cash'
                                                ? `Cash on ${order.type}`
                                                : 'Card ending *4912'}
                                        </p>
                                        <span className={`font-medium mt-1 block ${order.paymentStatus === 'Cash'
                                            ? 'text-[#ea580c]'
                                            : 'text-[#2BB29C]'
                                            }`}>
                                            {order.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Cancellation Details */}
                    {order.status === 'Cancelled' && (
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
                        className="flex-1 py-2.5 bg-[#2BB29C] text-white rounded-[8px] font-medium text-[14px] hover:bg-[#259D89] transition-colors shadow-sm cursor-pointer"
                    >
                        Accept Order
                    </button>
                </div>

            </div>
        </div>
    );
}
