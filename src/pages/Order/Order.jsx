import React, { useState } from 'react';
import { Clock, User, Phone, Box, MapPin } from 'lucide-react';

import OrderRequestModal from '../../components/OrderManagement/OrderRequestModal';
import AcceptOrderModal from '../../components/OrderManagement/AcceptOrderModal';
import RejectOrderModal from '../../components/OrderManagement/RejectOrderModal';

export default function OrderManagement() {
    const [activeTab, setActiveTab] = useState('New Orders');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const handleCardClick = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleAcceptClick = (e, order) => {
        e.stopPropagation();
        setSelectedOrder(order);
        setIsAcceptModalOpen(true);
    };

    const handleRejectClick = (e, order) => {
        e.stopPropagation();
        setSelectedOrder(order);
        setIsRejectModalOpen(true);
    };

    // Mock Data for all tabs
    const allOrders = [
        // New Orders
        {
            id: 'ORD-2310', status: 'Pending', timeAgo: '2 mins ago', customerName: 'Ali Raza', customerPhone: '+44 7700 900123', type: 'Delivery', itemsCount: 3, total: '$12.90', paymentStatus: 'Paid'
        },
        {
            id: 'ORD-2311', status: 'Pending', timeAgo: '4 mins ago', customerName: 'Sana Khan', customerPhone: '+44 7700 900456', type: 'Collection', itemsCount: 1, total: '$4.50', paymentStatus: 'Cash'
        },
        {
            id: 'ORD-2312', status: 'Pending', timeAgo: '6 mins ago', customerName: 'Bilal Ahmed', customerPhone: '+44 7700 900789', type: 'Delivery', itemsCount: 2, total: '$8.20', paymentStatus: 'Paid'
        },

        // In Progress
        {
            id: 'ORD-2313', status: 'Preparing', timeAgo: '15 mins ago', customerName: 'Ali Raza', customerPhone: '+44 7700 900123', type: 'Delivery', itemsCount: 3, total: '$12.90', paymentStatus: 'Paid', estTime: 'Est. 12 min'
        },
        {
            id: 'ORD-2308', status: 'Preparing', timeAgo: '20 mins ago', customerName: 'Hamza Noor', customerPhone: '+44 7700 901234', type: 'Delivery', itemsCount: 2, total: '$10.40', paymentStatus: 'Paid', estTime: 'Est. 8 min'
        },
        {
            id: 'ORD-2305', status: 'Preparing', timeAgo: '25 mins ago', customerName: 'Nida Karim', customerPhone: '+44 7700 902345', type: 'Collection', itemsCount: 1, total: '$7.90', paymentStatus: 'Cash', estTime: 'Est. 6 min'
        },

        // Ready for Pickup
        {
            id: 'ORD-2302', status: 'Ready', timeAgo: '6 hours ago', customerName: 'Ahmed', customerPhone: '+44 7700 903456', type: 'Delivery', itemsCount: 1, total: '$9.60', paymentStatus: 'Paid', riderStatus: 'Rider not assigned'
        },
        {
            id: 'ORD-2299', status: 'Ready', timeAgo: '6 hours ago', customerName: 'Farah', customerPhone: '+44 7700 904567', type: 'Collection', itemsCount: 1, total: '$5.50', paymentStatus: 'Cash', riderStatus: 'Collection'
        },
        {
            id: 'ORD-2297', status: 'Ready', timeAgo: '6 hours ago', customerName: 'Danish', customerPhone: '+44 7700 905678', type: 'Delivery', itemsCount: 2, total: '$11.75', paymentStatus: 'Paid', riderStatus: 'Rider arriving in 4 min'
        },

        // On the Way
        {
            id: 'ORD-2288', status: 'On the Way', timeAgo: '6 hours ago', customerName: 'Sara', customerPhone: '+44 7700 906789', type: 'Delivery', itemsCount: 1, total: '$13.20', paymentStatus: 'Paid', eta: 'ETA 12 min'
        },
        {
            id: 'ORD-2282', status: 'On the Way', timeAgo: '6 hours ago', customerName: 'Noor', customerPhone: '+44 7700 907890', type: 'Delivery', itemsCount: 1, total: '$6.80', paymentStatus: 'Paid', eta: 'ETA 5 min'
        },
        {
            id: 'ORD-2280', status: 'On the Way', timeAgo: '6 hours ago', customerName: 'Imran', customerPhone: '+44 7700 908901', type: 'Delivery', itemsCount: 1, total: '$15.50', paymentStatus: 'Paid', eta: 'ETA 18 min'
        },

        // Completed
        {
            id: 'ORD-2270', status: 'Completed', timeAgo: 'Delivered 7 hours ago', customerName: 'Wajahat', customerPhone: '+44 7700 909012', type: 'Delivery', itemsCount: 1, total: '$10.40', paymentStatus: 'Paid'
        },
        {
            id: 'ORD-2265', status: 'Completed', timeAgo: 'Delivered 11 hours ago', customerName: 'Sana', customerPhone: '+44 7700 910123', type: 'Collection', itemsCount: 1, total: '$7.20', paymentStatus: 'Cash'
        },
        {
            id: 'ORD-2258', status: 'Completed', timeAgo: 'Delivered yesterday', customerName: 'Farooq', customerPhone: '+44 7700 911234', type: 'Delivery', itemsCount: 3, total: '$6.50', paymentStatus: 'Paid'
        },

        // Cancelled
        {
            id: 'ORD-2247', status: 'Cancelled', timeAgo: 'Changed mind', customerName: 'CANCELLED', customerPhone: '+44 7700 912345', type: 'Delivery', itemsCount: 1, total: '$9.00', paymentStatus: 'Paid', cancelledBy: 'Cancelled by Customer'
        },
        {
            id: 'ORD-2241', status: 'Cancelled', timeAgo: 'Item unavailable', customerName: 'CANCELLED', customerPhone: '+44 7700 913456', type: 'Delivery', itemsCount: 1, total: '$12.50', paymentStatus: 'Paid', cancelledBy: 'Cancelled by Restaurant'
        },
        {
            id: 'ORD-2239', status: 'Cancelled', timeAgo: 'Customer unreachable', customerName: 'CANCELLED', customerPhone: '+44 7700 914567', type: 'Delivery', itemsCount: 1, total: '$5.20', paymentStatus: 'Paid', cancelledBy: 'Cancelled by Restaurant'
        }
    ];

    // Filter orders based on active tab
    const getStatusFromTab = (tab) => {
        switch (tab) {
            case 'New Orders': return 'Pending';
            case 'In Progress': return 'Preparing';
            case 'Ready for Pickup': return 'Ready';
            case 'On the Way': return 'On the Way';
            case 'Completed': return 'Completed';
            case 'Cancelled': return 'Cancelled';
            case 'Refunds': return 'Refund';
            default: return 'Pending';
        }
    };

    const currentStatus = getStatusFromTab(activeTab);
    const filteredOrders = allOrders.filter(order => order.status === currentStatus);

    // Tab counts
    const tabs = [
        { name: 'New Orders', count: allOrders.filter(o => o.status === 'Pending').length },
        { name: 'In Progress', count: allOrders.filter(o => o.status === 'Preparing').length },
        { name: 'Ready for Pickup', count: allOrders.filter(o => o.status === 'Ready').length },
        { name: 'On the Way', count: allOrders.filter(o => o.status === 'On the Way').length },
        { name: 'Completed', count: allOrders.filter(o => o.status === 'Completed').length },
        { name: 'Cancelled', count: allOrders.filter(o => o.status === 'Cancelled').length },
        { name: 'Refunds', count: 0 },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-[#FFF7ED] text-[#ea580c] border-[#FFEDD5]';
            case 'Preparing': return 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]';
            case 'Ready': return 'bg-[#E0E7FF] text-[#4F46E5] border-[#C7D2FE]';
            case 'On the Way': return 'bg-[#F3E8FF] text-[#9333EA] border-[#E9D5FF]';
            case 'Completed': return 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]';
            case 'Cancelled': return 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Tabs Cards */}
            <div className="bg-white rounded-[12px] p-4 border-b border-b-[#E5E7EB]  mb-6">
                <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`flex items-center gap-2 text-[14px] font-semibold whitespace-nowrap transition-all cursor-pointer relative pb-4
                  ${activeTab === tab.name ? 'text-[#2bb29c]' : 'text-[#6B7280] hover:text-[#374151]'}`}
                        >
                            {tab.name}
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold
                  ${activeTab === tab.name ? 'bg-[#E0F2F1] text-[#2BB29C]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                                {tab.count}
                            </span>

                            {/* Active Tab Indicator */}
                            {activeTab === tab.name && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2BB29C] rounded-t-full animate-in slide-in-from-bottom-1 duration-300" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <div
                            key={order.id}
                            onClick={() => handleCardClick(order)}
                            className="bg-white rounded-[12px] p-6 border border-[#E5E7EB] cursor-pointer"
                        >
                            {/* Top Row: ID, Status, Time, Price */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className={`text-[18px] font-[400] ${order.status === 'Cancelled' ? 'text-gray-500 line-through' : 'text-[#111827]'}`}>
                                        {order.id}
                                    </span>
                                    <span className={`px-3 py-1 rounded-md text-[12px] font-medium border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-gray-500 text-[13px]">
                                        <Clock size={16} className='mb-1' />
                                        <span>{order.timeAgo}</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-[20px]  text-[#111827]">{order.total}</p>
                                    <p className={`text-[13px] font-medium ${order.paymentStatus === 'Paid' ? 'text-[#2BB29C]' : 'text-[#ea580c]'}`}>
                                        {order.paymentStatus}
                                    </p>
                                </div>
                            </div>

                            {/* Customer Details Row */}
                            <div className="flex flex-col md:flex-row md:items-center gap-6 -mt-3">
                                <div className="flex items-center gap-2 text-[#374151]">
                                    <User size={18} className="text-gray-400 -mt-1" />
                                    <span className={`text-[14px] font-[400] text-[#6B7280] ${order.customerName === 'CANCELLED' ? 'text-gray-200 uppercase tracking-wider' : ''}`}>
                                        {order.customerName}
                                    </span>
                                </div>
                                <div className="phone-container flex items-center gap-2 text-[#374151]">
                                    <Phone size={18} className="text-gray-400" />
                                    <span className="text-[14px] text-[#6B7280]">{order.customerPhone}</span>
                                </div>
                                <div className={`flex items-center gap-2 px-5 py-2 rounded-[8px] text-[12px] font-medium w-fit
                                    ${order.type === 'Delivery' ? 'bg-[#E6F7F4] text-[#2BB29C]' : 'bg-[#F3F4F6] text-gray-600'}`}>
                                    <MapPin size={14} />
                                    {order.type}
                                </div>
                            </div>

                            <div className="h-[1px] w-full bg-[#E5E7EB] mt-4"></div>

                            {/* Bottom Row */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-3">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Box size={18} />
                                    <span className="text-[14px]">{order.itemsCount} items</span>
                                    {order.estTime && (
                                        <span className="text-[14px] text-[#2BB29C] font-medium ml-4">{order.estTime}</span>
                                    )}
                                    {order.riderStatus && (
                                        <span className="text-[14px] text-gray-500 ml-4">{order.riderStatus}</span>
                                    )}
                                    {order.eta && (
                                        <span className="text-[14px] text-gray-500 ml-4">{order.eta}</span>
                                    )}
                                    {order.cancelledBy && (
                                        <span className="text-[14px] text-[#EF4444] ml-4">{order.cancelledBy}</span>
                                    )}
                                </div>

                                {order.status === 'Pending' && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => handleRejectClick(e, order)}
                                            className="px-6 py-2.5 rounded-[8px] border border-[#EF4444] text-[#EF4444] font-medium text-[13px] hover:bg-red-50 transition-colors cursor-pointer"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={(e) => handleAcceptClick(e, order)}
                                            className="px-6 py-2.5 rounded-[8px] bg-[#2BB29C] text-white font-medium text-[13px] hover:bg-[#259D89] transition-colors shadow-sm cursor-pointer"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-[12px] p-12 border border-[#E5E7EB] text-center">
                        <p className="text-gray-500 font-medium">No orders found in this section.</p>
                    </div>
                )}
            </div>

            <OrderRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
                onAccept={(order) => {
                    setIsModalOpen(false);
                    setSelectedOrder(order);
                    setIsAcceptModalOpen(true);
                }}
                onReject={(order) => {
                    setIsModalOpen(false);
                    setSelectedOrder(order);
                    setIsRejectModalOpen(true);
                }}
            />

            <AcceptOrderModal
                isOpen={isAcceptModalOpen}
                onClose={() => setIsAcceptModalOpen(false)}
                onConfirm={() => {
                    console.log('Accepted order:', selectedOrder?.id);
                    setIsAcceptModalOpen(false);
                }}
                orderId={selectedOrder?.id}
            />

            <RejectOrderModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={(reason) => {
                    console.log('Rejected order:', selectedOrder?.id, 'Reason:', reason);
                    setIsRejectModalOpen(false);
                }}
                orderId={selectedOrder?.id}
            />
        </div>
    );
}
