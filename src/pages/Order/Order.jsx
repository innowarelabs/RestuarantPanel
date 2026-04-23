import React, { useState, useEffect, useCallback } from 'react';
import { Clock, User, Phone, Box, MapPin } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import OrderRequestModal from '../../components/OrderManagement/OrderRequestModal';
import AcceptOrderModal from '../../components/OrderManagement/AcceptOrderModal';
import RejectOrderModal from '../../components/OrderManagement/RejectOrderModal';

export default function OrderManagement() {
    const [activeTab, setActiveTab] = useState('New Orders');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tabCounts, setTabCounts] = useState({
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        refunded: 0,
    });

    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const getRestaurantId = () => {
        const fromUser = user && typeof user === 'object' && typeof user.restaurant_id === 'string' ? user.restaurant_id : '';
        let fromStorage = '';
        try {
            fromStorage = localStorage.getItem('restaurant_id') || '';
        } catch {
            fromStorage = '';
        }
        return (fromUser || fromStorage).trim();
    };

    const restaurantId = getRestaurantId();

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

    // Map tabs to backend list status values (query param)
    // Backend spec:
    // - New Orders → status=pending
    // - In Progress / Ready for Pickup / On the Way → status=in-progress
    // - Completed → status=completed
    // - Cancelled → status=cancelled
    // - Refunds → status=refunded
    const getStatusFromTab = (tab) => {
        switch (tab) {
            case 'New Orders':
                return 'pending';
            case 'In Progress':
            case 'Ready for Pickup':
            case 'On the Way':
                return 'in-progress';
            case 'Completed':
                return 'completed';
            case 'Cancelled':
                return 'cancelled';
            case 'Refunds':
                return 'refunded';
            default:
                return 'pending';
        }
    };

    const currentStatus = getStatusFromTab(activeTab);

    const fetchOrders = useCallback(async () => {
        if (!restaurantId) {
            return;
        }
        setLoading(true);
        try {
            const url = `https://api.baaie.com/api/v1/orders?status=${encodeURIComponent(currentStatus)}&skip=0&limit=20`;

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const data = await res.json();
            console.log('Orders Data:', data);

            const payload = data?.data && typeof data.data === 'object' ? data.data : data;

            if (Array.isArray(payload?.orders)) {
                const mappedOrders = payload.orders.map((order) => ({
                    id: order.order_number || order.order_id || order.id,
                    rawId: order.order_id || order.id,
                    status: order.status || currentStatus,
                    timeAgo: order.time_ago || '',
                    customerName: order.customer_name || '',
                    customerPhone: order.customer_phone || '',
                    type: order.order_type === 'DELIVERY' ? 'Delivery' : order.order_type === 'PICKUP' ? 'Collection' : order.order_type || 'Delivery',
                    itemsCount: order.items_count || 0,
                    total: typeof order.total_amount === 'number' ? `$${order.total_amount.toFixed(2)}` : order.total || '',
                    paymentStatus: order.payment_status || 'Paid',
                    estTime: order.estimated_time || '',
                    riderStatus: order.rider_status || '',
                    eta: order.eta || '',
                    cancelledBy: order.cancelled_by || '',
                }));
                setOrders(mappedOrders);
            } else if (Array.isArray(payload)) {
                // Fallback if API returns array directly in data
                const mappedOrders = payload.map((order) => ({
                    id: order.order_number || order.order_id || order.id,
                    rawId: order.order_id || order.id,
                    status: order.status || currentStatus,
                    timeAgo: order.time_ago || '',
                    customerName: order.customer_name || '',
                    customerPhone: order.customer_phone || '',
                    type: order.order_type === 'DELIVERY' ? 'Delivery' : order.order_type === 'PICKUP' ? 'Collection' : order.order_type || 'Delivery',
                    itemsCount: order.items_count || 0,
                    total: typeof order.total_amount === 'number' ? `$${order.total_amount.toFixed(2)}` : order.total || '',
                    paymentStatus: order.payment_status || 'Paid',
                    estTime: order.estimated_time || '',
                    riderStatus: order.rider_status || '',
                    eta: order.eta || '',
                    cancelledBy: order.cancelled_by || '',
                }));
                setOrders(mappedOrders);
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Error fetching orders');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken, restaurantId, currentStatus]);

    const fetchTabCounts = useCallback(async () => {
        if (!restaurantId) {
            return;
        }
        try {
            const url = `https://api.baaie.com/api/v1/orders/counts`;

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });

            const data = await res.json();
            const payload = data?.data && typeof data.data === 'object' ? data.data : data;
            const counts = payload?.counts && typeof payload.counts === 'object' ? payload.counts : payload;

            if (counts && typeof counts === 'object') {
                setTabCounts((prev) => ({
                    ...prev,
                    pending: counts.pending ?? counts.new_orders ?? prev.pending,
                    in_progress: counts.in_progress ?? counts.inProgress ?? prev.in_progress,
                    completed: counts.completed ?? prev.completed,
                    cancelled: counts.cancelled ?? prev.cancelled,
                    refunded: counts.refunded ?? prev.refunded,
                }));
            }
        } catch (error) {
            console.error('Error fetching order counts:', error);
        }
    }, [accessToken, restaurantId]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        fetchTabCounts();
    }, [fetchTabCounts]);

    // Tab counts – prefer backend counts, fall back to active list length
    const tabs = [
        {
            name: 'New Orders',
            count: typeof tabCounts.pending === 'number'
                ? tabCounts.pending
                : activeTab === 'New Orders'
                    ? orders.length
                    : 0,
        },
        {
            name: 'In Progress',
            count: typeof tabCounts.in_progress === 'number'
                ? tabCounts.in_progress
                : activeTab === 'In Progress'
                    ? orders.length
                    : 0,
        },
        // {
        //     name: 'Ready for Pickup',
        //     count: typeof tabCounts.in_progress === 'number'
        //         ? tabCounts.in_progress
        //         : activeTab === 'Ready for Pickup'
        //             ? orders.length
        //             : 0,
        // },
        // {
        //     name: 'On the Way',
        //     count: typeof tabCounts.in_progress === 'number'
        //         ? tabCounts.in_progress
        //         : activeTab === 'On the Way'
        //             ? orders.length
        //             : 0,
        // },
        {
            name: 'Completed',
            count: typeof tabCounts.completed === 'number'
                ? tabCounts.completed
                : activeTab === 'Completed'
                    ? orders.length
                    : 0,
        },
        {
            name: 'Cancelled',
            count: typeof tabCounts.cancelled === 'number'
                ? tabCounts.cancelled
                : activeTab === 'Cancelled'
                    ? orders.length
                    : 0,
        },
        {
            name: 'Refunds',
            count: typeof tabCounts.refunded === 'number'
                ? tabCounts.refunded
                : activeTab === 'Refunds'
                    ? orders.length
                    : 0,
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
            case 'Pending':
            case 'pending':
                return 'bg-[#FFF7ED] text-[#ea580c] border-[#FFEDD5]';
            case 'PREPARING':
            case 'Preparing':
            case 'IN_PROGRESS':
            case 'in-progress':
            case 'In Progress':
                return 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]';
            case 'READY':
            case 'Ready':
            case 'ready':
                return 'bg-[#E0E7FF] text-[#4F46E5] border-[#C7D2FE]';
            case 'ON_THE_WAY':
            case 'On the Way':
            case 'on-the-way':
                return 'bg-[#F3E8FF] text-[#9333EA] border-[#E9D5FF]';
            case 'COMPLETED':
            case 'Completed':
            case 'completed':
                return 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]';
            case 'CANCELLED':
            case 'Cancelled':
            case 'cancelled':
                return 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]';
            case 'REFUNDED':
            case 'Refunded':
            case 'refunded':
                return 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const updateOrderStatus = async (orderId, newStatus, extraPayload = {}) => {
        if (!orderId) return;
        try {
            const url = `https://api.baaie.com/api/v1/orders/${encodeURIComponent(orderId)}/status`;

            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
                body: JSON.stringify({
                    status: newStatus,
                    ...extraPayload,
                }),
            });

            const data = await res.json();
            console.log('Update Order Response:', data);

            if (res.ok) {
                toast.success('Order updated successfully');
                fetchOrders();
                fetchTabCounts();
            } else {
                toast.error(data.message || 'Failed to update order');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Error updating order');
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
                  ${activeTab === tab.name ? 'text-[#DD2F26]' : 'text-[#6B7280] hover:text-[#374151]'}`}
                        >
                            {tab.name}
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold
                  ${activeTab === tab.name ? 'bg-[#FEF2F2] text-[#DD2F26]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                                {tab.count}
                            </span>

                            {/* Active Tab Indicator */}
                            {activeTab === tab.name && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#DD2F26] rounded-t-full animate-in slide-in-from-bottom-1 duration-300" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-[12px] p-12 border border-[#E5E7EB] text-center">
                        <p className="text-gray-500 font-medium">Loading orders...</p>
                    </div>
                ) : orders.length > 0 ? (
                    orders.map((order) => (
                        <div
                            key={order.id}
                            onClick={() => handleCardClick(order)}
                            className="bg-white rounded-[12px] p-6 border border-[#E5E7EB] cursor-pointer"
                        >
                            {/* Top Row: ID, Status, Time, Price */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className={`text-[18px] font-[400] ${order.status === 'CANCELLED' || order.status === 'Cancelled' ? 'text-gray-500 line-through' : 'text-[#111827]'}`}>
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
                                    <p className={`text-[13px] font-medium ${order.paymentStatus === 'Paid' ? 'text-[#DD2F26]' : 'text-[#ea580c]'}`}>
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
                                    ${order.type === 'Delivery' ? 'bg-[#FEF2F2] text-[#DD2F26]' : 'bg-[#F3F4F6] text-gray-600'}`}>
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
                                        <span className="text-[14px] text-[#DD2F26] font-medium ml-4">{order.estTime}</span>
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

                                {(order.status === 'PENDING' || order.status === 'Pending' || order.status === 'pending') && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => handleRejectClick(e, order)}
                                            className="px-6 py-2.5 rounded-[8px] border border-[#EF4444] text-[#EF4444] font-medium text-[13px] hover:bg-red-50 transition-colors cursor-pointer"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={(e) => handleAcceptClick(e, order)}
                                            className="px-6 py-2.5 rounded-[8px] bg-[#DD2F26] text-white font-medium text-[13px] hover:bg-[#C52820] transition-colors shadow-sm cursor-pointer"
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
                    if (selectedOrder?.rawId) {
                        // Accept → move to in-progress per backend spec
                        updateOrderStatus(selectedOrder.rawId, 'in-progress');
                    }
                    setIsAcceptModalOpen(false);
                }}
                orderId={selectedOrder?.id}
            />

            <RejectOrderModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={(reason) => {
                    if (selectedOrder?.rawId) {
                        updateOrderStatus(
                            selectedOrder.rawId,
                            'cancelled',
                            reason ? { cancel_reason: reason } : {},
                        );
                    }
                    setIsRejectModalOpen(false);
                }}
                orderId={selectedOrder?.id}
            />
        </div>
    );
}
