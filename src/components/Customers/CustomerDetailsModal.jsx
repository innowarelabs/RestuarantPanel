import React from 'react';
import { X, Phone, Mail, MapPin, ChevronRight, ShoppingBag, DollarSign, Award, Target } from 'lucide-react';

export default function CustomerDetailsModal({ isOpen, onClose, customer }) {
    if (!isOpen || !customer) return null;

    const isActive = customer.status === 'Active';

    // Mock extra data for the modal based on images
    const extraData = isActive ? {
        avgOrderValue: '$12.16',
        loyaltyPoints: 190,
        lifetimePoints: 450,
        rewards: ['Free Ice Cream', 'Free Drink'],
        addresses: [
            { id: 1, street: '123 High Street', city: 'London, SW1A 1AA' },
            { id: 2, street: '45 Park Lane', city: 'London, W1K 1PN' }
        ]
    } : {
        avgOrderValue: '$11.74',
        loyaltyPoints: 80,
        lifetimePoints: 180,
        addresses: [
            { id: 1, street: '89 Queen Road', city: 'Newcastle, NE1 4EX' }
        ],
        orderHistory: [
            { id: 'ORD-2275', status: 'Returned', date: '29 Nov 2025', price: '$14.20' }
        ]
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 transition-opacity" onClick={onClose}>
            <div
                className="bg-white rounded-[24px] w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-8 flex justify-between items-start">
                    <div className="space-y-3">
                        <h2 className="text-[24px] font-[800] text-[#111827]">{customer.name}</h2>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-gray-500">
                                <Phone size={18} />
                                <span className="text-[14px]">{customer.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-500">
                                <Mail size={18} />
                                <span className="text-[14px]">{customer.email}</span>
                            </div>
                        </div>
                        <div className="pt-1">
                            <span className={`px-4 py-1.5 rounded-lg text-[14px] font-medium
                                ${isActive ? 'bg-[#E0F2F1] text-[#2BB29C]' : 'bg-[#FEF2F2] text-[#EF4444]'}`}>
                                {customer.status}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Divider */}
                <div className="h-[1px] w-full bg-gray-100 mx-8"></div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">

                    {/* Customer Profile Summary */}
                    <section>
                        <h3 className="text-[16px] font-[800] text-[#111827] mb-4">Customer Profile Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#F6F8F9] p-5 rounded-[16px] border border-gray-50">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <ShoppingBag size={16} />
                                    <span className="text-[13px]">Total Orders</span>
                                </div>
                                <p className="text-[20px] font-bold text-[#111827]">{customer.totalOrders}</p>
                            </div>
                            <div className="bg-[#F6F8F9] p-5 rounded-[16px] border border-gray-50">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <DollarSign size={16} />
                                    <span className="text-[13px]">Total Spend</span>
                                </div>
                                <p className="text-[20px] font-bold text-[#111827]">{customer.totalSpend}</p>
                            </div>
                            <div className="bg-[#F6F8F9] p-5 rounded-[16px] border border-gray-50">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Target size={16} />
                                    <span className="text-[13px]">Avg Order Value</span>
                                </div>
                                <p className="text-[20px] font-bold text-[#111827]">{extraData.avgOrderValue}</p>
                            </div>
                            <div className="bg-[#E6F7F4]/30 p-5 rounded-[16px] border border-[#2BB29C]/10">
                                <div className="flex items-center gap-2 text-[#2BB29C] mb-2">
                                    <Award size={16} />
                                    <span className="text-[13px]">Loyalty Points</span>
                                </div>
                                <p className="text-[20px] font-bold text-[#2BB29C]">{extraData.loyaltyPoints}</p>
                            </div>
                        </div>

                        {/* Points Info Box */}
                        <div className="mt-4 p-5 rounded-[12px] border border-gray-100">
                            <p className="text-[14px] text-gray-600">
                                Lifetime Points Earned: <span className="font-bold text-[#111827]">{extraData.lifetimePoints}</span>
                            </p>
                            {isActive && extraData.rewards && (
                                <div className="mt-4 space-y-3">
                                    <p className="text-[14px] text-gray-600">Rewards Redeemed:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {extraData.rewards.map((reward, i) => (
                                            <span key={i} className="px-3 py-1 bg-[#E0F2F1] text-[#2BB29C] rounded-lg text-[13px]">
                                                {reward}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Delivery Addresses */}
                    <section>
                        <h3 className="text-[16px] font-bold text-[#111827] mb-4">Delivery Addresses</h3>
                        <div className="space-y-3">
                            {extraData.addresses.map((addr) => (
                                <div key={addr.id} className="bg-[#F9FAFB] p-4 rounded-[16px] flex items-start gap-4 border border-gray-50">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <MapPin size={18} className="text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-normal text-[#111827]">{addr.street}</p>
                                        <p className="text-[13px] font-normal text-gray-500">{addr.city}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Order History (Blocked only) */}
                    {!isActive && extraData.orderHistory && (
                        <section className="pb-4">
                            <h3 className="text-[16px] font-bold text-[#111827] mb-4">Order History</h3>
                            <div className="space-y-3">
                                {extraData.orderHistory.map((order) => (
                                    <div key={order.id} className="p-4 border border-gray-100 rounded-[16px] flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-[14px] font-bold text-[#111827]">{order.id}</p>
                                                <p className="text-[12px] text-gray-500">{order.date}</p>
                                            </div>
                                            <span className="px-3 py-0.5 bg-[#E0E7FF] text-[#4338CA] rounded-full text-[12px]">
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[14px] font-bold text-[#111827]">{order.price}</span>
                                            <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
