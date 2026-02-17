import React, { useState } from 'react';
import { Package, DollarSign, X } from 'lucide-react';

export default function NotificationPanel({ isOpen, onClose }) {
    const [activeFilter, setActiveFilter] = useState('All');

    if (!isOpen) return null;

    const notifications = [
        {
            id: 1,
            type: 'Order',
            title: 'New Order Request',
            description: 'Order #ORD-2391 from Ali Hassan',
            time: '17 mins ago',
            isUnread: true,
            icon: Package,
        },
        {
            id: 2,
            type: 'Payment',
            title: 'Payment Received',
            description: 'Order #ORD-2390 - AED 20.98',
            time: '27 mins ago',
            isUnread: true,
            icon: DollarSign,
        },
    ];

    const filters = ['All', 'Unread', 'Today'];

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 mt-2 sm:mt-2 w-auto sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in zoom-in-95 duration-200 origin-top sm:origin-top-right top-[70px] sm:top-full">
                {/* Header */}
                <div className="p-6 border-b border-[#F3F4F6]">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-[#1A1A1A]">Notifications</h3>
                        <div className="flex items-center gap-3">
                            <button className="text-[14px] font-semibold text-[#24B99E] hover:underline transition">
                                Mark all as read
                            </button>
                            <button
                                onClick={onClose}
                                className="sm:hidden p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3 mt-6">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-5 py-2 rounded-full text-[14px] font-bold transition-all ${activeFilter === filter
                                    ? 'bg-[#24B99E] text-white shadow-lg shadow-[#24B99E]/20'
                                    : 'bg-[#F3F4F6] text-[#6B6B6B] hover:bg-gray-200'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="max-h-[480px] overflow-y-auto no-scrollbar">
                    {notifications.length > 0 ? (
                        <div className="divide-y divide-[#F3F4F6]">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-6 flex gap-4 hover:bg-gray-50 transition cursor-pointer relative group ${notif.isUnread ? 'bg-[#F0FDFA]/50' : ''
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#F3F4F6] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <notif.icon className="w-6 h-6 text-[#24B99E]" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-[#1A1A1A] text-[15px]">
                                                {notif.title}
                                            </h4>
                                            {notif.isUnread && (
                                                <div className="w-2.5 h-2.5 bg-[#24B99E] rounded-full mt-1.5" />
                                            )}
                                        </div>
                                        <p className="text-[#6B6B6B] text-[14px] mt-1 font-medium italic">
                                            {notif.description}
                                        </p>
                                        <p className="text-[#9CA3AF] text-[12px] mt-2 font-semibold">
                                            {notif.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                            <Bell className="w-12 h-12 text-[#E5E7EB] mb-4" />
                            <p className="text-[#1A1A1A] font-bold">No notifications yet</p>
                            <p className="text-[#6B6B6B] text-sm mt-1">We'll notify you when something important happens.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#F3F4F6] bg-gray-50/50">
                    <button className="w-full py-3 text-[14px] font-bold text-[#6B6B6B] hover:text-[#1A1A1A] transition">
                        View All Notifications
                    </button>
                </div>
            </div>
        </>
    );
}
