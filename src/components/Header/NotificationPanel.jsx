import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, X, Bell } from 'lucide-react';
import { useOrderNotifications } from '../../context/OrderNotificationsContext';

function getTimeLabel(createdAt) {
    if (!createdAt) return 'Just now';
    const diff = Date.now() - (typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime());
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

function getIconForType(type) {
    return type === 'Payment' ? DollarSign : Package;
}

export default function NotificationPanel({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('All');
    const { notifications, markAsRead, markAllAsRead } = useOrderNotifications();

    const filteredNotifications = useMemo(() => {
        const list = notifications.map((n) => ({
            ...n,
            time: n.time || getTimeLabel(n.createdAt),
            icon: getIconForType(n.type),
        }));
        if (activeFilter === 'Unread') return list.filter((n) => n.isUnread);
        if (activeFilter === 'Today') {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            return list.filter((n) => (n.createdAt || 0) >= startOfToday.getTime());
        }
        return list;
    }, [notifications, activeFilter]);

    const handleNotificationClick = (notif) => {
        if (notif.isUnread) markAsRead(notif.id);
        if (notif.orderNumber) {
            onClose();
            navigate('/orders');
        }
    };

    if (!isOpen) return null;

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
                            {notifications.some((n) => n.isUnread) && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[14px] font-semibold text-[#24B99E] hover:underline transition"
                                >
                                    Mark all as read
                                </button>
                            )}
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
                    {filteredNotifications.length > 0 ? (
                        <div className="divide-y divide-[#F3F4F6]">
                            {filteredNotifications.map((notif) => {
                                const Icon = notif.icon || Package;
                                return (
                                    <div
                                        key={notif.id}
                                        className={`p-6 flex flex-col gap-4 hover:bg-gray-50 transition cursor-pointer relative group ${notif.isUnread ? 'bg-[#F0FDFA]/50' : ''
                                            }`}
                                    >
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => handleNotificationClick(notif)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notif)}
                                            className="flex gap-4"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-[#F3F4F6] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
                                                <Icon className="w-6 h-6 text-[#24B99E]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-[#1A1A1A] text-[15px]">
                                                        {notif.title}
                                                    </h4>
                                                    {notif.isUnread && (
                                                        <div className="w-2.5 h-2.5 bg-[#24B99E] rounded-full mt-1.5 shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-[#6B6B6B] text-[14px] mt-1 font-medium italic">
                                                    {notif.description}
                                                </p>
                                                {notif.itemsText && (
                                                    <p className="text-[#6B6B6B] text-[13px] mt-0.5 font-medium">
                                                        {notif.itemsText}
                                                    </p>
                                                )}
                                                <p className="text-[#9CA3AF] text-[12px] mt-2 font-semibold">
                                                    {notif.time}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Accept / Decline buttons temporarily removed as requested */}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                            <Bell className="w-12 h-12 text-[#E5E7EB] mb-4" />
                            <p className="text-[#1A1A1A] font-bold">No notifications yet</p>
                            <p className="text-[#6B6B6B] text-sm mt-1">We&apos;ll notify you when something important happens.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#F3F4F6] bg-gray-50/50">
                    <button
                        onClick={() => { onClose(); navigate('/orders'); }}
                        className="w-full py-3 text-[14px] font-bold text-[#6B6B6B] hover:text-[#1A1A1A] transition"
                    >
                        View All Notifications
                    </button>
                </div>
            </div>
        </>
    );
}
