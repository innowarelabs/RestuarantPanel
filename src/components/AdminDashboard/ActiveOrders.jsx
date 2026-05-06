import { User } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import AcceptOrderModal from '../OrderManagement/AcceptOrderModal';
import RejectOrderModal from '../OrderManagement/RejectOrderModal';

const API_BASE = 'https://api.baaie.com';

/** Same rule as Orders → New Orders list (pending only). */
function isPendingOrder(order) {
    const s = String(order?.status ?? '').trim();
    if (!s) return true;
    const n = s.toLowerCase();
    return n === 'pending';
}

/** Shape expected by Accept/Reject modals (matches Order.jsx `selectedOrder`). */
function toModalOrder(order) {
    const rawId = order.order_id || order.id;
    const id = order.order_number || rawId;
    return {
        id,
        rawId,
        status: order.status || 'pending',
        customerName: order.customer_name || '',
        total: typeof order.total_amount === 'number' ? `$${order.total_amount.toFixed(2)}` : '',
    };
}

export default function ActiveOrders({ orders = [], loading = false, onOrdersChanged }) {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    const getRestaurantId = useCallback(() => {
        const fromUser =
            user && typeof user === 'object' && typeof user.restaurant_id === 'string'
                ? user.restaurant_id
                : '';
        let fromStorage = '';
        try {
            fromStorage = localStorage.getItem('restaurant_id') || '';
        } catch {
            fromStorage = '';
        }
        return (fromUser || fromStorage).trim();
    }, [user]);

    const updateOrderStatus = useCallback(
        async (orderId, newStatus, extraPayload = {}, successMessage = 'Order updated successfully') => {
            if (!orderId) return false;
            const restaurantId = getRestaurantId();
            try {
                const baseUrl = (import.meta.env.VITE_BACKEND_URL || API_BASE).replace(/\/$/, '');
                const url = `${baseUrl}/api/v1/orders/${encodeURIComponent(orderId)}/status`;
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
                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                    toast.success(successMessage);
                    return true;
                }
                toast.error(data.message || 'Failed to update order');
                return false;
            } catch (error) {
                console.error('Error updating order:', error);
                toast.error('Error updating order');
                return false;
            }
        },
        [accessToken, getRestaurantId],
    );

    const handleAcceptClick = (e, order) => {
        e.stopPropagation();
        setSelectedOrder(toModalOrder(order));
        setIsAcceptModalOpen(true);
    };

    const handleRejectClick = (e, order) => {
        e.stopPropagation();
        setSelectedOrder(toModalOrder(order));
        setIsRejectModalOpen(true);
    };

    const hasOrders = orders && orders.length > 0;

    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033] h-[530px]">
            <h3 className="text-[20px] font-bold text-[#111827] mb-1">Active Orders</h3>
            <p className="text-[#6B7280] font-[400] text-[14px] mb-6">
                {loading ? 'Fetching active orders...' : 'Orders that need your attention right now'}
            </p>

            {!hasOrders && !loading && (
                <div className="h-full flex items-center justify-center text-[13px] text-[#9CA3AF]">
                    No active orders at the moment.
                </div>
            )}

            {hasOrders && (
                <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: '420px' }}>
                    {orders.map((order) => {
                        const showActions = isPendingOrder(order);
                        return (
                            <div
                                key={order.order_id}
                                className="rounded-[12px] border border-primary p-4 bg-[#DD2F260D]"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-[400] text-[#111827] text-[16px]">
                                            Order {order.order_number}
                                        </span>
                                        <span className="bg-[#DBEAFE] text-[#1E40AF] text-[10px] px-3 py-1 rounded-[6px] font-medium">
                                            New
                                        </span>
                                    </div>
                                    <span className="font-[400] text-[#111827] text-[18px]">
                                        ${order.total_amount?.toLocaleString?.() ?? order.total_amount}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2 text-[#4B5563] text-[14px]">
                                        <User size={18} className="text-gray-400 -mt-1" />
                                        {order.customer_name}
                                    </div>
                                    <span className="text-[#6B7280] text-[11px]">{order.time_ago}</span>
                                </div>

                                <p className="text-[#6B7280] text-[13px] font-[400] mb-4">
                                    {(order.items || [])
                                        .map((item) => `${item.name} x${item.quantity}`)
                                        .join(', ') || '—'}
                                </p>

                                {showActions ? (
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <button
                                            type="button"
                                            onClick={(e) => handleRejectClick(e, order)}
                                            className="w-full min-h-[45px] text-[14px] font-[500] rounded-[8px] border border-[#EF4444] text-[#EF4444] py-2.5 hover:bg-red-50 transition-colors cursor-pointer"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleAcceptClick(e, order)}
                                            className="w-full min-h-[45px] text-[14px] font-[500] rounded-[8px] bg-[#DD2F26] text-white py-2.5 hover:bg-[#C52820] transition-colors shadow-sm cursor-pointer"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}

            <AcceptOrderModal
                isOpen={isAcceptModalOpen}
                onClose={() => setIsAcceptModalOpen(false)}
                onConfirm={async () => {
                    if (!selectedOrder?.rawId) {
                        setIsAcceptModalOpen(false);
                        return;
                    }
                    const ok = await updateOrderStatus(
                        selectedOrder.rawId,
                        'in-progress',
                        {},
                        'Order Accepted',
                    );
                    if (ok) await onOrdersChanged?.();
                    setIsAcceptModalOpen(false);
                }}
                orderId={selectedOrder?.id}
            />

            <RejectOrderModal
                key={selectedOrder?.rawId || 'reject'}
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={async (reason) => {
                    if (!selectedOrder?.rawId) {
                        setIsRejectModalOpen(false);
                        return;
                    }
                    const ok = await updateOrderStatus(
                        selectedOrder.rawId,
                        'cancelled',
                        reason ? { cancel_reason: reason } : {},
                        'Order Rejected',
                    );
                    if (ok) await onOrdersChanged?.();
                    setIsRejectModalOpen(false);
                }}
            />
        </div>
    );
}
