import { User } from 'lucide-react';
import React from 'react';

export default function ActiveOrders({ orders = [], loading = false }) {
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
                    {orders.map((order) => (
                        <div
                            key={order.order_id}
                            className="bg-[#DD2F260D] p-4 rounded-[12px] border border-[#DD2F26]"
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
                                <span className="text-[#6B7280] text-[11px]">
                                    {order.time_ago}
                                </span>
                            </div>

                            <p className="text-[#6B7280] text-[13px] font-[400]">
                                {(order.items || [])
                                    .map((item) => `${item.name} x${item.quantity}`)
                                    .join(', ')}
                            </p>

                            {/* <div className="flex gap-3">
                                <button className="h-[45px] text-[14px] font-[500] flex-1 bg-primary text-white py-2.5 rounded-[8px] font-medium hover:opacity-90 transition-opacity cursor-pointer">
                                    Accept
                                </button>
                                <button className="flex-1 text-[14px] font-[500] bg-white border border-[#E5E7EB] text-[#374151] py-2.5 rounded-[8px] font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                                    Reject
                                </button>
                            </div> */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
