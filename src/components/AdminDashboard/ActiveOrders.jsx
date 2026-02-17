import { User } from 'lucide-react';
import React from 'react';

const activeOrders = [
    { id: '#8423', name: 'Ali Raza', items: 'Zinger Burger x1, Loaded Fries x1', price: '$9.48', time: '2 minutes ago', isNew: true },
    { id: '#8422', name: 'Sarah Johnson', items: 'Classic Burger x2, Coke x2', price: '$18.50', time: '5 minutes ago', isNew: true },
];

export default function ActiveOrders() {
    return (
        <div className="bg-white p-6 rounded-[16px] border border-[#00000033] h-[530px]">
            <h3 className="text-[20px] font-bold text-[#111827] mb-1">Active Orders</h3>
            <p className="text-[#6B7280] font-[400] text-[14px] mb-6">Orders that need your attention right now</p>

            <div className="space-y-4">
                {activeOrders.map((order) => (
                    <div key={order.id} className="bg-[#24B99E33] p-4 rounded-[12px] border border-[#24B99E]">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-[400] text-[#111827] text-[16px]">Order {order.id}</span>
                                {order.isNew && (
                                    <span className="bg-[#DBEAFE] text-[#1E40AF] text-[10px] px-3 py-1 rounded-[6px] font-medium">New</span>
                                )}
                            </div>
                            <span className="font-[400] text-[#111827] text-[18px]">{order.price}</span>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-[#4B5563] text-[14px]">
                                    <User size={18} className="text-gray-400 -mt-1" />

                                {order.name}
                            </div>
                            <span className="text-[#6B7280] text-[11px]">{order.time}</span>
                        </div>

                        <p className="text-[#6B7280] text-[13px] font-[400] mb-4">{order.items}</p>

                        <div className="flex gap-3">
                            <button className="h-[45px] text-[14px] font-[500] flex-1 bg-primary text-white py-2.5 rounded-[8px] font-medium hover:opacity-90 transition-opacity cursor-pointer">
                                Accept
                            </button>
                            <button className="flex-1 text-[14px] font-[500] bg-white border border-[#E5E7EB] text-[#374151] py-2.5 rounded-[8px] font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                                Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
