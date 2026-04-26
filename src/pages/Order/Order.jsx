import React, { useState, useEffect, useCallback } from 'react';
import { Clock, User, Phone, Box, MapPin, MousePointer2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import OrderRequestModal from '../../components/OrderManagement/OrderRequestModal';
import InProgressOrderDrawer from '../../components/OrderManagement/InProgressOrderDrawer';
import CompletedOrderDrawer from '../../components/OrderManagement/CompletedOrderDrawer';
import CancelledOrderDrawer from '../../components/OrderManagement/CancelledOrderDrawer';
import AcceptOrderModal from '../../components/OrderManagement/AcceptOrderModal';
import RejectOrderModal from '../../components/OrderManagement/RejectOrderModal';

/** Relative time from `created_at` (ISO), e.g. "2 mins ago", "3 days ago" */
function formatTimeAgoFromCreated(iso) {
    if (!iso) return '';
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return '';
    let sec = Math.floor((Date.now() - t.getTime()) / 1000);
    if (sec < 0) return 'just now';
    if (sec < 10) return 'just now';
    if (sec < 60) return `${sec} secs ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
    if (day < 30) {
        const wk = Math.floor(day / 7);
        return wk < 1 ? `${day} days ago` : `${wk} week${wk === 1 ? '' : 's'} ago`;
    }
    if (day < 365) {
        const mo = Math.floor(day / 30);
        return `${mo} month${mo === 1 ? '' : 's'} ago`;
    }
    const yr = Math.floor(day / 365);
    return `${yr} year${yr === 1 ? '' : 's'} ago`;
}

/** e.g. "Delivered 7 hours ago" — reuses the same relative strings as `formatTimeAgoFromCreated` */
function formatDeliveredAgoLine(deliveredAtIso, fallback) {
    const rel = formatTimeAgoFromCreated(deliveredAtIso);
    if (!rel) return fallback;
    return `Delivered ${rel}`;
}

function mapOrderTypeForCard(orderType) {
    const u = String(orderType || '').toUpperCase();
    if (u === 'DELIVERY' || u === 'DELIVER') return 'Delivery';
    if (u === 'PICKUP' || u === 'COLLECTION') return 'Collection';
    if (!u) return 'Delivery';
    return String(orderType).charAt(0).toUpperCase() + String(orderType).slice(1).toLowerCase();
}

export default function OrderManagement() {
    const [activeTab, setActiveTab] = useState('New Orders');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inProgressDrawerOpen, setInProgressDrawerOpen] = useState(false);
    const [completedDrawerOpen, setCompletedDrawerOpen] = useState(false);
    const [cancelledDrawerOpen, setCancelledDrawerOpen] = useState(false);
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
        if (activeTab === 'In Progress') {
            setIsModalOpen(false);
            setCompletedDrawerOpen(false);
            setCancelledDrawerOpen(false);
            setInProgressDrawerOpen(true);
        } else if (activeTab === 'Completed') {
            setIsModalOpen(false);
            setInProgressDrawerOpen(false);
            setCancelledDrawerOpen(false);
            setCompletedDrawerOpen(true);
        } else if (activeTab === 'Cancelled') {
            setIsModalOpen(false);
            setInProgressDrawerOpen(false);
            setCompletedDrawerOpen(false);
            setCancelledDrawerOpen(true);
        } else {
            setInProgressDrawerOpen(false);
            setCompletedDrawerOpen(false);
            setCancelledDrawerOpen(false);
            setIsModalOpen(true);
        }
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
                    timeAgo: formatTimeAgoFromCreated(order.created_at) || order.time_ago || '',
                    customerName: order.customer_name || '',
                    customerPhone: order.customer_phone || '',
                    type: mapOrderTypeForCard(order.order_type),
                    itemsCount:
                        order.items_count ??
                        (Array.isArray(order.order_items) ? order.order_items.length : 0) ??
                        0,
                    total: typeof order.total_amount === 'number' ? `$${order.total_amount.toFixed(2)}` : order.total || '',
                    paymentStatus: order.payment_status || 'Paid',
                    estTime: order.estimated_time || '',
                    riderStatus: order.rider_status || '',
                    eta: order.eta || '',
                    cancelledBy: order.cancelled_by || order.cancelled_by_type || '',
                    cancelReason: order.cancel_reason || order.cancellation_reason || '',
                    deliveryAddress: order.delivery_address || '',
                    orderItems: Array.isArray(order.order_items) ? order.order_items : [],
                    subtotal: typeof order.subtotal === 'number' ? order.subtotal : 0,
                    taxAmount: typeof order.tax_amount === 'number' ? order.tax_amount : 0,
                    totalAmount: typeof order.total_amount === 'number' ? order.total_amount : 0,
                    paymentMethod: order.payment_method || '',
                    createdAt: order.created_at,
                    updatedAt: order.updated_at,
                    deliveredAt: order.delivered_at || null,
                }));
                setOrders(mappedOrders);
            } else if (Array.isArray(payload)) {
                // Fallback if API returns array directly in data
                const mappedOrders = payload.map((order) => ({
                    id: order.order_number || order.order_id || order.id,
                    rawId: order.order_id || order.id,
                    status: order.status || currentStatus,
                    timeAgo: formatTimeAgoFromCreated(order.created_at) || order.time_ago || '',
                    customerName: order.customer_name || '',
                    customerPhone: order.customer_phone || '',
                    type: mapOrderTypeForCard(order.order_type),
                    itemsCount:
                        order.items_count ??
                        (Array.isArray(order.order_items) ? order.order_items.length : 0) ??
                        0,
                    total: typeof order.total_amount === 'number' ? `$${order.total_amount.toFixed(2)}` : order.total || '',
                    paymentStatus: order.payment_status || 'Paid',
                    estTime: order.estimated_time || '',
                    riderStatus: order.rider_status || '',
                    eta: order.eta || '',
                    cancelledBy: order.cancelled_by || order.cancelled_by_type || '',
                    cancelReason: order.cancel_reason || order.cancellation_reason || '',
                    deliveryAddress: order.delivery_address || '',
                    orderItems: Array.isArray(order.order_items) ? order.order_items : [],
                    subtotal: typeof order.subtotal === 'number' ? order.subtotal : 0,
                    taxAmount: typeof order.tax_amount === 'number' ? order.tax_amount : 0,
                    totalAmount: typeof order.total_amount === 'number' ? order.total_amount : 0,
                    paymentMethod: order.payment_method || '',
                    createdAt: order.created_at,
                    updatedAt: order.updated_at,
                    deliveredAt: order.delivered_at || null,
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
                return 'bg-[#FEF3C7] text-[#92400E] border-0';
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

    const updateOrderStatus = async (
        orderId,
        newStatus,
        extraPayload = {},
        successMessage = 'Order updated successfully',
    ) => {
        if (!orderId) return false;
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
                toast.success(successMessage);
                fetchOrders();
                fetchTabCounts();
                return true;
            }
            toast.error(data.message || 'Failed to update order');
            return false;
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Error updating order');
            return false;
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Tabs Cards */}
            <div className="mb-6 rounded-[12px] border-b border-b-[#E5E7EB] bg-white pt-4 px-4">
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
                                    <span
                                        className={`px-3 py-1 rounded-[8px] text-[12px] font-medium border capitalize ${
                                            activeTab === 'Refunds' &&
                                            String(order.status || '').toLowerCase() === 'refunded'
                                                ? 'bg-[#FED7AA] text-[#9A3412] border-0'
                                                : getStatusColor(order.status)
                                        }`}
                                    >
                                        {String(order.status || '')
                                            .replace(/_/g, ' ')
                                            .toLowerCase()}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-gray-500 text-[13px]">
                                        <Clock size={16} className="mt-[1px] shrink-0" />
                                        <span className="mt-[2px]">
                                            {activeTab === 'Completed' && order.deliveredAt
                                                ? formatDeliveredAgoLine(order.deliveredAt, order.timeAgo)
                                                : order.timeAgo}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-right font-sans text-[20px] font-semibold leading-[30px] tracking-normal text-[#0F1724]">
                                        {order.total}
                                    </p>
                                    <p
                                        className={`text-[13px] font-medium capitalize ${
                                            String(order.paymentStatus || '').toLowerCase() === 'paid'
                                                ? 'text-[#10B981]'
                                                : 'text-[#ea580c]'
                                        }`}
                                    >
                                        {String(order.paymentStatus || '')
                                            .replace(/_/g, ' ')
                                            .toLowerCase()}
                                    </p>
                                </div>
                            </div>

                            {/* Customer Details Row */}
                            <div className="flex flex-col md:flex-row md:items-center gap-6 -mt-3">
                                <div className="flex items-center gap-2 text-[#374151]">
                                    <User size={18} className="text-gray-400 -mt-1" />
                                    <span
                                        className={`text-[14px] font-[400] ${
                                            activeTab === 'Cancelled'
                                                ? 'text-[#6B7280] uppercase tracking-wider'
                                                : `text-[#6B7280] ${order.customerName === 'CANCELLED' ? 'text-gray-200 uppercase tracking-wider' : ''}`
                                        }`}
                                    >
                                        {activeTab === 'Cancelled' ? 'CANCELLED' : order.customerName}
                                    </span>
                                </div>
                                <div className="phone-container flex flex-wrap items-center gap-2 text-[#374151]">
                                    <Phone size={18} className="text-gray-400 shrink-0" />
                                    <span className="text-[14px] text-[#6B7280]">{order.customerPhone}</span>
                                    <div
                                        className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-[8px] text-[12px] font-medium capitalize ${
                                            String(order.type || '').toLowerCase() === 'delivery'
                                                ? 'bg-primary-bg text-primary'
                                                : 'bg-[#F3F4F6] text-gray-600'
                                        }`}
                                    >
                                        {String(order.type || '').toLowerCase() === 'delivery' ? (
                                            <MousePointer2 size={14} className="-scale-x-100 shrink-0" strokeWidth={2} />
                                        ) : (
                                            <MapPin size={14} className="shrink-0" />
                                        )}
                                        {String(order.type || '')
                                            .replace(/_/g, ' ')
                                            .toLowerCase()}
                                    </div>
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

            <InProgressOrderDrawer
                isOpen={inProgressDrawerOpen}
                onClose={() => setInProgressDrawerOpen(false)}
                order={selectedOrder}
                onMarkReady={async (ord) => {
                    if (!ord?.rawId) return;
                    const ok = await updateOrderStatus(ord.rawId, 'ready', {}, 'Order marked as ready');
                    if (ok) setInProgressDrawerOpen(false);
                }}
                onAssignDriver={() => {
                    toast('Assign driver will be available soon');
                }}
            />

            <CompletedOrderDrawer
                isOpen={completedDrawerOpen}
                onClose={() => setCompletedDrawerOpen(false)}
                order={selectedOrder}
                onPrintReceipt={() => {
                    toast('Print receipt will be available soon');
                }}
                onIssueRefund={() => {
                    toast('Issue refund will be available soon');
                }}
            />

            <CancelledOrderDrawer
                isOpen={cancelledDrawerOpen}
                onClose={() => setCancelledDrawerOpen(false)}
                order={selectedOrder}
            />

            <AcceptOrderModal
                isOpen={isAcceptModalOpen}
                onClose={() => setIsAcceptModalOpen(false)}
                onConfirm={() => {
                    if (selectedOrder?.rawId) {
                        // Accept → move to in-progress per backend spec
                        updateOrderStatus(
                            selectedOrder.rawId,
                            'in-progress',
                            {},
                            'Order Accepted',
                        );
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
                            'Order Rejected',
                        );
                    }
                    setIsRejectModalOpen(false);
                }}
                orderId={selectedOrder?.id}
            />
        </div>
    );
}
